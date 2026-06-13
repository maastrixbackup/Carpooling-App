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

export default function ChatRoomScreen() {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const { roomId, title } = useLocalSearchParams<{
        roomId: string;
        title?: string;
    }>();

    const socketRef = useRef<Socket | null>(null);
    const listRef = useRef<FlatList<ChatMessage>>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["chat-messages", roomId],
        queryFn: () => getChatMessagesApi(String(roomId)),
        enabled: !!roomId,
    });

    const currentUserId = String(data?.data?.currentUserId || "");
    // const isMine = String(item.sender_id) === currentUserId;
    const chatTitle = title || "New User";

    useEffect(() => {
        const apiMessages = data?.data?.messages || [];
        setMessages(apiMessages);
    }, [data]);

    useEffect(() => {
        if (!roomId || !SOCKET_URL) return;

        markChatReadApi(String(roomId)).catch(() => { });

        const socket = io(SOCKET_URL, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_room", String(roomId));
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

            setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
            }, 80);
        });

        socket.on("connect_error", () => {
            console.log("Socket connection failed");
        });

        return () => {
            socket.emit("leave_room", String(roomId));
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomId]);

    const sortedMessages = useMemo(() => {
        return [...messages].sort(
            (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
        );
    }, [messages]);

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
                        <Text style={{ color: colors.muted }} className="text-xs font-semibold">
                            Booking chat
                        </Text>
                    </View>
                </View>

                <FlatList
                    ref={listRef}
                    data={sortedMessages}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: 14,
                        paddingTop: 14,
                        paddingBottom: 22,
                        flexGrow: 1,
                    }}
                    onContentSizeChange={() =>
                        listRef.current?.scrollToEnd({ animated: true })
                    }
                    refreshing={false}
                    onRefresh={refetch}
                    renderItem={({ item }) => (
                        <MessageBubble
                            message={item}
                            isMine={String(item.sender_id) === String(currentUserId)}
                        />
                    )}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center px-8">
                            <Text
                                style={{ color: colors.text }}
                                className="text-lg font-extrabold"
                            >
                                No messages yet
                            </Text>
                            <Text
                                style={{ color: colors.muted }}
                                className="mt-2 text-center text-sm"
                            >
                                Start the conversation about pickup, timing, or vehicle details.
                            </Text>
                        </View>
                    }
                />

                <View
                    style={{
                        backgroundColor: colors.card,
                        borderTopColor: colors.border,
                        paddingBottom: Math.max(insets.bottom, 12),
                    }}
                    className="flex-row items-end gap-3 border-t px-4 pt-3"
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
                            backgroundColor: colors.input,
                            maxHeight: 120,
                            minHeight: 46,
                        }}
                        className="flex-1 rounded-[22px] px-4 py-3 text-base font-semibold"
                    />

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleSend}
                        disabled={!text.trim() || sending}
                        style={{
                            backgroundColor:
                                text.trim() && !sending ? colors.primary : colors.border,
                        }}
                        className="h-12 w-12 items-center justify-center rounded-full"
                    >
                        {sending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <SendHorizonal size={21} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
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

function formatChatTime(value?: string) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}