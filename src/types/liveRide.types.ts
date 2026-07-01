export type LatLng = {
  latitude: number;
  longitude: number;
};

export type RideStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export type LiveRide = {
  id: string | number;
  status: RideStatus | string;

  driver_id?: string;
  driver_name?: string;
  driver_rating?: number;
  driver_total_rides?: number;
  profile_picture?: string | null;
  is_verified?: boolean;

  source_address?: string;
  destination_address?: string;

  source_lat?: number | string;
  source_lng?: number | string;
  destination_lat?: number | string;
  destination_lng?: number | string;

  polyline?: string | null;
  duration_seconds?: number | string;
  distance_meters?: number | string;

  vehicles?: any;
};

export type LiveDriverLocation = {
  rideId: string | number;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  updatedAt?: string;
};

export type TrackingConnectionState =
  | "offline"
  | "connecting"
  | "joining"
  | "live"
  | "stopped"
  | "error";
