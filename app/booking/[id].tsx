import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  cancelBookingApi,
  getBookingByIdApi,
} from "@/services/booking.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  IndianRupee,
  Navigation,
  Phone,
  ShieldCheck,
  Ticket,
  User,
  Users,
  XCircle
} from "lucide-react-native";
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
const cardShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 8,
  },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 5,
};

const smallShadow = {
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 3,
};
type BookingDetails = {
  id: string;
  code: string;
  rideId: string;
  from: string;
  to: string;
  fullFrom: string;
  fullTo: string;
  sourceLat: number;
  sourceLng: number;
  destinationLat: number;
  destinationLng: number;
  date: string;
  time: string;
  seats: number;
  pricePerSeat: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: string;
  paymentType: string;
  driverName: string;
  driverPhone?: string | null;
  car: string;
  registrationNumber: string;
  color: string;
};

export default function BookingDetailsScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["booking-details", id],
    queryFn: () => getBookingByIdApi(id!),
    enabled: !!id,
  });

  const booking = data?.data?.booking
    ? mapBookingToDetails(data.data.booking)
    : null;

  const cancelMutation = useMutation({
    mutationFn: cancelBookingApi,
    onSuccess: async () => {
      toast.success("Booking cancelled successfully.");
      await queryClient.invalidateQueries({ queryKey: ["booking-details", id] });
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      await queryClient.invalidateQueries({ queryKey: ["home-bootstrap"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to cancel booking.");
    },
  });

  const handleCancelBooking = async () => {
    if (!booking) return;

    const ok = await confirm({
      title: "Cancel booking?",
      message:
        "This booking will be cancelled and your reserved seats will be released.",
      confirmText: "Cancel",
      cancelText: "Keep Booking",
      danger: true,
    });

    if (!ok) return;

    cancelMutation.mutate(booking.id);
  };

  const handleCallDriver = () => {
    if (!booking?.driverPhone) {
      toast.error("Driver phone number is not available.");
      return;
    }

    Linking.openURL(`tel:${booking.driverPhone}`);
  };

  const handleViewMap = () => {
    if (!booking) return;

    router.push({
      pathname: "/ride-map/[id]" as any,
      params: { id: booking.rideId },
    });
  };

  if (isLoading) {
    return (
      <CenterState
        icon={<Ticket size={42} color={colors.primary} />}
        title="Loading booking..."
        subtitle="Please wait while we fetch your trip details."
        loading
      />
    );
  }

  if (isError || !booking) {
    return (
      <CenterState
        icon={<Ticket size={42} color={colors.muted} />}
        title="Booking not found"
        subtitle="This booking may not exist or may have been removed."
        actionText="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  const statusTheme = getStatusTheme(booking.status, colors);
  const canCancel = booking.status === "pending" || booking.status === "confirmed";

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
            paddingBottom: canCancel ? 190 : 135,
          }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.card, borderColor: colors.border, shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 18,
                elevation: 6,
              }}
              className="h-11 w-11 items-center justify-center rounded-full border"
            >
              <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <View
              style={{ backgroundColor: statusTheme.bg }}
              className="rounded-full px-4 py-2"
            >
              <Text
                style={{ color: statusTheme.text }}
                className="text-xs font-extrabold"
              >
                {statusTheme.label}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.primary,
              ...cardShadow,
            }}
            className="mt-6 overflow-hidden rounded-[34px] p-6"
          >
            <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <View className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/10" />

            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text className="font-bold text-white">Booking Details</Text>
            </View>

            <Text className="mt-4 text-xl font-extrabold leading-9 text-white">
              {booking.from}
            </Text>

            <Text className="my-1 text-2xl font-extrabold text-blue-100">↓</Text>

            <Text className="text-xl font-extrabold leading-9 text-white">
              {booking.to}
            </Text>

            <Text className="mt-4 text-sm font-bold text-blue-100">
              {formatDisplayDate(booking.date)} • {formatDisplayTime(booking.time)}
            </Text>

            <Text className="mt-2 text-xs font-bold text-white/80">
              Booking ID: {booking.code}
            </Text>
          </View>

          <View className="mt-5 flex-row gap-3">
            <MiniStat
              icon={<IndianRupee size={17} color={colors.primary} />}
              label="Total"
              value={`₹${booking.totalPrice}`}
            />

            <MiniStat
              icon={<Users size={17} color={colors.success} />}
              label="Seats"
              value={`${booking.seats}`}
            />
          </View>

          <SectionCard title="Trip Details">
            <InfoRow
              icon={<Calendar size={18} color={colors.primary} />}
              label="Date & Time"
              value={`${formatDisplayDate(booking.date)} • ${formatDisplayTime(
                booking.time
              )}`}
            />

            {/* <InfoRow
              icon={<MapPin size={18} color={colors.primary} />}
              label="Pickup"
              value={booking.fullFrom}
            />

            <InfoRow
              icon={<MapPin size={18} color={colors.success} />}
              label="Drop"
              value={booking.fullTo}
            /> */}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleViewMap}
              style={{ backgroundColor: colors.primarySoft }}
              className="mt-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
            >
              <Navigation size={18} color={colors.primary} />
              <Text style={{ color: colors.primary }} className="font-extrabold">
                View Route Map
              </Text>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard title="Driver & Vehicle">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row flex-1 items-center gap-3">
                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="h-14 w-14 items-center justify-center rounded-full"
                >
                  <User size={24} color={colors.primary} />
                </View>

                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="text-base font-extrabold">
                    {booking.driverName}
                  </Text>
                  <Text style={{ color: colors.muted }} className="mt-1 text-xs font-semibold">
                    {booking.car} • {booking.color}
                  </Text>
                </View>
              </View>

              <View
                style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
                className="rounded-full px-3 py-1.5"
              >
                <Text style={{ color: colors.success }} className="text-xs font-bold">
                  Verified
                </Text>
              </View>
            </View>

            <InfoRow
              icon={<Car size={18} color={colors.primary} />}
              label="Registration"
              value={booking.registrationNumber}
            />

            {booking.driverPhone && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCallDriver}
                style={{ backgroundColor: colors.input }}
                className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
              >
                <Phone size={18} color={colors.primary} />
                <Text style={{ color: colors.text }} className="font-extrabold">
                  Call Driver
                </Text>
              </TouchableOpacity>
            )}
          </SectionCard>

          <SectionCard title="Payment Summary">
            <SummaryRow
              label="Seat price"
              value={`₹${booking.pricePerSeat}`}
            />
            <SummaryRow
              label="Seats booked"
              value={`${booking.seats}`}
            />
            <SummaryRow
              label="Payment type"
              value={capitalize(booking.paymentType)}
            />
            <SummaryRow
              label="Payment status"
              value={capitalize(booking.paymentStatus)}
            />

            <View
              style={{ borderTopColor: colors.border }}
              className="mt-2 border-t pt-4"
            >
              <SummaryRow
                label="Total"
                value={`₹${booking.totalPrice}`}
                strong
              />
            </View>
          </SectionCard>

        </ScrollView>

        <View
          style={{
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          }}
          className="absolute bottom-0 left-0 right-0 border-t rounded-t-[28px] px-5 pb-8 pt-4"
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.muted }} className="text-sm">
                Payable Amount
              </Text>
              <Text
                style={{ color: colors.text }}
                className="mt-1 text-2xl font-extrabold"
              >
                ₹{booking.totalPrice}
              </Text>
            </View>

            <View
              style={{ backgroundColor: statusTheme.bg }}
              className="rounded-full px-4 py-2"
            >
              <Text
                style={{ color: statusTheme.text }}
                className="text-xs font-bold"
              >
                {statusTheme.label}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleViewMap}
              style={{ backgroundColor: colors.primarySoft }}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
            >
              <Navigation size={18} color={colors.primary} />
              <Text style={{ color: colors.primary }} className="font-extrabold">
                Map
              </Text>
            </TouchableOpacity>

            {canCancel ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCancelBooking}
                disabled={cancelMutation.isPending}
                style={{
                  backgroundColor: colors.danger,
                  opacity: cancelMutation.isPending ? 0.75 : 1,
                }}
                className="flex-[1.4] flex-row items-center justify-center gap-2 rounded-2xl py-4"
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <XCircle size={18} color="#FFFFFF" />
                    <Text className="font-extrabold text-white">Cancel</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled
                style={{ backgroundColor: statusTheme.bg }}
                className="flex-[1.4] items-center justify-center rounded-2xl py-4"
              >
                <Text style={{ color: statusTheme.text }} className="font-extrabold">
                  {statusTheme.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function CenterState({
  icon,
  title,
  subtitle,
  loading,
  actionText,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  loading?: boolean;
  actionText?: string;
  onAction?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg }}
      className="items-center justify-center px-5"
    >
      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="w-full items-center rounded-[30px] border p-8"
      >
        {loading ? <ActivityIndicator color={colors.primary} /> : icon}

        <Text style={{ color: colors.text }} className="mt-4 text-xl font-extrabold">
          {title}
        </Text>

        <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
          {subtitle}
        </Text>

        {actionText && onAction && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAction}
            style={{ backgroundColor: colors.primary }}
            className="mt-6 rounded-2xl px-6 py-3"
          >
            <Text className="font-extrabold text-white">{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        ...cardShadow,
      }}
      className="mt-5 rounded-[30px] border p-5"
    >
      <Text style={{ color: colors.text }} className="text-lg font-extrabold">
        {title}
      </Text>

      <View className="mt-5 gap-4">{children}</View>
    </View>
  );
}

