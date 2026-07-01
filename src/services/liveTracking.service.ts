import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { getAuthenticatedSocket } from "@/lib/socket";
import type { LiveDriverLocation } from "@/types/liveRide.types";

export async function joinRideTracking(rideId: string | number) {
  const socket = await getAuthenticatedSocket();
  socket.emit(SOCKET_EVENTS.RIDE_TRACKING_JOIN, { rideId });
  return socket;
}

export async function leaveRideTracking(rideId: string | number) {
  const socket = await getAuthenticatedSocket();
  socket.emit(SOCKET_EVENTS.RIDE_TRACKING_LEAVE, { rideId });
}

export async function publishRideLocation(payload: {
  rideId: string | number;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
}) {
  const socket = await getAuthenticatedSocket();
  socket.emit(SOCKET_EVENTS.RIDE_TRACKING_UPDATE, payload);
}

export async function stopRideTracking(rideId: string | number) {
  const socket = await getAuthenticatedSocket();
  socket.emit(SOCKET_EVENTS.RIDE_TRACKING_STOP, { rideId });
}

export function normalizeLiveLocation(payload: any): LiveDriverLocation | null {
  if (
    !payload?.rideId ||
    payload.latitude == null ||
    payload.longitude == null
  ) {
    return null;
  }

  return {
    rideId: payload.rideId,
    driverId: payload.driverId,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    heading: payload.heading == null ? null : Number(payload.heading),
    speed: payload.speed == null ? null : Number(payload.speed),
    accuracy: payload.accuracy == null ? null : Number(payload.accuracy),
    updatedAt: payload.updatedAt,
  };
}
