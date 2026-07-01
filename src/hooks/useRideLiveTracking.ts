import { SOCKET_EVENTS } from "@/constants/socketEvents";
import {
  joinRideTracking,
  leaveRideTracking,
  normalizeLiveLocation,
} from "@/services/liveTracking.service";
import type { LiveDriverLocation } from "@/types/liveRide.types";
import type {
  RideTrackingError,
  RideTrackingJoined,
  RideTrackingStopped,
  RideTrackingUpdate,
} from "@/types/socket.types";
import { useEffect, useState } from "react";

type Props = {
  rideId?: string | number | null;
  enabled?: boolean;
};

export function useRideLiveTracking({ rideId, enabled = true }: Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [liveLocation, setLiveLocation] = useState<LiveDriverLocation | null>(
    null,
  );
  const [trackingStopped, setTrackingStopped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId || !enabled) return;

    const currentRideId = rideId;
    let mounted = true;
    let socket: any;

    async function setup() {
      try {
        socket = await joinRideTracking(currentRideId);
        if (!mounted) return;

        const handleConnect = () => {
          setIsConnected(true);
          socket.emit(SOCKET_EVENTS.RIDE_TRACKING_JOIN, {
            rideId: currentRideId,
          });
        };

        const handleDisconnect = () => {
          setIsConnected(false);
          setHasJoined(false);
        };

        const handleJoined = (payload: RideTrackingJoined) => {
          if (String(payload?.rideId) !== String(currentRideId)) return;

          setHasJoined(true);
          setTrackingStopped(false);
          setError(null);
        };

        const handleLocation = (payload: RideTrackingUpdate) => {
          const location = normalizeLiveLocation(payload);

          if (!location || String(location.rideId) !== String(currentRideId)) {
            return;
          }

          setLiveLocation(location);
          setTrackingStopped(false);
          setError(null);
        };

        const handleStopped = (payload: RideTrackingStopped) => {
          if (String(payload?.rideId) !== String(currentRideId)) return;

          setTrackingStopped(true);
        };

        const handleError = (payload: RideTrackingError) => {
          setError(payload?.message || "Live tracking unavailable.");
        };

        socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
        socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_JOINED, handleJoined);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_SNAPSHOT, handleLocation);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_UPDATE, handleLocation);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_STOPPED, handleStopped);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_ERROR, handleError);

        socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
        socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
        socket.on(SOCKET_EVENTS.RIDE_TRACKING_JOINED, handleJoined);
        socket.on(SOCKET_EVENTS.RIDE_TRACKING_SNAPSHOT, handleLocation);
        socket.on(SOCKET_EVENTS.RIDE_TRACKING_UPDATE, handleLocation);
        socket.on(SOCKET_EVENTS.RIDE_TRACKING_STOPPED, handleStopped);
        socket.on(SOCKET_EVENTS.RIDE_TRACKING_ERROR, handleError);

        if (socket.connected) handleConnect();
      } catch {
        setIsConnected(false);
        setError("Unable to connect live tracking.");
      }
    }

    setup();

    return () => {
      mounted = false;

      if (socket) {
        socket.emit(SOCKET_EVENTS.RIDE_TRACKING_LEAVE, {
          rideId: currentRideId,
        });

        socket.off(SOCKET_EVENTS.RIDE_TRACKING_JOINED);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_SNAPSHOT);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_UPDATE);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_STOPPED);
        socket.off(SOCKET_EVENTS.RIDE_TRACKING_ERROR);
      }

      leaveRideTracking(currentRideId).catch(() => {});
    };
  }, [rideId, enabled]);

  return {
    isConnected,
    hasJoined,
    liveLocation,
    trackingStopped,
    error,
  };
}
