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

  if (params?.source_lat !== undefined && params?.source_lat !== null) {
    query.append("source_lat", String(params.source_lat));
  }

  if (params?.source_lng !== undefined && params?.source_lng !== null) {
    query.append("source_lng", String(params.source_lng));
  }

  if (
    params?.destination_lat !== undefined &&
    params?.destination_lat !== null
  ) {
    query.append("destination_lat", String(params.destination_lat));
  }

  if (
    params?.destination_lng !== undefined &&
    params?.destination_lng !== null
  ) {
    query.append("destination_lng", String(params.destination_lng));
  }

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

export async function getDriverRideDetailsApi(id: string | number) {
  return apiClient(`/rides/${id}/driver`, {
    method: "GET",
  });
}

export async function updateRideApi(id: string | number, payload: any) {
  return apiClient(`/rides/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function startRideApi(id: string | number) {
  return apiClient(`/rides/${id}/start`, {
    method: "PATCH",
  });
}

export async function completeRideApi(id: string | number) {
  return apiClient(`/rides/${id}/complete`, {
    method: "PATCH",
  });
}
