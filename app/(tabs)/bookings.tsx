import { useConfirm } from "@/components/common/ConfirmProvider";
import { shortAddress } from "@/hooks/address-trimmer";
import {
  cancelBookingApi,
  getMyBookingsApi,
} from "@/services/booking.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Search,
  Ticket,
  X
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type BookingStatus = "upcoming" | "completed" | "cancelled" | "pending";

type BookingUi = {
  id: string;
  code: string;
  from: string;
  to: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  driver: string;
  car: string;
  paymentStatus: string;
  bookingStatus: BookingStatus;
};

const bookingTabs: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function BookingsScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: getMyBookingsApi,
  });

  const bookings: BookingUi[] = useMemo(() => {
    const rawBookings = data?.data?.bookings || [];
    return rawBookings.map(mapBookingToUi);
  }, [data]);

  const cancelMutation = useMutation({
    mutationFn: cancelBookingApi,
    onSuccess: async () => {
      toast.success("Booking cancelled successfully.");
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      await queryClient.invalidateQueries({ queryKey: ["home-bootstrap"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to cancel booking.");
    },
  });

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const routeText =
        `${booking.from} ${booking.to} ${booking.driver} ${booking.car} ${booking.code}`.toLowerCase();

      const matchesSearch = query ? routeText.includes(query) : true;
      const matchesTab =
        activeTab === "all" ? true : booking.bookingStatus === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [bookings, search, activeTab]);

  const upcomingCount = bookings.filter(
    (item) => item.bookingStatus === "upcoming" || item.bookingStatus === "pending"
  ).length;

  const completedCount = bookings.filter(
    (item) => item.bookingStatus === "completed"
  ).length;

  const handleCancelPress = async (booking: BookingUi) => {
    const ok = await confirm({
      title: "Cancel booking?",
      message: "This booking will be cancelled and your seat will be released.",
      confirmText: "Cancel",
      cancelText: "Keep Booking",
      danger: true,
    });

    if (!ok) return;

    cancelMutation.mutate(booking.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <View>
              <Text style={{ color: colors.muted }} className="text-sm">
                Travel history
              </Text>
              <Text
                style={{ color: colors.text }}
                className="mt-1 text-3xl font-extrabold"
              >
                My Bookings
              </Text>
            </View>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="h-12 w-12 items-center justify-center rounded-full"
            >
              <Ticket size={22} color={colors.primary} />
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
            className="mt-6 rounded-[30px] border p-4"
          >
            <View
              style={{ backgroundColor: colors.input }}
              className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
            >
              <Search size={18} color={colors.muted} />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search booking, route, driver"
                placeholderTextColor={colors.muted}
                autoCorrect={false}
                style={{ color: colors.text }}
                className="flex-1 text-base font-semibold"
              />

              {search.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSearch("")}
                >
                  <X size={17} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              {bookingTabs.map((tab) => {
                const active = activeTab === tab.value;

                return (
                  <TouchableOpacity
                    key={tab.value}
                    activeOpacity={0.85}
                    onPress={() => setActiveTab(tab.value)}
                    style={{
                      backgroundColor: active ? colors.primary : colors.input,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                    className="rounded-full border px-4 py-2"
                  >
                    <Text
                      style={{ color: active ? "#FFFFFF" : colors.text }}
                      className="text-xs font-extrabold"
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mt-6 flex-row gap-3">
            <SummaryCard
              label="Upcoming"
              value={`${upcomingCount}`}
              icon={<Clock size={17} color={colors.primary} />}
            />
            <SummaryCard
              label="Completed"
              value={`${completedCount}`}
              icon={<CheckCircle2 size={17} color={colors.success} />}
            />
          </View>

          <View className="mt-8 flex-row items-center justify-between">
            <Text
              style={{ color: colors.text }}
              className="text-xl font-extrabold"
            >
              Trips
            </Text>

            <Text style={{ color: colors.muted }} className="text-sm font-bold">
              {filteredBookings.length} booking
              {filteredBookings.length === 1 ? "" : "s"}
            </Text>
          </View>

          <View className="mt-5 gap-5">
            {isLoading ? (
              <LoadingBookings />
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  cancelling={cancelMutation.isPending}
                  onCancel={() => handleCancelPress(booking)}
                />
              ))
            ) : (
              <EmptyBookings />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: BookingUi;
  onCancel: () => void;
  cancelling?: boolean;
}) {
  const { colors } = useAppTheme();

  const statusTheme = getStatusTheme(booking.bookingStatus, colors);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/booking/[id]",
          params: { id: booking.id },
        })
      }
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className="overflow-hidden rounded-[30px] border p-5 shadow"
    >
      <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10" />

      <View className="flex-row items-center justify-between">
        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="h-12 w-12 items-center justify-center rounded-2xl"
        >
          <Ticket size={22} color={colors.primary} />
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

      <Text
        style={{ color: colors.text }}
        className="mt-4 text-xl font-extrabold"
        numberOfLines={2}
      >
        {shortAddress(booking.from)} → {shortAddress(booking.to)}
      </Text>

      {/* <Text style={{ color: colors.muted }} className="mt-2 text-xs font-bold">
        Booking ID: {booking.code}
      </Text> */}

      <View className="mt-4 gap-3">
        <InfoRow
          icon={<Calendar size={16} color={colors.primary} />}
          text={`${formatDisplayDate(booking.date)} • ${formatDisplayTime(
            booking.time
          )}`}
        />

        {/* <InfoRow
          icon={<MapPin size={16} color={colors.primary} />}
          text={`${booking.pickup} to ${booking.drop}`}
        /> */}

        <InfoRow
          icon={<Car size={16} color={colors.primary} />}
          text={`${booking.car} • ${booking.seats} seat${booking.seats > 1 ? "s" : ""
            }`}
        />
      </View>

      <View
        style={{ borderTopColor: colors.border }}
        className="mt-5 flex-row items-center justify-between border-t pt-4"
      >
        <View>
          <Text style={{ color: colors.muted }} className="text-xs">
            Payable amount
          </Text>
          <Text
            style={{ color: colors.primary }}
            className="mt-1 text-lg font-extrabold"
          >
            ₹{booking.price}
          </Text>
          <Text style={{ color: colors.muted }} className="mt-1 text-[11px] font-bold">
            {booking.paymentStatus.toUpperCase()}
          </Text>
        </View>

        {booking.bookingStatus === "upcoming" ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(event) => {
              event.stopPropagation();
              onCancel();
            }}
            disabled={cancelling}
            style={{
              backgroundColor: colors.dangerSoft,
              opacity: cancelling ? 0.7 : 1,
            }}
            className="rounded-full px-4 py-2"
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Text style={{ color: colors.danger }} className="text-xs font-bold">
                Cancel
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(event) => {
              event.stopPropagation();
              router.push({
                pathname: "/booking/[id]",
                params: { id: booking.id },
              });
            }}
            style={{ backgroundColor: colors.primarySoft }}
            className="rounded-full px-4 py-2"
          >
            <Text style={{ color: colors.primary }} className="text-xs font-bold">
              View
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text
        style={{ color: colors.muted }}
        className="flex-1 text-sm font-medium"
        numberOfLines={1}
      >
        {text || "Not available"}
      </Text>
    </View>
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
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="flex-1 rounded-[24px] border p-4"
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text style={{ color: colors.muted }} className="text-xs font-bold">
          {label}
        </Text>
      </View>

      <Text
        style={{ color: colors.text }}
        className="mt-2 text-2xl font-extrabold"
      >
        {value}
      </Text>
    </View>
  );
}

function LoadingBookings() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="items-center rounded-[30px] border p-8"
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
        Loading bookings...
      </Text>
    </View>
  );
}

function EmptyBookings() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
      }}
      className="items-center rounded-[30px] border p-8"
    >
      <Ticket size={36} color={colors.muted} />

      <Text style={{ color: colors.text }} className="mt-4 text-lg font-extrabold">
        No bookings found
      </Text>

      <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
        Your upcoming and completed trips will appear here.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/rides")}
        style={{ backgroundColor: colors.primary }}
        className="mt-5 rounded-2xl px-5 py-3"
      >
        <Text className="font-extrabold text-white">Find Rides</Text>
      </TouchableOpacity>
    </View>
  );
}

