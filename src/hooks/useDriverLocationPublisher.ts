import { getAuthenticatedSocket } from "@/lib/socket";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { Socket } from "socket.io-client";

type Props = {
  rideId?: string | number | null;
  enabled?: boolean;
};

export function useDriverLocationPublisher({ rideId, enabled = false }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopPublishing = useCallback(async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsPublishing(false);
  }, []);

  const startPublishing = useCallback(async () => {
    try {
      if (!rideId || !enabled) return;

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setError("Location permission is required for live tracking.");
        return;
      }

      const socket = await getAuthenticatedSocket();
      socketRef.current = socket;

      socket.emit("ride:join", { rideId });

      subscriptionRef.current?.remove();

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (location) => {
          socket.emit("ride:location:update", {
            rideId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            accuracy: location.coords.accuracy,
          });
        },
      );

      setIsPublishing(true);
      setError(null);
    } catch {
      setError("Unable to start live location sharing.");
      setIsPublishing(false);
    }
  }, [rideId, enabled]);

  useEffect(() => {
    if (enabled) {
      startPublishing();
    } else {
      stopPublishing();
    }

    return () => {
      stopPublishing();
    };
  }, [enabled, startPublishing, stopPublishing]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && enabled && rideId) {
        startPublishing();
      }
    });

    return () => sub.remove();
  }, [enabled, rideId, startPublishing]);

  return {
    isPublishing,
    error,
    startPublishing,
    stopPublishing,
  };
}
