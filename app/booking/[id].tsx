import { demoRides } from "@/data/demoRides";
import { useAppTheme } from "@/theme/ThemeProvider";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  IndianRupee,
  MapPin,
  ShieldCheck,
  Star,
  Ticket,
  Users,
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookingScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isConfirmed, setIsConfirmed] = useState(false);

  const ride = demoRides.find((item) => item.id === id);

  if (!ride) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg }}
        className="items-center justify-center px-5"
      >
        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="w-full items-center rounded-[30px] border p-8"
        >
          <Ticket size={42} color={colors.muted} />

          <Text
            style={{ color: colors.text }}
            className="mt-4 text-xl font-extrabold"
          >
            Booking not found
          </Text>

          <Text
            style={{ color: colors.muted }}
            className="mt-2 text-center text-sm"
          >
            This booking may not exist or has been removed.
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

  const handleConfirmSeat = () => {
    setIsConfirmed(true);

    Alert.alert(
      "Seat Confirmed",
      `Your seat from ${ride.from} to ${ride.to} has been confirmed.`
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
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
              style={{
                backgroundColor: isConfirmed
                  ? "rgba(34,197,94,0.14)"
                  : colors.primarySoft,
              }}
              className="rounded-full px-4 py-2"
            >
              <Text
                style={{ color: isConfirmed ? colors.success : colors.primary }}
                className="text-xs font-extrabold"
              >
                {isConfirmed ? "Confirmed" : "Pending"}
              </Text>
            </View>
          </View>

          <View
            style={{ backgroundColor: colors.primary }}
            className="mt-6 overflow-hidden rounded-[34px] p-6"
          >
            <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <View className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/10" />

            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text className="font-bold text-white">Booking Confirmation</Text>
            </View>

            <Text className="mt-4 text-3xl font-extrabold leading-9 text-white">
              {isConfirmed ? "Seat confirmed" : "Confirm your seat"}
            </Text>

            <Text className="mt-2 leading-5 text-blue-100">
              {ride.from} to {ride.to} • {ride.date}, {ride.time}
            </Text>
          </View>

          <View className="mt-5 flex-row gap-3">
            <MiniStat
              icon={<IndianRupee size={17} color={colors.primary} />}
              label="Amount"
              value={`₹${ride.price}`}
            />

            <MiniStat
              icon={<Users size={17} color={colors.success} />}
              label="Seat"
              value="1"
            />
          </View>

          <SectionCard title="Trip Details">
            <InfoRow
              icon={<MapPin size={18} color={colors.primary} />}
              label="Route"
              value={`${ride.from} → ${ride.to}`}
            />

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
              value={ride.car}
            />
          </SectionCard>

          <SectionCard title="Driver">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="h-14 w-14 items-center justify-center rounded-full"
                >
                  <Text
                    style={{ color: colors.primary }}
                    className="text-xl font-extrabold"
                  >
                    {ride.driver.charAt(0)}
                  </Text>
                </View>

                <View>
                  <Text
                    style={{ color: colors.text }}
                    className="text-base font-extrabold"
                  >
                    {ride.driver}
                  </Text>

                  <View className="mt-1 flex-row items-center gap-1">
                    <Star size={15} color="#F59E0B" fill="#F59E0B" />
                    <Text
                      style={{ color: colors.muted }}
                      className="text-sm font-semibold"
                    >
                      {ride.rating} rating
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
                className="rounded-full px-3 py-1.5"
              >
                <Text
                  style={{ color: colors.success }}
                  className="text-xs font-bold"
                >
                  Verified
                </Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Booking Summary">
            <SummaryRow label="Seat price" value={`₹${ride.price}`} />
            <SummaryRow label="Seats booked" value="1" />
            <SummaryRow label="Platform fee" value="₹0" />

            <View
              style={{ borderTopColor: colors.border }}
              className="mt-2 border-t pt-4"
            >
              <SummaryRow label="Total" value={`₹${ride.price}`} strong />
            </View>
          </SectionCard>

          <SectionCard title="Safety">
            <SafetyRow text="Confirm driver and vehicle details before boarding." />
            <SafetyRow text="Share your trip status with someone you trust." />
            <SafetyRow text="Keep booking details available during travel." />
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
                Payable Amount
              </Text>
              <Text
                style={{ color: colors.text }}
                className="mt-1 text-2xl font-extrabold"
              >
                ₹{ride.price}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: isConfirmed
                  ? "rgba(34,197,94,0.14)"
                  : colors.primarySoft,
              }}
              className="rounded-full px-4 py-2"
            >
              <Text
                style={{ color: isConfirmed ? colors.success : colors.primary }}
                className="text-xs font-bold"
              >
                {isConfirmed ? "Booked" : "1 Seat"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isConfirmed}
            onPress={handleConfirmSeat}
            style={{
              backgroundColor: isConfirmed ? colors.success : colors.primary,
              opacity: isConfirmed ? 0.9 : 1,
            }}
            className="rounded-2xl py-4"
          >
            <Text className="text-center text-base font-extrabold text-white">
              {isConfirmed ? "Seat Confirmed" : "Confirm Seat"}
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
    <View className="flex-row items-center justify-between">
      <Text
        style={{ color: strong ? colors.text : colors.muted }}
        className={strong ? "text-base font-extrabold" : "text-sm font-medium"}
      >
        {label}
      </Text>

      <Text
        style={{ color: strong ? colors.primary : colors.text }}
        className={strong ? "text-lg font-extrabold" : "font-bold"}
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