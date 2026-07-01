import {
  joinRideTracking,
  leaveRideTracking,
  publishRideLocation,
} from "@/services/liveTracking.service";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppStateStatus } from "react-native";
import { AppState } from "react-native";

type Props = {
  rideId?: string | number | null;
  enabled?: boolean;
};

export function useDriverLocationPublisher({ rideId, enabled = false }: Props) {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const startedRef = useRef(false);
  const startingRef = useRef(false);
  const rideIdRef = useRef<string | number | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopPublishing = useCallback(async () => {
    if (!startedRef.current && !subscriptionRef.current) return;

    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    startedRef.current = false;
    startingRef.current = false;
    setIsPublishing(false);

    const currentRideId = rideIdRef.current;
    rideIdRef.current = null;

    if (currentRideId) {
      leaveRideTracking(currentRideId).catch(() => {});
    }
  }, []);

  const startPublishing = useCallback(async () => {
    if (!rideId || !enabled) return;
    if (startedRef.current || startingRef.current) return;

    const currentRideId = rideId;

    try {
      startingRef.current = true;
      rideIdRef.current = currentRideId;

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        setError("Location permission is required for live tracking.");
        startingRef.current = false;
        return;
      }

      await joinRideTracking(currentRideId);

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      await publishRideLocation({
        rideId: currentRideId,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        heading: current.coords.heading,
        speed: current.coords.speed,
        accuracy: current.coords.accuracy,
      });

      subscriptionRef.current?.remove();

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2500,
          distanceInterval: 5,
        },
        (location) => {
          publishRideLocation({
            rideId: currentRideId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            accuracy: location.coords.accuracy,
          }).catch(() => {});
        },
      );

      startedRef.current = true;
      startingRef.current = false;
      setIsPublishing(true);
      setError(null);
    } catch (err: any) {
      startedRef.current = false;
      startingRef.current = false;
      setIsPublishing(false);
      setError(err?.message || "Unable to start live location sharing.");
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
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === "active" && enabled && rideId) {
        startPublishing();
      }

      // Do not stop on inactive/background for now.
      // Stopping here causes the publish true/false loop you are seeing.
    };

    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => sub.remove();
  }, [enabled, rideId, startPublishing]);

  return {
    isPublishing,
    error,
    startPublishing,
    stopPublishing,
  };
}