function InfoRow({
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
        backgroundColor: colors.input,
      }}
      className="flex-row items-center gap-3 rounded-2xl p-3"
    >
      <View
        style={{
          backgroundColor: colors.primarySoft,
        }}
        className="h-10 w-10 items-center justify-center rounded-2xl"
      >
        {icon}
      </View>

      <View className="flex-1">
        <Text
          style={{ color: colors.muted }}
          className="text-xs font-bold"
        >
          {label}
        </Text>

        <Text
          style={{ color: colors.text }}
          className="mt-1 text-sm font-semibold leading-5"
          numberOfLines={2}
        >
          {value || "Not available"}
        </Text>
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: strong
          ? colors.primarySoft
          : colors.input,
      }}
      className="flex-row items-center justify-between rounded-2xl px-4 py-3"
    >
      <Text
        style={{
          color: strong
            ? colors.primary
            : colors.muted,
        }}
        className={
          strong
            ? "text-base font-extrabold"
            : "text-sm font-bold"
        }
      >
        {label}
      </Text>

      <Text
        style={{
          color: strong
            ? colors.primary
            : colors.text,
        }}
        className={
          strong
            ? "text-lg font-extrabold"
            : "font-extrabold"
        }
      >
        {value}
      </Text>
    </View>
  );
}

