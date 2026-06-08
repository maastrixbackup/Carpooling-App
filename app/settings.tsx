import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Globe2,
  Lock,
  MapPin,
  Moon,
  ShieldCheck,
  Sun,
  UserCog,
} from "lucide-react-native";
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();

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
          <Header title="Settings" subtitle="Preferences and account controls" />

          <View
            style={{ backgroundColor: colors.primary }}
            className="mt-6 overflow-hidden rounded-[34px] p-6"
          >
            <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <Text className="text-sm font-bold text-blue-100">Car Pooling</Text>
            <Text className="mt-3 text-3xl font-extrabold text-white">
              Make the app yours
            </Text>
            <Text className="mt-2 text-sm leading-5 text-blue-100">
              Manage theme, alerts, privacy, and travel preferences.
            </Text>
          </View>

          <Section title="Preferences">
            <SettingRow
              icon={isDark ? <Sun size={20} color="#FACC15" /> : <Moon size={20} color={colors.primary} />}
              title={isDark ? "Dark Mode" : "Light Mode"}
              subtitle="Switch app appearance"
              right={<Switch value={isDark} onValueChange={toggleTheme} />}
            />

            <SettingRow
              icon={<Globe2 size={20} color={colors.primary} />}
              title="Language"
              subtitle="English"
            />

            <SettingRow
              icon={<MapPin size={20} color={colors.primary} />}
              title="Default Location"
              subtitle="Use current city for nearby rides"
            />
          </Section>

          <Section title="Alerts">
            <SettingRow
              icon={<Bell size={20} color={colors.primary} />}
              title="Notifications"
              subtitle="Ride alerts, booking updates, and reminders"
              onPress={() => router.push("/notifications")}
            />
          </Section>

          <Section title="Account & Safety">
            <SettingRow
              icon={<UserCog size={20} color={colors.primary} />}
              title="Account Preferences"
              subtitle="Profile, saved vehicle, and travel settings"
            />

            <SettingRow
              icon={<ShieldCheck size={20} color={colors.success} />}
              title="Safety & Verification"
              subtitle="ID checks and trusted ride settings"
            />

            <SettingRow
              icon={<Lock size={20} color={colors.primary} />}
              title="Privacy"
              subtitle="Control visibility and data preferences"
              last
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
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
          {title}
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-sm">
          {subtitle}
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

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.8}
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

      {right ?? <ChevronRight size={19} color={colors.muted} />}
    </TouchableOpacity>
  );
}