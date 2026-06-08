import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
    AlertTriangle,
    ArrowLeft,
    Bell,
    CalendarClock,
    Car,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Ticket,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const alerts = [
  {
    id: "1",
    type: "booking",
    title: "Booking confirmed",
    message: "Your seat from Bhubaneswar to Cuttack is confirmed.",
    time: "2 min ago",
  },
  {
    id: "2",
    type: "ride",
    title: "New ride available",
    message: "A nearby ride to Puri is available tomorrow morning.",
    time: "18 min ago",
  },
  {
    id: "3",
    type: "safety",
    title: "Safety reminder",
    message: "Verify driver and vehicle details before starting your trip.",
    time: "1 hour ago",
  },
];

export default function NotificationsScreen() {
  const { colors } = useAppTheme();

  const [rideAlerts, setRideAlerts] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [safetyAlerts, setSafetyAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const enabledCount = useMemo(
    () => [rideAlerts, bookingAlerts, safetyAlerts, promoAlerts].filter(Boolean).length,
    [rideAlerts, bookingAlerts, safetyAlerts, promoAlerts]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 120,
          }}
        >
          <Header />

          <View
            style={{ backgroundColor: colors.primary }}
            className="mt-6 overflow-hidden rounded-[34px] p-6"
          >
            <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <View className="flex-row items-center gap-2">
              <Bell size={18} color="#FFFFFF" />
              <Text className="font-bold text-white">Notification Center</Text>
            </View>

            <Text className="mt-4 text-3xl font-extrabold text-white">
              {enabledCount} alert types active
            </Text>

            <Text className="mt-2 text-sm leading-5 text-blue-100">
              Control ride, booking, safety, and promotional notifications.
            </Text>
          </View>

          <Section title="Alert Preferences">
            <AlertToggle
              icon={<Car size={20} color={colors.primary} />}
              title="Ride Alerts"
              subtitle="New rides and route matches"
              value={rideAlerts}
              onChange={setRideAlerts}
            />

            <AlertToggle
              icon={<Ticket size={20} color={colors.primary} />}
              title="Booking Alerts"
              subtitle="Confirmations, cancellations, and trip updates"
              value={bookingAlerts}
              onChange={setBookingAlerts}
            />

            <AlertToggle
              icon={<ShieldCheck size={20} color={colors.success} />}
              title="Safety Alerts"
              subtitle="Important travel and verification reminders"
              value={safetyAlerts}
              onChange={setSafetyAlerts}
            />

            <AlertToggle
              icon={<AlertTriangle size={20} color="#F59E0B" />}
              title="Offers & Promotions"
              subtitle="Discounts, campaigns, and special offers"
              value={promoAlerts}
              onChange={setPromoAlerts}
              last
            />
          </Section>

          <Section title="Recent Alerts">
            {alerts.map((alert, index) => (
              <NotificationCard
                key={alert.id}
                alert={alert}
                last={index === alerts.length - 1}
              />
            ))}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Header() {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center gap-4">
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="h-11 w-11 items-center justify-center rounded-full border"
      >
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>

      <View className="flex-1">
        <Text style={{ color: colors.text }} className="text-3xl font-extrabold">
          Notifications
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-sm">
          Manage alerts and recent updates
        </Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-7">
      <Text style={{ color: colors.text }} className="mb-3 text-lg font-extrabold">
        {title}
      </Text>

      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="rounded-[30px] border p-2"
      >
        {children}
      </View>
    </View>
  );
}

function AlertToggle({
  icon,
  title,
  subtitle,
  value,
  onChange,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row items-center gap-3 border-b px-3 py-4"
    >
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-11 w-11 items-center justify-center rounded-2xl"
      >
        {icon}
      </View>

      <View className="flex-1">
        <Text style={{ color: colors.text }} className="font-extrabold">
          {title}
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-xs">
          {subtitle}
        </Text>
      </View>

      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function NotificationCard({
  alert,
  last,
}: {
  alert: {
    type: string;
    title: string;
    message: string;
    time: string;
  };
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  const icon =
    alert.type === "booking" ? (
      <CheckCircle2 size={20} color={colors.success} />
    ) : alert.type === "ride" ? (
      <CalendarClock size={20} color={colors.primary} />
    ) : (
      <ShieldCheck size={20} color={colors.success} />
    );

  return (
    <View
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row gap-3 border-b px-3 py-4"
    >
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-11 w-11 items-center justify-center rounded-2xl"
      >
        {icon}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-3">
          <Text style={{ color: colors.text }} className="flex-1 font-extrabold">
            {alert.title}
          </Text>
          <View className="flex-row items-center gap-1">
            <Clock size={12} color={colors.muted} />
            <Text style={{ color: colors.muted }} className="text-[11px] font-bold">
              {alert.time}
            </Text>
          </View>
        </View>

        <Text style={{ color: colors.muted }} className="mt-1 text-xs leading-5">
          {alert.message}
        </Text>
      </View>
    </View>
  );
}