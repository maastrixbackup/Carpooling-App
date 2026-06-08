import { apiClient } from "@/lib/apiClient";

export async function getMyVehiclesApi() {
  return apiClient("/vehicles", {
    method: "GET",
  });
}

export async function getVehicleByIdApi(id: string | number) {
  return apiClient(`/vehicles/${id}`, {
    method: "GET",
  });
}

export async function createVehicleApi(payload: any) {
  return apiClient("/vehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVehicleApi(id: string | number, payload: any) {
  return apiClient(`/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteVehicleApi(id: string | number) {
  return apiClient(`/vehicles/${id}`, {
    method: "DELETE",
  });
}
