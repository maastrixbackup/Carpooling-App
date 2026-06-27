import { useRideLiveTracking } from "@/hooks/useRideLiveTracking";
import { getRideByIdApi } from "@/services/ride.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Car,
  Clock,
  LocateFixed,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import MapView, {
  AnimatedRegion,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type LatLng = {
  latitude: number;
  longitude: number;
};

const ANIMATION_DURATION = 900;

export default function LiveRideScreen() {
  const { colors, isDark } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const bottomCardHeight = Math.min(height * 0.34, 300);
  const [currentHeading, setCurrentHeading] = useState(0);

  const animatedDriverCoordinate = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;

  const headingAnim = useRef(new Animated.Value(0)).current;
  const hasInitializedDriver = useRef(false);
  const hasAutoFitted = useRef(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["live-ride", id],
    queryFn: () => getRideByIdApi(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const ride = data?.data?.ride;

  const pickupCoordinate: LatLng | null = useMemo(() => {
    if (!ride?.source_lat || !ride?.source_lng) return null;
    return {
      latitude: Number(ride.source_lat),
      longitude: Number(ride.source_lng),
    };
  }, [ride]);

  const dropCoordinate: LatLng | null = useMemo(() => {
    if (!ride?.destination_lat || !ride?.destination_lng) return null;
    return {
      latitude: Number(ride.destination_lat),
      longitude: Number(ride.destination_lng),
    };
  }, [ride]);

  const routeCoords = useMemo(() => {
    if (ride?.polyline) return decodePolyline(ride.polyline);
    if (pickupCoordinate && dropCoordinate) return [pickupCoordinate, dropCoordinate];
    return [];
  }, [ride?.polyline, pickupCoordinate, dropCoordinate]);

  const isRideOngoing = ride?.status === "ongoing";

  const { isConnected, liveLocation, trackingStopped, error } =
    useRideLiveTracking({
      rideId: id,
      enabled: !!id && isRideOngoing,
    });

  const driverCoordinate: LatLng | null = liveLocation
    ? {
      latitude: Number(liveLocation.latitude),
      longitude: Number(liveLocation.longitude),
    }
    : null;

  const fitMap = useCallback(() => {
    const coords = [
      ...(routeCoords || []),
      ...(driverCoordinate ? [driverCoordinate] : []),
    ];

    if (!coords.length) return;

    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: {
        top: 140,
        right: 70,
        bottom: bottomCardHeight + Math.max(insets.bottom, 16) + 70,
        left: 70,
      },
      animated: true,
    });
  }, [routeCoords, driverCoordinate, bottomCardHeight, insets.bottom]);

  useEffect(() => {
    if (!routeCoords.length || hasAutoFitted.current) return;

    const timer = setTimeout(() => {
      fitMap();
      hasAutoFitted.current = true;
    }, 500);

    return () => clearTimeout(timer);
  }, [fitMap, routeCoords.length]);

  useEffect(() => {
    if (!driverCoordinate) return;

    const nextHeading = Number(liveLocation?.heading || currentHeading || 0);

    if (!hasInitializedDriver.current) {
      animatedDriverCoordinate.setValue({
        latitude: driverCoordinate.latitude,
        longitude: driverCoordinate.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });

      headingAnim.setValue(nextHeading);
      setCurrentHeading(nextHeading);
      hasInitializedDriver.current = true;

      mapRef.current?.animateCamera(
        {
          center: driverCoordinate,
          zoom: 15,
          heading: nextHeading,
        },
        { duration: 700 },
      );

      return;
    }

    animatedDriverCoordinate
      .timing({
        latitude: driverCoordinate.latitude,
        longitude: driverCoordinate.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      } as any)
      .start();

    Animated.timing(headingAnim, {
      toValue: nextHeading,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    setCurrentHeading(nextHeading);

    mapRef.current?.animateCamera(
      {
        center: driverCoordinate,
        zoom: 15,
        heading: nextHeading,
      },
      { duration: ANIMATION_DURATION },
    );
  }, [driverCoordinate?.latitude, driverCoordinate?.longitude, liveLocation?.heading]);

  if (isLoading) return <CenterState title="Loading live ride..." />;

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

  const headingRotation = headingAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: pickupCoordinate.latitude,
          longitude: pickupCoordinate.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        customMapStyle={isDark ? premiumDarkMapStyle : premiumLightMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        moveOnMarkerPress={false}
        loadingEnabled
        loadingIndicatorColor={colors.primary}
        loadingBackgroundColor={colors.bg}
      >
        {routeCoords.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeColor={isDark ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.16)"}
              strokeWidth={12}
              lineCap="round"
              lineJoin="round"
            />

            <Polyline
              coordinates={routeCoords}
              strokeColor={isDark ? "#CBD5E1" : "#64748B"}
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
            />

            <Polyline
              coordinates={driverCoordinate ? trimRouteFromDriver(routeCoords, driverCoordinate) : routeCoords}
              strokeColor={colors.primary}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        <Marker coordinate={pickupCoordinate}>
          <RouteMarker
            label="Pickup"
            color={colors.primary}
            icon={<MapPin size={17} color="#FFFFFF" />}
          />
        </Marker>

        <Marker coordinate={dropCoordinate}>
          <RouteMarker
            label="Drop"
            color={colors.success}
            icon={<Navigation size={17} color="#FFFFFF" />}
          />
        </Marker>

        {driverCoordinate && (
          <Marker.Animated
            coordinate={animatedDriverCoordinate as any}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <DriverMarker rotation={headingRotation} />
          </Marker.Animated>
        )}
      </MapView>

      <SafeAreaView edges={["top"]} className="absolute left-0 right-0 top-0 px-5">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.back()}
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="h-11 w-11 items-center justify-center rounded-full border"
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={fitMap}
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="h-11 w-11 items-center justify-center rounded-full border"
          >
            <LocateFixed size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 18 : 14),
        }}
        className="absolute bottom-0 left-0 right-0 rounded-t-[32px] border px-5 pt-5"
      >
        <View className="mb-4 h-1 w-12 self-center rounded-full bg-slate-400/40" />

        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text style={{ color: colors.text }} className="text-xl font-extrabold" numberOfLines={2}>
              {shortAddress(ride.source_address)} → {shortAddress(ride.destination_address)}
            </Text>

            <Text style={{ color: colors.muted }} className="mt-1 text-sm font-semibold">
              {ride.driver_name || "Driver"} • {capitalize(ride.status)}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: isRideOngoing ? "rgba(34,197,94,0.14)" : colors.primarySoft,
            }}
            className="rounded-full px-3 py-2"
          >
            <Text
              style={{ color: isRideOngoing ? colors.success : colors.primary }}
              className="text-xs font-extrabold"
            >
              {isRideOngoing ? "LIVE" : "WAITING"}
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row gap-3">
          <InfoCard
            icon={<Radio size={17} color={isConnected ? colors.success : colors.muted} />}
            label="Connection"
            value={isConnected ? "Connected" : "Connecting"}
          />

          <InfoCard
            icon={<Clock size={17} color={colors.primary} />}
            label="ETA"
            value={formatDuration(Number(ride.duration_seconds || 0))}
          />

          <InfoCard
            icon={<ShieldCheck size={17} color={colors.success} />}
            label="Driver"
            value={ride.is_verified ? "Verified" : "Basic"}
          />
        </View>

        <View
          style={{ backgroundColor: error ? colors.dangerSoft : colors.input }}
          className="mt-4 rounded-2xl px-4 py-3"
        >
          <Text
            style={{
              color: error
                ? colors.danger
                : trackingStopped
                  ? colors.muted
                  : isRideOngoing && driverCoordinate
                    ? colors.success
                    : colors.muted,
            }}
            className="text-xs font-bold"
          >
            {error
              ? error
              : trackingStopped
                ? "Live tracking has stopped."
                : !isRideOngoing
                  ? "Live tracking will begin once the driver starts the ride."
                  : driverCoordinate
                    ? "Driver is moving live on the map."
                    : "Waiting for driver location..."}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DriverMarker({ rotation }: { rotation: Animated.AnimatedInterpolation<string> }) {
  const { colors } = useAppTheme();

  return (
    <View className="items-center justify-center">
      <View className="absolute h-20 w-20 rounded-full bg-blue-500/10" />
      <View className="absolute h-14 w-14 rounded-full bg-blue-500/20" />

      <Animated.View
        style={{
          transform: [{ rotate: rotation }],
          backgroundColor: colors.primary,
        }}
        className="h-12 w-12 items-center justify-center rounded-full border-4 border-white"
      >
        <Car size={22} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

function RouteMarker({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <View className="items-center">
      <View
        style={{ backgroundColor: color }}
        className="h-11 w-11 items-center justify-center rounded-full border-4 border-white"
      >
        {icon}
      </View>

      <View className="-mt-1 rounded-full bg-black/80 px-2 py-1">
        <Text className="text-[10px] font-bold text-white">{label}</Text>
      </View>
    </View>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.input }} className="flex-1 rounded-2xl p-3">
      {icon}
      <Text style={{ color: colors.muted }} className="mt-2 text-[10px] font-bold">
        {label}
      </Text>
      <Text
        style={{ color: colors.text }}
        className="mt-0.5 text-xs font-extrabold"
        numberOfLines={1}
      >
        {value}
      </Text>
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
    <View style={{ flex: 1, backgroundColor: colors.bg }} className="items-center justify-center px-5">
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.text }} className="mt-4 text-xl font-extrabold">
        {title}
      </Text>
      {!!subtitle && (
        <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
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

function shortAddress(address?: string) {
  if (!address) return "";
  return address
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

function formatDuration(seconds: number) {
  if (!seconds) return "--";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function decodePolyline(encoded: string) {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

const premiumLightMapStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#E5E7EB" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#F1F5F9" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#DBEAFE" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#F8FAFC" }],
  },
];

const premiumDarkMapStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    elementType: "geometry",
    stylers: [{ color: "#111827" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#0F172A" }],
  },
];

function capitalize(value?: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDistanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function trimRouteFromDriver(route: LatLng[], driver: LatLng) {
  if (!route.length) return [];

  let nearestIndex = 0;
  let nearestDistance = Number.MAX_SAFE_INTEGER;

  route.forEach((point, index) => {
    const distance = getDistanceMeters(point, driver);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return [driver, ...route.slice(nearestIndex)];
}