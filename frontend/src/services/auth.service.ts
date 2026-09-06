import { api, type ApiResponse } from "./api";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = "cmms_token";
const USER_KEY = "cmms_user";

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const res = await api.post<ApiResponse<LoginResult>>("/api/auth/login", {
      email,
      password,
    });

    if (res?.data?.token) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    }

    return res.data;
  },

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return api.post<ApiResponse<any>>("/api/auth/register", data);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent("cmms:auth_changed"));
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};