function mapBookingToUi(booking: any): BookingUi {
  return {
    id: String(booking.id),

    code: booking.code || booking.booking_code || `#${booking.id}`,

    from: booking.from || "",
    to: booking.to || "",

    pickup: booking.pickup || booking.from || "",
    drop: booking.drop || booking.to || "",

    date: booking.date || booking.ride_date || "",
    time: booking.time || booking.ride_time || "",

    price: Number(booking.price || booking.total_price || 0),

    seats: Number(booking.seats || 1),

    driver: booking.driver || "Driver",

    car: booking.car || "Vehicle",

    paymentStatus:
      booking.paymentStatus ||
      booking.payment_status ||
      "unpaid",

    bookingStatus: normalizeBookingStatus(
      booking.bookingStatus || booking.status,
    ),
  };
}

function normalizeBookingStatus(status?: string): BookingStatus {
  const value = String(status || "").toLowerCase();
  if (["completed", "complete"].includes(value)) return "completed";
  if (["cancelled", "canceled", "rejected"].includes(value)) {
    return "cancelled";
  }
  if (["pending", "payment_pending"].includes(value)) {
    return "pending";
  }
  return "upcoming";
}

function formatDisplayDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDisplayTime(value?: string) {
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
  status: BookingStatus,
  colors: ReturnType<typeof useAppTheme>["colors"]
) {
  if (status === "completed") {
    return {
      label: "Completed",
      bg: colors.primarySoft,
      text: colors.primary,
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      bg: colors.dangerSoft,
      text: colors.danger,
    };
  }

  if (status === "pending") {
    return {
      label: "Pending",
      bg: "rgba(245,158,11,0.14)",
      text: "#F59E0B",
    };
  }

  return {
    label: "Upcoming",
    bg: "rgba(34,197,94,0.14)",
    text: colors.success,
  };
}