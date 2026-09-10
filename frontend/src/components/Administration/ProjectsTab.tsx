import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw, Pencil, Trash2, Building2 } from "lucide-react";
import {
  projectService,
  type BackendProject,
  type BackendProjectStatus,
} from "../../services/project.service";
import { userService } from "../../services/admin.service";
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
  PROJECT_STATUSES,
  PROJECT_STATUS_STYLE,
  SECONDARY_BTN,
  SELECT_CLS,
  TD_CLS,
  TEXTAREA_CLS,
  TH_CLS,
} from "./shared";

const EMPTY_CREATE = {
  projectCode: "",
  name: "",
  clientName: "",
  contractorName: "",
  consultantName: "",
  location: "",
  projectManagerId: "",
  contractValue: "",
  currency: "ETB",
  startDate: "",
  completionDate: "",
  status: "PLANNING" as BackendProjectStatus,
  description: "",
};

interface Props {
  onProjectChanged?: () => Promise<void>;
}

export default function ProjectsTab({ onProjectChanged }: Props) {
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createBusy, setCreateBusy] = useState(false);

  const [editProject, setEditProject] = useState<BackendProject | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_CREATE);
  const [editBusy, setEditBusy] = useState(false);

  const [deleteProject, setDeleteProject] = useState<BackendProject | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, usersRes] = await Promise.all([
        projectService.getProjects({ limit: 100 }),
        userService.getUsers({ limit: 100 }),
      ]);
      setProjects(projectsRes ?? []);
      setUsers((usersRes ?? []).map((u) => ({ id: u.id, fullName: u.fullName })));
    } catch (err) {
      console.error("Failed to load projects:", err);
      setError(getErrorMessage(err, "Failed to load projects from backend"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        (p.clientName ?? "").toLowerCase().includes(q) ||
        (p.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [projects, search, statusFilter]);

  const toForm = (p: BackendProject) => ({
    projectCode: p.projectCode,
    name: p.name,
    clientName: p.clientName ?? "",
    contractorName: p.contractorName ?? "",
    consultantName: p.consultantName ?? "",
    location: p.location ?? "",
    projectManagerId: p.projectManagerId ?? p.projectManager?.id ?? "",
    contractValue: p.contractValue?.toString() ?? "",
    currency: p.currency ?? "ETB",
    startDate: p.startDate ? p.startDate.slice(0, 10) : "",
    completionDate: p.completionDate ? p.completionDate.slice(0, 10) : "",
    status: p.status,
    description: p.description ?? "",
  });

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE);
    setShowCreate(true);
  };

  const openEdit = (p: BackendProject) => {
    setEditProject(p);
    setEditForm(toForm(p));
  };

  const buildPayload = (f: typeof EMPTY_CREATE) => ({
    projectCode: f.projectCode.trim(),
    name: f.name.trim(),
    clientName: f.clientName.trim() || undefined,
    contractorName: f.contractorName.trim() || undefined,
    consultantName: f.consultantName.trim() || undefined,
    location: f.location.trim() || undefined,
    projectManagerId: f.projectManagerId || undefined,
    contractValue: f.contractValue ? Number(f.contractValue) : undefined,
    currency: f.currency.trim() || undefined,
    startDate: f.startDate || undefined,
    completionDate: f.completionDate || undefined,
    status: f.status,
    description: f.description.trim() || undefined,
  });

  const toUpdatePayload = (f: typeof EMPTY_CREATE) => {
    const p = buildPayload(f);
    delete p.projectCode;
    return p;
  };

  const validateForm = (f: typeof EMPTY_CREATE) => {
    if (!f.name.trim() || !f.projectCode.trim()) {
      toast.error("Project name and code are required");
      return false;
    }
    const code = f.projectCode.trim();
    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
      toast.error("Project code can only contain letters, numbers, dash and underscore");
      return false;
    }
    if (f.startDate && f.completionDate && f.completionDate < f.startDate) {
      toast.error("Completion date cannot be before the start date");
      return false;
    }
    return true;
  };

  const refresh = async () => {
    await load();
    if (onProjectChanged) await onProjectChanged();
  };

  const submitCreate = async () => {
    if (!validateForm(createForm)) return;
    setCreateBusy(true);
    try {
      await projectService.createProject(buildPayload(createForm));
      toast.success(`Project ${createForm.name.trim()} created`);
      setShowCreate(false);
      await refresh();
    } catch (err) {
      console.error("Failed to create project:", err);
      toast.error(getErrorMessage(err, "Failed to create project"));
    } finally {
      setCreateBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!editProject) return;
    if (!validateForm(editForm)) return;
    setEditBusy(true);
    try {
      await projectService.updateProject(editProject.id, toUpdatePayload(editForm));
      toast.success(`Project ${editForm.name.trim()} updated`);
      setEditProject(null);
      await refresh();
    } catch (err) {
      console.error("Failed to update project:", err);
      toast.error(getErrorMessage(err, "Failed to update project"));
    } finally {
      setEditBusy(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteProject) return;
    setDeleteBusy(true);
    try {
      await projectService.deleteProject(deleteProject.id);
      toast.success(`Project ${deleteProject.name} deleted`);
      setDeleteProject(null);
      await refresh();
    } catch (err) {
      console.error("Failed to delete project:", err);
      toast.error(getErrorMessage(err, "Failed to delete project"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const pmName = (p: BackendProject) => p.projectManager?.fullName ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {["ALL", ...PROJECT_STATUSES].map((s) => (
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
          placeholder="Search code, name, client..."
          className={`${INPUT_CLS} w-56`}
        />

        <div className="ml-auto flex gap-2">
          <button onClick={() => void refresh()} className={SECONDARY_BTN} title="Refresh from backend">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={openCreate} className={PRIMARY_BTN}>
            <Plus size={15} /> New Project
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <Spinner label="Loading projects from backend..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No projects found"
            hint={search || statusFilter !== "ALL" ? "Adjust the filters and try again." : "Create your first project to get started."}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className={TH_CLS}>Project</th>
                <th className={TH_CLS}>Manager</th>
                <th className={TH_CLS}>Value</th>
                <th className={TH_CLS}>Status</th>
                <th className={`${TH_CLS} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className={TD_CLS}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <Building2 size={15} />
                      </span>
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {p.projectCode}
                          {p.clientName ? ` · ${p.clientName}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={TD_CLS}>
                    <span className="text-xs text-muted-foreground">{pmName(p) ?? "—"}</span>
                  </td>
                  <td className={TD_CLS}>
                    <span className="text-xs font-semibold">
                      {p.contractValue != null
                        ? `${p.currency ?? ""} ${Number(p.contractValue).toLocaleString()}`
                        : "—"}
                    </span>
                  </td>
                  <td className={TD_CLS}>
                    <Badge label={p.status} className={PROJECT_STATUS_STYLE[p.status]} />
                  </td>
                  <td className={`${TD_CLS} text-right`}>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteProject(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
        title="Create Project"
        subtitle="Registers a new project in the backend database."
        width="max-w-2xl"
      >
        <ProjectForm
          form={createForm}
          setForm={setCreateForm}
          users={users}
          submit={submitCreate}
          submitLabel={createBusy ? "Creating..." : "Create Project"}
          busy={createBusy}
          onCancel={() => setShowCreate(false)}
        />
      </ModalShell>

      <ModalShell
        open={editProject !== null}
        onClose={() => setEditProject(null)}
        title={`Edit · ${editProject?.name ?? ""}`}
        subtitle="Update project details, manager assignment, or status."
        width="max-w-2xl"
      >
        <ProjectForm
          form={editForm}
          setForm={setEditForm}
          users={users}
          submit={submitEdit}
          submitLabel={editBusy ? "Saving..." : "Save Changes"}
          busy={editBusy}
          onCancel={() => setEditProject(null)}
        />
      </ModalShell>

      <ConfirmModal
        open={deleteProject !== null}
        onClose={() => setDeleteProject(null)}
        onConfirm={() => void submitDelete()}
        busy={deleteBusy}
        title="Delete project"
        message={`Delete the project "${deleteProject?.name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete Project"
      />
    </div>
  );
}

function ProjectForm({
  form,
  setForm,
  users,
  submit,
  submitLabel,
  busy,
  onCancel,
}: {
  form: typeof EMPTY_CREATE;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_CREATE>>;
  users: { id: string; fullName: string }[];
  submit: () => void;
  submitLabel: string;
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Project code *</label>
        <input value={form.projectCode} onChange={(e) => setForm({ ...form, projectCode: e.target.value.toUpperCase() })}
          placeholder="e.g. PRJ-2026-001" className={`${INPUT_CLS} mt-1 font-mono`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Project name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Tower Junction Mall" className={`${INPUT_CLS} mt-1`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Client</label>
        <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className={`${INPUT_CLS} mt-1`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Contractor</label>
        <input value={form.contractorName} onChange={(e) => setForm({ ...form, contractorName: e.target.value })} className={`${INPUT_CLS} mt-1`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Consultant</label>
        <input value={form.consultantName} onChange={(e) => setForm({ ...form, consultantName: e.target.value })} className={`${INPUT_CLS} mt-1`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Location</label>
        <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={`${INPUT_CLS} mt-1`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Project manager</label>
        <select value={form.projectManagerId} onChange={(e) => setForm({ ...form, projectManagerId: e.target.value })} className={`${SELECT_CLS} mt-1`}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.fullName}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Contract value</label>
          <input type="number" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })}
            placeholder="0" className={`${INPUT_CLS} mt-1`} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Currency</label>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={`${SELECT_CLS} mt-1`}>
            <option value="ETB">ETB</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Start date</label>
        <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={`${INPUT_CLS} mt-1`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Completion date</label>
        <input type="date" value={form.completionDate} onChange={(e) => setForm({ ...form, completionDate: e.target.value })} className={`${INPUT_CLS} mt-1`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BackendProjectStatus })} className={`${SELECT_CLS} mt-1`}>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-semibold text-muted-foreground">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2} className={`${TEXTAREA_CLS} mt-1`} />
      </div>
      <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
        <button onClick={onCancel} className={SECONDARY_BTN}>Cancel</button>
        <button onClick={submit} disabled={busy} className={`${PRIMARY_BTN} disabled:opacity-50`}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}