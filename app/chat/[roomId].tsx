import {
  getChatMessagesApi,
  markChatReadApi,
  sendChatMessageApi,
} from "@/services/chat.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, SendHorizonal, User } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  _status?: "sending" | "sent" | "failed";
};

type ChatListItem =
  | { type: "date"; id: string; label: string }
  | { type: "message"; id: string; message: ChatMessage };

function createTempMessage({
  roomId,
  currentUserId,
  message,
}: {
  roomId: string;
  currentUserId: string;
  message: string;
}): ChatMessage {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    room_id: roomId,
    sender_id: currentUserId,
    message,
    message_type: "text",
    is_read: true,
    created_at: new Date().toISOString(),
    _status: "sending",
  };
}

export default function ChatRoomScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { roomId, title } = useLocalSearchParams<{
    roomId: string;
    title?: string;
  }>();

  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList<ChatListItem>>(null);
  const didInitialScrollRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["chat-messages", roomId],
    queryFn: () => getChatMessagesApi(String(roomId)),
    enabled: !!roomId,
    refetchOnWindowFocus: false,
    staleTime: 10 * 1000,
  });

  const currentUserId = String(data?.data?.currentUserId || "");
  const chatTitle = title || "Ride Chat";

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    const apiMessages: ChatMessage[] = data?.data?.messages || [];

    setMessages((prev) => {
      const tempMessages = prev.filter((item) =>
        String(item.id).startsWith("temp-"),
      );

      const merged = [...apiMessages];

      tempMessages.forEach((temp) => {
        const alreadyExists = merged.some(
          (item) =>
            item.message === temp.message &&
            String(item.sender_id) === String(temp.sender_id),
        );

        if (!alreadyExists) {
          merged.push(temp);
        }
      });

      return uniqueMessages(merged);
    });
  }, [data]);

  useEffect(() => {
    if (!roomId || !SOCKET_URL) return;

    markChatReadApi(String(roomId)).catch(() => {});

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join_room", String(roomId));
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("connect_error", () => {
      setSocketConnected(false);
    });

    socket.on("new_message", (newMessage: ChatMessage) => {
      if (String(newMessage.room_id) !== String(roomId)) return;

      setMessages((prev) => {
        const withoutMatchingTemp = prev.filter((item) => {
          const isTemp = String(item.id).startsWith("temp-");
          const sameText = item.message === newMessage.message;
          const sameSender =
            String(item.sender_id) === String(newMessage.sender_id);

          return !(isTemp && sameText && sameSender);
        });

        return uniqueMessages([...withoutMatchingTemp, newMessage]);
      });

      markChatReadApi(String(roomId)).catch(() => {});
    });

    return () => {
      socket.emit("leave_room", String(roomId));
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("new_message");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => scrollToBottom(true), 140);
    });

    return () => {
      showSub.remove();
    };
  }, [scrollToBottom]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [messages]);

  const listItems = useMemo(() => {
    return buildChatList(sortedMessages);
  }, [sortedMessages]);

  useEffect(() => {
    if (!listItems.length) return;

    const timer = setTimeout(() => {
      scrollToBottom(didInitialScrollRef.current);
      didInitialScrollRef.current = true;
    }, didInitialScrollRef.current ? 80 : 220);

    return () => clearTimeout(timer);
  }, [listItems.length, scrollToBottom]);

  const handleSend = async () => {
    const cleanMessage = text.trim();

    if (!cleanMessage || !roomId || sending) return;

    if (!currentUserId) {
      toast.error("Chat is still loading. Please try again.");
      return;
    }

    const tempMessage = createTempMessage({
      roomId: String(roomId),
      currentUserId,
      message: cleanMessage,
    });

    setText("");
    setSending(true);
    setMessages((prev) => uniqueMessages([...prev, tempMessage]));

    try {
      await sendChatMessageApi(String(roomId), cleanMessage);
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((item) =>
          String(item.id) === String(tempMessage.id)
            ? { ...item, _status: "failed" }
            : item,
        ),
      );

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
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <ChatHeader
          title={chatTitle}
          connected={socketConnected}
          onBack={() => router.back()}
        />

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
          onLayout={() => {
            setTimeout(() => scrollToBottom(false), 160);
          }}
          renderItem={({ item }) => {
            if (item.type === "date") {
              return <DateSeparator label={item.label} />;
            }

            return (
              <MessageBubble
                message={item.message}
                isMine={String(item.message.sender_id) === currentUserId}
              />
            );
          }}
          ListEmptyComponent={<EmptyChat />}
        />

        <ChatInput
          value={text}
          onChangeText={setText}
          onSend={handleSend}
          sending={sending}
          disabled={!currentUserId}
          bottomInset={Math.max(
            insets.bottom,
            Platform.OS === "android" ? 18 : 12,
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function ChatHeader({
  title,
  connected,
  onBack,
}: {
  title: string;
  connected: boolean;
  onBack: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
      }}
      className="flex-row items-center gap-3 border-b px-4 py-3"
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBack}
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
          {title}
        </Text>

        <View className="mt-1 flex-row items-center gap-1.5">
          <View
            style={{
              backgroundColor: connected ? colors.success : colors.muted,
            }}
            className="h-2 w-2 rounded-full"
          />

          <Text
            style={{ color: connected ? colors.success : colors.muted }}
            className="text-xs font-semibold"
          >
            {connected ? "Online" : "Connecting..."}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ChatInput({
  value,
  onChangeText,
  onSend,
  sending,
  disabled,
  bottomInset,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  disabled: boolean;
  bottomInset: number;
}) {
  const { colors } = useAppTheme();

  const canSend = value.trim().length > 0 && !sending && !disabled;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        paddingBottom: bottomInset,
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
            value={value}
            onChangeText={onChangeText}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            editable={!disabled}
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
          onPress={onSend}
          disabled={!canSend}
          style={{
            backgroundColor: canSend ? colors.primary : colors.input,
            borderColor: canSend ? colors.primary : colors.border,
            opacity: canSend ? 1 : 0.65,
          }}
          className="mb-0.5 h-12 w-12 items-center justify-center rounded-full border"
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <SendHorizonal
              size={21}
              color={canSend ? "#FFFFFF" : colors.muted}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  const failed = message._status === "failed";
  const sending = message._status === "sending";

  return (
    <View className={`mb-2 flex-row ${isMine ? "justify-end" : "justify-start"}`}>
      <View
        style={{
          backgroundColor: isMine ? colors.primary : colors.card,
          borderColor: failed
            ? colors.danger
            : isMine
              ? colors.primary
              : colors.border,
          borderTopRightRadius: isMine ? 6 : 18,
          borderTopLeftRadius: isMine ? 18 : 6,
          opacity: failed ? 0.75 : 1,
        }}
        className="max-w-[82%] rounded-[18px] border px-3.5 py-2.5"
      >
        <Text
          style={{ color: isMine ? "#FFFFFF" : colors.text }}
          className="text-[15px] font-medium leading-5"
        >
          {message.message}
        </Text>

        <View className="mt-1 flex-row items-center justify-end gap-1.5">
          {sending && (
            <Text
              style={{ color: "rgba(255,255,255,0.75)" }}
              className="text-[10px] font-bold"
            >
              Sending
            </Text>
          )}

          {failed && (
            <Text
              style={{ color: isMine ? "#FFFFFF" : colors.danger }}
              className="text-[10px] font-bold"
            >
              Failed
            </Text>
          )}

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
        Start the ride chat
      </Text>

      <Text
        style={{ color: colors.muted }}
        className="mt-2 text-center text-sm leading-5"
      >
        Confirm pickup point, timing, vehicle details, or passenger notes here.
      </Text>
    </View>
  );
}

function uniqueMessages(messages: ChatMessage[]) {
  const map = new Map<string, ChatMessage>();

  messages.forEach((message) => {
    const key = String(message.id);

    if (!map.has(key)) {
      map.set(key, message);
    }
  });

  return [...map.values()];
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