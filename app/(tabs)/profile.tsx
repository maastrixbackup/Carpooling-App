import { useConfirm } from "@/components/common/ConfirmProvider";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
  Bell,
  Car,
  ChevronRight,
  CreditCard,
  Gift,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Star,
  X
} from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { user, logout } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const confirm = useConfirm();

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

            <View className="flex-row items-center gap-4">
              <View
                style={{ backgroundColor: colors.primary }}
                className="h-20 w-20 items-center justify-center rounded-full"
              >
                <Text className="text-3xl font-extrabold text-white">R</Text>
              </View>

              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-2xl font-extrabold">
                  Rudranarayan
                </Text>

                <Text style={{ color: colors.muted }} className="mt-1 text-sm">
                  Passenger / Driver
                </Text>

                <View className="mt-3 flex-row flex-wrap items-center gap-2">
                  <View className="flex-row items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1">
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={{ color: colors.text }} className="text-xs font-bold">
                      4.8
                    </Text>
                  </View>

                  <View style={{ backgroundColor: "rgba(34,197,94,0.14)" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: colors.success }} className="text-xs font-bold">
                      Verified
                    </Text>
                  </View>
                </View>
              </View>

              <ChevronRight size={20} color={colors.muted} />
            </View>
          </TouchableOpacity>

          <View className="mt-5 flex-row gap-3">
            <StatCard label="Trips" value="24" />
            <StatCard label="Saved" value="₹3.2k" />
            <StatCard label="Rating" value="4.8" />
          </View>

          <Section title="Rewards">
            <MenuItem
              icon={<Gift size={20} color={colors.primary} />}
              title="Rewards"
              subtitle="Points, badges, and referral benefits"
              onPress={() => router.push("/rewards")}
              last
            />
          </Section>

          <Section title="Account">
            <MenuItem
              icon={<Car size={20} color={colors.primary} />}
              title="My Vehicles"
              subtitle="Manage cars used for rides"
              onPress={() => router.push("/vehicles")}
            />

            <MenuItem
              icon={<ShieldCheck size={20} color={colors.success} />}
              title="Verification"
              subtitle="ID, phone, and safety checks"
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

function ProfileModal({
  visible,
  onClose,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  user: any;
}) {
  const { colors } = useAppTheme();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing details", "Name and phone number are required.");
      return;
    }

    Alert.alert("Profile Updated", "Your profile details have been saved.");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="max-h-[88%] rounded-t-[34px] border px-5 pb-8 pt-5"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.text }} className="text-xl font-extrabold">
                Edit Profile
              </Text>
              <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                Update your personal information
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: colors.input }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 24 }}
          >
            <View className="items-center">
              <View
                style={{ backgroundColor: colors.primary }}
                className="h-24 w-24 items-center justify-center rounded-full"
              >
                <Text className="text-4xl font-extrabold text-white">R</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={{ backgroundColor: colors.primarySoft }}
                className="mt-4 rounded-full px-4 py-2"
              >
                <Text style={{ color: colors.primary }} className="text-xs font-extrabold">
                  Change Photo
                </Text>
              </TouchableOpacity>
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
              onPress={handleSave}
              style={{ backgroundColor: colors.primary }}
              className="mt-7 rounded-2xl py-4"
            >
              <Text className="text-center text-base font-extrabold text-white">
                Save Changes
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProfileInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
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
        style={{ backgroundColor: colors.input }}
        className="rounded-2xl px-4 py-3"
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{ color: colors.text }}
          className="text-base font-semibold"
        />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-7">
      <Text style={{ color: colors.muted }} className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wider">
        {title}
      </Text>

      <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="overflow-hidden rounded-[26px] border">
        {children}
      </View>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-1 rounded-[24px] border p-4">
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
      <View style={{ backgroundColor: colors.primarySoft }} className="h-10 w-10 items-center justify-center rounded-xl">
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

      <ChevronRight size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}