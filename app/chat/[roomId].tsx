import {
    getChatMessagesApi,
    markChatReadApi,
    sendChatMessageApi,
} from "@/services/chat.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, SendHorizonal, User } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner-native";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

type ChatMessage = {
  id: string | number;
  room_id: string | number;
  sender_id: string;
  message: string;
  message_type?: string;
  is_read?: boolean;
  created_at: string;
};

type ChatListItem =
  | { type: "date"; id: string; label: string }
  | { type: "message"; id: string; message: ChatMessage };

export default function ChatRoomScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { roomId, title } = useLocalSearchParams<{
    roomId: string;
    title?: string;
  }>();

  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList<ChatListItem>>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["chat-messages", roomId],
    queryFn: () => getChatMessagesApi(String(roomId)),
    enabled: !!roomId,
    refetchOnWindowFocus: false,
  });

  const currentUserId = String(data?.data?.currentUserId || "");
  const chatTitle = title || "Ride Chat";

  useEffect(() => {
    const apiMessages = data?.data?.messages || [];
    setMessages(apiMessages);
  }, [data]);

  useEffect(() => {
    if (!roomId || !SOCKET_URL) return;

    markChatReadApi(String(roomId)).catch(() => {});

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_room", String(roomId));
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("new_message", (newMessage: ChatMessage) => {
      if (String(newMessage.room_id) !== String(roomId)) return;

      setMessages((prev) => {
        const exists = prev.some(
          (item) => String(item.id) === String(newMessage.id),
        );

        if (exists) return prev;
        return [...prev, newMessage];
      });

      setTimeout(scrollToBottom, 80);
    });

    socket.on("connect_error", () => {
      setSocketConnected(false);
    });

    return () => {
      socket.emit("leave_room", String(roomId));
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(scrollToBottom, 120);
    });

    return () => {
      showSub.remove();
    };
  }, []);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime(),
    );
  }, [messages]);

  const listItems = useMemo(() => {
    return buildChatList(sortedMessages);
  }, [sortedMessages]);

  const scrollToBottom = () => {
    listRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = async () => {
    const cleanMessage = text.trim();

    if (!cleanMessage || !roomId || sending) return;

    setText("");
    setSending(true);

    try {
      await sendChatMessageApi(String(roomId), cleanMessage);
    } catch (error: any) {
      setText(cleanMessage);
      toast.error(error?.message || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.bg }}
        className="items-center justify-center"
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.muted }} className="mt-3 font-bold">
          Loading chat...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          }}
          className="flex-row items-center gap-3 border-b px-4 py-3"
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.back()}
            style={{ backgroundColor: colors.input }}
            className="h-10 w-10 items-center justify-center rounded-full"
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>

          <View
            style={{ backgroundColor: colors.primarySoft }}
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <User size={21} color={colors.primary} />
          </View>

          <View className="flex-1">
            <Text
              style={{ color: colors.text }}
              className="text-base font-extrabold"
              numberOfLines={1}
            >
              {chatTitle}
            </Text>

            <Text
              style={{ color: socketConnected ? colors.success : colors.muted }}
              className="text-xs font-semibold"
            >
              {socketConnected ? "Online" : "Connecting..."}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <FlatList
            ref={listRef}
            data={listItems}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshing={isFetching}
            onRefresh={refetch}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingTop: 16,
              paddingBottom: 18,
              flexGrow: 1,
            }}
            onContentSizeChange={scrollToBottom}
            renderItem={({ item }) => {
              if (item.type === "date") {
                return <DateSeparator label={item.label} />;
              }

              return (
                <MessageBubble
                  message={item.message}
                  isMine={
                    String(item.message.sender_id) === String(currentUserId)
                  }
                />
              );
            }}
            ListEmptyComponent={<EmptyChat />}
          />
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 10),
          }}
          className="border-t px-3 pt-3"
        >
          <View className="flex-row items-end gap-2">
            <View
              style={{
                backgroundColor: colors.input,
                borderColor: colors.border,
              }}
              className="flex-1 rounded-[24px] border px-4 py-1"
            >
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Message"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                style={{
                  color: colors.text,
                  maxHeight: 120,
                  minHeight: 42,
                  paddingTop: Platform.OS === "ios" ? 11 : 7,
                  paddingBottom: Platform.OS === "ios" ? 10 : 7,
                }}
                className="text-[15px] font-medium"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSend}
              disabled={!text.trim() || sending}
              style={{
                backgroundColor:
                  text.trim() && !sending ? colors.primary : colors.border,
              }}
              className="mb-0.5 h-12 w-12 items-center justify-center rounded-full"
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <SendHorizonal size={21} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View className={`mb-2 flex-row ${isMine ? "justify-end" : "justify-start"}`}>
      <View
        style={{
          backgroundColor: isMine ? colors.primary : colors.card,
          borderColor: isMine ? colors.primary : colors.border,
          borderTopRightRadius: isMine ? 6 : 18,
          borderTopLeftRadius: isMine ? 18 : 6,
        }}
        className="max-w-[82%] rounded-[18px] border px-3.5 py-2.5"
      >
        <Text
          style={{ color: isMine ? "#FFFFFF" : colors.text }}
          className="text-[15px] font-medium leading-5"
        >
          {message.message}
        </Text>

        <View className="mt-1 flex-row justify-end">
          <Text
            style={{
              color: isMine ? "rgba(255,255,255,0.75)" : colors.muted,
            }}
            className="text-[10px] font-bold"
          >
            {formatChatTime(message.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DateSeparator({ label }: { label: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="my-3 items-center">
      <View
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
        className="rounded-full border px-3 py-1"
      >
        <Text style={{ color: colors.muted }} className="text-[11px] font-bold">
          {label}
        </Text>
      </View>
    </View>
  );
}

function EmptyChat() {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-16 w-16 items-center justify-center rounded-full"
      >
        <User size={28} color={colors.primary} />
      </View>

      <Text style={{ color: colors.text }} className="mt-5 text-lg font-extrabold">
        No messages yet
      </Text>

      <Text
        style={{ color: colors.muted }}
        className="mt-2 text-center text-sm leading-5"
      >
        Start the conversation about pickup point, timing, or vehicle details.
      </Text>
    </View>
  );
}

function buildChatList(messages: ChatMessage[]): ChatListItem[] {
  const items: ChatListItem[] = [];
  let lastDateKey = "";

  for (const message of messages) {
    const dateKey = getDateKey(message.created_at);

    if (dateKey !== lastDateKey) {
      items.push({
        type: "date",
        id: `date-${dateKey}`,
        label: formatDateSeparator(message.created_at),
      });

      lastDateKey = dateKey;
    }

    items.push({
      type: "message",
      id: `message-${message.id}`,
      message,
    });
  }

  return items;
}

function getDateKey(value?: string) {
  if (!value) return "unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "unknown";

  return date.toISOString().slice(0, 10);
}

function formatDateSeparator(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateKey = date.toDateString();

  if (dateKey === today.toDateString()) return "Today";
  if (dateKey === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatChatTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}