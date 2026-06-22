import { shortAddress1 } from "@/hooks/address-trimmer";
import { getMyChatRoomsApi } from "@/services/chat.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
    ArrowLeft,
    Car,
    CheckCheck,
    RefreshCcw,
    Search,
    ShieldCheck,
    UserRound,
    Users,
    X
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatTab = "passengers" | "drivers";

type ChatItem = {
  roomId: string;
  name: string;
  roleLabel: string;
  from: string;
  to: string;
  lastMessage: string;
  lastMessageAt?: string | null;
  rideDate?: string;
  rideTime?: string;
  unreadCount: number;
  avatarLetter?: string;
  rideStatus?: string;
  profilePicture?: string | null;
};

function mapChatItem(item: any): ChatItem {
  return {
    roomId: String(item.roomId || item.id),
    name: item.name || "User",
    roleLabel: item.roleLabel || (item.role === "driver" ? "Passenger" : "Driver"),
    from: shortAddress1(item.from) || "",
    to: shortAddress1(item.to) || "",
    lastMessage: item.lastMessage || "No messages yet",
    lastMessageAt: item.lastMessageAt || null,
    rideDate: item.rideDate || "",
    rideTime: item.rideTime || "",
    unreadCount: Number(item.unreadCount || 0),
    avatarLetter:
      item.avatarLetter ||
      String(item.name || "U").trim().charAt(0).toUpperCase() ||
      "U",
    rideStatus: item.rideStatus || "active",
    profilePicture: item.profilePicture || null,
  };
}

