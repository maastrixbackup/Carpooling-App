import { apiClient } from "@/lib/apiClient";

export async function savePushTokenApi(payload: {
  expo_push_token: string;
  device_type?: string;
  device_name?: string;
}) {
  return apiClient("/push-tokens", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
