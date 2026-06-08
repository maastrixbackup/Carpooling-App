import { shortAddress } from "@/hooks/address-trimmer";
import { getRideByIdApi } from "@/services/ride.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Clock,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type LatLng = {
  latitude: number;
  longitude: number;
};

type RouteCacheValue = {
  coords: LatLng[];
  distance: string;
  duration: string;
};

const routeCache = new Map<string, RouteCacheValue>();

function mapApiRide(ride: any) {
  return {
    id: String(ride.id),
    from: shortAddress(ride.source_address),
    to: shortAddress(ride.destination_address),
    pickup: shortAddress(ride.source_address).split(",")[0],
    drop: shortAddress(ride.destination_address),
    price: Number(ride.price_per_seat || 0),
    seats: Number(ride.available_seats || 0),
    driver: ride.driver_name || "Driver",
    rating: Number(ride.vehicle_rating || 4.8),
    car: `${ride.brand || ""} ${ride.model || ""}`.trim() || "Vehicle",
    pickupCoordinate: {
      latitude: Number(ride.source_lat),
      longitude: Number(ride.source_lng),
    },
    dropCoordinate: {
      latitude: Number(ride.destination_lat),
      longitude: Number(ride.destination_lng),
    },
    polyline: ride.polyline,
    distanceMeters: ride.distance_meters,
    durationSeconds: ride.duration_seconds,
  };
}

