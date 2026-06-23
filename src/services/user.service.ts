// services/user.service.ts
import { apiClient } from "@/lib/apiClient";

export async function getMeApi() {
  return apiClient("/users", {
    method: "GET",
  });
}

// Account Deletion

export async function getDeleteRequestApi() {
  return apiClient("/account/delete-request", {
    method: "GET",
  });
}

export async function requestDeleteAccountApi() {
  return apiClient("/account/delete-request", {
    method: "POST",
  });
}

export async function cancelDeleteAccountApi() {
  return apiClient("/account/delete-request/cancel", {
    method: "POST",
  });
}
