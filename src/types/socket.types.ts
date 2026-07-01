export interface RideTrackingUpdate {
  rideId: number | string;
  driverId: string;

  latitude: number;
  longitude: number;

  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;

  updatedAt?: string;
}

export interface RideTrackingError {
  reason: string;
  message: string;
}

export interface RideTrackingJoined {
  rideId: number | string;
  room: string;
}

export interface RideTrackingStopped {
  rideId: number | string;
  status: "stopped";
}
