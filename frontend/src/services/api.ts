const RAW_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").trim().replace(/\/+$/, "");

export const API_BASE_URL = RAW_BASE_URL;

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/api/")) {
    return `${API_BASE_URL}${cleanPath}`;
  }
  return `${API_BASE_URL}/api${cleanPath}`;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(path);
  const token = localStorage.getItem("cmms_token");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("cmms:unauthorized"));
    }
    const message = (data && data.message) || response.statusText || "Request failed";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T = any>(path: string, headers?: Record<string, string>) =>
    apiRequest<T>(path, { method: "GET", headers }),

  post: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),

  put: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),

  patch: <T = any>(path: string, body?: any, headers?: Record<string, string>) =>
    apiRequest<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),

  delete: <T = any>(path: string, headers?: Record<string, string>) =>
    apiRequest<T>(path, { method: "DELETE", headers }),
};
