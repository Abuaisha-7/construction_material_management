import type { UserStatus } from "../../services/admin.service";
import type { BackendProjectStatus } from "../../services/project.service";

export const USER_STATUS_STYLE: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  INACTIVE: "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300",
  SUSPENDED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export const PROJECT_STATUS_STYLE: Record<BackendProjectStatus, string> = {
  PLANNING: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  COMPLETED: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export const USER_STATUSES: UserStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];
export const PROJECT_STATUSES: BackendProjectStatus[] = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

export const PRIMARY_BTN =
  "flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.98] dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400";
export const SECONDARY_BTN =
  "flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent active:scale-[0.98]";
export const DANGER_BTN =
  "flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10";
export const INPUT_CLS =
  "h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2";
export const SELECT_CLS =
  "h-9 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none ring-ring focus:ring-2";
export const TEXTAREA_CLS =
  "w-full rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none ring-ring focus:ring-2";
export const TH_CLS = "px-3 py-2.5 first:pl-4";
export const TD_CLS = "px-3 py-2.5 first:pl-4";

export function getErrorMessage(err: unknown, fallback = "Request failed"): string {
  return err instanceof Error && err.message ? err.message : fallback;
}