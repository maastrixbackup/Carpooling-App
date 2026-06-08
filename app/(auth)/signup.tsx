import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
  Car,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
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

export default function SignupScreen() {
  const { colors } = useAppTheme();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    name.trim().length > 1 &&
    phone.trim().length >= 8 &&
    email.trim().includes("@") &&
    password.trim().length >= 6 &&
    accepted;

  const handleSignup = async () => {
    Keyboard.dismiss();

    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    if (phone.trim().length < 8) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    if (!email.trim().includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (password.trim().length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (!accepted) {
      toast.error("Please accept Terms & Privacy Policy.");
      return;
    }

    try {
      setLoading(true);

      await signup({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      toast.success("Account created successfully.");
      router.replace("/(tabs)/home");
    } catch (error: any) {
      toast.error(error?.message || "Unable to create account.");
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
              paddingTop: Platform.OS === "android" ? 18 : 20,
              paddingBottom: 40,
              flexGrow: 1,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.back()}
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
              className="h-11 w-11 items-center justify-center rounded-full border"
            >
              <Text style={{ color: colors.text }} className="text-2xl font-bold">
                ‹
              </Text>
            </TouchableOpacity>

            <View className="mt-7">
              <View
                style={{ backgroundColor: colors.primary }}
                className="h-16 w-16 items-center justify-center rounded-[24px]"
              >
                <Car size={32} color="#FFFFFF" />
              </View>

              <Text
                style={{ color: colors.text }}
                className="mt-6 text-4xl font-extrabold"
              >
                Create Account
              </Text>

              <Text style={{ color: colors.muted }} className="mt-2 text-sm leading-5">
                Join as passenger, driver, or both.
              </Text>
            </View>

            <View
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
              className="mt-8 rounded-[34px] border p-5"
            >
              <AuthInput
                icon={<User size={19} color={colors.primary} />}
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                textContentType="name"
                autoComplete="name"
                returnKeyType="next"
              />

              <AuthInput
                icon={<Phone size={19} color={colors.primary} />}
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                returnKeyType="next"
              />

              <AuthInput
                icon={<Mail size={19} color={colors.primary} />}
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
              />

              <AuthInput
                icon={<Lock size={19} color={colors.primary} />}
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create password"
                secureTextEntry={secure}
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
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
                activeOpacity={0.85}
                onPress={() => setAccepted((prev) => !prev)}
                className="mt-5 flex-row items-start gap-3"
              >
                <View
                  style={{
                    backgroundColor: accepted ? colors.primary : colors.input,
                    borderColor: accepted ? colors.primary : colors.border,
                  }}
                  className="h-6 w-6 items-center justify-center rounded-lg border"
                >
                  {accepted && <Check size={15} color="#FFFFFF" />}
                </View>

                <View className="flex-1 flex-row flex-wrap">
                  <Text
                    style={{ color: colors.muted }}
                    className="text-xs font-semibold leading-5"
                  >
                    I agree to the{" "}
                  </Text>

                  <TouchableOpacity onPress={() => router.push("/terms-conditions")}>
                    <Text
                      style={{ color: colors.primary }}
                      className="text-xs font-extrabold leading-5"
                    >
                      Terms
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{ color: colors.muted }}
                    className="text-xs font-semibold leading-5"
                  >
                    ,{" "}
                  </Text>

                  <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
                    <Text
                      style={{ color: colors.primary }}
                      className="text-xs font-extrabold leading-5"
                    >
                      Privacy Policy
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{ color: colors.muted }}
                    className="text-xs font-semibold leading-5"
                  >
                    , and ride safety guidelines.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignup}
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
                    Create Account
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
                Your profile helps build trust between passengers and drivers.
              </Text>
            </View>

            <View className="mt-auto flex-row justify-center gap-1 pt-8">
              <Text style={{ color: colors.muted }} className="font-semibold">
                Already have an account?
              </Text>

              <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                <Text style={{ color: colors.primary }} className="font-extrabold">
                  Login
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
  onSubmitEditing,
  textContentType,
  autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  rightAction?: React.ReactNode;
  last?: boolean;
  returnKeyType?: "done" | "next" | "go" | "search" | "send";
  onSubmitEditing?: () => void;
  textContentType?: "name" | "telephoneNumber" | "emailAddress" | "password";
  autoComplete?: "name" | "tel" | "email" | "password";
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
          autoCorrect={false}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType={textContentType}
          autoComplete={autoComplete}
          style={{ color: colors.text }}
          className="flex-1 text-base font-semibold"
        />

        {rightAction}
      </View>
    </View>
  );
}