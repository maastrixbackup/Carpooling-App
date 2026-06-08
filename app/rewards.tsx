import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
    ArrowLeft,
    BadgeCheck,
    Gift,
    Star,
    Trophy,
    Users,
} from "lucide-react-native";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RewardsScreen() {
  const { colors } = useAppTheme();

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
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
              className="h-11 w-11 items-center justify-center rounded-full border"
            >
              <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <View>
              <Text style={{ color: colors.text }} className="text-3xl font-extrabold">
                Rewards
              </Text>
              <Text style={{ color: colors.muted }} className="mt-1 text-sm">
                Points, badges, and ride benefits
              </Text>
            </View>
          </View>

          <View style={{ backgroundColor: colors.primary }} className="mt-6 overflow-hidden rounded-[34px] p-6">
            <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />

            <View className="flex-row items-center gap-2">
              <Trophy size={20} color="#FFFFFF" />
              <Text className="font-bold text-white">Reward Balance</Text>
            </View>

            <Text className="mt-5 text-5xl font-extrabold text-white">
              850
            </Text>

            <Text className="mt-2 text-blue-100">
              Points earned from completed rides and referrals.
            </Text>
          </View>

          <View className="mt-6 flex-row gap-3">
            <RewardStat label="Rides" value="24" icon={<Star size={17} color={colors.primary} />} />
            <RewardStat label="Referrals" value="5" icon={<Users size={17} color={colors.success} />} />
          </View>

          <Section title="Achievements">
            <RewardRow
              icon={<BadgeCheck size={20} color={colors.success} />}
              title="Verified Rider"
              subtitle="Completed profile and verification"
            />

            <RewardRow
              icon={<Trophy size={20} color={colors.primary} />}
              title="Frequent Traveler"
              subtitle="Completed more than 20 trips"
            />

            <RewardRow
              icon={<Gift size={20} color={colors.primary} />}
              title="Referral Bonus"
              subtitle="Invite friends and earn extra points"
              last
            />
          </Section>

          <Section title="How to earn more">
            <RewardRow
              icon={<Star size={20} color="#F59E0B" />}
              title="Complete rides"
              subtitle="Earn points after every successful trip"
            />

            <RewardRow
              icon={<Users size={20} color={colors.primary} />}
              title="Invite friends"
              subtitle="Get bonus points when friends join"
            />

            <RewardRow
              icon={<BadgeCheck size={20} color={colors.success} />}
              title="Keep good ratings"
              subtitle="Higher ratings unlock better benefits"
              last
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RewardStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-1 rounded-[24px] border p-4">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-7">
      <Text style={{ color: colors.muted }} className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wider">
        {title}
      </Text>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="overflow-hidden rounded-[26px] border">
        {children}
      </View>
    </View>
  );
}

function RewardRow({
  icon,
  title,
  subtitle,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row items-center gap-3 border-b px-4 py-4"
    >
      <View style={{ backgroundColor: colors.primarySoft }} className="h-10 w-10 items-center justify-center rounded-xl">
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
    </View>
  );
}