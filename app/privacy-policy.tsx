import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
    ArrowLeft,
    Database,
    Lock,
    MapPin,
    ShieldCheck,
    UserCheck,
} from "lucide-react-native";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 90,
          }}
        >
          <Header title="Privacy Policy" subtitle="How we collect and protect your data" />

          <HeroCard />

          <PolicySection
            icon={<UserCheck size={20} color={colors.primary} />}
            title="Information We Collect"
            body="We may collect your name, phone number, email address, profile details, ride preferences, vehicle details, and booking activity when you use the app."
          />

          <PolicySection
            icon={<MapPin size={20} color={colors.primary} />}
            title="Location Information"
            body="Location access is used to detect pickup points, show nearby rides, calculate routes, and improve ride matching. You can disable location permission from your device settings."
          />

          <PolicySection
            icon={<Database size={20} color={colors.primary} />}
            title="How We Use Data"
            body="We use your information to create rides, show available trips, manage bookings, improve safety, personalize experience, and provide app notifications."
          />

          <PolicySection
            icon={<ShieldCheck size={20} color={colors.success} />}
            title="Safety & Verification"
            body="We may use profile, phone, ride, and vehicle information to support user verification, trust, safety checks, and fraud prevention."
          />

          <PolicySection
            icon={<Lock size={20} color={colors.primary} />}
            title="Data Protection"
            body="We aim to protect your data using reasonable security practices. No system is completely risk-free, so users should avoid sharing sensitive information unnecessarily."
          />

          <Text style={{ color: colors.muted }} className="mt-7 text-xs leading-5">
            Last updated: January 2026. This screen is a starter policy draft. Review with a legal professional before publishing.
          </Text>
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

function HeroCard() {
  const { colors } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.primary }} className="mt-6 overflow-hidden rounded-[34px] p-6">
      <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <ShieldCheck size={28} color="#FFFFFF" />
      <Text className="mt-4 text-3xl font-extrabold text-white">
        Your privacy matters
      </Text>
      <Text className="mt-2 text-sm leading-5 text-blue-100">
        We only collect information needed to provide safe and reliable car pooling features.
      </Text>
    </View>
  );
}

function PolicySection({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-5 rounded-[28px] border p-5"
    >
      <View className="flex-row items-center gap-3">
        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="h-11 w-11 items-center justify-center rounded-2xl"
        >
          {icon}
        </View>

        <Text style={{ color: colors.text }} className="flex-1 text-lg font-extrabold">
          {title}
        </Text>
      </View>

      <Text style={{ color: colors.muted }} className="mt-4 text-sm leading-6">
        {body}
      </Text>
    </View>
  );
}