export default function RideMapScreen() {
  const { colors, isDark } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mapRef = useRef<MapView | null>(null);

  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [distanceText, setDistanceText] = useState("Calculating");
  const [durationText, setDurationText] = useState("Calculating");
  const [isRouteLoading, setIsRouteLoading] = useState(true);
  const [routeFailed, setRouteFailed] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ride-map", id],
    queryFn: () => getRideByIdApi(id),
    enabled: !!id,
  });

  const ride = data?.data?.ride ? mapApiRide(data.data.ride) : null;

  const pickupCoordinate = useMemo<LatLng>(
    () =>
      ride?.pickupCoordinate ?? {
        latitude: 20.2961,
        longitude: 85.8245,
      },
    [ride]
  );

  const dropCoordinate = useMemo<LatLng>(
    () =>
      ride?.dropCoordinate ?? {
        latitude: 20.4625,
        longitude: 85.883,
      },
    [ride]
  );

  const cacheKey = useMemo(() => {
    if (!ride) return "";

    return `${ride.id}-${pickupCoordinate.latitude}-${pickupCoordinate.longitude}-${dropCoordinate.latitude}-${dropCoordinate.longitude}`;
  }, [ride, pickupCoordinate, dropCoordinate]);

  const fitRouteToScreen = useCallback(() => {
    const coordinates =
      routeCoords.length > 0 ? routeCoords : [pickupCoordinate, dropCoordinate];

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 120,
        right: 60,
        bottom: 390,
        left: 60,
      },
      animated: true,
    });
  }, [routeCoords, pickupCoordinate, dropCoordinate]);

  const fetchRoadRoute = useCallback(async () => {
    if (!ride || !cacheKey) return;

    const cached = routeCache.get(cacheKey);

    if (cached) {
      setRouteCoords(cached.coords);
      setDistanceText(cached.distance);
      setDurationText(cached.duration);
      setRouteFailed(false);
      setIsRouteLoading(false);
      return;
    }

    try {
      setIsRouteLoading(true);
      setRouteFailed(false);

      if (ride.polyline) {
        const decoded = decodePolyline(ride.polyline);

        setRouteCoords(decoded);
        setDistanceText(
          ride.distanceMeters ? `${(Number(ride.distanceMeters) / 1000).toFixed(1)} km` : "Unavailable"
        );
        setDurationText(
          ride.durationSeconds ? `${Math.round(Number(ride.durationSeconds) / 60)} min` : "Unavailable"
        );

        routeCache.set(cacheKey, {
          coords: decoded,
          distance: ride.distanceMeters
            ? `${(Number(ride.distanceMeters) / 1000).toFixed(1)} km`
            : "Unavailable",
          duration: ride.durationSeconds
            ? `${Math.round(Number(ride.durationSeconds) / 60)} min`
            : "Unavailable",
        });

        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        throw new Error("Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY");
      }

      const origin = `${pickupCoordinate.latitude},${pickupCoordinate.longitude}`;
      const destination = `${dropCoordinate.latitude},${dropCoordinate.longitude}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=driving&key=${apiKey}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.status !== "OK") {
        throw new Error(result.error_message || result.status || "Directions failed");
      }

      const route = result.routes?.[0];
      const leg = route?.legs?.[0];
      const encodedPoints = route?.overview_polyline?.points;

      if (!encodedPoints) {
        throw new Error("No route polyline returned");
      }

      const decodedCoords = decodePolyline(encodedPoints);
      const distance = leg?.distance?.text || "Unavailable";
      const duration = leg?.duration?.text || "Unavailable";

      setRouteCoords(decodedCoords);
      setDistanceText(distance);
      setDurationText(duration);

      routeCache.set(cacheKey, {
        coords: decodedCoords,
        distance,
        duration,
      });
    } catch (error) {
      console.log("Route fetch error:", error);
      setRouteFailed(true);
      setDistanceText("Unavailable");
      setDurationText("Unavailable");
      setRouteCoords([pickupCoordinate, dropCoordinate]);
    } finally {
      setIsRouteLoading(false);
    }
  }, [ride, cacheKey, pickupCoordinate, dropCoordinate]);

  useEffect(() => {
    fetchRoadRoute();
  }, [fetchRoadRoute]);

  useEffect(() => {
    if (!ride) return;

    const timer = setTimeout(() => {
      fitRouteToScreen();
    }, 500);

    return () => clearTimeout(timer);
  }, [ride, routeCoords.length, fitRouteToScreen]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        const cached = cacheKey ? routeCache.get(cacheKey) : undefined;

        if (cached) {
          setRouteCoords(cached.coords);
          setDistanceText(cached.distance);
          setDurationText(cached.duration);
          setRouteFailed(false);
          setIsRouteLoading(false);
        }

        fitRouteToScreen();
      }, 250);

      return () => clearTimeout(timer);
    }, [cacheKey, fitRouteToScreen])
  );

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg }}
        className="items-center justify-center px-5"
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.muted }} className="mt-3 font-bold">
          Loading map...
        </Text>
      </View>
    );
  }

  if (isError || !ride) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg }}
        className="items-center justify-center px-5"
      >
        <Text style={{ color: colors.text }} className="text-xl font-extrabold">
          Ride not found
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: colors.primary }}
          className="mt-5 rounded-2xl px-6 py-3"
        >
          <Text className="font-extrabold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: pickupCoordinate.latitude,
          longitude: pickupCoordinate.longitude,
          latitudeDelta: 0.18,
          longitudeDelta: 0.18,
        }}
        customMapStyle={isDark ? darkMapStyle : []}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled
        rotateEnabled={false}
      >
        {routeCoords.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoords}
              strokeColor="rgba(0,102,204,0.22)"
              strokeWidth={10}
              geodesic={false}
            />

            <Polyline
              coordinates={routeCoords}
              strokeColor={colors.primary}
              strokeWidth={5}
              geodesic={false}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        <Marker coordinate={pickupCoordinate} title={ride.pickup}>
          <RouteMarker
            label="Pickup"
            icon={<MapPin size={18} color="#FFFFFF" />}
            color={colors.primary}
          />
        </Marker>

        <Marker coordinate={dropCoordinate} title={ride.drop}>
          <RouteMarker
            label="Drop"
            icon={<Navigation size={18} color="#FFFFFF" />}
            color={colors.success}
          />
        </Marker>
      </MapView>

      {isRouteLoading && routeCoords.length === 0 && (
        <View className="absolute inset-0 items-center justify-center bg-black/10">
          <View
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="items-center rounded-3xl border px-5 py-4"
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.text }} className="mt-2 text-xs font-bold">
              Loading road route
            </Text>
          </View>
        </View>
      )}

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
            onPress={fitRouteToScreen}
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="h-11 w-11 items-center justify-center rounded-full border"
          >
            <LocateFixed size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="absolute bottom-0 left-0 right-0 rounded-t-[34px] border px-5 pb-8 pt-5"
      >
        <View className="mb-4 h-1 w-12 self-center rounded-full bg-slate-400/40" />

        <View className="flex-row items-center justify-between">
          <View
            style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
            className="flex-row items-center gap-1 rounded-full px-3 py-1.5"
          >
            <ShieldCheck size={14} color={colors.success} />
            <Text style={{ color: colors.success }} className="text-xs font-bold">
              Verified ride
            </Text>
          </View>

          <View className="flex-row items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5">
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={{ color: colors.text }} className="text-xs font-bold">
              {ride.rating.toFixed(1)}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text style={{ color: colors.text }} className="text-xl font-extrabold">
              {ride.from} <Text style={{ color: colors.danger }} > → </Text>{ride.to}
            </Text>

            <Text style={{ color: colors.muted }} className="mt-2 text-sm font-semibold">
              {ride.driver} • {ride.car}
            </Text> 
          </View>

          <View
            style={{ backgroundColor: colors.primarySoft }}
            className="rounded-2xl px-4 py-2"
          >
            <Text style={{ color: colors.primary }} className="text-lg font-extrabold">
              ₹{ride.price}
            </Text>
            <Text style={{ color: colors.muted }} className="text-[10px] font-bold">
              per seat
            </Text>
          </View>
        </View>

        {routeFailed && (
          <View
            style={{ backgroundColor: colors.dangerSoft }}
            className="mt-4 rounded-2xl px-4 py-3"
          >
            <Text style={{ color: colors.danger }} className="text-xs font-bold">
              Road route is unavailable. Showing fallback route.
            </Text>
          </View>
        )}

        <View className="mt-5 flex-row gap-3">
          <MiniInfo
            icon={<Clock size={16} color={colors.primary} />}
            label="Duration"
            text={isRouteLoading ? "..." : durationText}
            loading={isRouteLoading}
          />

          <MiniInfo
            icon={<Navigation size={16} color={colors.primary} />}
            label="Distance"
            text={isRouteLoading ? "..." : distanceText}
            loading={isRouteLoading}
          />

          <MiniInfo
            icon={<Users size={16} color={colors.primary} />}
            label="Seats"
            text={`${ride.seats} left`}
          />
        </View>

        <View style={{ backgroundColor: colors.input }} className="mt-5 rounded-3xl p-4">
          <RoutePoint color={colors.primary} title={ride.pickup} subtitle="Pickup point" />

          <View
            style={{ backgroundColor: colors.border }}
            className="ml-[7px] h-8 w-0.5"
          />

          <RoutePoint color={colors.success} title={ride.drop} subtitle="Drop point" />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/ride/[id]",
              params: { id: ride.id },
            })
          }
          style={{ backgroundColor: colors.primary }}
          className="mt-5 rounded-2xl py-4"
        >
          <Text className="text-center text-base font-extrabold text-white">
            Continue to Details
          </Text>
        </TouchableOpacity>
      </View>
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
        className="h-12 w-12 items-center justify-center rounded-full border-4 border-white"
      >
        {icon}
      </View>

      <View className="-mt-1 rounded-full bg-black/80 px-2 py-1">
        <Text className="text-[10px] font-bold text-white">{label}</Text>
      </View>
    </View>
  );
}

function MiniInfo({
  icon,
  label,
  text,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  loading?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.input }}
      className="flex-1 items-center rounded-2xl px-2 py-3"
    >
      {loading ? <ActivityIndicator size="small" color={colors.primary} /> : icon}

      <Text style={{ color: colors.muted }} className="mt-1 text-[10px] font-bold">
        {label}
      </Text>

      <Text
        style={{ color: colors.text }}
        className="mt-0.5 text-center text-[11px] font-extrabold"
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function RoutePoint({
  color,
  title,
  subtitle,
}: {
  color: string;
  title: string;
  subtitle: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-start gap-3">
      <View
        style={{ backgroundColor: color }}
        className="mt-1 h-4 w-4 rounded-full border-2 border-white"
      />

      <View className="flex-1">
        <Text style={{ color: colors.text }} className="font-extrabold" numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-xs">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#121212" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#A1A1AA" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1F2937" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0F172A" }],
  },
];

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