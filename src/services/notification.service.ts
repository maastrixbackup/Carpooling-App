import { apiClient } from "@/lib/apiClient";

export type SavePushTokenPayload = {
  expo_push_token: string;
  device_type?: "ios" | "android" | "web" | "unknown";
  device_name?: string | null;
  device_id?: string | null;
  app_version?: string | null;
  build_number?: string | null;
  os_version?: string | null;
};

export async function savePushTokenApi(payload: SavePushTokenPayload) {
  return apiClient("/push-tokens", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deactivatePushTokenApi(payload: {
  expo_push_token?: string;
  device_id?: string;
}) {
  return apiClient("/push-tokens/deactivate", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
