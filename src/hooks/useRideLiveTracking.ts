import { getAuthenticatedSocket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export type LiveLocation = {
  rideId: string | number;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  updatedAt?: string;
};

type UseRideLiveTrackingProps = {
  rideId?: string | number | null;
  enabled?: boolean;
};

export function useRideLiveTracking({
  rideId,
  enabled = true,
}: UseRideLiveTrackingProps) {
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [trackingStopped, setTrackingStopped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideId || !enabled) return;

    let mounted = true;
    let socket: Socket | null = null;

    const setup = async () => {
      try {
        socket = await getAuthenticatedSocket();

        if (!mounted) return;

        socketRef.current = socket;

        const handleConnect = () => {
          setIsConnected(true);
          socket?.emit("ride:join", { rideId });
        };

        const handleDisconnect = () => {
          setIsConnected(false);
        };

        const handleLocation = (payload: LiveLocation) => {
          if (String(payload.rideId) !== String(rideId)) return;

          setLiveLocation({
            ...payload,
            latitude: Number(payload.latitude),
            longitude: Number(payload.longitude),
          });

          setTrackingStopped(false);
        };

        const handleStopped = (payload: { rideId: string | number }) => {
          if (String(payload.rideId) !== String(rideId)) return;
          setTrackingStopped(true);
        };

        const handleTrackingError = (payload: { message?: string }) => {
          setError(payload?.message || "Live tracking unavailable.");
        };

        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("ride:location:broadcast", handleLocation);
        socket.off("ride:tracking:stopped", handleStopped);
        socket.off("ride:tracking:error", handleTrackingError);

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("ride:location:broadcast", handleLocation);
        socket.on("ride:tracking:stopped", handleStopped);
        socket.on("ride:tracking:error", handleTrackingError);

        if (socket.connected) {
          handleConnect();
        }
      } catch {
        setIsConnected(false);
        setError("Unable to connect live tracking.");
      }
    };

    setup();

    return () => {
      mounted = false;

      if (socket) {
        socket.emit("ride:leave", { rideId });
        socket.off("ride:location:broadcast");
        socket.off("ride:tracking:stopped");
        socket.off("ride:tracking:error");
      }

      socketRef.current = null;
    };
  }, [rideId, enabled]);

  return {
    isConnected,
    liveLocation,
    trackingStopped,
    error,
  };
}