export default function MessagesScreen() {
  const { colors } = useAppTheme();

  const [activeTab, setActiveTab] = useState<ChatTab>("passengers");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-chat-rooms"],
    queryFn: getMyChatRoomsApi,
  });

  const passengerChats = useMemo(() => {
    return (data?.data?.passengerChats || []).map(mapChatItem);
  }, [data]);

  const driverChats = useMemo(() => {
    return (data?.data?.driverChats || []).map(mapChatItem);
  }, [data]);

  const currentChats = activeTab === "passengers" ? passengerChats : driverChats;

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return currentChats;

    return currentChats.filter((item: ChatItem) => {
      const text = `${item.name} ${item.from} ${item.to} ${item.lastMessage}`.toLowerCase();
      return text.includes(query);
    });
  }, [search, currentChats]);

  const unreadPassengerCount = passengerChats.reduce(
    (sum: number, item: ChatItem) => sum + item.unreadCount,
    0,
  );

  const unreadDriverCount = driverChats.reduce(
    (sum: number, item: ChatItem) => sum + item.unreadCount,
    0,
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 120,
          }}
        >
          <Header onRefresh={refetch} />

          <SearchBox search={search} setSearch={setSearch} />

          <TelegramTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadPassengerCount={unreadPassengerCount}
            unreadDriverCount={unreadDriverCount}
          />

          <View className="mt-6 flex-row items-end justify-between">
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="text-xl font-extrabold">
                {activeTab === "passengers" ? "Passenger Chats" : "Driver Messages"}
              </Text>

              <Text style={{ color: colors.muted }} className="mt-1 text-xs leading-4">
                {activeTab === "passengers"
                  ? "People messaging you as a driver"
                  : "Drivers messaging you as a passenger"}
              </Text>
            </View>

            <View
              style={{ backgroundColor: colors.input }}
              className="rounded-full px-3 py-1.5"
            >
              <Text style={{ color: colors.muted }} className="text-xs font-bold">
                {filteredChats.length} chat{filteredChats.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>

          <View
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="mt-4 overflow-hidden rounded-[28px] border"
          >
            {isLoading ? (
              <LoadingChats />
            ) : filteredChats.length > 0 ? (
              filteredChats.map((item: ChatItem, index: number) => (
                <ChatListItem
                  key={item.roomId}
                  item={item}
                  last={index === filteredChats.length - 1}
                />
              ))
            ) : (
              <EmptyChats activeTab={activeTab} />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
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
          Messages
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-sm">
          Ride chats in one inbox
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onRefresh}
        style={{ backgroundColor: colors.primarySoft }}
        className="h-12 w-12 items-center justify-center rounded-full"
      >
        <RefreshCcw size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function SearchBox({
  search,
  setSearch,
}: {
  search: string;
  setSearch: (value: string) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-6 rounded-[24px] border px-4 py-3"
    >
      <View className="flex-row items-center gap-3">
        <Search size={18} color={colors.muted} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search messages"
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          style={{ color: colors.text }}
          className="flex-1 text-base font-semibold"
        />

        {search.length > 0 && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => setSearch("")}>
            <X size={17} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function TelegramTabs({
  activeTab,
  setActiveTab,
  unreadPassengerCount,
  unreadDriverCount,
}: {
  activeTab: ChatTab;
  setActiveTab: (value: ChatTab) => void;
  unreadPassengerCount: number;
  unreadDriverCount: number;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.input }}
      className="mt-5 flex-row rounded-full p-1.5"
    >
      <SegmentTab
        active={activeTab === "passengers"}
        title="Passengers"
        count={unreadPassengerCount}
        icon={
          <Users
            size={16}
            color={activeTab === "passengers" ? "#FFFFFF" : colors.muted}
          />
        }
        onPress={() => setActiveTab("passengers")}
      />

      <SegmentTab
        active={activeTab === "drivers"}
        title="Drivers"
        count={unreadDriverCount}
        icon={
          <Car
            size={16}
            color={activeTab === "drivers" ? "#FFFFFF" : colors.muted}
          />
        }
        onPress={() => setActiveTab("drivers")}
      />
    </View>
  );
}

function SegmentTab({
  active,
  title,
  count,
  icon,
  onPress,
}: {
  active: boolean;
  title: string;
  count: number;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{ backgroundColor: active ? colors.primary : "transparent" }}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-full px-3 py-3"
    >
      {icon}

      <Text
        style={{ color: active ? "#FFFFFF" : colors.muted }}
        className="text-sm font-extrabold"
      >
        {title}
      </Text>

      {count > 0 && (
        <View
          style={{ backgroundColor: active ? "#FFFFFF" : colors.primary }}
          className="min-w-5 items-center rounded-full px-1.5 py-0.5"
        >
          <Text
            style={{ color: active ? colors.primary : "#FFFFFF" }}
            className="text-[10px] font-extrabold"
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ChatListItem({ item, last }: { item: ChatItem; last?: boolean }) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() =>
        router.push({
          pathname: "/chat/[roomId]",
          params: { roomId: item.roomId },
        })
      }
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row items-center gap-3 border-b px-4 py-4"
    >
      <View>
        <View
          style={{ backgroundColor: colors.primary }}
          className="h-14 w-14 items-center justify-center rounded-full"
        >
          <Text className="text-xl font-extrabold text-white">
            {item.avatarLetter || "U"}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <View
            style={{ borderColor: colors.card, backgroundColor: colors.success }}
            className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2"
          />
        )}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between gap-3">
          <Text
            style={{ color: colors.text }}
            className="flex-1 text-base font-extrabold"
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text
            style={{
              color: item.unreadCount > 0 ? colors.primary : colors.muted,
            }}
            className="text-xs font-bold"
          >
            {formatChatTime(item.lastMessageAt)}
          </Text>
        </View>

        <View className="mt-1 flex-row items-center gap-1.5">
          <CheckCheck size={14} color={colors.muted} />

          <Text
            style={{
              color: item.unreadCount > 0 ? colors.text : colors.muted,
            }}
            className="flex-1 text-sm font-semibold"
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>

          {item.unreadCount > 0 && (
            <View
              style={{ backgroundColor: colors.primary }}
              className="min-w-6 items-center justify-center rounded-full px-2 py-1"
            >
              <Text className="text-[10px] font-extrabold text-white">
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <View
            style={{ backgroundColor: colors.primarySoft }}
            className="rounded-full px-2.5 py-1"
          >
            <Text
              style={{ color: colors.primary }}
              className="text-[10px] font-extrabold"
            >
              {item.roleLabel}
            </Text>
          </View>

          <View
            style={{ backgroundColor: colors.input }}
            className="max-w-[70%] rounded-full px-2.5 py-1"
          >
            <Text
              style={{ color: colors.muted }}
              className="text-[10px] font-bold"
              numberOfLines={1}
            >
              {item.from || "Pickup"} → {item.to || "Drop"}
            </Text>
          </View>

          <StatusPill status={normalizeStatus(item.rideStatus)} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: "active" | "waiting" | "ended" }) {
  const { colors } = useAppTheme();

  const config = {
    active: {
      label: "Active",
      bg: "rgba(34,197,94,0.14)",
      color: colors.success,
    },
    waiting: {
      label: "Waiting",
      bg: colors.primarySoft,
      color: colors.primary,
    },
    ended: {
      label: "Ended",
      bg: colors.input,
      color: colors.muted,
    },
  }[status];

  return (
    <View style={{ backgroundColor: config.bg }} className="rounded-full px-2.5 py-1">
      <Text style={{ color: config.color }} className="text-[10px] font-bold">
        {config.label}
      </Text>
    </View>
  );
}

function EmptyChats({ activeTab }: { activeTab: ChatTab }) {
  const { colors } = useAppTheme();

  return (
    <View className="items-center px-6 py-10">
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-16 w-16 items-center justify-center rounded-full"
      >
        {activeTab === "passengers" ? (
          <Users size={30} color={colors.primary} />
        ) : (
          <UserRound size={30} color={colors.primary} />
        )}
      </View>

      <Text style={{ color: colors.text }} className="mt-4 text-lg font-extrabold">
        No messages yet
      </Text>

      <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm leading-5">
        {activeTab === "passengers"
          ? "Passenger chats will appear here after your ride bookings are accepted."
          : "Driver messages will appear here after your booking is accepted."}
      </Text>

      <View
        style={{ backgroundColor: colors.input }}
        className="mt-5 flex-row items-center gap-2 rounded-full px-4 py-2"
      >
        <ShieldCheck size={15} color={colors.primary} />
        <Text style={{ color: colors.muted }} className="text-xs font-bold">
          Chats unlock after approval
        </Text>
      </View>
    </View>
  );
}

function LoadingChats() {
  const { colors } = useAppTheme();

  return (
    <View className="items-center px-6 py-10">
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
        Loading messages...
      </Text>
    </View>
  );
}

function normalizeStatus(value?: string): "active" | "waiting" | "ended" {
  const status = String(value || "").toLowerCase();

  if (["completed", "cancelled", "canceled", "ended"].includes(status)) {
    return "ended";
  }

  if (["pending", "waiting"].includes(status)) {
    return "waiting";
  }

  return "active";
}

function formatChatTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}