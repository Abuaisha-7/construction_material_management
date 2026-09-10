import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, RefreshCw, Pencil, Trash2, KeyRound, Users,
} from "lucide-react";
import {
  roleService,
  permissionService,
  rolePermissionService,
  type BackendPermissionLite,
  type BackendRole,
} from "../../services/admin.service";
import {
  Badge,
  ConfirmModal,
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

const EMPTY_CREATE = { name: "", description: "" };

export default function RolesTab() {
  const [roles, setRoles] = useState<BackendRole[]>([]);
  const [permissions, setPermissions] = useState<BackendPermissionLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createBusy, setCreateBusy] = useState(false);

  const [editRole, setEditRole] = useState<BackendRole | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editBusy, setEditBusy] = useState(false);

  const [permFor, setPermFor] = useState<BackendRole | null>(null);
  const [permBusy, setPermBusy] = useState<string | null>(null);

  const [deleteRole, setDeleteRole] = useState<BackendRole | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getRoles(),
        permissionService.getPermissions(),
      ]);
      setRoles(rolesRes ?? []);
      setPermissions((permsRes ?? []).map((p) => ({ id: p.id, name: p.name, description: p.description })));
    } catch (err) {
      console.error("Failed to load roles:", err);
      setError(getErrorMessage(err, "Failed to load roles from backend"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rolePerms = (r: BackendRole) => (r.permissions ?? []).map((p) => p.permission);

  const submitCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    setCreateBusy(true);
    try {
      await roleService.createRole({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
      });
      toast.success(`Role ${createForm.name.trim()} created`);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      await load();
    } catch (err) {
      console.error("Failed to create role:", err);
      toast.error(getErrorMessage(err, "Failed to create role"));
    } finally {
      setCreateBusy(false);
    }
  };

  const openEdit = (r: BackendRole) => {
    setEditRole(r);
    setEditForm({ name: r.name, description: r.description ?? "" });
  };

  const submitEdit = async () => {
    if (!editRole) return;
    if (!editForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    setEditBusy(true);
    try {
      await roleService.updateRole(editRole.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
      });
      toast.success(`Role ${editForm.name.trim()} updated`);
      setEditRole(null);
      await load();
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error(getErrorMessage(err, "Failed to update role"));
    } finally {
      setEditBusy(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteRole) return;
    setDeleteBusy(true);
    try {
      await roleService.deleteRole(deleteRole.id);
      toast.success(`Role ${deleteRole.name} deleted`);
      setDeleteRole(null);
      await load();
    } catch (err) {
      console.error("Failed to delete role:", err);
      toast.error(getErrorMessage(err, "Failed to delete role"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const togglePermission = async (permission: BackendPermissionLite) => {
    if (!permFor) return;
    const has = rolePerms(permFor).some((p) => p.id === permission.id);
    setPermBusy(permission.id);
    try {
      if (has) {
        await rolePermissionService.removePermissionFromRole(permFor.id, permission.id);
        toast.info(`Removed ${permission.name} from ${permFor.name}`);
      } else {
        await rolePermissionService.assignPermissionToRole({ roleId: permFor.id, permissionId: permission.id });
        toast.success(`Assigned ${permission.name} to ${permFor.name}`);
      }
      await load();
      setPermFor((prev) => (prev && prev.id === permFor.id ? { ...prev } : prev));
      const refreshed = roles.find((r) => r.id === permFor.id);
      if (refreshed) setPermFor(refreshed);
    } catch (err) {
      console.error("Failed to update role permission:", err);
      toast.error(getErrorMessage(err, "Failed to update role permissions"));
    } finally {
      setPermBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          {roles.length} role{roles.length === 1 ? "" : "s"} in database
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => void load()} className={SECONDARY_BTN} title="Refresh from backend">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className={PRIMARY_BTN}>
            <Plus size={15} /> New Role
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <Spinner label="Loading roles from backend..." />
        ) : roles.length === 0 ? (
          <EmptyState title="No roles found" hint="Create your first role to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className={TH_CLS}>Role</th>
                <th className={TH_CLS}>Description</th>
                <th className={TH_CLS}>Permissions</th>
                <th className={TH_CLS}>Users</th>
                <th className={`${TH_CLS} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => {
                const perms = rolePerms(r);
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className={TD_CLS}>
                      <span className="font-semibold">{r.name}</span>
                    </td>
                    <td className={TD_CLS}>
                      <span className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground">
                        {r.description || "—"}
                      </span>
                    </td>
                    <td className={TD_CLS}>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge label={`${perms.length} perms`} className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" />
                      </div>
                    </td>
                    <td className={TD_CLS}>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={13} /> {r._count?.users ?? 0}
                      </span>
                    </td>
                    <td className={`${TD_CLS} text-right`}>
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setPermFor(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                          title="Manage permissions"
                        >
                          <KeyRound size={13} /> Permissions
                        </button>
                        <button
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteRole(r)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={13} />
                        </button>
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
        title="Create Role"
        subtitle="Adds a new role to the backend database."
      >
        <div className="space-y-3 p-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Role name *</label>
            <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. FINANCE_OFFICER" className={`${INPUT_CLS} mt-1 uppercase`} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="What this role is responsible for" rows={3} className={`${TEXTAREA_CLS} mt-1`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className={SECONDARY_BTN}>Cancel</button>
            <button onClick={submitCreate} disabled={createBusy} className={`${PRIMARY_BTN} disabled:opacity-50`}>
              {createBusy ? "Creating..." : "Create Role"}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={editRole !== null}
        onClose={() => setEditRole(null)}
        title="Edit Role"
        subtitle="Update the role name or description."
      >
        <div className="space-y-3 p-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Role name</label>
            <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className={`${INPUT_CLS} mt-1 uppercase`} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3} className={`${TEXTAREA_CLS} mt-1`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditRole(null)} className={SECONDARY_BTN}>Cancel</button>
            <button onClick={submitEdit} disabled={editBusy} className={`${PRIMARY_BTN} disabled:opacity-50`}>
              {editBusy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={permFor !== null}
        onClose={() => setPermFor(null)}
        title={`Permissions · ${permFor?.name ?? ""}`}
        subtitle="Toggle permissions assigned to this role via RolePermission."
        width="max-w-2xl"
      >
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {rolePerms(permFor ?? ({ permissions: [] } as BackendRole)).length} of {permissions.length} permissions assigned
            </span>
          </div>
          <div className="max-h-[48vh] space-y-1 overflow-y-auto">
            {permissions.map((p) => {
              const checked = permFor ? rolePerms(permFor).some((rp) => rp.id === p.id) : false;
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition ${
                    checked
                      ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={permBusy === p.id}
                    onChange={() => void togglePermission(p)}
                    className="mt-0.5 h-4 w-4 accent-amber-500"
                  />
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold">{p.name}</div>
                    {p.description && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{p.description}</div>
                    )}
                  </div>
                  {permBusy === p.id && <RefreshCw size={13} className="ml-auto mt-0.5 animate-spin text-amber-500" />}
                </label>
              );
            })}
          </div>
        </div>
      </ModalShell>

      <ConfirmModal
        open={deleteRole !== null}
        onClose={() => setDeleteRole(null)}
        onConfirm={() => void submitDelete()}
        busy={deleteBusy}
        title="Delete role"
        message={`Delete the ${deleteRole?.name ?? ""} role? User assignments and permission links will be removed.`}
        confirmLabel="Delete Role"
      />
    </div>
  );
}