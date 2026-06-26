import {
  createSupportTicketApi,
  getMySupportTicketsApi,
  SupportCategoryKey,
} from "@/services/support.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeHelp,
  Car,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileQuestion,
  Headphones,
  LifeBuoy,
  Lock,
  MessageSquareText,
  RefreshCcw,
  Send,
  ShieldAlert,
  Ticket,
  Wrench,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type Category = {
  key: SupportCategoryKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

type TicketItem = {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  description: string;
  priority: "normal" | "high" | "urgent";
  status: "open" | "in_review" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
};

export default function HelpSupportScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: getMySupportTicketsApi,
  });

  const tickets: TicketItem[] = data?.data?.tickets || [];

  const createMutation = useMutation({
    mutationFn: createSupportTicketApi,
    onSuccess: async () => {
      toast.success("Support ticket created successfully.");
      setModalVisible(false);
      setSelectedCategory(null);
      await queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to create support ticket.");
    },
  });

  const categories = useSupportCategories();

  const openTicketForm = (category: Category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const openTickets = tickets.filter((item) =>
    ["open", "in_review"].includes(item.status),
  ).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <StickySupportHeader onRefresh={refetch} />
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

          <HeroCard openTickets={openTickets} totalTickets={tickets.length} />

          <View className="mt-7">
            <Text
              style={{ color: colors.text }}
              className="text-xl font-extrabold"
            >
              What do you need help with?
            </Text>
            <Text style={{ color: colors.muted }} className="mt-1 text-sm">
              Choose a category so we can route your issue properly.
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-3">
              {categories.map((item) => (
                <CategoryCard
                  key={item.key}
                  category={item}
                  onPress={() => openTicketForm(item)}
                />
              ))}
            </View>
          </View>

          <Section title="My Support Tickets">
            {isLoading ? (
              <LoadingTickets />
            ) : tickets.length > 0 ? (
              tickets.slice(0, 5).map((ticket, index) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  last={index === Math.min(tickets.length, 5) - 1}
                />
              ))
            ) : (
              <EmptyTickets />
            )}
          </Section>

          <Section title="Quick Answers">
            <FaqRow
              title="When can I chat with a driver?"
              subtitle="Chat unlocks after your booking is accepted."
            />
            <FaqRow
              title="When do I earn rewards?"
              subtitle="Reward points are added after completed rides or bookings."
            />
            <FaqRow
              title="Why is my vehicle pending?"
              subtitle="Vehicle RC and details may require review before approval."
              last
            />
          </Section>
        </ScrollView>

        <CreateTicketModal
          visible={modalVisible}
          category={selectedCategory}
          loading={createMutation.isPending}
          onClose={() => setModalVisible(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
        />
      </SafeAreaView>
    </View>
  );
}

function useSupportCategories(): Category[] {
  const { colors } = useAppTheme();

  return useMemo(
    () => [
      {
        key: "ride_issue",
        title: "Ride Issue",
        subtitle: "Route, timing, or trip problem",
        icon: <Car size={22} color={colors.primary} />,
      },
      {
        key: "booking_issue",
        title: "Booking Issue",
        subtitle: "Approval, cancellation, or chat",
        icon: <Ticket size={22} color={colors.primary} />,
      },
      {
        key: "payment_rewards",
        title: "Payments & Rewards",
        subtitle: "Points, redeem, or payment issue",
        icon: <CreditCard size={22} color="#F59E0B" />,
      },
      {
        key: "vehicle_verification",
        title: "Vehicle Verification",
        subtitle: "RC upload or approval",
        icon: <Wrench size={22} color={colors.primary} />,
      },
      {
        key: "account_login",
        title: "Account & Login",
        subtitle: "Login, profile, or verification",
        icon: <Lock size={22} color={colors.primary} />,
      },
      {
        key: "safety_concern",
        title: "Safety Concern",
        subtitle: "Unsafe behavior or urgent issue",
        icon: <ShieldAlert size={22} color={colors.danger} />,
      },
      {
        key: "other",
        title: "Other",
        subtitle: "Anything else",
        icon: <FileQuestion size={22} color={colors.primary} />,
      },
    ],
    [colors],
  );
}

