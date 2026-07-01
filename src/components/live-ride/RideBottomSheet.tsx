import { useAppTheme } from "@/theme/ThemeProvider";
import type { LiveDriverLocation, LiveRide } from "@/types/liveRide.types";
import { capitalize, shortAddress } from "@/utils/liveRide";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RideInfoCards from "./RideInfoCards";

type Props = {
  ride: LiveRide;
  connectionLabel: string;
  isRideOngoing: boolean;
  trackingStopped: boolean;
  error?: string | null;
  driverLocation?: LiveDriverLocation | null;
};

export default function RideBottomSheet({
  ride,
  connectionLabel,
  isRideOngoing,
  trackingStopped,
  error,
  driverLocation,
}: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const statusMessage = getStatusMessage({
    isRideOngoing,
    trackingStopped,
    hasDriverLocation: Boolean(driverLocation),
    error,
  });

  const statusColor = error
    ? colors.danger
    : trackingStopped
      ? colors.muted
      : isRideOngoing && driverLocation
        ? colors.success
        : colors.muted;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 18 : 14),
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -8 },
        elevation: 20,
      }}
      className="absolute bottom-0 left-0 right-0 rounded-t-[34px] border px-5 pt-5"
    >
      <View className="mb-4 h-1 w-12 self-center rounded-full bg-slate-400/40" />

      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text
            style={{ color: colors.text }}
            className="text-xl font-extrabold"
            numberOfLines={2}
          >
            {shortAddress(ride.source_address)} →{" "}
            {shortAddress(ride.destination_address)}
          </Text>

          <Text
            style={{ color: colors.muted }}
            className="mt-1 text-sm font-semibold"
            numberOfLines={1}
          >
            {ride.driver_name || "Driver"} • {capitalize(String(ride.status))}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: isRideOngoing
              ? "rgba(34,197,94,0.14)"
              : colors.primarySoft,
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

      <RideInfoCards
        connectionLabel={connectionLabel}
        durationSeconds={ride.duration_seconds}
        isVerified={Boolean(ride.is_verified)}
        speed={driverLocation?.speed}
      />

      <View
        style={{
          backgroundColor: error ? colors.dangerSoft : colors.input,
        }}
        className="mt-4 rounded-2xl px-4 py-3"
      >
        <Text
          style={{ color: statusColor }}
          className="text-xs font-bold leading-5"
        >
          {statusMessage}
        </Text>
      </View>
    </View>
  );
}

function getStatusMessage({
  isRideOngoing,
  trackingStopped,
  hasDriverLocation,
  error,
}: {
  isRideOngoing: boolean;
  trackingStopped: boolean;
  hasDriverLocation: boolean;
  error?: string | null;
}) {
  if (error) return error;
  if (trackingStopped) return "Live tracking has stopped.";
  if (!isRideOngoing) return "Live tracking will begin once the driver starts the ride.";
  if (hasDriverLocation) return "Driver location is updating live on the map.";

  return "Waiting for driver location...";
}