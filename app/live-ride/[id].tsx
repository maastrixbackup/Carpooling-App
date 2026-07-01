import LiveRideMap from "@/components/live-ride/LiveRideMap";
import RideBottomSheet from "@/components/live-ride/RideBottomSheet";
import RideHeader from "@/components/live-ride/RideHeader";
import { useAuth } from "@/context/AuthContext";
import { useDriverLocationPublisher } from "@/hooks/useDriverLocationPublisher";
import { useRideLiveTracking } from "@/hooks/useRideLiveTracking";
import { getRideByIdApi } from "@/services/ride.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import type {
  LatLng,
  LiveDriverLocation,
  LiveRide,
} from "@/types/liveRide.types";
import { getConnectionLabel } from "@/utils/liveRide";
import { decodePolyline } from "@/utils/polyline";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LiveRideScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [locateSignal, setLocateSignal] = useState(0);

  const bottomOffset =
    Math.min(height * 0.36, 330) + Math.max(insets.bottom, 16);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["live-ride", id],
    queryFn: () => getRideByIdApi(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const ride = data?.data?.ride as LiveRide | undefined;
  const isRideOngoing = ride?.status === "ongoing";

  const currentUserId = (user as any)?.id || (user as any)?.user?.id || null;
  const isDriver =
    !!ride?.driver_id &&
    !!currentUserId &&
    String(ride.driver_id) === String(currentUserId);
  const shouldPublishDriverLocation = !!id && isDriver && isRideOngoing;

  const { isPublishing, error: publisherError } = useDriverLocationPublisher({
    rideId: id,
    enabled: shouldPublishDriverLocation,
  });

  const pickupCoordinate = useMemo(() => {
    if (!ride?.source_lat || !ride?.source_lng) return null;
    return {
      latitude: Number(ride.source_lat),
      longitude: Number(ride.source_lng),
    };
  }, [ride?.source_lat, ride?.source_lng]);

  const dropCoordinate = useMemo(() => {
    if (!ride?.destination_lat || !ride?.destination_lng) return null;
    return {
      latitude: Number(ride.destination_lat),
      longitude: Number(ride.destination_lng),
    };
  }, [ride?.destination_lat, ride?.destination_lng]);

  const routeCoords = useMemo<LatLng[]>(() => {
    if (ride?.polyline) return decodePolyline(ride.polyline);
    if (pickupCoordinate && dropCoordinate)
      return [pickupCoordinate, dropCoordinate];
    return [];
  }, [ride?.polyline, pickupCoordinate, dropCoordinate]);

  const { isConnected, hasJoined, liveLocation, trackingStopped, error } =
    useRideLiveTracking({
      rideId: id,
      enabled: !!id && isRideOngoing,
    });

  const connectionLabel = getConnectionLabel({
    isConnected,
    hasJoined,
    trackingStopped,
    error,
  });

  if (isLoading) {
    return <CenterState title="Loading live ride..." />;
  }

  if (isError || !ride || !pickupCoordinate || !dropCoordinate) {
    return (
      <CenterState
        title="Ride unavailable"
        subtitle="Unable to load live ride details."
        actionText="Go Back"
        onAction={() => router.back()}
      />
    );
  }
  if (__DEV__) {
    console.log("[LIVE RIDE DEBUG]", {
      rideId: id,
      rideStatus: ride?.status,
      isDriver,
      shouldPublishDriverLocation,
      isPublishing,
      publisherError,
    });
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LiveRideMap
        pickupCoordinate={pickupCoordinate}
        dropCoordinate={dropCoordinate}
        routeCoords={routeCoords}
        driverLocation={liveLocation as LiveDriverLocation | null}
        bottomOffset={bottomOffset}
        locateSignal={locateSignal}
      />

      <RideHeader onLocate={() => setLocateSignal((prev) => prev + 1)} />

      <RideBottomSheet
        ride={ride}
        connectionLabel={connectionLabel}
        isRideOngoing={isRideOngoing}
        trackingStopped={trackingStopped}
        error={publisherError || error}
        driverLocation={liveLocation as LiveDriverLocation | null}
      />
    </View>
  );
}

function CenterState({
  title,
  subtitle,
  actionText,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg }}
      className="items-center justify-center px-5"
    >
      <ActivityIndicator color={colors.primary} />

      <Text
        style={{ color: colors.text }}
        className="mt-4 text-xl font-extrabold"
      >
        {title}
      </Text>

      {!!subtitle && (
        <Text
          style={{ color: colors.muted }}
          className="mt-2 text-center text-sm"
        >
          {subtitle}
        </Text>
      )}

      {!!actionText && !!onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{ backgroundColor: colors.primary }}
          className="mt-5 rounded-2xl px-6 py-3"
        >
          <Text className="font-extrabold text-white">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
