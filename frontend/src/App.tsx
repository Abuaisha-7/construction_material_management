import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { LayoutDashboard, FileText, FlaskConical, Boxes } from "lucide-react";
import {
  buildSeedState,
} from "./data/mockData";
import { MATERIALS } from "./data/mockData";
import { ROLES, type AppState, type UserRole } from "./types";
import Navbar from "./components/Navbar";
import ProjectOverview from "./components/ProjectOverview";
import RequisitionProcurement from "./components/RequisitionProcurement";
import QualityControlAndGRN from "./components/QualityControlAndGRN";
import InventoryAndSiteIssuance from "./components/InventoryAndSiteIssuance";

import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";

const STORAGE_KEY = "cmms-dala-state-v1";

function App() {
  const [role, setRole] = useState<UserRole>("Project Manager");
  const [tab, setTab] = useState("overview");
  const [focus, setFocus] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AppState;
    } catch {
      /* ignore */
    }
    return buildSeedState();
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const resetDemo = () => {
    setState(buildSeedState());
    toast.success("Demo data reseeded to Jigjiga baseline");
  };

  const quickCreate = (k: string) => {
    const map: Record<string, string> = {
      requisition: "req",
      po: "procurement",
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
    () => [
      { key: "overview", label: "Command Center", icon: LayoutDashboard },
      { key: "req", label: "Requisition & Procurement", icon: FileText },
      { key: "quality", label: "Quality & GRN", icon: FlaskConical },
      { key: "inventory", label: "Inventory & Site", icon: Boxes },
    ],
    [],
  );

  const isEngineer = role === "Site Engineer" || role === "Storekeeper";

  return (
    <>
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <Navbar
        role={role}
        setRole={setRole}
        materials={MATERIALS}
        onQuickCreate={quickCreate}
        onSearch={onSearch}
        onNavigateTab={(tab) => { setTab(tab); setFocus(null); }}
        theme={theme}
        toggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      />

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 border-r border-border p-3 lg:block">
          <nav className="space-y-1">
            {navItems.map((n) => (
              <button key={n.key} onClick={() => { setTab(n.key); setFocus(null); }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${tab === n.key ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950" : "text-muted-foreground hover:bg-accent"}`}>
                <n.icon size={16} /> {n.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
            <div className="font-semibold text-foreground">Active Persona</div>
            <div className="mt-1">{role}</div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isEngineer ? "bg-amber-500" : "bg-emerald-500"}`} />
              {isEngineer ? "Field / stores access" : "Approval / oversight access"}
            </div>
          </div>

          <button onClick={resetDemo}
            className="mt-3 w-full rounded-lg border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-accent">
            Reset demo data
          </button>

          <div className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
            CMMS · Dala Studio
            <br />Jigjiga, Somali Region
            <br />ETB functional currency
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          {/* Mobile tabs */}
          <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 sm:hidden">
            {navItems.map((n) => (
              <button key={n.key} onClick={() => { setTab(n.key); setFocus(null); }}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium ${tab === n.key ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950" : "text-muted-foreground"}`}>
                {n.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {tab === "overview" && <ProjectOverview state={state} role={role} />}
              {tab === "req" && <RequisitionProcurement state={state} setState={setState} role={role} focus={focus} />}
              {tab === "quality" && <QualityControlAndGRN state={state} setState={setState} role={role} focus={focus} />}
              {tab === "inventory" && <InventoryAndSiteIssuance state={state} setState={setState} role={role} focus={focus} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </>
    
  );
}

export default App;