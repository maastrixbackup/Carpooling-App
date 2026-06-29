import {
  getMyNotificationsApi,
  getNotificationSettingsApi,
  updateNotificationSettingsApi,
} from "@/services/notification.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  MessageCircle,
  ShieldCheck,
  Ticket,
} from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: getNotificationSettingsApi,
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: getMyNotificationsApi,
  });

  const settings = settingsData?.data?.settings;
  const notifications = notificationsData?.data?.notifications || [];

  const updateSettingsMutation = useMutation({
    mutationFn: updateNotificationSettingsApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notification-settings"],
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to update notification setting.");
    },
  });

  const handleToggle = (
    key:
      | "ride_alerts"
      | "booking_alerts"
      | "chat_alerts"
      | "safety_alerts"
      | "promotional_alerts",
    value: boolean,
  ) => {
    if (!settings) return;

    queryClient.setQueryData(["notification-settings"], (old: any) => ({
      ...old,
      data: {
        ...old?.data,
        settings: {
          ...old?.data?.settings,
          [key]: value,
        },
      },
    }));

    updateSettingsMutation.mutate({
      [key]: value,
    });
  };

  const enabledCount = useMemo(() => {
    if (!settings) return 0;

    return [
      settings.ride_alerts,
      settings.booking_alerts,
      settings.chat_alerts,
      settings.safety_alerts,
      settings.promotional_alerts,
    ].filter(Boolean).length;
  }, [settings]);

  if (settingsLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg }}
        className="items-center justify-center"
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>

        <StickyNotificationsHeader />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 120,
          }}
        >

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
              value={Boolean(settings?.ride_alerts)}
              onChange={(value) => handleToggle("ride_alerts", value)}
            />

            <AlertToggle
              icon={<Ticket size={20} color={colors.primary} />}
              title="Booking Alerts"
              subtitle="Confirmations, cancellations, and trip updates"
              value={Boolean(settings?.booking_alerts)}
              onChange={(value) => handleToggle("booking_alerts", value)}
            />

            <AlertToggle
              icon={<MessageCircle size={20} color={colors.primary} />}
              title="Chat Alerts"
              subtitle="Messages from drivers and passengers"
              value={Boolean(settings?.chat_alerts)}
              onChange={(value) => handleToggle("chat_alerts", value)}
            />

            <AlertToggle
              icon={<ShieldCheck size={20} color={colors.success} />}
              title="Safety Alerts"
              subtitle="Important travel and verification reminders"
              value={Boolean(settings?.safety_alerts)}
              onChange={(value) => handleToggle("safety_alerts", value)}
            />

            <AlertToggle
              icon={<AlertTriangle size={20} color="#F59E0B" />}
              title="Offers & Promotions"
              subtitle="Discounts, campaigns, and special offers"
              value={Boolean(settings?.promotional_alerts)}
              onChange={(value) => handleToggle("promotional_alerts", value)}
              last
            />
          </Section>

          <Section title="Recent Alerts">
            {notificationsLoading ? (
              <View className="py-8">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : notifications.length ? (
              notifications.map((alert: any, index: number) => (
                <NotificationCard
                  key={alert.id}
                  alert={{
                    type: alert.type,
                    title: alert.title,
                    message: alert.message,
                    time: formatTimeAgo(alert.created_at),
                  }}
                  last={index === notifications.length - 1}
                />
              ))
            ) : (
              <Text style={{ color: colors.muted }} className="px-4 py-6 text-center text-sm">
                No notifications yet.
              </Text>
            )}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StickyNotificationsHeader() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderBottomColor: colors.border,
      }}
      className="border-b px-5 pb-4 pt-3"
    >
      <View className="flex-row items-center gap-3">
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

        <View className="flex-1 items-center">
          <Text
            style={{ color: colors.text }}
            className="text-lg font-extrabold"
            numberOfLines={1}
          >
            Notifications
          </Text>

          <Text
            style={{ color: colors.muted }}
            className="mt-0.5 text-xs font-semibold"
            numberOfLines={1}
          >
            Alerts, updates & preferences
          </Text>
        </View>

        <View className="h-11 w-11" />
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

function formatTimeAgo(value?: string) {
  if (!value) return "";

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}