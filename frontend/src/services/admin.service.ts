import { api, type ApiResponse } from "./api";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface BackendRoleLite {
  id: string;
  name: string;
  description?: string | null;
}

export interface BackendPermissionLite {
  id: string;
  name: string;
  description?: string | null;
}

export interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
  roles?: { role: BackendRoleLite }[];
}

export interface BackendRole {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  permissions?: { permission: BackendPermissionLite }[];
  _count?: {
    users: number;
  };
}

export interface BackendPermission {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  roles?: { role: { id: string; name: string } }[];
}

export interface BackendRolePermission {
  roleId: string;
  permissionId: string;
  role: BackendRoleLite;
  permission: BackendPermissionLite;
}

export interface BackendUserRole {
  userId: string;
  roleId: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    status: UserStatus;
  };
  role?: BackendRoleLite;
}

export const userService = {
  async getUsers(params?: {
    search?: string;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/users${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendUser[]>>(endpoint);
    return res.data;
  },

  async getUserById(id: string) {
    const res = await api.get<ApiResponse<BackendUser>>(`/api/users/${id}`);
    return res.data;
  },

  async createUser(payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    status?: UserStatus;
  }) {
    const res = await api.post<ApiResponse<BackendUser>>("/api/users", payload);
    return res.data;
  },

  async updateUser(
    id: string,
    payload: {
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      status?: UserStatus;
    }
  ) {
    const res = await api.patch<ApiResponse<BackendUser>>(`/api/users/${id}`, payload);
    return res.data;
  },
};

export const roleService = {
  async getRoles() {
    const res = await api.get<ApiResponse<BackendRole[]>>("/api/roles");
    return res.data;
  },

  async createRole(payload: { name: string; description?: string }) {
    const res = await api.post<ApiResponse<BackendRole>>("/api/roles", payload);
    return res.data;
  },

  async updateRole(
    id: string,
    payload: { name?: string; description?: string }
  ) {
    const res = await api.patch<ApiResponse<BackendRole>>(`/api/roles/${id}`, payload);
    return res.data;
  },

  async deleteRole(id: string) {
    const res = await api.delete<ApiResponse<null>>(`/api/roles/${id}`);
    return res.data;
  },
};

export const permissionService = {
  async getPermissions() {
    const res = await api.get<ApiResponse<BackendPermission[]>>("/api/permissions");
    return res.data;
  },

  async createPermission(payload: { name: string; description?: string }) {
    const res = await api.post<ApiResponse<BackendPermission>>("/api/permissions", payload);
    return res.data;
  },
};

export const rolePermissionService = {
  async assignPermissionToRole(payload: { roleId: string; permissionId: string }) {
    const res = await api.post<ApiResponse<BackendRolePermission>>(
      "/api/role-permissions",
      payload
    );
    return res.data;
  },

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const res = await api.delete<ApiResponse<null>>(
      `/api/role-permissions/${roleId}/${permissionId}`
    );
    return res.data;
  },
};

export const userRoleService = {
  async assignRoleToUser(payload: { userId: string; roleId: string }) {
    const res = await api.post<ApiResponse<BackendUserRole>>("/api/user-roles", payload);
    return res.data;
  },

  async removeRoleFromUser(userId: string, roleId: string) {
    const res = await api.delete<ApiResponse<null>>(
      `/api/user-roles/${userId}/${roleId}`
    );
    return res.data;
  },

  async getUserRoles() {
    const res = await api.get<ApiResponse<BackendUserRole[]>>("/api/user-roles");
    return res.data;
  },
};