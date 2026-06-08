import { getRideByIdApi } from "@/services/ride.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Car,
  IndianRupee,
  MapPin,
  ShieldCheck,
  Star,
  Users,
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

function mapRide(ride: any) {
  return {
    id: String(ride.id),
    from: ride.source_address,
    to: ride.destination_address,
    date: ride.ride_date,
    time: ride.departure_time,
    price: Number(ride.price_per_seat || 0),
    seats: Number(ride.available_seats || 0),
    driver: ride.driver_name || "Driver",
    rating: Number(ride.vehicle_rating || 4.8),
    car: `${ride.brand || ""} ${ride.model || ""}`.trim() || "Vehicle",
    pickup: ride.source_address,
    drop: ride.destination_address,
    registrationNumber: ride.registration_number,
    color: ride.color,
  };
}

export default function RideDetailsScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: ["ride-details", id],
    queryFn: () => getRideByIdApi(id),
    enabled: !!id,
  });

  const ride = data?.data?.ride ? mapRide(data.data.ride) : null;

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
            paddingBottom: 150,
          }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.back()}
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
              className="h-11 w-11 items-center justify-center rounded-full border"
            >
              <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="rounded-full px-4 py-2"
            >
              <Text style={{ color: colors.primary }} className="text-xs font-extrabold">
                {ride.seats} seats left
              </Text>
            </View>
          </View>

          <View
            style={{ backgroundColor: colors.primary }}
            className="mt-6 overflow-hidden rounded-[34px] p-6"
          >
            <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <View className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/10" />

            <Text className="text-sm font-bold text-blue-100">Trip Route</Text>

            <Text className="mt-4 text-xl font-extrabold text-white">
              {ride.from}
            </Text>

            <Text className="my-2 text-2xl font-extrabold text-blue-100">↓</Text>

            <Text className="text-xl font-extrabold text-white">
              {ride.to}
            </Text>

            <View className="mt-5 flex-row items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2">
              <Calendar size={15} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">
                {ride.date}, {ride.time}
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <MiniStat
              icon={<IndianRupee size={17} color={colors.primary} />}
              label="Price"
              value={`₹${ride.price}`}
            />
            <MiniStat
              icon={<Users size={17} color={colors.success} />}
              label="Seats"
              value={`${ride.seats}`}
            />
          </View>

          <SectionCard title="Ride Details">
            <InfoRow
              icon={<Calendar size={18} color={colors.primary} />}
              label="Date & Time"
              value={`${ride.date}, ${ride.time}`}
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
              <View className="flex-row items-center gap-3">
                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="h-14 w-14 items-center justify-center rounded-full"
                >
                  <Text style={{ color: colors.primary }} className="text-xl font-extrabold">
                    {ride.driver.charAt(0)}
                  </Text>
                </View>

                <View>
                  <Text style={{ color: colors.text }} className="text-base font-extrabold">
                    {ride.driver}
                  </Text>

                  <View className="mt-1 flex-row items-center gap-1">
                    <Star size={15} color="#F59E0B" fill="#F59E0B" />
                    <Text style={{ color: colors.muted }} className="text-sm font-semibold">
                      {ride.rating} rating
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
          }}
          className="absolute bottom-0 left-0 right-0 border-t px-5 pb-8 pt-4"
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.muted }} className="text-sm">
                Total Price
              </Text>
              <Text style={{ color: colors.text }} className="mt-1 text-2xl font-extrabold">
                ₹{ride.price}
              </Text>
            </View>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="rounded-full px-4 py-2"
            >
              <Text style={{ color: colors.primary }} className="text-xs font-bold">
                Per seat
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={ride.seats <= 0}
            onPress={() =>
              router.push({
                pathname: "/booking/[id]",
                params: { id: ride.id },
              })
            }
            style={{
              backgroundColor: ride.seats > 0 ? colors.primary : colors.muted,
            }}
            className="rounded-2xl py-4"
          >
            <Text className="text-center text-base font-extrabold text-white">
              {ride.seats > 0 ? "Book Seat" : "No Seats Available"}
            </Text>
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
          {value}
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