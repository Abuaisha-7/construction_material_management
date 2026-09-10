import { useState } from "react";
import { Users, KeyRound, ShieldCheck, Building2 } from "lucide-react";
import UsersTab from "./UsersTab";
import RolesTab from "./RolesTab";
import PermissionsTab from "./PermissionsTab";
import ProjectsTab from "./ProjectsTab";

const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles", icon: ShieldCheck },
  { id: "permissions", label: "Permissions", icon: KeyRound },
  { id: "projects", label: "Projects", icon: Building2 },
];

interface Props {
  permissions: string[];
  currentUserId: string | null;
  onProjectChanged?: () => Promise<void>;
}

export default function Administration({
  permissions,
  currentUserId,
  onProjectChanged,
}: Props) {
  const [tab, setTab] = useState("users");

  const canCreateUsers = permissions.includes("users:create");
  const canUpdateUsers = permissions.includes("users:update");

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:px-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Administration</h2>
        <p className="text-xs text-muted-foreground">
          Manage backend user accounts, roles, permissions, and projects.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                active
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "users" && (
        <UsersTab currentUserId={currentUserId} canCreate={canCreateUsers} canUpdate={canUpdateUsers} />
      )}
      {tab === "roles" && <RolesTab />}
      {tab === "permissions" && <PermissionsTab />}
      {tab === "projects" && <ProjectsTab onProjectChanged={onProjectChanged} />}
    </div>
  );
}