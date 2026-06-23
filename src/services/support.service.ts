import { apiClient } from "@/lib/apiClient";

export type SupportCategoryKey =
  | "ride_issue"
  | "booking_issue"
  | "payment_rewards"
  | "vehicle_verification"
  | "account_login"
  | "safety_concern"
  | "other";

export async function getSupportCategoriesApi() {
  return apiClient("/support/categories", {
    method: "GET",
  });
}

export async function getMySupportTicketsApi() {
  return apiClient("/support/tickets", {
    method: "GET",
  });
}

export async function createSupportTicketApi(payload: {
  category: SupportCategoryKey;
  subject: string;
  description: string;
  relatedRideId?: string | number | null;
  relatedBookingId?: string | number | null;
  attachments?: any[];
}) {
  return apiClient("/support/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSupportTicketByIdApi(id: string | number) {
  return apiClient(`/support/tickets/${id}`, {
    method: "GET",
  });
}