function Header({ onRefresh }: { onRefresh: () => void }) {
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

      <View className="flex-1">
        <Text style={{ color: colors.text }} className="text-3xl font-extrabold">
          Help & Support
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-sm">
          Get help with rides, bookings, and account issues
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
  );
}

function HeroCard({
  openTickets,
  totalTickets,
}: {
  openTickets: number;
  totalTickets: number;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-6 overflow-hidden rounded-[30px] border p-5"
    >
      <View className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10" />

      <View className="flex-row items-center gap-4">
        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="h-16 w-16 items-center justify-center rounded-3xl"
        >
          <Headphones size={30} color={colors.primary} />
        </View>

        <View className="flex-1">
          <Text style={{ color: colors.text }} className="text-xl font-extrabold">
            We are here to help
          </Text>
          <Text style={{ color: colors.muted }} className="mt-1 text-sm leading-5">
            Submit a support ticket and track the status from this screen.
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <MiniStat label="Open" value={`${openTickets}`} />
        <MiniStat label="Total Tickets" value={`${totalTickets}`} />
      </View>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.input }} className="flex-1 rounded-2xl p-4">
      <Text style={{ color: colors.text }} className="text-2xl font-extrabold">
        {value}
      </Text>
      <Text style={{ color: colors.muted }} className="mt-1 text-xs font-bold">
        {label}
      </Text>
    </View>
  );
}

function CategoryCard({
  category,
  onPress,
}: {
  category: Category;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="w-[48%] rounded-[24px] border p-4"
    >
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-12 w-12 items-center justify-center rounded-2xl"
      >
        {category.icon}
      </View>

      <Text
        style={{ color: colors.text }}
        className="mt-4 font-extrabold"
        numberOfLines={1}
      >
        {category.title}
      </Text>
      <Text
        style={{ color: colors.muted }}
        className="mt-1 text-xs leading-4"
        numberOfLines={2}
      >
        {category.subtitle}
      </Text>
    </TouchableOpacity>
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
        className="overflow-hidden rounded-[26px] border"
      >
        {children}
      </View>
    </View>
  );
}

