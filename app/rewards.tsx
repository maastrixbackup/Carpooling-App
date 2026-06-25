import { getMyRewardsApi } from "@/services/reward.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Car,
  ChevronRight,
  Gift,
  RefreshCcw,
  Star,
  Trophy,
  Users,
  Wallet
} from "lucide-react-native";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RewardsScreen() {
  const { colors } = useAppTheme();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-rewards"],
    queryFn: getMyRewardsApi,
  });

  const rewards = data?.data?.rewards || {};

  const pointsBalance = Number(rewards.pointsBalance || 0);
  const totalEarned = Number(rewards.totalPointsEarned || 0);
  const redeemValue = Number(rewards.redeemValue || 0);
  const level = rewards.level || "Bronze";

  const completedRides = Number(rewards.completedRides || 0);
  const completedDrives = Number(
    rewards.completedDrives ?? rewards.driverTrips ?? 0,
  );
  const completedJourneys = Number(
    rewards.completedJourneys ?? rewards.passengerTrips ?? completedRides,
  );

  const referrals = Number(rewards.referrals || 0);
  const transactions = rewards.transactions || [];

  const nextLevelPoints = getNextLevelPoints(level);
  const progress = nextLevelPoints
    ? Math.min((pointsBalance / nextLevelPoints) * 100, 100)
    : 100;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <StickyRewardsHeader onRefresh={refetch} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 120,
          }}
        >

          {isLoading ? (
            <LoadingCard />
          ) : (
            <>
              <WalletCard
                pointsBalance={pointsBalance}
                totalEarned={totalEarned}
                redeemValue={redeemValue}
                level={level}
                progress={progress}
                nextLevelPoints={nextLevelPoints}
              />

              <View className="mt-5 flex-row gap-3">
                <MetricCard
                  label="Completed Drives"
                  value={`${completedDrives}`}
                  icon={<Car size={18} color={colors.primary} />}
                />

                <MetricCard
                  label="Completed Journeys"
                  value={`${completedJourneys}`}
                  icon={<Users size={18} color={colors.success} />}
                />
              </View>

              <View className="mt-3 flex-row gap-3">
                <MetricCard
                  label="Total Points"
                  value={`${pointsBalance}`}
                  icon={<Trophy size={18} color="#F59E0B" />}
                />

                <MetricCard
                  label="Redeem Value"
                  value={`₹${redeemValue}`}
                  icon={<Wallet size={18} color={colors.primary} />}
                />
              </View>

              <Section title="Recent Activity">
                {transactions.length > 0 ? (
                  transactions.slice(0, 6).map((item: any, index: number) => (
                    <TransactionRow
                      key={item.id}
                      item={item}
                      last={index === Math.min(transactions.length, 6) - 1}
                    />
                  ))
                ) : (
                  <EmptyActivity />
                )}
              </Section>

              <Section title="Achievements">
                <AchievementRow
                  icon={<BadgeCheck size={20} color={colors.success} />}
                  title="Verified Rider"
                  subtitle="Complete profile and identity verification"
                  status="Ready"
                />

                <AchievementRow
                  icon={<Trophy size={20} color={colors.primary} />}
                  title="Frequent Traveler"
                  subtitle={`${completedDrives + completedJourneys}/20 trips completed`}
                  status={
                    completedDrives + completedJourneys >= 20
                      ? "Unlocked"
                      : "In progress"
                  }
                />

                <AchievementRow
                  icon={<Gift size={20} color="#F59E0B" />}
                  title="Referral Bonus"
                  subtitle="Invite friends and earn extra points"
                  status="Soon"
                  last
                />
              </Section>

              <Section title="How to Earn More">
                <EarnRow
                  icon={<Car size={20} color={colors.primary} />}
                  title="Complete drives"
                  subtitle="+10 points after every completed driver trip"
                />

                <EarnRow
                  icon={<Users size={20} color={colors.success} />}
                  title="Complete journeys"
                  subtitle="+5 points after every completed booking"
                />

                <EarnRow
                  icon={<Star size={20} color="#F59E0B" />}
                  title="Keep good ratings"
                  subtitle="Better ratings can unlock higher benefits later"
                  last
                />
              </Section>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function WalletCard({
  pointsBalance,
  totalEarned,
  redeemValue,
  level,
  progress,
  nextLevelPoints,
}: {
  pointsBalance: number;
  totalEarned: number;
  redeemValue: number;
  level: string;
  progress: number;
  nextLevelPoints: number | null;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className="mt-6 overflow-hidden rounded-[30px] border p-5"
    >
      <View className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10" />

      <View className="flex-row items-center justify-between">
        <View>
          <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
            Reward Balance
          </Text>
          <Text
            style={{ color: colors.text }}
            className="mt-2 text-5xl font-extrabold"
          >
            {pointsBalance}
          </Text>
          <Text style={{ color: colors.muted }} className="mt-1 text-sm">
            Points available
          </Text>
        </View>

        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="items-center rounded-3xl px-4 py-3"
        >
          <Trophy size={22} color={colors.primary} />
          <Text
            style={{ color: colors.primary }}
            className="mt-2 text-xs font-extrabold"
          >
            {level}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <MiniInfo label="Worth" value={`₹${redeemValue}`} />
        <MiniInfo label="Earned" value={`${totalEarned} pts`} />
      </View>

      <View className="mt-5">
        <View className="mb-2 flex-row justify-between">
          <Text style={{ color: colors.muted }} className="text-xs font-bold">
            Level progress
          </Text>
          <Text style={{ color: colors.muted }} className="text-xs font-bold">
            {nextLevelPoints ? `${pointsBalance}/${nextLevelPoints}` : "Max"}
          </Text>
        </View>

        <View
          style={{ backgroundColor: colors.input }}
          className="h-2 overflow-hidden rounded-full"
        >
          <View
            style={{
              width: `${progress}%`,
              backgroundColor: colors.primary,
            }}
            className="h-2 rounded-full"
          />
        </View>
      </View>
    </View>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.input }}
      className="flex-1 rounded-2xl px-4 py-3"
    >
      <Text style={{ color: colors.muted }} className="text-xs font-bold">
        {label}
      </Text>
      <Text style={{ color: colors.text }} className="mt-1 font-extrabold">
        {value}
      </Text>
    </View>
  );
}

