import { apiClient } from "@/lib/apiClient";

export type AuthPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

export async function loginApi(payload: AuthPayload) {
  return apiClient("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export async function signupApi(payload: SignupPayload) {
  return apiClient("/auth/signup", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export async function meApi() {
  return apiClient("/auth/me", {
    method: "GET",
  });
}

export async function logoutApi() {
  return apiClient("/auth/logout", {
    method: "POST",
  });
}