function TicketRow({ ticket, last }: { ticket: TicketItem; last?: boolean }) {
  const { colors } = useAppTheme();
  const status = getTicketStatus(ticket.status, colors);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row items-center gap-3 border-b px-4 py-4"
    >
      <View
        style={{ backgroundColor: status.bg }}
        className="h-11 w-11 items-center justify-center rounded-2xl"
      >
        <LifeBuoy size={20} color={status.color} />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            style={{ color: colors.text }}
            className="font-extrabold"
            numberOfLines={1}
          >
            {ticket.subject}
          </Text>
        </View>

        <Text style={{ color: colors.muted }} className="mt-1 text-xs">
          {ticket.ticketNumber} • {formatDate(ticket.createdAt)}
        </Text>
      </View>

      <View style={{ backgroundColor: status.bg }} className="rounded-full px-3 py-1">
        <Text style={{ color: status.color }} className="text-[10px] font-bold">
          {status.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function FaqRow({
  title,
  subtitle,
  last,
}: {
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
        style={{ backgroundColor: colors.primarySoft }}
        className="h-10 w-10 items-center justify-center rounded-xl"
      >
        <BadgeHelp size={19} color={colors.primary} />
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

function CreateTicketModal({
  visible,
  category,
  loading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  category: Category | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    category: SupportCategoryKey;
    subject: string;
    description: string;
  }) => void;
}) {
  const { colors } = useAppTheme();
  const { height, width } = useWindowDimensions();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit =
    !!category &&
    subject.trim().length >= 5 &&
    description.trim().length >= 10 &&
    !loading;

  const modalWidth = Math.min(width - 32, 520);
  const modalMaxHeight = Math.min(height * 0.86, 720);

  const resetAndClose = () => {
    setSubject("");
    setDescription("");
    onClose();
  };

  const handleSubmit = () => {
    if (!category) return;

    onSubmit({
      category: category.key,
      subject: subject.trim(),
      description: description.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center bg-black/75 px-4">
          <View
            style={{
              width: modalWidth,
              maxHeight: modalMaxHeight,
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
            className="overflow-hidden rounded-[30px] border"
          >
            <View className="px-5 pt-5">
              <View className="flex-row items-start justify-between gap-4">
                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="h-14 w-14 items-center justify-center rounded-2xl"
                >
                  {category?.icon || <MessageSquareText size={24} color={colors.primary} />}
                </View>

                <TouchableOpacity
                  onPress={resetAndClose}
                  style={{ backgroundColor: colors.input }}
                  className="h-10 w-10 items-center justify-center rounded-full"
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.text }} className="mt-5 text-2xl font-extrabold">
                Create Support Ticket
              </Text>
              <Text style={{ color: colors.muted }} className="mt-2 text-sm leading-6">
                {category
                  ? `Category: ${category.title}`
                  : "Tell us what went wrong and our team will review it."}
              </Text>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 20,
              }}
            >
              <InputBlock
                label="Subject"
                value={subject}
                onChangeText={setSubject}
                placeholder="Example: Booking chat not visible"
              />

              <InputBlock
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Explain your issue clearly..."
                multiline
              />

              <View
                style={{ backgroundColor: colors.input }}
                className="mt-2 flex-row gap-3 rounded-2xl p-4"
              >
                <AlertTriangle size={18} color="#F59E0B" />
                <Text style={{ color: colors.muted }} className="flex-1 text-xs leading-5">
                  For urgent safety issues, choose Safety Concern. Our team will prioritize it.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!canSubmit}
                onPress={handleSubmit}
                style={{
                  backgroundColor: canSubmit ? colors.primary : colors.input,
                  opacity: canSubmit ? 1 : 0.65,
                }}
                className="mt-5 flex-row items-center justify-center gap-2 rounded-2xl py-4"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={18} color={canSubmit ? "#FFFFFF" : colors.muted} />
                    <Text
                      style={{ color: canSubmit ? "#FFFFFF" : colors.muted }}
                      className="font-extrabold"
                    >
                      Submit Ticket
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function InputBlock({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-4">
      <Text style={{ color: colors.text }} className="mb-2 font-extrabold">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          color: colors.text,
          backgroundColor: colors.input,
          minHeight: multiline ? 130 : 54,
          borderColor: colors.border,
        }}
        className="rounded-2xl border px-4 py-4 text-base font-semibold"
      />
    </View>
  );
}

function LoadingTickets() {
  const { colors } = useAppTheme();

  return (
    <View className="items-center px-6 py-8">
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
        Loading tickets...
      </Text>
    </View>
  );
}

function EmptyTickets() {
  const { colors } = useAppTheme();

  return (
    <View className="items-center px-6 py-8">
      <CheckCircle2 size={34} color={colors.success} />
      <Text style={{ color: colors.text }} className="mt-3 font-extrabold">
        No tickets yet
      </Text>
      <Text style={{ color: colors.muted }} className="mt-1 text-center text-xs">
        Your submitted support requests will appear here.
      </Text>
    </View>
  );
}

function getTicketStatus(status: TicketItem["status"], colors: any) {
  if (status === "resolved") {
    return {
      label: "Resolved",
      bg: "rgba(34,197,94,0.14)",
      color: colors.success,
    };
  }

  if (status === "in_review") {
    return {
      label: "In Review",
      bg: colors.primarySoft,
      color: colors.primary,
    };
  }

  if (status === "closed") {
    return {
      label: "Closed",
      bg: colors.input,
      color: colors.muted,
    };
  }

  return {
    label: "Open",
    bg: "rgba(245,158,11,0.14)",
    color: "#F59E0B",
  };
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function StickySupportHeader({ onRefresh }: { onRefresh: () => void }) {
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
            Help & Support
          </Text>

          <Text
            style={{ color: colors.muted }}
            className="mt-0.5 text-xs font-semibold"
            numberOfLines={1}
          >
            Tickets, safety & account help
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