function MetricCard({
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
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="flex-1 items-center rounded-[24px] border p-4"
    >
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-10 w-10 items-center justify-center rounded-2xl"
      >
        {icon}
      </View>

      <Text
        style={{ color: colors.text }}
        className="mt-3 text-2xl font-extrabold"
      >
        {value}
      </Text>

      <Text
        style={{ color: colors.muted }}
        className="mt-1 text-center text-[11px] font-bold leading-4"
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-7">
      <Text
        style={{ color: colors.muted }}
        className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wider"
      >
        {title}
      </Text>

      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="overflow-hidden rounded-[26px] border"
      >
        {children}
      </View>
    </View>
  );
}

function TransactionRow({ item, last }: { item: any; last?: boolean }) {
  const { colors } = useAppTheme();

  const points = Number(item.points || 0);
  const positive = points >= 0;

  return (
    <View
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row items-center gap-3 border-b px-4 py-4"
    >
      <View
        style={{
          backgroundColor: positive ? colors.primarySoft : colors.dangerSoft,
        }}
        className="h-10 w-10 items-center justify-center rounded-xl"
      >
        {positive ? (
          <Gift size={18} color={colors.primary} />
        ) : (
          <Wallet size={18} color={colors.danger} />
        )}
      </View>

      <View className="flex-1">
        <Text style={{ color: colors.text }} className="font-extrabold">
          {item.title || "Reward activity"}
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-xs">
          {formatRewardDate(item.createdAt)}
        </Text>
      </View>

      <Text
        style={{ color: positive ? colors.success : colors.danger }}
        className="font-extrabold"
      >
        {positive ? "+" : ""}
        {points} pts
      </Text>
    </View>
  );
}

function AchievementRow({
  icon,
  title,
  subtitle,
  status,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: string;
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row items-center gap-3 border-b px-4 py-4"
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

      <View
        style={{ backgroundColor: colors.input }}
        className="rounded-full px-3 py-1.5"
      >
        <Text style={{ color: colors.muted }} className="text-[10px] font-bold">
          {status}
        </Text>
      </View>
    </View>
  );
}

function EarnRow({
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
      <View
        style={{ backgroundColor: colors.input }}
        className="h-10 w-10 items-center justify-center rounded-xl"
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

      <ChevronRight size={17} color={colors.muted} />
    </View>
  );
}

function EmptyActivity() {
  const { colors } = useAppTheme();

  return (
    <View className="items-center px-6 py-8">
      <Activity size={32} color={colors.muted} />
      <Text style={{ color: colors.text }} className="mt-3 font-extrabold">
        No reward activity yet
      </Text>
      <Text style={{ color: colors.muted }} className="mt-1 text-center text-xs">
        Complete a ride to start earning points.
      </Text>
    </View>
  );
}

function LoadingCard() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-6 items-center rounded-[30px] border p-8"
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
        Loading rewards...
      </Text>
    </View>
  );
}

function getNextLevelPoints(level: string) {
  const value = level.toLowerCase();

  if (value === "bronze") return 100;
  if (value === "silver") return 500;
  if (value === "gold") return 1000;

  return null;
}

function formatRewardDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function StickyRewardsHeader({ onRefresh }: { onRefresh: () => void }) {
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
            Rewards
          </Text>

          <Text
            style={{ color: colors.muted }}
            className="mt-0.5 text-xs font-semibold"
            numberOfLines={1}
          >
            Points, levels & ride benefits
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onRefresh}
          style={{ backgroundColor: colors.primarySoft }}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <RefreshCcw size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}