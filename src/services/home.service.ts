import { apiClient } from "@/lib/apiClient";

export const getHomeBootstrap = async (params?: {
  source?: string;
  destination?: string;
  seats?: number;
  ride_date?: string;
}) => {
  const query = new URLSearchParams();

  if (params?.source) query.append("source", params.source);
  if (params?.destination) query.append("destination", params.destination);
  if (params?.seats) query.append("seats", String(params.seats));
  if (params?.ride_date) query.append("ride_date", params.ride_date);

  return apiClient(`/bootstrap/home${query.toString() ? `?${query}` : ""}`, {
    method: "GET",
  });
};
