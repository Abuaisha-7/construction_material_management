import { api, type ApiResponse } from "./api";

export interface BackendProject {
  id: string;
  projectCode: string;
  name: string;
  location?: string | null;
  clientName?: string | null;
  contractorName?: string | null;
  consultantName?: string | null;
  projectManagerId?: string | null;
  startDate?: string | null;
  completionDate?: string | null;
  contractValue?: string | number | null;
  currency?: string | null;
  status: "ACTIVE" | "COMPLETED" | "SUSPENDED" | "CANCELLED";
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  projectManager?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export const projectService = {
  async getProjects(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/projects${qs ? `?${qs}` : ""}`;
    const res = await api.get<ApiResponse<BackendProject[]>>(endpoint);
    return res.data;
  },

  async getProjectById(id: string) {
    const res = await api.get<ApiResponse<BackendProject>>(`/api/projects/${id}`);
    return res.data;
  },

  async createProject(payload: {
    projectCode: string;
    name: string;
    location?: string;
    clientName?: string;
    contractorName?: string;
    consultantName?: string;
    projectManagerId?: string;
    startDate?: string;
    completionDate?: string;
    contractValue?: number;
    currency?: string;
    description?: string;
  }) {
    const res = await api.post<ApiResponse<BackendProject>>("/api/projects", payload);
    return res.data;
  },
};
