import { useConfirm } from "@/components/common/ConfirmProvider";
import { useAuth } from "@/context/AuthContext";
import { getMeApi } from "@/services/user.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import {
  Bell,
  Car,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  MessageCircle,
  Route,
  Settings,
  ShieldCheck,
  Star,
  Trophy,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { logout, isAuthenticated } = useAuth();
  const confirm = useConfirm();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: getMeApi,
    enabled: isAuthenticated,
  });

  const user = data?.data?.user;

  const displayName = user?.full_name || user?.name || "User";
  const email = user?.email || "";
  const phone = user?.phone || "";

  const verification = useMemo(() => getVerificationMeta(user), [user]);

  const rating = user?.rating ? Number(user.rating).toFixed(1) : "N/A";
  const totalRides = String(user?.total_rides || 0);
  const savedAmount = user?.saved_amount
    ? `₹${Number(user.saved_amount).toFixed(1)}`
    : "₹0";

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Logout?",
      message: "You will need to login again to access your rides and bookings.",
      confirmText: "Logout",
      cancelText: "Stay",
      danger: true,
      iconType: "danger",
    });

    if (!ok) return;

    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Logged out successfully");
      router.replace("/(auth)/login");
    } catch (error: any) {
      toast.error(error?.message || "Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 120,
          }}
        >
          <View>
            <Text style={{ color: colors.muted }} className="text-sm font-semibold">
              Account
            </Text>
            <Text style={{ color: colors.text }} className="mt-1 text-3xl font-extrabold">
              Profile
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setProfileModalVisible(true)}
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="mt-6 overflow-hidden rounded-[34px] border p-5"
          >
            <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/10" />

            {isLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
                  Loading profile...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-4">
                <View
                  style={{ backgroundColor: colors.primary }}
                  className="h-20 w-20 items-center justify-center rounded-full"
                >
                  <Text className="text-3xl font-extrabold text-white">
                    {getInitial(displayName)}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text
                    style={{ color: colors.text }}
                    className="text-2xl font-extrabold"
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>

                  <Text
                    style={{ color: colors.muted }}
                    className="mt-1 text-sm font-semibold"
                    numberOfLines={1}
                  >
                    {email || phone || "No contact added"}
                  </Text>

                  <View className="mt-3 flex-row flex-wrap items-center gap-2">
                    <View className="flex-row items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1">
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text style={{ color: colors.text }} className="text-xs font-bold">
                        {user?.rating ? Number(user.rating).toFixed(1) : "No rating"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => router.push("/verification" as any)}
                      style={{
                        backgroundColor: verification.bg,
                      }}
                      className="flex-row items-center gap-1 rounded-full px-3 py-1"
                    >
                      <ShieldCheck size={12} color={verification.color} />
                      <Text style={{ color: verification.color }} className="text-xs font-bold">
                        {verification.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ChevronRight size={20} color={colors.muted} />
              </View>
            )}
          </TouchableOpacity>

          <View className="mt-5 flex-row gap-3">
            <StatCard label="Trips" value={totalRides} />
            <StatCard label="Saved" value={savedAmount} />
            <StatCard label="Rating" value={rating} />
          </View>

          {!verification.completed && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/verification" as any)}
              style={{
                backgroundColor: colors.primarySoft,
                borderColor: colors.border,
              }}
              className="mt-5 rounded-[24px] border p-4"
            >
              <View className="flex-row items-center gap-3">
                <ShieldCheck size={22} color={colors.primary} />

                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="font-extrabold">
                    Complete verification
                  </Text>
                  <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                    Required before redeeming rewards and earnings.
                  </Text>
                </View>

                <ChevronRight size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>
          )}

          <View className="pt-4">
            <MenuItem
              icon={<Route size={20} color={colors.primary} />}
              title="My Published Rides"
              subtitle="Manage rides and passenger bookings"
              onPress={() => router.push("/my-pub-rides")}
              last
            />
          </View>

          <Section title="Account">
            <MenuItem
              icon={<MessageCircle size={20} color={colors.primary} />}
              title="Messages"
              subtitle="Chat with drivers and passengers"
              onPress={() => router.push("/messages" as any)}
              last
            />

            <MenuItem
              icon={<Car size={20} color={colors.primary} />}
              title="My Vehicles"
              subtitle="Manage cars used for rides"
              onPress={() => router.push("/vehicles")}
            />

            <MenuItem
              icon={<Trophy size={20} color={colors.primary} />}
              title="Rewards"
              subtitle="Points and achievements"
              onPress={() => router.push("/rewards")}
              last
            />
          </Section>

          <Section title="Preferences">
            <MenuItem
              icon={<Bell size={20} color={colors.primary} />}
              title="Notifications"
              subtitle="Ride alerts and booking updates"
              onPress={() => router.push("/notifications")}
            />

            <MenuItem
              icon={<Settings size={20} color={colors.primary} />}
              title="Settings"
              subtitle="Theme, privacy, and app preferences"
              onPress={() => router.push("/settings")}
            />

            <MenuItem
              icon={<CreditCard size={20} color={colors.primary} />}
              title="Payments"
              subtitle="Wallet, cards, and payment history"
              onPress={() => router.push("/payments")}
              last
            />
          </Section>

          <Section title="Support">
            <MenuItem
              icon={<HelpCircle size={20} color={colors.primary} />}
              title="Help & Support"
              subtitle="Get help with rides and bookings"
              onPress={() => router.push("/help-support" as any)}
              last
            />
          </Section>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isLoggingOut}
            style={{
              backgroundColor: colors.dangerSoft,
              opacity: isLoggingOut ? 0.7 : 1,
            }}
            className="mt-6 flex-row items-center justify-center gap-2 rounded-[22px] py-4"
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.danger} />
            <Text style={{ color: colors.danger }} className="font-extrabold">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>

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



        <ProfileModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          user={user}
        />
      </SafeAreaView>
    </View>
  );
}

