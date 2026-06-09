import { getMyRidesApi } from "@/services/ride.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Car,
    Plus,
    Ticket,
    Users
} from "lucide-react-native";
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PublishedRide = {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  car: string;
  status: string;
};

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 5,
};

export default function MyPublishedRidesScreen() {
  const { colors } = useAppTheme();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-rides"],
    queryFn: getMyRidesApi,
  });

  const rides: PublishedRide[] =
    data?.data?.rides?.map(mapRideToUi) || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 120,
          }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="h-11 w-11 items-center justify-center rounded-full border"
            >
              <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/publish")}
              style={{ backgroundColor: colors.primary }}
              className="h-11 w-11 items-center justify-center rounded-full"
            >
              <Plus size={21} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View className="mt-6">
            <Text style={{ color: colors.muted }} className="text-sm font-semibold">
              Driver dashboard
            </Text>

            <Text style={{ color: colors.text }} className="mt-1 text-3xl font-extrabold">
              My Published Rides
            </Text>

            <Text style={{ color: colors.muted }} className="mt-2 text-sm leading-5">
              Manage your rides, seats, pricing, and passenger bookings.
            </Text>
          </View>

          <View className="mt-6 flex-row gap-3">
            <SummaryCard
              icon={<Ticket size={17} color={colors.primary} />}
              label="Published"
              value={`${rides.length}`}
            />

            <SummaryCard
              icon={<Users size={17} color={colors.success} />}
              label="Available Seats"
              value={`${rides.reduce((sum, ride) => sum + ride.availableSeats, 0)}`}
            />
          </View>

          <View className="mt-8 flex-row items-center justify-between">
            <Text style={{ color: colors.text }} className="text-xl font-extrabold">
              Rides
            </Text>

            <Text style={{ color: colors.muted }} className="text-sm font-bold">
              {rides.length} ride{rides.length === 1 ? "" : "s"}
            </Text>
          </View>

          <View className="mt-5 gap-5">
            {isLoading ? (
              <LoadingCard />
            ) : rides.length > 0 ? (
              rides.map((ride) => <RideCard key={ride.id} ride={ride} />)
            ) : (
              <EmptyState />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RideCard({ ride }: { ride: PublishedRide }) {
  const { colors } = useAppTheme();
  const statusTheme = getStatusTheme(ride.status, colors);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() =>
        router.push({
          pathname: "/driver-ride/[id]" as any,
          params: { id: ride.id },
        })
      }
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        ...cardShadow,
      }}
      className="overflow-hidden rounded-[30px] border p-5"
    >
      <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10" />

      <View className="flex-row items-start justify-between gap-3">
        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="h-12 w-12 items-center justify-center rounded-2xl"
        >
          <Car size={22} color={colors.primary} />
        </View>

        <View
          style={{ backgroundColor: statusTheme.bg }}
          className="rounded-full px-3 py-1.5"
        >
          <Text style={{ color: statusTheme.text }} className="text-xs font-bold">
            {statusTheme.label}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <View className="items-center pt-1">
          <View
            style={{ backgroundColor: colors.primary }}
            className="h-2.5 w-2.5 rounded-full"
          />
          <View
            style={{ backgroundColor: colors.border }}
            className="my-1 h-8 w-[1px]"
          />
          <View
            style={{ backgroundColor: colors.success }}
            className="h-2.5 w-2.5 rounded-full"
          />
        </View>

        <View className="flex-1">
          <Text
            style={{ color: colors.text }}
            className="text-lg font-extrabold"
            numberOfLines={1}
          >
            {ride.from}
          </Text>

          <Text
            style={{ color: colors.text }}
            className="mt-4 text-lg font-extrabold"
            numberOfLines={1}
          >
            {ride.to}
          </Text>
        </View>
      </View>

      <View className="mt-5 gap-2">
        <InfoLine
          icon={<Calendar size={15} color={colors.primary} />}
          text={`${formatDate(ride.date)} • ${formatTime(ride.time)}`}
        />

        <InfoLine
          icon={<Car size={15} color={colors.primary} />}
          text={ride.car}
        />
      </View>

      <View
        style={{ borderTopColor: colors.border }}
        className="mt-5 flex-row items-center justify-between border-t pt-4"
      >
        <View>
          <Text style={{ color: colors.muted }} className="text-xs font-bold">
            Price / Seat
          </Text>
          <Text style={{ color: colors.primary }} className="mt-1 text-xl font-extrabold">
            ₹{ride.price}
          </Text>
        </View>

        <View className="items-end">
          <Text style={{ color: colors.muted }} className="text-xs font-bold">
            Seats
          </Text>
          <Text style={{ color: colors.text }} className="mt-1 font-extrabold">
            {ride.availableSeats}/{ride.totalSeats} available
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/driver-ride/[id]" as any,
            params: { id: ride.id },
          })
        }
        style={{ backgroundColor: colors.primarySoft }}
        className="mt-5 rounded-2xl py-3"
      >
        <Text style={{ color: colors.primary }} className="text-center font-extrabold">
          View Bookings & Manage
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function SummaryCard({
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
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        ...cardShadow,
      }}
      className="flex-1 rounded-[24px] border p-4"
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text style={{ color: colors.muted }} className="text-xs font-bold">
          {label}
        </Text>
      </View>

      <Text style={{ color: colors.text }} className="mt-2 text-2xl font-extrabold">
        {value}
      </Text>
    </View>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text
        style={{ color: colors.muted }}
        className="flex-1 text-sm font-semibold"
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function LoadingCard() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        ...cardShadow,
      }}
      className="items-center rounded-[30px] border p-8"
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
        Loading published rides...
      </Text>
    </View>
  );
}

function EmptyState() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        ...cardShadow,
      }}
      className="items-center rounded-[30px] border p-8"
    >
      <Car size={38} color={colors.muted} />

      <Text style={{ color: colors.text }} className="mt-4 text-lg font-extrabold">
        No published rides yet
      </Text>

      <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
        Publish your first ride and start accepting passenger bookings.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/publish")}
        style={{ backgroundColor: colors.primary }}
        className="mt-5 rounded-2xl px-5 py-3"
      >
        <Text className="font-extrabold text-white">Publish Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

function mapRideToUi(ride: any): PublishedRide {
  return {
    id: String(ride.id),
    from: shortAddress(ride.source_address),
    to: shortAddress(ride.destination_address),
    date: ride.ride_date || "",
    time: ride.departure_time || "",
    price: Number(ride.price_per_seat || 0),
    totalSeats: Number(ride.total_seats || 0),
    availableSeats: Number(ride.available_seats || 0),
    car: `${ride.brand || ""} ${ride.model || ""}`.trim() || "Vehicle",
    status: ride.status || "scheduled",
  };
}

function shortAddress(address?: string) {
  if (!address) return "";

  return address
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(value?: string) {
  if (!value) return "Time unavailable";

  const parts = value.split(":");

  if (parts.length < 2) return value;

  let hour = Number(parts[0]);
  const minute = parts[1];

  if (Number.isNaN(hour)) return value;

  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minute} ${ampm}`;
}

function getStatusTheme(
  status: string,
  colors: ReturnType<typeof useAppTheme>["colors"]
) {
  const value = String(status || "").toLowerCase();

  if (value === "cancelled") {
    return {
      label: "Cancelled",
      bg: colors.dangerSoft,
      text: colors.danger,
    };
  }

  if (value === "completed") {
    return {
      label: "Completed",
      bg: colors.primarySoft,
      text: colors.primary,
    };
  }

  return {
    label: "Scheduled",
    bg: "rgba(34,197,94,0.14)",
    text: colors.success,
  };
}