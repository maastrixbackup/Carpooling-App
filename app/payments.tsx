import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    CreditCard,
    IndianRupee,
    Plus,
    ReceiptText,
    ShieldCheck,
    Wallet,
} from "lucide-react-native";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const transactions = [
  {
    id: "1",
    title: "Bhubaneswar → Cuttack",
    subtitle: "Ride booking",
    amount: "₹120",
    status: "Paid",
  },
  {
    id: "2",
    title: "Wallet top-up",
    subtitle: "Added to wallet",
    amount: "₹500",
    status: "Success",
  },
  {
    id: "3",
    title: "Cuttack → Puri",
    subtitle: "Ride booking",
    amount: "₹250",
    status: "Paid",
  },
];

export default function PaymentsScreen() {
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
          <Header />

          <View
            style={{ backgroundColor: colors.primary }}
            className="mt-6 overflow-hidden rounded-[34px] p-6"
          >
            <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <View className="absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-white/10" />

            <View className="flex-row items-center gap-2">
              <Wallet size={20} color="#FFFFFF" />
              <Text className="font-bold text-white">Wallet Balance</Text>
            </View>

            <Text className="mt-5 text-5xl font-extrabold text-white">
              ₹1,240
            </Text>

            <Text className="mt-2 text-sm leading-5 text-blue-100">
              Use wallet balance for faster ride bookings and refunds.
            </Text>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3">
                <Plus size={18} color={colors.primary} />
                <Text style={{ color: colors.primary }} className="font-extrabold">
                  Add Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-white/15 py-3">
                <ReceiptText size={18} color="#FFFFFF" />
                <Text className="font-extrabold text-white">Statement</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-6 flex-row gap-3">
            <PaymentStat
              icon={<IndianRupee size={17} color={colors.primary} />}
              label="Spent"
              value="₹3.2k"
            />
            <PaymentStat
              icon={<CheckCircle2 size={17} color={colors.success} />}
              label="Successful"
              value="18"
            />
          </View>

          <Section title="Payment Methods">
            <PaymentMethod
              icon={<CreditCard size={20} color={colors.primary} />}
              title="UPI"
              subtitle="rudranarayan@upi"
              tag="Default"
            />

            <PaymentMethod
              icon={<Banknote size={20} color={colors.primary} />}
              title="Cash"
              subtitle="Pay driver directly"
            />

            <PaymentMethod
              icon={<CreditCard size={20} color={colors.primary} />}
              title="Cards"
              subtitle="Add debit or credit card"
              last
            />
          </Section>

          <Section title="Recent Transactions">
            {transactions.map((item, index) => (
              <TransactionRow
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                amount={item.amount}
                status={item.status}
                last={index === transactions.length - 1}
              />
            ))}
          </Section>

          <View
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="mt-7 rounded-[26px] border p-4"
          >
            <View className="flex-row items-center gap-3">
              <View
                style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
                className="h-11 w-11 items-center justify-center rounded-2xl"
              >
                <ShieldCheck size={20} color={colors.success} />
              </View>

              <View className="flex-1">
                <Text style={{ color: colors.text }} className="font-extrabold">
                  Secure Payments
                </Text>
                <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                  Payments are demo-only now. Later connect Razorpay, Stripe, or UPI.
                </Text>
              </View>
            </View>
          </View>
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
        activeOpacity={0.85}
        onPress={() => router.back()}
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="h-11 w-11 items-center justify-center rounded-full border"
      >
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>

      <View>
        <Text style={{ color: colors.text }} className="text-3xl font-extrabold">
          Payments
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-sm">
          Wallet, methods, and transaction history
        </Text>
      </View>
    </View>
  );
}

function PaymentStat({
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

function PaymentMethod({
  icon,
  title,
  subtitle,
  tag,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tag?: string;
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

      {tag && (
        <View
          style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
          className="rounded-full px-3 py-1"
        >
          <Text style={{ color: colors.success }} className="text-xs font-bold">
            {tag}
          </Text>
        </View>
      )}
    </View>
  );
}

function TransactionRow({
  title,
  subtitle,
  amount,
  status,
  last,
}: {
  title: string;
  subtitle: string;
  amount: string;
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
        className="h-10 w-10 items-center justify-center rounded-xl"
      >
        <ReceiptText size={19} color={colors.primary} />
      </View>

      <View className="flex-1">
        <Text style={{ color: colors.text }} className="font-extrabold">
          {title}
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-xs">
          {subtitle}
        </Text>
      </View>

      <View className="items-end">
        <Text style={{ color: colors.text }} className="font-extrabold">
          {amount}
        </Text>
        <Text style={{ color: colors.success }} className="mt-1 text-xs font-bold">
          {status}
        </Text>
      </View>
    </View>
  );
}