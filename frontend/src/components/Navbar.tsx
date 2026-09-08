import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardHat, Bell, BellRing, Search, ChevronDown, Plus, Building2, Moon, Sun,
  Check, CheckCheck, X, TriangleAlert, ShieldCheck, Truck, Package, Eye,
  LogOut, RefreshCw, UserCheck,
} from "lucide-react";
import { ROLES, PROJECT, etb, type UserRole, type Material, ProjectMeta } from "../types";
import { authService, type AuthUser } from "../services/auth.service";
import {
  notificationService,
  mapBackendNotificationToUI,
  type UINotification as Notification,
} from "../services/notification.service";

const CATEGORY_ICONS: Record<Notification["category"], typeof Bell> = {
  alert: TriangleAlert,
  approval: ShieldCheck,
  delivery: Truck,
  qc: Package,
};

const CATEGORY_TAB = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "alert", label: "Alerts" },
  { key: "approval", label: "Approvals" },
] as const;

type FilterKey = (typeof CATEGORY_TAB)[number]["key"];

interface NavbarProps {
  role: UserRole;
  setRole: (r: UserRole) => void;
  materials: Material[];
  project: ProjectMeta;
  onQuickCreate: (tab: string) => void;
  onSearch: (q: string) => void;
  onNavigateTab?: (tab: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
  onRefresh?: () => void;
  isSyncing?: boolean;
}

const ROLE_COLORS: Record<UserRole, string> = {
  "Project Manager": "bg-violet-500",
  "Site Engineer": "bg-sky-500",
  Storekeeper: "bg-amber-500",
  "QA/QC Inspector": "bg-emerald-500",
  "Procurement Officer": "bg-orange-500",
  "Finance Officer": "bg-rose-500",
};

const ROLE_TAG: Record<UserRole, string> = {
  "Project Manager": "PM",
  "Site Engineer": "SE",
  Storekeeper: "SK",
  "QA/QC Inspector": "QC",
  "Procurement Officer": "PO",
  "Finance Officer": "FO",
};

export default function Navbar({
  role, setRole, materials, project, onQuickCreate, onSearch, onNavigateTab, theme, toggleTheme,
  user, onLogout, onRefresh, isSyncing,
}: NavbarProps) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<FilterKey>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications strictly scoped to the authenticated user from the database
  const loadNotifications = async () => {
    const currentUserId = user?.id || authService.getCurrentUser()?.id;
    if (!currentUserId || !authService.isAuthenticated()) {
      setNotifications([]);
      return;
    }

    try {
      setNotifLoading(true);
      const res = await notificationService.getNotifications({ limit: 50 });
      if (res?.success && Array.isArray(res.notifications)) {
        // Enforce user-only scoping: only notifications belonging to this active user
        const userOnlyNotifs = res.notifications
          .filter((n) => !n.userId || n.userId === currentUserId)
          .map(mapBackendNotificationToUI);
        setNotifications(userOnlyNotifs);
      }
    } catch (err) {
      console.error("Failed to load user notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Auto poll every 30 seconds for live database updates
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    // Event listener for in-app updates
    const handleRefresh = () => {
      loadNotifications();
    };
    window.addEventListener("cmms:refresh_notifications", handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cmms:refresh_notifications", handleRefresh);
    };
  }, [user?.id]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const filteredNotifs = useMemo(() => {
    if (notifFilter === "all") return notifications;
    if (notifFilter === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.category === notifFilter);
  }, [notifications, notifFilter]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const dismissNotif = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationService.deleteNotification(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    setNotifOpen(false);
    try {
      await notificationService.clearAllNotifications();
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const handleNotifClick = (n: Notification) => {
    markRead(n.id);
    setNotifOpen(false);
    if (onNavigateTab) onNavigateTab(n.workspace);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return materials.filter(
      (m) => m.name.toLowerCase().includes(q) || m.spec.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query, materials]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30">
            <HardHat size={20} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">CMMS NEMAR GC</div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Building2 size={11} /> {project.name}
            </div>
          </div>
        </div>

        {/* Project context chip (desktop) */}
        <div className="ml-2 hidden items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 xl:flex">
          <div className="text-[11px] text-amber-900 dark:text-amber-200">
            <span className="font-semibold">{project.ref}</span> · {project.location.split(",")[0]}
          </div>
        </div>

        {/* Search */}
        <div className="relative ml-auto hidden md:block md:w-72 lg:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); onSearch(e.target.value); }}
            onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
            placeholder="Search materials, refs, suppliers..."
            className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm outline-none ring-ring focus:ring-2"
          />
          <AnimatePresence>
            {searchOpen && filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-11 z-50 w-full rounded-xl border border-border bg-popover p-1.5 shadow-xl"
              >
                {filtered.map((m) => (
                  <button
                    key={m.id}
                    onMouseDown={() => { setQuery(""); onSearch(m.name); }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-accent"
                  >
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-[11px] text-muted-foreground">{m.spec}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live ETB stat */}
        <div className="hidden items-center rounded-lg border border-border bg-card px-3 py-1.5 lg:flex">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Budget</span>
          <span className="ml-2 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {etb(project.budget)}
          </span>
        </div>

        {/* Quick create */}
        {role === "Project Manager" && (
        <div className="relative">
          <button
            onClick={() => setCreateOpen((o) => !o)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 text-white px-3 text-sm font-semibold shadow-sm transition hover:bg-slate-800 active:scale-[0.98] dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown size={13} />
          </button>
          <AnimatePresence>
            {createOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-xl"
              >
                {[
                  ["requisition", "Material Requisition (MR)"],
                  ["po", "Purchase Order (PO)"],
                  ["grn", "Goods Receipt (GRN)"],
                  ["qc", "Inspection (MIR)"],
                  ["issue", "Issue Voucher (SIV)"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { onQuickCreate(key); setCreateOpen(false); }}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent transition"
          >
            {unreadCount > 0 ? <BellRing size={16} /> : <Bell size={16} />}
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white"
              >
                {unreadCount}
              </motion.span>
            )}
            {unreadCount > 0 && (
              <motion.span
                className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-rose-500/40"
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="absolute right-0 top-11 z-50 w-[360px] max-w-[90vw] rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-muted-foreground" />
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        {unreadCount > 99 ? "99+" : `${unreadCount} new`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {notifLoading && (
                      <RefreshCw size={12} className="animate-spin text-muted-foreground" />
                    )}
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition"
                      >
                        <CheckCheck size={13} /> Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 border-b border-border px-3 py-2">
                  {CATEGORY_TAB.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setNotifFilter(t.key)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${notifFilter === t.key
                          ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950"
                          : "text-muted-foreground hover:bg-accent"
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Notification list */}
                <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                  {notifLoading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                      <RefreshCw size={22} className="animate-spin text-amber-500" />
                      <span className="text-xs text-muted-foreground">Loading notifications...</span>
                    </div>
                  ) : filteredNotifs.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                      <Check size={28} className="text-muted-foreground/40" />
                      <span className="text-sm font-medium text-muted-foreground">All clear</span>
                      <span className="text-[11px] text-muted-foreground/60">
                        No {notifFilter === "all" ? "" : notifFilter} notifications
                      </span>
                    </div>
                  ) : (
                    filteredNotifs.map((n) => {
                      const CatIcon = CATEGORY_ICONS[n.category];
                      return (
                        <div
                          key={n.id}
                          className={`group relative flex cursor-pointer gap-3 border-b border-border/50 px-4 py-3 transition hover:bg-accent/50 ${!n.read ? "bg-accent/20" : ""
                            }`}
                          onClick={() => handleNotifClick(n)}
                        >
                          {/* Category icon */}
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.category === "alert" ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" :
                              n.category === "approval" ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" :
                                n.category === "delivery" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" :
                                  "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                            }`}>
                            <CatIcon size={15} />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-sm leading-tight ${!n.read ? "font-semibold" : "font-medium text-muted-foreground"}`}>
                                {n.title}
                              </span>
                              <span className="shrink-0 text-[10px] text-muted-foreground/60">{n.timestamp}</span>
                            </div>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
                              {n.description}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              {!n.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              )}
                              <span className="text-[10px] font-medium text-muted-foreground/50 capitalize">
                                {n.category}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="absolute right-2 top-2 hidden gap-0.5 group-hover:flex">
                            {!n.read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
                                title="Mark as read"
                              >
                                <Eye size={13} />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-rose-500 transition"
                              title="Dismiss"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t border-border px-4 py-2 text-center">
                    <button
                      onClick={clearAll}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition"
                    >
                      Clear all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Backend API Sync */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition"
            title="Sync live data with Backend API"
          >
            <RefreshCw size={15} className={isSyncing ? "animate-spin text-amber-500" : ""} />
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent"
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Role switcher */}
       
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-2 pl-1.5 transition hover:bg-accent">
            <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white ${ROLE_COLORS[role]}`}>
              {ROLE_TAG[role]}
            </span>
            <span className="hidden max-w-[110px] truncate text-xs font-medium md:block">{role}</span>
          </div>
     

        {/* Authenticated User & Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-1 border-l border-border">
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-semibold leading-tight text-foreground truncate max-w-[130px]">
                {user.fullName || "User"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                {user.email}
              </span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition"
                title="Log out from system"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}