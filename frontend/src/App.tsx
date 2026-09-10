import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { LayoutDashboard, FileText, FlaskConical, Boxes, Database, Settings } from "lucide-react";
import { type UserRole } from "./types";
import Navbar from "./components/Navbar";
import ProjectOverview from "./components/ProjectOverview";
import RequisitionProcurement from "./components/RequisitionProcurement";
import QualityControlAndGRN from "./components/QualityControlAndGRN";
import InventoryAndSiteIssuance from "./components/InventoryAndSiteIssuance";
import Administration from "./components/Administration";
import Login from "./pages/Login";
import { authService, type AuthUser } from "./services/auth.service";
import { useAppData } from "./hooks/useAppData";

function mapBackendRoleToPersona(roles?: string[]): UserRole {
  if (!roles || roles.length === 0) return "Project Manager";
  if (roles.includes("ADMIN") || roles.includes("PROJECT_MANAGER")) return "Project Manager";
  if (roles.includes("SITE_ENGINEER")) return "Site Engineer";
  if (roles.includes("STORE_KEEPER")) return "Storekeeper";
  if (roles.includes("INSPECTOR")) return "QA/QC Inspector";
  if (roles.includes("PROCUREMENT_OFFICER")) return "Procurement Officer";
  return "Project Manager";
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [role, setRole] = useState<UserRole>(() => mapBackendRoleToPersona(authService.getCurrentUser()?.roles));
  const [tab, setTab] = useState("overview");
  const [focus, setFocus] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const {
    state,
    setState,
    materials,
    project,
    suppliers,
    loading,
    error,
    refreshAll,
    createRequisition,
    submitRequisition,
    startRequisitionReview,
    approveRequisition,
    rejectRequisition,
    cancelRequisition,
    createPurchaseOrder,
    submitPurchaseOrder,
    approvePurchaseOrder,
    cancelPurchaseOrder,
    closePurchaseOrder,
    createSupplier,
    confirmGrn,
    rejectGrn,
    createGrn,
    completeInspection,
  } = useAppData();

  useEffect(() => {
    const handleAuthChange = () => {
      const auth = authService.isAuthenticated();
      setIsAuthenticated(auth);
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setRole(mapBackendRoleToPersona(user.roles));
      }
    };

    const handleUnauthorized = () => {
      toast.error("Session expired. Please log in again.");
      authService.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
    };

    window.addEventListener("cmms:auth_changed", handleAuthChange);
    window.addEventListener("cmms:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("cmms:auth_changed", handleAuthChange);
      window.removeEventListener("cmms:unauthorized", handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.info("You have been signed out.");
  };

  const quickCreate = (k: string) => {
    const map: Record<string, string> = {
      requisition: "req",
      po: "req",
      grn: "quality",
      qc: "quality",
      issue: "inventory",
    };
    setTab(map[k] ?? "overview");
    setFocus(k === "qc" ? "qc" : k === "po" ? "po" : k);
    toast.info("Opening " + k + " workspace");
  };

  const onSearch = (q: string) => {
    if (!q.trim()) return;
    setFocus(q);
    setTab("overview");
  };

  const navItems = useMemo(
    () => {
      const items = [
        { key: "overview", label: "Command Center", icon: LayoutDashboard },
        { key: "req", label: "Requisition & Procurement", icon: FileText },
        { key: "quality", label: "Quality & GRN", icon: FlaskConical },
        { key: "inventory", label: "Inventory & Site", icon: Boxes },
      ];
      if (currentUser?.permissions?.includes("users:read")) {
        items.push({ key: "admin", label: "Administration", icon: Settings });
      }
      return items;
    },
    [currentUser]
  );

  const isEngineer = role === "Site Engineer" || role === "Storekeeper";

  // If unauthenticated, display the full-page Login portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground">
        <Toaster position="top-center" richColors />
        <Login
          onSuccess={() => {
            setIsAuthenticated(true);
            const user = authService.getCurrentUser();
            setCurrentUser(user);
            if (user) {
              setRole(mapBackendRoleToPersona(user.roles));
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <Navbar
        role={role}
        setRole={setRole}
        materials={materials}
        project={project}
        onQuickCreate={quickCreate}
        onSearch={onSearch}
        onNavigateTab={(tab) => {
          setTab(tab);
          setFocus(null);
        }}
        theme={theme}
        toggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        user={currentUser}
        onLogout={handleLogout}
        onRefresh={refreshAll}
        isSyncing={loading}
      />

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 border-r border-border p-3 lg:block">
          <nav className="space-y-1">
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => {
                  setTab(n.key);
                  setFocus(null);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  tab === n.key
                    ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <n.icon size={16} /> {n.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
            <div className="font-semibold text-foreground">Active Persona</div>
            <div className="mt-1">{role}</div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isEngineer ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              {isEngineer ? "Field / stores access" : "Approval / oversight access"}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Database size={13} className="text-amber-500" />
              <span>Backend API Status</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected (Port 5000)</span>
            </div>
          </div>

          <div className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
            CMMS · Integrated Live System
            <br />
            {project.location}
            <br />
            ETB functional currency
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          {/* Mobile tabs */}
          <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 sm:hidden">
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => {
                  setTab(n.key);
                  setFocus(null);
                }}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${
                  tab === n.key
                    ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950"
                    : "text-muted-foreground"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={refreshAll}
                className="font-semibold underline ml-2 hover:opacity-80"
              >
                Retry
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {tab === "overview" && (
                <ProjectOverview
                  state={state}
                  role={role}
                  project={project}
                  materials={materials}
                />
              )}
              {tab === "req"  && (
                <RequisitionProcurement
                  state={state}
                  setState={setState}
                  role={role}
                  project={project}
                  focus={focus}
                  materials={materials}
                  suppliers={suppliers}
                  onCreateRequisitionBackend={createRequisition}
                  onSubmitRequisitionBackend={submitRequisition}
                  onStartRequisitionReviewBackend={startRequisitionReview}
                  onApproveRequisitionBackend={approveRequisition}
                  onRejectRequisitionBackend={rejectRequisition}
                  onCancelRequisitionBackend={cancelRequisition}
                  onCreatePurchaseOrderBackend={createPurchaseOrder}
                  onSubmitPurchaseOrderBackend={submitPurchaseOrder}
                  onApprovePurchaseOrderBackend={approvePurchaseOrder}
                  onCancelPurchaseOrderBackend={cancelPurchaseOrder}
                  onClosePurchaseOrderBackend={closePurchaseOrder}
                  onCreateSupplierBackend={createSupplier}
                />
              )}
              {tab === "quality" && (
                <QualityControlAndGRN
                  state={state}
                  setState={setState}
                  role={role}
                  focus={focus}
                  materials={materials}
                  suppliers={suppliers}
                  onConfirmGrnBackend={confirmGrn}
                  onRejectGrnBackend={rejectGrn}
                  onCreateGrnBackend={createGrn}
                  onCompleteInspectionBackend={completeInspection}
                />
              )}
              {tab === "inventory" && (
                <InventoryAndSiteIssuance
                  state={state}
                  setState={setState}
                  role={role}
                  focus={focus}
                  materials={materials}
                />
              )}
              {tab === "admin" &&
                (currentUser?.permissions?.includes("users:read") ? (
                  <Administration
                    permissions={currentUser.permissions ?? []}
                    currentUserId={currentUser.id ?? null}
                    onProjectChanged={refreshAll}
                  />
                ) : (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                    You do not have permission to view Administration.
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;