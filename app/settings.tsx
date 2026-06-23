import { useAuth } from "@/context/AuthContext";
import { cancelDeleteAccountApi, getDeleteRequestApi, requestDeleteAccountApi } from "@/services/user.service";
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
  X
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const { data: deleteRequestData } = useQuery({
    queryKey: ["account-delete-request"],
    queryFn: getDeleteRequestApi,
  });

  const deletionRequest = deleteRequestData?.data?.deletionRequest;
  const hasDeletionRequest = Boolean(deletionRequest);

  const requestDeleteMutation = useMutation({
    mutationFn: requestDeleteAccountApi,
    onSuccess: async () => {
      toast.success("Account deletion requested successfully.");
      setDeleteModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: ["account-delete-request"] });

      // recommended
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
      toast.success("Account deletion request cancelled.");
      await queryClient.invalidateQueries({ queryKey: ["account-delete-request"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to cancel request.");
    },
  });

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
          <Header title="Settings" subtitle="Preferences and account controls" />

          <View
            style={{ backgroundColor: colors.primary }}
            className="mt-6 overflow-hidden rounded-[34px] p-6"
          >
            <View className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <Text className="text-sm font-bold text-blue-100">Car Pooling</Text>
            <Text className="mt-3 text-3xl font-extrabold text-white">
              Make the app yours
            </Text>
            <Text className="mt-2 text-sm leading-5 text-blue-100">
              Manage theme, alerts, privacy, and travel preferences.
            </Text>
          </View>

          <Section title="Preferences">
            <SettingRow
              icon={isDark ? <Sun size={20} color="#FACC15" /> : <Moon size={20} color={colors.primary} />}
              title={isDark ? "Dark Mode" : "Light Mode"}
              subtitle="Switch app appearance"
              right={<Switch value={isDark} onValueChange={toggleTheme} />}
            />

            <SettingRow
              icon={<Globe2 size={20} color={colors.primary} />}
              title="Language"
              subtitle="English"
            />

            <SettingRow
              icon={<MapPin size={20} color={colors.primary} />}
              title="Default Location"
              subtitle="Use current city for nearby rides"
            />
          </Section>



          <Section title="Account & Safety">

            <SettingRow
              icon={<ShieldCheck size={20} color={colors.success} />}
              title="Safety & Verification"
              subtitle="ID checks and trusted ride settings"
            />

            <SettingRow
              icon={<Lock size={20} color={colors.primary} />}
              title="Privacy"
              subtitle="Control visibility and data preferences"
              onPress={() => router.push("/privacy-policy" as any)}
            />

            <SettingRow
              icon={<FileText size={20} color={colors.primary} />}
              title="Terms & Conditions"
              subtitle="Rules for using Car Pooling"
              onPress={() => router.push("/terms-conditions" as any)}
            />

            <SettingRow
              icon={<Info size={20} color={colors.primary} />}
              title="About App"
              subtitle="Version, developer, and product details"
              onPress={() => router.push("/about" as any)}
            />

            <SettingRow
              icon={<Trash2 size={20} color={hasDeletionRequest ? "#F59E0B" : colors.danger} />}
              title={hasDeletionRequest ? "Deletion Scheduled" : "Delete Account"}
              subtitle={
                hasDeletionRequest
                  ? `Scheduled on ${formatDate(deletionRequest?.scheduledDeleteAt)}`
                  : "Request account deletion after 15 days"
              }
              onPress={() => setDeleteModalVisible(true)}
              last
            />
          </Section>
          <View
            style={{
              borderTopColor: colors.border,
              borderTopWidth: 1,
            }}
            className="mt-8 pt-5 items-center"
          >
            <Text
              style={{ color: colors.muted }}
              className="text-xs"
            >
              CarPooling v1.0.0
            </Text>

            <Text
              style={{ color: colors.muted }}
              className="mt-1 text-[11px]"
            >
              Effective Date: 22 June 2026
            </Text>

            <Text
              style={{ color: colors.muted }}
              className="mt-1 text-[11px]"
            >
              © 2026 CarPooling. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <DeleteAccountModal
        visible={deleteModalVisible}
        deletionRequest={deletionRequest}
        loading={requestDeleteMutation.isPending || cancelDeleteMutation.isPending}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={() => requestDeleteMutation.mutate()}
        onCancelRequest={() => cancelDeleteMutation.mutate()}
      />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-7">
      <Text style={{ color: colors.text }} className="mb-3 text-lg font-extrabold">
        {title}
      </Text>

      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="rounded-[30px] border p-2"
      >
        {children}
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.8}
      style={{ borderBottomColor: last ? "transparent" : colors.border }}
      className="flex-row items-center gap-3 border-b px-3 py-4"
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

      {right ?? <ChevronRight size={19} color={colors.muted} />}
    </TouchableOpacity>
  );
}


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
  const modalMaxHeight = Math.min(height * 0.86, 720);
  const modalWidth = Math.min(width - 32, 520);

  useEffect(() => {
    if (!visible) setConfirmText("");
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
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
                  style={{
                    backgroundColor: hasRequest ? "rgba(245,158,11,0.14)" : colors.dangerSoft,
                    height: 52,
                    width: 52,
                  }}
                  className="items-center justify-center rounded-2xl"
                >
                  <AlertTriangle size={26} color={hasRequest ? "#F59E0B" : colors.danger} />
                </View>

                <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={{ backgroundColor: colors.input }} className="h-10 w-10 items-center justify-center rounded-full">
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.text }} className="mt-5 text-2xl font-extrabold">
                {hasRequest ? "Deletion Scheduled" : "Delete Account Request"}
              </Text>

              <Text style={{ color: colors.muted }} className="mt-2 text-sm leading-6">
                {hasRequest
                  ? `Your account is scheduled for deletion on ${formatDate(deletionRequest?.scheduledDeleteAt)}. You can cancel this request before it is processed.`
                  : "Your account will be scheduled for deletion after 15 days. You can contact support during this period if the request was made by mistake."}
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
                  <DeleteInfoCard
                    title="Current Status"
                    items={[
                      `Status: ${deletionRequest?.status || "pending"}`,
                      `Requested on: ${formatDate(deletionRequest?.requestedAt)}`,
                      `Scheduled deletion: ${formatDate(deletionRequest?.scheduledDeleteAt)}`,
                    ]}
                  />

                  <DeleteInfoCard
                    title="Cancel Request"
                    items={[
                      "Your account will remain active after cancellation.",
                      "Your profile, rides, bookings, rewards, and messages will remain available.",
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
                      {loading ? "Cancelling..." : "Cancel Deletion Request"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.85} onPress={onClose} className="mt-3 rounded-2xl py-4" style={{ backgroundColor: colors.input }}>
                    <Text style={{ color: colors.text }} className="text-center text-base font-extrabold">
                      Close
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <DeleteInfoCard
                    title="What will be deleted"
                    items={[
                      "Your profile information",
                      "Login access to the app",
                      "Saved preferences and notification tokens",
                      "Personal account data not required for legal or safety records",
                    ]}
                  />

                  <DeleteInfoCard
                    title="What may remain"
                    danger
                    items={[
                      "Completed ride history for safety, dispute, fraud prevention, and company policy",
                      "Payment, reward, and transaction records where legally required",
                      "Reports, complaints, or support records linked to platform safety",
                      "Anonymized analytics that no longer directly identify you",
                    ]}
                  />

                  <DeleteInfoCard
                    title="Important"
                    items={[
                      "You will be logged out after submitting the request",
                      "You may lose access to rewards, bookings, messages, and vehicles",
                      "This action is not immediate. The deletion process starts after the 15-day waiting period",
                    ]}
                  />

                  <View className="mt-2">
                    <Text style={{ color: colors.text }} className="mb-2 font-extrabold">
                      Type DELETE to continue
                    </Text>

                    <TextInput
                      value={confirmText}
                      onChangeText={setConfirmText}
                      placeholder="Type DELETE"
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
                      opacity: canDelete && !loading ? 1 : 0.6,
                    }}
                    className="mt-5 rounded-2xl py-4"
                  >
                    <Text className="text-center text-base font-extrabold" style={{ color: canDelete ? "#FFFFFF" : colors.muted }}>
                      {loading ? "Submitting..." : "Request Account Deletion"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.85} onPress={onClose} disabled={loading} className="mt-3 rounded-2xl py-4" style={{ backgroundColor: colors.input }}>
                    <Text style={{ color: colors.text }} className="text-center text-base font-extrabold">
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

function DeleteInfoCard({
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
        className="font-extrabold"
      >
        {title}
      </Text>

      <View className="mt-3 gap-2">
        {items.map((item) => (
          <View key={item} className="flex-row gap-2">
            <Text style={{ color: danger ? colors.danger : colors.muted }}>
              •
            </Text>
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

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}