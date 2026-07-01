import RouteMarker from "@/components/live-ride/RouteMarker";
import { premiumDarkMapStyle, premiumLightMapStyle } from "@/constants/mapStyles";
import { useAppTheme } from "@/theme/ThemeProvider";
import type { LatLng, LiveDriverLocation } from "@/types/liveRide.types";
import { splitRouteByDriver } from "@/utils/map";
import { MapPin, Navigation } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import MapView, { AnimatedRegion, Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import DriverMarker from "./DriverMaker";

type Props = {
  pickupCoordinate: LatLng;
  dropCoordinate: LatLng;
  routeCoords: LatLng[];
  driverLocation?: LiveDriverLocation | null;
  bottomOffset?: number;
  locateSignal?: number;
};

const DRIVER_ANIMATION_DURATION = 1200;

export default function LiveRideMap({
  pickupCoordinate,
  dropCoordinate,
  routeCoords,
  driverLocation,
  bottomOffset = 320,
  locateSignal = 0,
}: Props) {
  const { colors, isDark } = useAppTheme();
  const mapRef = useRef<MapView | null>(null);
  const [currentHeading, setCurrentHeading] = useState(0);

  const animatedCoordinate = useRef(
    new AnimatedRegion({
      latitude: pickupCoordinate.latitude,
      longitude: pickupCoordinate.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;

  const headingAnim = useRef(new Animated.Value(0)).current;

  const driverCoordinate = useMemo<LatLng | null>(() => {
    if (!driverLocation) return null;
    return {
      latitude: Number(driverLocation.latitude),
      longitude: Number(driverLocation.longitude),
    };
  }, [driverLocation]);

  const { completedRoute, remainingRoute } = useMemo(
    () => splitRouteByDriver(routeCoords, driverCoordinate),
    [routeCoords, driverCoordinate],
  );

  const fitRoute = () => {
    const coords = driverCoordinate
      ? [driverCoordinate, ...(remainingRoute.length ? remainingRoute : routeCoords), dropCoordinate]
      : [pickupCoordinate, ...(routeCoords.length ? routeCoords : []), dropCoordinate];

    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: {
        top: 120,
        right: 60,
        bottom: bottomOffset + 70,
        left: 60,
      },
      animated: true,
    });
  };

  useEffect(() => {
    const timer = setTimeout(fitRoute, 450);
    return () => clearTimeout(timer);
  }, [locateSignal]);

  useEffect(() => {
    const timer = setTimeout(fitRoute, 700);
    return () => clearTimeout(timer);
  }, [routeCoords.length]);

  useEffect(() => {
    if (!driverCoordinate) return;

    const nextHeading = Number(driverLocation?.heading ?? currentHeading ?? 0);

    animatedCoordinate
      .timing({
        latitude: driverCoordinate.latitude,
        longitude: driverCoordinate.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration: DRIVER_ANIMATION_DURATION,
        useNativeDriver: false,
      } as any)
      .start();

    Animated.timing(headingAnim, {
      toValue: nextHeading,
      duration: DRIVER_ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    setCurrentHeading(nextHeading);

    mapRef.current?.animateCamera(
      {
        center: driverCoordinate,
        heading: nextHeading,
        zoom: 16,
        pitch: 45,
      },
      { duration: DRIVER_ANIMATION_DURATION },
    );
  }, [driverCoordinate?.latitude, driverCoordinate?.longitude, driverLocation?.heading]);

  const headingRotation = headingAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={{
        latitude: pickupCoordinate.latitude,
        longitude: pickupCoordinate.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }}
      customMapStyle={isDark ? premiumDarkMapStyle : premiumLightMapStyle}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      showsTraffic={false}
      showsBuildings
      toolbarEnabled={false}
      rotateEnabled
      pitchEnabled
      moveOnMarkerPress={false}
      loadingEnabled
      loadingIndicatorColor={colors.primary}
      loadingBackgroundColor={colors.bg}
      onMapReady={fitRoute}
    >
      {completedRoute.length > 1 && (
        <Polyline
          coordinates={completedRoute}
          strokeColor={isDark ? "rgba(148,163,184,0.45)" : "rgba(148,163,184,0.75)"}
          strokeWidth={7}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {(remainingRoute.length > 1 ? remainingRoute : routeCoords).length > 1 && (
        <>
          <Polyline
            coordinates={remainingRoute.length > 1 ? remainingRoute : routeCoords}
            strokeColor={isDark ? "rgba(255,255,255,0.20)" : "rgba(15,23,42,0.16)"}
            strokeWidth={14}
            lineCap="round"
            lineJoin="round"
          />

          <Polyline
            coordinates={remainingRoute.length > 1 ? remainingRoute : routeCoords}
            strokeColor={colors.primary}
            strokeWidth={6}
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
        <Marker.Animated coordinate={animatedCoordinate as any} anchor={{ x: 0.5, y: 0.5 }} flat>
          <DriverMarker rotation={headingRotation} />
        </Marker.Animated>
      )}
    </MapView>
  );
}