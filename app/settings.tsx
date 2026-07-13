import { APP_INFO } from "@/config/appInfo";
import { useAuth } from "@/context/AuthContext";
import {
  cancelDeleteAccountApi,
  getDeleteRequestApi,
  requestDeleteAccountApi,
} from "@/services/user.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  FileText,
  Globe2,
  Info,
  Lock,
  MapPin,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: deleteRequestData } = useQuery({
    queryKey: ["account-delete-request"],
    queryFn: getDeleteRequestApi,
  });

  const deletionRequest = deleteRequestData?.data?.deletionRequest;
  const hasDeletionRequest = Boolean(deletionRequest);

  const requestDeleteMutation = useMutation({
    mutationFn: requestDeleteAccountApi,
    onSuccess: async () => {
      toast.success("Account deletion requested.");
      setDeleteModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: ["account-delete-request"] });
      await logout();
      router.replace("/(auth)/login");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to request account deletion.");
    },
  });

  const cancelDeleteMutation = useMutation({
    mutationFn: cancelDeleteAccountApi,
    onSuccess: async () => {
      toast.success("Deletion request cancelled.");
      await queryClient.invalidateQueries({ queryKey: ["account-delete-request"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to cancel request.");
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View
          style={{ borderBottomColor: colors.border }}
          className="flex-row items-center gap-3 border-b px-5 pb-4 pt-3"
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.back()}
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="h-10 w-10 items-center justify-center rounded-full border"
          >
            <ArrowLeft size={19} color={colors.text} />
          </TouchableOpacity>

          <Text style={{ color: colors.text }} className="flex-1 text-lg font-extrabold">
            Settings
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 32) + 40,
          }}
        >
          {/* ── Preferences ── */}
          <SectionLabel label="Preferences" />

          <View style={{ backgroundColor: colors.bg }}>
            {/* Dark mode — signature pill toggle */}
            <View
              style={{ borderBottomColor: colors.border }}
              className="flex-row items-center border-b px-5 py-4"
            >
              <View className="flex-1 flex-row items-center gap-3">
                {isDark
                  ? <Moon size={19} color={colors.primary} />
                  : <Sun size={19} color={colors.primary} />
                }
                <Text style={{ color: colors.text }} className="text-[15px] font-semibold">
                  Appearance
                </Text>
              </View>

              {/* Pill toggle — the signature interaction */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={toggleTheme}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="flex-row items-center rounded-full p-1"
              >
                <View
                  style={{
                    backgroundColor: !isDark ? colors.primary : "transparent",
                  }}
                  className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                >
                  <Sun size={13} color={!isDark ? "#fff" : colors.muted} />
                  <Text
                    style={{ color: !isDark ? "#fff" : colors.muted }}
                    className="text-xs font-bold"
                  >
                    Light
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: isDark ? colors.primary : "transparent",
                  }}
                  className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                >
                  <Moon size={13} color={isDark ? "#fff" : colors.muted} />
                  <Text
                    style={{ color: isDark ? "#fff" : colors.muted }}
                    className="text-xs font-bold"
                  >
                    Dark
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Row
              icon={<Globe2 size={19} color={colors.primary} />}
              title="Language"
              value="English"
            />

            <Row
              icon={<MapPin size={19} color={colors.primary} />}
              title="Default Location"
              subtitle="Use current city for nearby rides"
              last
            />
          </View>

          {/* ── Account & Safety ── */}
          <SectionLabel label="Account & Safety" />

          <View style={{ backgroundColor: colors.bg }}>
            <Row
              icon={<ShieldCheck size={19} color={colors.success} />}
              title="Safety & Verification"
              subtitle="ID checks and trusted ride settings"
            />

            <Row
              icon={<Lock size={19} color={colors.primary} />}
              title="Privacy"
              subtitle="Visibility and data preferences"
              onPress={() => router.push("/privacy-policy" as any)}
            />

            <Row
              icon={<FileText size={19} color={colors.primary} />}
              title="Terms & Conditions"
              onPress={() => router.push("/terms-conditions" as any)}
            />

            <Row
              icon={<Info size={19} color={colors.primary} />}
              title="About"
              value={`v${APP_INFO.version}`}
              onPress={() => router.push("/about" as any)}
              last
            />
          </View>

          {/* ── Danger zone — separated, no section card ── */}
          <View
            style={{ backgroundColor: colors.bg, marginTop: 32 }}
          >
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setDeleteModalVisible(true)}
              style={{ borderTopColor: colors.border, borderBottomColor: colors.border }}
              className="flex-row items-center gap-3 border-b border-t px-5 py-4"
            >
              <Trash2
                size={19}
                color={hasDeletionRequest ? "#F59E0B" : colors.danger}
              />
              <View className="flex-1">
                <Text
                  style={{
                    color: hasDeletionRequest ? "#F59E0B" : colors.danger,
                  }}
                  className="text-[15px] font-semibold"
                >
                  {hasDeletionRequest ? "Deletion Scheduled" : "Delete Account"}
                </Text>
                {hasDeletionRequest && (
                  <Text style={{ color: colors.muted }} className="mt-0.5 text-xs">
                    Scheduled for {formatDate(deletionRequest?.scheduledDeleteAt)}
                  </Text>
                )}
              </View>
              <ChevronRight size={17} color={hasDeletionRequest ? "#F59E0B" : colors.danger} />
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View className="mt-10 items-center gap-1 px-5">
            <Text style={{ color: colors.muted }} className="text-xs">
              {APP_INFO.name} · v{APP_INFO.version}
            </Text>
            <Text style={{ color: colors.muted }} className="text-[11px]">
              © 2026 PoolShare. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <DeleteAccountModal
        visible={deleteModalVisible}
        deletionRequest={deletionRequest}
        loading={
          requestDeleteMutation.isPending || cancelDeleteMutation.isPending
        }
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={() => requestDeleteMutation.mutate()}
        onCancelRequest={() => cancelDeleteMutation.mutate()}
      />
    </View>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={{ color: colors.muted }}
      className="mt-8 mb-2 px-5 text-xs font-bold uppercase tracking-widest"
    >
      {label}
    </Text>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function Row({
  icon,
  title,
  subtitle,
  value,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.65}
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row items-center gap-3 border-b px-5 py-4"
    >
      {icon}

      <View className="flex-1">
        <Text style={{ color: colors.text }} className="text-[15px] font-semibold">
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: colors.muted }} className="mt-0.5 text-xs leading-4">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text style={{ color: colors.muted }} className="text-xs font-semibold">
          {value}
        </Text>
      ) : null}

      {onPress ? <ChevronRight size={17} color={colors.muted} /> : null}
    </TouchableOpacity>
  );
}