function MiniStat({
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
        ...smallShadow,
      }}
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

function SafetyRow({ text }: { text: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-start gap-3">
      <View
        style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
        className="mt-0.5 h-8 w-8 items-center justify-center rounded-full"
      >
        <ShieldCheck size={16} color={colors.success} />
      </View>

      <Text
        style={{ color: colors.muted }}
        className="flex-1 text-sm leading-5"
      >
        {text}
      </Text>
    </View>
  );
}

function mapBookingToDetails(booking: any): BookingDetails {
  const source = booking.ride_source || "";
  const destination = booking.ride_destination || "";

  return {
    id: String(booking.id),
    code: booking.booking_code || `#${booking.id}`,
    rideId: String(booking.ride_id),
    from: shortAddress(source),
    to: shortAddress(destination),
    fullFrom: source,
    fullTo: destination,
    sourceLat: Number(booking.ride_source_lat || 0),
    sourceLng: Number(booking.ride_source_lng || 0),
    destinationLat: Number(booking.ride_destination_lat || 0),
    destinationLng: Number(booking.ride_destination_lng || 0),
    date: booking.ride_date || "",
    time: booking.ride_time || "",
    seats: Number(booking.seats || 1),
    pricePerSeat: Number(booking.price_per_seat || 0),
    totalPrice: Number(booking.total_price || 0),
    status: normalizeBookingStatus(booking.status),
    paymentStatus: booking.payment_status || "unpaid",
    paymentType: booking.payment_type || "cash",
    driverName: booking.driver_name || "Driver",
    driverPhone: booking.driver_phone || null,
    car: `${booking.brand || ""} ${booking.model || ""}`.trim() || "Vehicle",
    registrationNumber: booking.registration_number || "Not available",
    color: booking.color || "Vehicle",
  };
}

function normalizeBookingStatus(status?: string): BookingStatus {
  const value = String(status || "").toLowerCase();

  if (["confirmed", "accepted"].includes(value)) return "confirmed";
  if (["cancelled", "canceled", "rejected"].includes(value)) return "cancelled";
  if (["completed", "complete"].includes(value)) return "completed";

  return "pending";
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

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}

function capitalize(value?: string) {
  if (!value) return "Not available";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusTheme(
  status: BookingStatus,
  colors: ReturnType<typeof useAppTheme>["colors"],
) {
  if (status === "confirmed") {
    return {
      label: "Confirmed",
      bg: "rgba(34,197,94,0.14)",
      text: colors.success,
    };
  }

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

  return {
    label: "Pending",
    bg: colors.primarySoft,
    text: colors.primary,
  };
}