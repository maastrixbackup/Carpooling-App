import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
  Car,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState("rudranarayan.maastrix@gmail.com");
  const [password, setPassword] = useState("AdminPass@123");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.trim().length >= 6;

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    if (password.trim().length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      toast.success("Login successful.");
      router.replace("/(tabs)/home");
    } catch (error: any) {
      toast.error(error?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={Keyboard.dismiss}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 22,
              paddingTop: Platform.OS === "android" ? 28 : 24,
              paddingBottom: Platform.OS === "android" ? 90 : 70,
              flexGrow: 1,
              justifyContent: "center",
            }}
          >
            <View className="items-center">
              <View
                style={{ backgroundColor: colors.primary }}
                className="h-20 w-20 items-center justify-center rounded-[28px]"
              >
                <Car size={38} color="#FFFFFF" />
              </View>

              <Text
                style={{ color: colors.text }}
                className="mt-6 text-center text-4xl font-extrabold"
              >
                Welcome Back
              </Text>

              <Text
                style={{ color: colors.muted }}
                className="mt-2 max-w-[300px] text-center text-sm leading-5"
              >
                Sign in to find rides, publish trips, and manage bookings.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="mt-8 rounded-[34px] border p-5"
            >
              <AuthInput
                icon={<Mail size={19} color={colors.primary} />}
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />

              <AuthInput
                icon={<Lock size={19} color={colors.primary} />}
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry={secure}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                blurOnSubmit
                rightAction={
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSecure((prev) => !prev)}
                    className="h-10 w-10 items-center justify-center"
                  >
                    {secure ? (
                      <EyeOff size={19} color={colors.muted} />
                    ) : (
                      <Eye size={19} color={colors.muted} />
                    )}
                  </TouchableOpacity>
                }
                last
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toast.info("Forgot password will be added soon.")}
                className="mt-3 self-end"
              >
                <Text
                  style={{ color: colors.primary }}
                  className="text-xs font-extrabold"
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={loading || !canSubmit}
                style={{
                  backgroundColor: canSubmit ? colors.primary : colors.muted,
                  opacity: loading ? 0.85 : 1,
                }}
                className="mt-6 h-14 items-center justify-center rounded-2xl"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-extrabold text-white">
                    Login
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="mt-5 flex-row items-start gap-3 rounded-[24px] p-4"
            >
              <ShieldCheck size={20} color={colors.primary} />
              <Text
                style={{ color: colors.text }}
                className="flex-1 text-xs font-semibold leading-5"
              >
                Your account is protected with secure token-based authentication.
              </Text>
            </View>

            <View className="mt-8 flex-row justify-center gap-1">
              <Text style={{ color: colors.muted }} className="font-semibold">
                New here?
              </Text>

              <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                <Text
                  style={{ color: colors.primary }}
                  className="font-extrabold"
                >
                  Create account
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Pressable>
  );
}

function AuthInput({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  rightAction,
  last,
  returnKeyType,
  blurOnSubmit,
  onSubmitEditing,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  rightAction?: React.ReactNode;
  last?: boolean;
  returnKeyType?: "done" | "next" | "go" | "search" | "send";
  blurOnSubmit?: boolean;
  onSubmitEditing?: () => void;
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
        className="h-14 flex-row items-center gap-3 rounded-2xl px-4"
      >
        {icon}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={{ color: colors.text }}
          className="flex-1 text-base font-semibold"
          blurOnSubmit={blurOnSubmit}
        />

        {rightAction}
      </View>
    </View>
  );
}