import { apiClient } from "@/lib/apiClient";

export async function createReviewApi(payload: {
  booking_id: string | number;
  rating: number;
  review?: string;
}) {
  return apiClient("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDriverReviewsApi(driverId: string | number) {
  return apiClient(`/reviews/driver/${driverId}`, {
    method: "GET",
  });
}
