import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus, UserPlus, RefreshCw, ShieldCheck, X, UserCog,
} from "lucide-react";
import {
  userService,
  roleService,
  userRoleService,
  type BackendRoleLite,
  type BackendUser,
  type UserStatus,
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
  SELECT_CLS,
  TD_CLS,
  TH_CLS,
  USER_STATUSES,
  USER_STATUS_STYLE,
} from "./shared";

const EMPTY_CREATE = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  status: "ACTIVE" as UserStatus,
};

interface Props {
  currentUserId: string | null;
  canCreate: boolean;
  canUpdate: boolean;
}

export default function UsersTab({ currentUserId, canCreate, canUpdate }: Props) {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [roles, setRoles] = useState<BackendRoleLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createBusy, setCreateBusy] = useState(false);

  const [editUser, setEditUser] = useState<BackendUser | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", password: "", status: "ACTIVE" as UserStatus });
  const [editBusy, setEditBusy] = useState(false);

  const [assignFor, setAssignFor] = useState<BackendUser | null>(null);
  const [assignRoleId, setAssignRoleId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);

  const [removeRole, setRemoveRole] = useState<{ user: BackendUser; role: BackendRoleLite } | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.getUsers({ limit: 100 }),
        roleService.getRoles(),
      ]);
      setUsers(usersRes ?? []);
      setRoles((rolesRes ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description })));
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(getErrorMessage(err, "Failed to load users from backend"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search, statusFilter]);

  const userRoleNames = (u: BackendUser) => (u.roles ?? []).map((ur) => ur.role);

  const submitCreate = async () => {
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password) {
      toast.error("Full name, email and password are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (createForm.password.length < 8) {
      toast.error("Password must contain at least 8 characters");
      return;
    }
    setCreateBusy(true);
    try {
      await userService.createUser({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone.trim() || undefined,
        status: createForm.status,
      });
      toast.success(`User ${createForm.fullName.trim()} created`);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      await load();
    } catch (err) {
      console.error("Failed to create user:", err);
      toast.error(getErrorMessage(err, "Failed to create user"));
    } finally {
      setCreateBusy(false);
    }
  };

  const openEdit = (u: BackendUser) => {
    setEditUser(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      phone: u.phone ?? "",
      password: "",
      status: u.status,
    });
  };

  const submitEdit = async () => {
    if (!editUser) return;
    if (!editForm.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (editForm.password && editForm.password.length < 8) {
      toast.error("New password must contain at least 8 characters");
      return;
    }
    if (
      editUser.id === currentUserId &&
      editForm.status !== "ACTIVE"
    ) {
      toast.error("You cannot deactivate your own account");
      return;
    }
    setEditBusy(true);
    try {
      await userService.updateUser(editUser.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || undefined,
        ...(editForm.password ? { password: editForm.password } : {}),
        status: editForm.status,
      });
      toast.success(`User ${editForm.fullName.trim()} updated`);
      setEditUser(null);
      await load();
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error(getErrorMessage(err, "Failed to update user"));
    } finally {
      setEditBusy(false);
    }
  };

  const openAssign = (u: BackendUser) => {
    const available = roles.filter((r) => !userRoleNames(u).some((ur) => ur.id === r.id));
    setAssignRoleId(available[0]?.id ?? "");
    setAssignFor(u);
  };

  const submitAssign = async () => {
    if (!assignFor || !assignRoleId) {
      toast.error("Select a role to assign");
      return;
    }
    setAssignBusy(true);
    try {
      await userRoleService.assignRoleToUser({ userId: assignFor.id, roleId: assignRoleId });
      toast.success(`Role assigned to ${assignFor.fullName}`);
      setAssignFor(null);
      await load();
    } catch (err) {
      console.error("Failed to assign role:", err);
      toast.error(getErrorMessage(err, "Failed to assign role"));
    } finally {
      setAssignBusy(false);
    }
  };

  const submitRemoveRole = async () => {
    if (!removeRole) return;
    if (removeRole.role.name === "ADMIN" && removeRole.user.id === currentUserId) {
      toast.error("You cannot remove the ADMIN role from your own account");
      setRemoveRole(null);
      return;
    }
    setRoleBusy(true);
    try {
      await userRoleService.removeRoleFromUser(removeRole.user.id, removeRole.role.id);
      toast.success(`Role ${removeRole.role.name} removed from ${removeRole.user.fullName}`);
      setRemoveRole(null);
      await load();
    } catch (err) {
      console.error("Failed to remove role:", err);
      toast.error(getErrorMessage(err, "Failed to remove role"));
    } finally {
      setRoleBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {["ALL", ...USER_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${statusFilter === s ? "bg-amber-500 text-slate-950" : "text-muted-foreground hover:bg-accent"}`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone..."
          className={`${INPUT_CLS} w-56`}
        />

        <div className="ml-auto flex gap-2">
          <button onClick={() => void load()} className={SECONDARY_BTN} title="Refresh from backend">
            <RefreshCw size={15} /> Refresh
          </button>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className={PRIMARY_BTN}>
              <Plus size={15} /> New User
            </button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <Spinner label="Loading users from backend..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No users found"
            hint={search || statusFilter !== "ALL" ? "Adjust the filters and try again." : "Create your first user to get started."}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className={TH_CLS}>User</th>
                <th className={TH_CLS}>Phone</th>
                <th className={TH_CLS}>Roles</th>
                <th className={TH_CLS}>Status</th>
                <th className={`${TH_CLS} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className={TD_CLS}>
                    <div className="font-semibold">{u.fullName}</div>
                    <div className="text-[11px] text-muted-foreground">{u.email}</div>
                  </td>
                  <td className={TD_CLS}>
                    <span className="text-xs text-muted-foreground">{u.phone || "—"}</span>
                  </td>
                  <td className={TD_CLS}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {userRoleNames(u).length === 0 ? (
                        <span className="text-[11px] text-muted-foreground">No roles</span>
                      ) : (
                        userRoleNames(u).map((r) => (
                          <span key={r.id} className="group inline-flex items-center gap-0.5">
                            <Badge label={r.name} className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" />
                            {canUpdate && (
                              <button
                                onClick={() => setRemoveRole({ user: u, role: r })}
                                className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
                                title={`Remove ${r.name} role`}
                              >
                                <X size={11} />
                              </button>
                            )}
                          </span>
                        ))
                      )}
                      {canUpdate && (
                        <button
                          onClick={() => openAssign(u)}
                          className="flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="Assign role"
                        >
                          <UserPlus size={11} /> Assign
                        </button>
                      )}
                    </div>
                  </td>
                  <td className={TD_CLS}>
                    <Badge label={u.status} className={USER_STATUS_STYLE[u.status]} />
                  </td>
                  <td className={`${TD_CLS} text-right`}>
                    {canUpdate && (
                      <button
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <UserCog size={13} /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ModalShell
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create User"
        subtitle="Creates a user record in the backend database."
      >
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Full name *</label>
              <input value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                placeholder="e.g. Abebe Kebede" className={`${INPUT_CLS} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Email *</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="name@company.com" className={`${INPUT_CLS} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Password *</label>
              <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Min 8 characters" className={`${INPUT_CLS} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Phone</label>
              <input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="+251..." className={`${INPUT_CLS} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as UserStatus })}
                className={`${SELECT_CLS} mt-1`}>
                {USER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className={SECONDARY_BTN}>Cancel</button>
            <button onClick={submitCreate} disabled={createBusy} className={`${PRIMARY_BTN} disabled:opacity-50`}>
              {createBusy ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={editUser !== null}
        onClose={() => setEditUser(null)}
        title="Edit User"
        subtitle="Update profile details or change the account status."
      >
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Full name</label>
              <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className={`${INPUT_CLS} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={`${INPUT_CLS} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Phone</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className={`${INPUT_CLS} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">New password</label>
              <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Leave blank to keep current" className={`${INPUT_CLS} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                className={`${SELECT_CLS} mt-1`}>
                {USER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditUser(null)} className={SECONDARY_BTN}>Cancel</button>
            <button onClick={submitEdit} disabled={editBusy} className={`${PRIMARY_BTN} disabled:opacity-50`}>
              {editBusy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={assignFor !== null}
        onClose={() => setAssignFor(null)}
        title={`Assign role to ${assignFor?.fullName ?? ""}`}
        subtitle="Assigns a role through the existing user-role API."
      >
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="text-violet-500" />
            Current roles:{" "}
            {assignFor ? userRoleNames(assignFor).map((r) => r.name).join(", ") || "none" : ""}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Role</label>
            <select value={assignRoleId} onChange={(e) => setAssignRoleId(e.target.value)} className={`${SELECT_CLS} mt-1`}>
              {roles.length === 0 && <option value="">No roles available</option>}
              {roles
                .filter((r) => (assignFor ? !userRoleNames(assignFor).some((ur) => ur.id === r.id) : true))
                .map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAssignFor(null)} className={SECONDARY_BTN}>Cancel</button>
            <button onClick={submitAssign} disabled={assignBusy || !assignRoleId} className={`${PRIMARY_BTN} disabled:opacity-50`}>
              {assignBusy ? "Assigning..." : "Assign Role"}
            </button>
          </div>
        </div>
      </ModalShell>

      <ConfirmModal
        open={removeRole !== null}
        onClose={() => setRemoveRole(null)}
        onConfirm={() => void submitRemoveRole()}
        busy={roleBusy}
        title="Remove role"
        message={`Remove the ${removeRole?.role.name ?? ""} role from ${removeRole?.user.fullName ?? ""}?`}
        confirmLabel="Remove Role"
      />
    </div>
  );
}