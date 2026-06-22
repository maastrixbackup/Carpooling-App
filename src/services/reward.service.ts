import { apiClient } from "@/lib/apiClient";

export async function getMyRewardsApi() {
  return apiClient("/rewards/me", {
    method: "GET",
  });
}
