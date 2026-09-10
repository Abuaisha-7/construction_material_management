import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";
import {
  permissionService,
  type BackendPermission,
} from "../../services/admin.service";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  ModalShell,
  Spinner,
} from "./shared-ui";
import {
  getErrorMessage,
  INPUT_CLS,
  PRIMARY_BTN,
  SECONDARY_BTN,
  TD_CLS,
  TEXTAREA_CLS,
  TH_CLS,
} from "./shared";

const EMPTY_FORM = { name: "", description: "" };

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState<BackendPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await permissionService.getPermissions();
      setPermissions(res ?? []);
    } catch (err) {
      console.error("Failed to load permissions:", err);
      setError(getErrorMessage(err, "Failed to load permissions from backend"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const roleNames = (p: BackendPermission) =>
    (p.roles ?? []).map((rp) => rp.role.name);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowCreate(true);
  };

  const submitCreate = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Permission name is required");
      return;
    }
    if (!/^[a-z_]+:[a-z_]+$/.test(name)) {
      toast.error("Use the format resource:action (e.g. materials:create)");
      return;
    }
    setBusy(true);
    try {
      await permissionService.createPermission({
        name,
        description: form.description.trim() || undefined,
      });
      toast.success(`Permission ${name} created`);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      console.error("Failed to create permission:", err);
      toast.error(getErrorMessage(err, "Failed to create permission"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          {permissions.length} permission{permissions.length === 1 ? "" : "s"} in database
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => void load()} className={SECONDARY_BTN} title="Refresh from backend">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={openCreate} className={PRIMARY_BTN}>
            <Plus size={15} /> New Permission
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <Spinner label="Loading permissions from backend..." />
        ) : permissions.length === 0 ? (
          <EmptyState title="No permissions found" hint="Create your first permission to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className={TH_CLS}>Permission</th>
                <th className={TH_CLS}>Description</th>
                <th className={TH_CLS}>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p) => {
                const roles = roleNames(p);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className={TD_CLS}>
                      <span className="font-mono text-xs font-semibold">{p.name}</span>
                    </td>
                    <td className={TD_CLS}>
                      <span className="line-clamp-2 max-w-[320px] text-xs text-muted-foreground">
                        {p.description || "—"}
                      </span>
                    </td>
                    <td className={TD_CLS}>
                      <div className="flex flex-wrap gap-1">
                        {roles.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">Unassigned</span>
                        ) : (
                          roles.map((r) => (
                            <Badge key={r} label={r} className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" />
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Permission"
        subtitle="Duplicate names are rejected by the backend."
      >
        <div className="space-y-3 p-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Permission name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="resource:action  e.g. reports:read"
              className={`${INPUT_CLS} mt-1 font-mono`}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Format: <span className="font-mono">resource:action</span> — lowercase letters and underscores only.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={`${TEXTAREA_CLS} mt-1`}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className={SECONDARY_BTN}>Cancel</button>
            <button onClick={submitCreate} disabled={busy} className={`${PRIMARY_BTN} disabled:opacity-50`}>
              {busy ? "Creating..." : "Create Permission"}
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}