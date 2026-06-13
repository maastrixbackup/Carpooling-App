import { apiClient } from "@/lib/apiClient";

export async function createBookingApi(payload: any) {
  return apiClient("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyBookingsApi() {
  return apiClient("/bookings/my-bookings", {
    method: "GET",
  });
}

export async function getDriverBookingsApi(rideId?: string | number) {
  const query = rideId ? `?ride_id=${rideId}` : "";
  return apiClient(`/bookings/driver-bookings${query}`, {
    method: "GET",
  });
}

export async function getBookingByIdApi(id: number | string) {
  return apiClient(`/bookings/${id}`, {
    method: "GET",
  });
}

export async function cancelBookingApi(id: number | string) {
  return apiClient(`/bookings/${id}/cancel`, {
    method: "PATCH",
  });
}

export function respondToBookingApi(
  id: string,
  status: "accepted" | "rejected",
) {
  return apiClient(`/bookings/${id}/respond`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