// ─── Delete account modal ─────────────────────────────────────────────────────

function DeleteAccountModal({
  visible,
  deletionRequest,
  loading = false,
  onClose,
  onConfirm,
  onCancelRequest,
}: {
  visible: boolean;
  deletionRequest?: any;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancelRequest: () => void;
}) {
  const { colors } = useAppTheme();
  const { height, width } = useWindowDimensions();
  const [confirmText, setConfirmText] = useState("");

  const hasRequest = Boolean(deletionRequest);
  const canDelete = confirmText.trim().toLowerCase() === "delete";
  const modalMaxHeight = Math.min(height * 0.88, 740);
  const modalWidth = Math.min(width - 32, 520);

  useEffect(() => {
    if (!visible) setConfirmText("");
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
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
            {/* Modal header */}
            <View className="px-5 pt-5">
              <View className="flex-row items-start justify-between gap-4">
                <View
                  style={{
                    backgroundColor: hasRequest
                      ? "rgba(245,158,11,0.14)"
                      : colors.dangerSoft,
                    height: 50,
                    width: 50,
                  }}
                  className="items-center justify-center rounded-2xl"
                >
                  <AlertTriangle
                    size={24}
                    color={hasRequest ? "#F59E0B" : colors.danger}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onClose}
                  style={{ backgroundColor: colors.input }}
                  className="h-10 w-10 items-center justify-center rounded-full"
                >
                  <X size={17} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text
                style={{ color: colors.text }}
                className="mt-4 text-xl font-extrabold"
              >
                {hasRequest ? "Deletion Scheduled" : "Delete Account"}
              </Text>
              <Text
                style={{ color: colors.muted }}
                className="mt-2 text-sm leading-6"
              >
                {hasRequest
                  ? `Your account is scheduled for deletion on ${formatDate(deletionRequest?.scheduledDeleteAt)}. Cancel before it's processed to keep your account.`
                  : "Your account will be queued for deletion after a 15-day waiting period. You can cancel during that window."}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 20,
              }}
            >
              {hasRequest ? (
                <>
                  <InfoBlock
                    title="Current status"
                    items={[
                      `Status: ${deletionRequest?.status || "pending"}`,
                      `Requested: ${formatDate(deletionRequest?.requestedAt)}`,
                      `Deletion date: ${formatDate(deletionRequest?.scheduledDeleteAt)}`,
                    ]}
                  />
                  <InfoBlock
                    title="Cancelling will restore"
                    items={[
                      "Full access to your profile, rides, and messages",
                      "Rewards, bookings, and saved vehicles",
                    ]}
                  />

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={loading}
                    onPress={onCancelRequest}
                    style={{
                      backgroundColor: colors.primary,
                      opacity: loading ? 0.7 : 1,
                    }}
                    className="mt-5 rounded-2xl py-4"
                  >
                    <Text className="text-center text-base font-extrabold text-white">
                      {loading ? "Cancelling…" : "Cancel Deletion Request"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onClose}
                    style={{ backgroundColor: colors.input }}
                    className="mt-3 rounded-2xl py-4"
                  >
                    <Text
                      style={{ color: colors.text }}
                      className="text-center text-base font-extrabold"
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <InfoBlock
                    title="What gets deleted"
                    items={[
                      "Profile info and login access",
                      "Saved preferences and notification tokens",
                      "Personal data not required for legal or safety records",
                    ]}
                  />
                  <InfoBlock
                    title="What stays (required by law)"
                    danger
                    items={[
                      "Completed ride history for safety and dispute records",
                      "Payment and transaction records",
                      "Reports or complaints linked to platform safety",
                    ]}
                  />
                  <InfoBlock
                    title="Before you proceed"
                    items={[
                      "You'll be logged out immediately after submitting",
                      "Deletion begins after a 15-day waiting period",
                      "Rewards, bookings, and messages will be lost",
                    ]}
                  />

                  <View className="mt-2">
                    <Text
                      style={{ color: colors.text }}
                      className="mb-2 text-sm font-extrabold"
                    >
                      Type DELETE to confirm
                    </Text>
                    <TextInput
                      value={confirmText}
                      onChangeText={setConfirmText}
                      placeholder="DELETE"
                      placeholderTextColor={colors.muted}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!loading}
                      style={{
                        color: colors.text,
                        backgroundColor: colors.input,
                        borderColor: canDelete ? colors.danger : colors.border,
                      }}
                      className="rounded-2xl border px-4 py-4 text-base font-bold"
                    />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={!canDelete || loading}
                    onPress={onConfirm}
                    style={{
                      backgroundColor: canDelete ? colors.danger : colors.input,
                      opacity: canDelete && !loading ? 1 : 0.55,
                    }}
                    className="mt-5 rounded-2xl py-4"
                  >
                    <Text
                      style={{ color: canDelete ? "#FFFFFF" : colors.muted }}
                      className="text-center text-base font-extrabold"
                    >
                      {loading ? "Submitting…" : "Request Deletion"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onClose}
                    disabled={loading}
                    style={{ backgroundColor: colors.input }}
                    className="mt-3 rounded-2xl py-4"
                  >
                    <Text
                      style={{ color: colors.text }}
                      className="text-center text-base font-extrabold"
                    >
                      Keep My Account
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Info block (inside modal) ────────────────────────────────────────────────

function InfoBlock({
  title,
  items,
  danger,
}: {
  title: string;
  items: string[];
  danger?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: danger ? colors.dangerSoft : colors.input,
        borderColor: danger ? colors.danger : colors.border,
      }}
      className="mb-4 rounded-2xl border p-4"
    >
      <Text
        style={{ color: danger ? colors.danger : colors.text }}
        className="text-xs font-extrabold uppercase tracking-wider"
      >
        {title}
      </Text>

      <View className="mt-3 gap-2">
        {items.map((item) => (
          <View key={item} className="flex-row gap-2">
            <Text style={{ color: danger ? colors.danger : colors.muted }}>·</Text>
            <Text
              style={{ color: danger ? colors.danger : colors.muted }}
              className="flex-1 text-xs leading-5"
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}