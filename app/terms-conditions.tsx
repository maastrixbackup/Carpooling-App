import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
    AlertTriangle,
    ArrowLeft,
    Car,
    FileText,
    ShieldCheck,
    UserCheck,
} from "lucide-react-native";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsConditionsScreen() {
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
          <Header title="Terms & Conditions" subtitle="Rules for using the car pooling app" />

          <View style={{ backgroundColor: colors.primary }} className="mt-6 overflow-hidden rounded-[34px] p-6">
            <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
            <FileText size={28} color="#FFFFFF" />
            <Text className="mt-4 text-3xl font-extrabold text-white">
              Ride responsibly
            </Text>
            <Text className="mt-2 text-sm leading-5 text-blue-100">
              These terms define basic rules for drivers, passengers, bookings, payments, and safety.
            </Text>
          </View>

          <TermsSection
            icon={<UserCheck size={20} color={colors.primary} />}
            title="User Responsibilities"
            body="Users must provide accurate information, use the app lawfully, and avoid misleading ride, vehicle, identity, or payment details."
          />

          <TermsSection
            icon={<Car size={20} color={colors.primary} />}
            title="Driver Responsibilities"
            body="Drivers are responsible for vehicle condition, legal driving requirements, safe driving behavior, and accurate ride details before publishing trips."
          />

          <TermsSection
            icon={<ShieldCheck size={20} color={colors.success} />}
            title="Passenger Responsibilities"
            body="Passengers should verify ride details, arrive on time, behave respectfully, and follow basic safety practices during the trip."
          />

          <TermsSection
            icon={<AlertTriangle size={20} color="#F59E0B" />}
            title="Bookings & Cancellations"
            body="Bookings, cancellations, refunds, and payment rules may vary based on future app policies. Demo bookings are currently for testing only."
          />

          <TermsSection
            icon={<FileText size={20} color={colors.primary} />}
            title="Limitation of Liability"
            body="The app is a platform to connect drivers and passengers. Final travel decisions, safety judgment, and compliance remain the responsibility of users."
          />

          <Text style={{ color: colors.muted }} className="mt-7 text-xs leading-5">
            Last updated: January 2026. This is a starter terms draft. Review with a legal professional before production release.
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

function TermsSection({
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