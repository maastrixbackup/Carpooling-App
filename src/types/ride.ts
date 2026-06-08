export type RouteOption = {
  route_index: number;
  summary: string;
  polyline: string;
  distance_meters: number;
  duration_seconds: number;
  distance_text: string;
  duration_text: string;
};

export type RideSearchPayload = {
  source_lat: number;
  source_lng: number;
  destination_lat: number;
  destination_lng: number;
};