function getVerificationMeta(user: any) {
  const isApproved =
    user?.is_verified === true ||
    user?.verification_status === "approved" ||
    user?.onboarding_completed === true;

  const isRejected = user?.verification_status === "rejected";
  const canRedeem = user?.can_redeem === true;

  if (isApproved) {
    return {
      completed: true,
      canRedeem,
      label: "Verified",
      bg: "rgba(34,197,94,0.14)",
      color: "#22C55E",
    };
  }

  if (isRejected) {
    return {
      completed: false,
      canRedeem: false,
      label: "Rejected",
      bg: "rgba(239,68,68,0.14)",
      color: "#EF4444",
    };
  }

  return {
    completed: false,
    canRedeem: false,
    label: "Verify Now",
    bg: "rgba(239,68,68,0.14)",
    color: "#EF4444",
  };
}

function ProfileModal({
  visible,
  onClose,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  user: any;
}) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const modalWidth = Math.min(width - 32, 520);
  const modalMaxHeight = Math.min(height * 0.86, 720);

  const originalName = user?.full_name || user?.name || "";
  const originalPhone = user?.phone || "";
  const originalEmail = user?.email || "";

  const hasChanges =
    name.trim() !== originalName ||
    phone.trim() !== originalPhone ||
    email.trim() !== originalEmail;

  useEffect(() => {
    if (visible) {
      setName(originalName);
      setPhone(originalPhone);
      setEmail(originalEmail);
    }
  }, [visible, originalName, originalPhone, originalEmail]);

  const handleClose = () => {
    setName(originalName);
    setPhone(originalPhone);
    setEmail(originalEmail);
    onClose();
  };

  const handleSave = () => {
    // Later integrate update profile API here.
    // Payload:
    // { full_name: name.trim(), phone: phone.trim(), email: email.trim() }
    toast.success("Profile changes are ready to save.");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 35 : 18}
        tint={isDark ? "dark" : "light"}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 items-center justify-center bg-black/45 px-4">
            <View
              style={{
                width: modalWidth,
                maxHeight: modalMaxHeight,
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 18),
              }}
              className="overflow-hidden rounded-[30px] border"
            >
              <View
                style={{ borderBottomColor: colors.border }}
                className="flex-row items-center justify-between border-b px-5 py-5"
              >
                <View className="flex-1 pr-3">
                  <Text
                    style={{ color: colors.text }}
                    className="text-xl font-extrabold"
                  >
                    Edit Profile
                  </Text>
                  <Text
                    style={{ color: colors.muted }}
                    className="mt-1 text-xs"
                  >
                    Update your personal information
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleClose}
                  style={{ backgroundColor: colors.input }}
                  className="h-10 w-10 items-center justify-center rounded-full"
                >
                  <X size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 24,
                  paddingBottom: 20,
                }}
              >
                <View className="items-center">
                  <View
                    style={{ backgroundColor: colors.primary }}
                    className="h-24 w-24 items-center justify-center rounded-full"
                  >
                    <Text className="text-4xl font-extrabold text-white">
                      {getInitial(name)}
                    </Text>
                  </View>

                  <Text
                    style={{ color: colors.text }}
                    className="mt-4 text-lg font-extrabold"
                    numberOfLines={1}
                  >
                    {name || "User"}
                  </Text>

                  <Text
                    style={{ color: colors.muted }}
                    className="mt-1 text-xs font-semibold"
                    numberOfLines={1}
                  >
                    {email || phone || "No contact available"}
                  </Text>
                </View>

                <View className="mt-7">
                  <ProfileInput
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter full name"
                  />

                  <ProfileInput
                    label="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />

                  <ProfileInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    last
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!hasChanges}
                  onPress={handleSave}
                  style={{
                    backgroundColor: hasChanges ? colors.primary : colors.input,
                    opacity: hasChanges ? 1 : 0.65,
                  }}
                  className="mt-7 rounded-2xl py-4"
                >
                  <Text
                    style={{ color: hasChanges ? "#FFFFFF" : colors.muted }}
                    className="text-center text-base font-extrabold"
                  >
                    Save Changes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleClose}
                  style={{ backgroundColor: colors.input }}
                  className="mt-3 rounded-2xl py-4"
                >
                  <Text
                    style={{ color: colors.text }}
                    className="text-center text-base font-extrabold"
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

function ProfileInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  last,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View className={last ? "" : "mb-4"}>
      <Text
        style={{ color: colors.muted }}
        className="mb-2 text-xs font-bold uppercase"
      >
        {label}
      </Text>

      <View
        style={{
          backgroundColor: colors.input,
          borderColor: colors.border,
        }}
        className="rounded-2xl border px-4 py-3"
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={{ color: colors.text }}
          className="text-base font-semibold"
        />
      </View>
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

function StatCard({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="flex-1 rounded-[24px] border p-4"
    >
      <Text style={{ color: colors.text }} className="text-center text-xl font-extrabold">
        {value}
      </Text>
      <Text style={{ color: colors.muted }} className="mt-1 text-center text-xs">
        {label}
      </Text>
    </View>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  last,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  last?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      disabled={!onPress}
      activeOpacity={0.75}
      onPress={onPress}
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

      {onPress && <ChevronRight size={18} color={colors.muted} />}
    </TouchableOpacity>
  );
}

function getInitial(name?: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "U";
}