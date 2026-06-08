// services/ride.service.ts
import { apiClient } from "@/lib/apiClient";
export async function publishRideApi(payload: any) {
  return apiClient("/rides", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRidesApi(params?: any) {
  const query = new URLSearchParams();

  if (params?.source) query.append("source", params.source);
  if (params?.destination) query.append("destination", params.destination);
  if (params?.ride_date) query.append("ride_date", params.ride_date);
  if (params?.min_seats) query.append("min_seats", String(params.min_seats));

  return apiClient(`/rides${query.toString() ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export async function getRideByIdApi(id: string | number) {
  return apiClient(`/rides/${id}`, {
    method: "GET",
  });
}

export async function getMyRidesApi() {
  return apiClient("/rides/my-rides", {
    method: "GET",
  });
}

export async function cancelRideApi(id: string | number) {
  return apiClient(`/rides/${id}/cancel`, {
    method: "PATCH",
  });
}

export async function getRouteOptionsApi(payload: {
  source_lat: number;
  source_lng: number;
  destination_lat: number;
  destination_lng: number;
}) {
  return apiClient("/rides/route-options", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
