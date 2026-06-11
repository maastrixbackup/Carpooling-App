// services/user.service.ts
import { apiClient } from "@/lib/apiClient";

export async function getMeApi() {
  return apiClient("/users", {
    method: "GET",
  });
}
