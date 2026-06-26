import { useConfirm } from "@/components/common/ConfirmProvider";
import { shortAddress } from "@/hooks/address-trimmer";
import { createBookingApi } from "@/services/booking.service";
import { getRideByIdApi } from "@/services/ride.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Car,
  IndianRupee,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

function mapRide(ride: any) {
  return {
    id: String(ride.id),
    from: shortAddress(ride.source_address),
    to: shortAddress(ride.destination_address),
    fullFrom: ride.source_address,
    fullTo: ride.destination_address,
    date: ride.ride_date,
    time: ride.departure_time,
    price: Number(ride.price_per_km || ride.price_per_seat || 0),
    seats: Number(ride.available_seats || 0),
    driver: ride.driver_name || "Driver",
    rating: Number(ride.driver_rating || 4.8),
    total_rides: Number(ride.driver_total_rides || 0),
    car: `${ride.brand || ""} ${ride.model || ""}`.trim() || "Vehicle",
    pickup: shortAddress(ride.source_address),
    drop: shortAddress(ride.destination_address),
    registrationNumber: ride.registration_number,
    color: ride.color,
    distanceMeters: Number(ride.distance_meters || 0),
    durationSeconds: Number(ride.duration_seconds || 0),
  };
}

export default function RideDetailsScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 24 : 16);
  const bottomBarHeight = 132 + bottomInset;

  const [selectedSeats, setSelectedSeats] = useState(1);

  const { data, isLoading, isFetching, refetch, isError } = useQuery({
    queryKey: ["ride-details", id],
    queryFn: () => getRideByIdApi(id),
    enabled: !!id,
  });

  const ride = data?.data?.ride ? mapRide(data.data.ride) : null;

  const totalPrice = useMemo(() => {
    if (!ride) return 0;
    const routeKm = ride.distanceMeters / 1000;
    return Math.round(
      ride.price * routeKm * selectedSeats
    );
  }, [ride, selectedSeats]);

  const bookingMutation = useMutation({
    mutationFn: createBookingApi,
    onSuccess: async () => {
      toast.success("Ride booked successfully.");
      await queryClient.invalidateQueries({ queryKey: ["ride-details", id] });
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      await queryClient.invalidateQueries({ queryKey: ["home-bootstrap"] });
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      router.push("/(tabs)/bookings");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to book this ride.");
    },
  });

  const handleBookRide = async () => {
    if (!ride || ride.seats <= 0) return;

    const ok = await confirm({
      title: "Confirm booking?",
      message: `Book ${selectedSeats} seat${selectedSeats > 1 ? "s" : ""
        } for ₹${totalPrice}.`,
      confirmText: "Book Now",
      cancelText: "Review",
      iconType: "success",
    });

    if (!ok) return;

    bookingMutation.mutate({
      ride_id: ride.id,
      seats: selectedSeats,
    });
  };

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg }}
        className="items-center justify-center px-5"
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.muted }} className="mt-3 font-semibold">
          Loading ride details...
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
        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="w-full items-center rounded-[30px] border p-8"
        >
          <Car size={42} color={colors.muted} />
          <Text style={{ color: colors.text }} className="mt-4 text-xl font-extrabold">
            Ride not found
          </Text>
          <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
            This ride may no longer be available.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.back()}
            style={{ backgroundColor: colors.primary }}
            className="mt-6 rounded-2xl px-6 py-3"
          >
            <Text className="font-extrabold text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const seatsLabel = ride.seats === 1 ? "1 seat left" : `${ride.seats} seats left`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <StickyRideHeader seatsLabel={seatsLabel} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: bottomBarHeight + 28,
          }}
        >
    

          <View
            style={{ backgroundColor: colors.primary }}
            className="mt-6 overflow-hidden rounded-[34px] p-6"
          >
            <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <View className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/10" />

            <Text className="text-sm font-bold text-blue-100">Trip Route</Text>

            <Text className="mt-4 text-xl font-extrabold leading-7 text-white">
              {ride.from}
            </Text>

            <Text className="my-2 text-2xl font-extrabold text-blue-100">↓</Text>

            <Text className="text-xl font-extrabold leading-7 text-white">
              {ride.to}
            </Text>

            <View className="mt-5 flex-row flex-wrap gap-2">
              <View className="flex-row items-center gap-2 rounded-full bg-white/15 px-4 py-2">
                <Calendar size={15} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  {formatRideDate(ride.date)}
                </Text>
              </View>

              <View className="rounded-full bg-white/15 px-4 py-2">
                <Text className="text-xs font-bold text-white">
                  {formatRideTime(ride.time)}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <MiniStat
              icon={<IndianRupee size={17} color={colors.primary} />}
              label="Per KM"
              value={`₹${ride.price}`}
            />
            <MiniStat
              icon={<Users size={17} color={colors.success} />}
              label="Available"
              value={`${ride.seats}`}
            />
          </View>

          <SectionCard title="Choose Seats">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-base font-extrabold">
                  Passenger seats
                </Text>
                <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                  Select how many seats you want to book.
                </Text>
              </View>

              <View
                style={{ backgroundColor: colors.input }}
                className="flex-row items-center gap-3 rounded-2xl px-3 py-2"
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedSeats((prev) => Math.max(1, prev - 1))}
                  disabled={selectedSeats <= 1}
                  style={{
                    backgroundColor: colors.card,
                    opacity: selectedSeats <= 1 ? 0.5 : 1,
                  }}
                  className="h-9 w-9 items-center justify-center rounded-full"
                >
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>

                <Text style={{ color: colors.text }} className="min-w-6 text-center text-lg font-extrabold">
                  {selectedSeats}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    setSelectedSeats((prev) => Math.min(ride.seats, prev + 1))
                  }
                  disabled={selectedSeats >= ride.seats}
                  style={{
                    backgroundColor: colors.primary,
                    opacity: selectedSeats >= ride.seats ? 0.5 : 1,
                  }}
                  className="h-9 w-9 items-center justify-center rounded-full"
                >
                  <Plus size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="mt-5 rounded-2xl px-4 py-3"
            >
              <Text style={{ color: colors.primary }} className="text-sm font-extrabold">
                {selectedSeats} seat{selectedSeats > 1 ? "s" : ""} ×
                ₹{ride.price}/km ×
                {(ride.distanceMeters / 1000).toFixed(1)} km
                =
                ₹{totalPrice}
              </Text>
            </View>
          </SectionCard>

          <SectionCard title="Ride Details">
            <InfoRow
              icon={<Calendar size={18} color={colors.primary} />}
              label="Date & Time"
              value={`${formatRideDate(ride.date)} • ${formatRideTime(ride.time)}`}
            />

            <InfoRow
              icon={<MapPin size={18} color={colors.primary} />}
              label="Pickup"
              value={ride.pickup}
            />

            <InfoRow
              icon={<MapPin size={18} color={colors.success} />}
              label="Drop"
              value={ride.drop}
            />

            {ride.distanceMeters > 0 && (
              <InfoRow
                icon={<MapPin size={18} color={colors.primary} />}
                label="Route"
                value={`${formatDistance(ride.distanceMeters)} • ${formatDuration(
                  ride.durationSeconds
                )}`}
              />
            )}

            <InfoRow
              icon={<Car size={18} color={colors.primary} />}
              label="Vehicle"
              value={`${ride.car}${ride.color ? ` • ${ride.color}` : ""}`}
            />

            {ride.registrationNumber && (
              <InfoRow
                icon={<Car size={18} color={colors.primary} />}
                label="Registration"
                value={ride.registrationNumber}
              />
            )}
          </SectionCard>

          <SectionCard title="Driver">
            <View className="flex-row items-center justify-between">
              <View className="flex-row flex-1 items-center gap-3">
                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="h-14 w-14 items-center justify-center rounded-full"
                >
                  <Text style={{ color: colors.primary }} className="text-xl font-extrabold">
                    {ride.driver.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="text-base font-extrabold">
                    {ride.driver}
                  </Text>

                  <View className="mt-1 flex-row items-center gap-1">
                    <Star size={15} color="#F59E0B" fill="#F59E0B" />
                    <Text style={{ color: colors.muted }} className="text-sm font-semibold">
                      {ride.rating.toFixed(1)} rating • ({ride.total_rides} rides)
                    </Text>
                  </View>
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
          </SectionCard>

          <SectionCard title="Safety Notes">
            <SafetyRow text="Confirm driver and vehicle details before boarding." />
            <SafetyRow text="Share your trip status with someone you trust." />
            <SafetyRow text="Use in-app booking flow for better record keeping." />
          </SectionCard>
        </ScrollView>

        <View
          style={{
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 18),
          }}
          className="absolute bottom-0 left-0 right-0 border-t px-5 pt-4"
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.muted }} className="text-sm">
                Total Price
              </Text>
              <Text style={{ color: colors.text }} className="mt-1 text-2xl font-extrabold">
                ₹{totalPrice}
              </Text>
            </View>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="rounded-full px-4 py-2"
            >
              <Text style={{ color: colors.primary }} className="text-xs font-bold">
                {selectedSeats} seat{selectedSeats > 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={ride.seats <= 0 || bookingMutation.isPending}
            onPress={handleBookRide}
            style={{
              backgroundColor: ride.seats > 0 ? colors.primary : colors.muted,
              opacity: bookingMutation.isPending ? 0.75 : 1,
            }}
            className="rounded-2xl py-4"
          >
            {bookingMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center text-base font-extrabold text-white">
                {ride.seats > 0 ? "Book Ride" : "No Seats Available"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
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
    <View className="flex-row items-center gap-3">
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-10 w-10 items-center justify-center rounded-2xl"
      >
        {icon}
      </View>

      <View className="flex-1">
        <Text style={{ color: colors.muted }} className="text-xs">
          {label}
        </Text>
        <Text
          style={{ color: colors.text }}
          className="mt-1 font-semibold"
          numberOfLines={2}
        >
          {value || "Not available"}
        </Text>
      </View>
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
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
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

      <Text style={{ color: colors.muted }} className="flex-1 text-sm leading-5">
        {text}
      </Text>
    </View>
  );
}

function formatRideDate(value?: string) {
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

function formatRideTime(value?: string) {
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

function formatDistance(meters: number) {
  if (!meters) return "Distance unavailable";

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  if (!seconds) return "Duration unavailable";

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} hr`;
}

function StickyRideHeader({ seatsLabel }: { seatsLabel: string }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.bg, borderBottomColor: colors.border }}
      className="border-b px-5 pb-4 pt-3"
    >
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.back()}
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="h-11 w-11 items-center justify-center rounded-full border"
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text style={{ color: colors.text }} className="text-lg font-extrabold">
            Ride Details
          </Text>
          <Text style={{ color: colors.muted }} className="mt-0.5 text-xs font-semibold">
            Review route & book seats
          </Text>
        </View>

        <View style={{ backgroundColor: colors.primarySoft }} className="rounded-full px-3 py-2">
          <Text style={{ color: colors.primary }} className="text-[11px] font-extrabold">
            {seatsLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}