import {
    getVerificationProfileApi,
    submitAadhaarApi,
    submitBankDetailsApi,
    updateVerificationProfileApi,
} from "@/services/verification.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
    ArrowLeft,
    BadgeCheck,
    Banknote,
    Check,
    ChevronRight,
    IdCard,
    ShieldCheck,
    User,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type StepKey = "profile" | "phone" | "aadhaar" | "bank" | "completed";
type VisibleStepKey = Exclude<StepKey, "phone" | "completed">;

type VerificationProfile = {
  fullName?: string;
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankAccountIfsc?: string;
  bankName?: string;
  aadhaarLast4?: string;
  aadhaarVerified?: boolean;
  bankVerified?: boolean;
  isVerified?: boolean;
  canRedeem?: boolean;
  onboardingStep?: StepKey;
  onboardingCompleted?: boolean;
  nextStep?: StepKey;
};

const steps: { key: VisibleStepKey; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "aadhaar", label: "Aadhaar" },
  { key: "bank", label: "Bank" },
];

function resolveStep(verification?: VerificationProfile | null): StepKey {
  if (!verification) return "profile";

  if (
    verification.onboardingCompleted ||
    verification.canRedeem ||
    verification.nextStep === "completed" ||
    verification.onboardingStep === "completed"
  ) {
    return "completed";
  }

  if (verification.nextStep === "bank" || verification.onboardingStep === "bank") {
    return "bank";
  }

  if (
    verification.nextStep === "aadhaar" ||
    verification.onboardingStep === "aadhaar"
  ) {
    return "aadhaar";
  }

  return "profile";
}

export default function VerificationScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const hydratedRef = useRef(false);

  const [activeStep, setActiveStep] = useState<StepKey>("profile");

  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [address, setAddress] = useState("");

  const [aadhaarNumber, setAadhaarNumber] = useState("");

  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountIfsc, setBankAccountIfsc] = useState("");
  const [bankName, setBankName] = useState("");

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["verification-profile"],
    queryFn: getVerificationProfileApi,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  const verification: VerificationProfile | null =
    data?.data?.verification || null;

  useEffect(() => {
    if (!verification || hydratedRef.current) return;

    setFullName(verification.fullName || "");
    setCity(verification.city || "");
    setStateName(verification.state || "");
    setAddress(verification.address || "");

    setBankAccountHolder(verification.bankAccountHolder || "");
    setBankAccountNumber(verification.bankAccountNumber || "");
    setBankAccountIfsc(verification.bankAccountIfsc || "");
    setBankName(verification.bankName || "");

    setActiveStep(resolveStep(verification));
    hydratedRef.current = true;
  }, [verification]);

  const currentStepIndex = useMemo(() => {
    if (activeStep === "completed") return 3;
    const index = steps.findIndex((item) => item.key === activeStep);
    return index < 0 ? 0 : index;
  }, [activeStep]);


  function profileMutationPending() {
    return profileMutation.isPending;
  }

  function aadhaarMutationPending() {
    return aadhaarMutation.isPending;
  }

  function bankMutationPending() {
    return bankMutation.isPending;
  }

  const profileMutation = useMutation({
    mutationFn: updateVerificationProfileApi,
    onSuccess: async () => {
      toast.success("Profile details saved.");
      setActiveStep("aadhaar");
      await queryClient.invalidateQueries({ queryKey: ["verification-profile"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to save profile.");
    },
  });

  const aadhaarMutation = useMutation({
    mutationFn: submitAadhaarApi,
    onSuccess: async () => {
      toast.success("Aadhaar submitted successfully.");
      setAadhaarNumber("");
      setActiveStep("bank");
      await queryClient.invalidateQueries({ queryKey: ["verification-profile"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to submit Aadhaar.");
    },
  });

  const bankMutation = useMutation({
    mutationFn: submitBankDetailsApi,
    onSuccess: async () => {
      toast.success("Verification completed.");
      setActiveStep("completed");
      await queryClient.invalidateQueries({ queryKey: ["verification-profile"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to submit bank details.");
    },
  });

    const busy =
    isFetching ||
    profileMutationPending() ||
    aadhaarMutationPending() ||
    bankMutationPending();


  const handleProfileSubmit = () => {
    if (!fullName.trim()) return toast.error("Full name is required.");
    if (!city.trim()) return toast.error("City is required.");
    if (!stateName.trim()) return toast.error("State is required.");

    profileMutation.mutate({
      full_name: fullName.trim(),
      city: city.trim(),
      state: stateName.trim(),
      address: address.trim() || null,
    });
  };

  const handleAadhaarSubmit = () => {
    const clean = aadhaarNumber.replace(/\D/g, "");

    if (clean.length !== 12) {
      toast.error("Please enter a valid 12 digit Aadhaar number.");
      return;
    }

    aadhaarMutation.mutate({ aadhaarNumber: clean });
  };

  const handleBankSubmit = () => {
    if (!bankAccountHolder.trim()) {
      return toast.error("Account holder name is required.");
    }

    if (!bankAccountNumber.trim() || bankAccountNumber.length < 9) {
      return toast.error("Please enter a valid account number.");
    }

    const ifsc = bankAccountIfsc.trim().toUpperCase();

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      return toast.error("Please enter a valid IFSC code.");
    }

    if (!bankName.trim()) {
      return toast.error("Bank name is required.");
    }

    bankMutation.mutate({
      bankAccountHolder: bankAccountHolder.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankAccountIfsc: ifsc,
      bankName: bankName.trim(),
    });
  };

  if (isLoading) {
    return (
      <CenterLoading title="Loading verification..." />
    );
  }

  if (isError) {
    return (
      <CenterError onRetry={refetch} />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 80,
          }}
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="h-11 w-11 items-center justify-center rounded-full border"
            >
              <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="rounded-full px-4 py-2"
            >
              <Text
                style={{ color: colors.primary }}
                className="text-xs font-extrabold"
              >
                {activeStep === "completed"
                  ? "Completed"
                  : `Step ${currentStepIndex + 1} of 3`}
              </Text>
            </View>
          </View>

          <View className="mt-7">
            <Text
              style={{ color: colors.text }}
              className="text-3xl font-extrabold"
            >
              Complete Verification
            </Text>

            <Text
              style={{ color: colors.muted }}
              className="mt-2 text-sm leading-5"
            >
              Verify your profile to unlock future rewards and earnings
              redemption.
            </Text>
          </View>

          <ProgressHeader activeStep={activeStep} currentStepIndex={currentStepIndex} />

          {isFetching && (
            <Text style={{ color: colors.muted }} className="mt-3 text-xs">
              Syncing verification status...
            </Text>
          )}

          {activeStep === "profile" && (
            <StepCard
              icon={<User size={24} color={colors.primary} />}
              title="Basic Details"
              subtitle="Tell us who you are. These details will appear on your verified profile."
            >
              <Input
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                editable={!busy}
              />

              <Input
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="Enter city"
                editable={!busy}
              />

              <Input
                label="State"
                value={stateName}
                onChangeText={setStateName}
                placeholder="Enter state"
                editable={!busy}
              />

              <Input
                label="Address"
                value={address}
                onChangeText={setAddress}
                placeholder="Optional"
                multiline
                editable={!busy}
              />

              <PrimaryButton
                label="Continue"
                loading={profileMutation.isPending}
                disabled={busy}
                onPress={handleProfileSubmit}
              />
            </StepCard>
          )}

          {activeStep === "aadhaar" && (
            <StepCard
              icon={<IdCard size={24} color={colors.primary} />}
              title="Aadhaar Verification"
              subtitle="We store only a secure hash and the last 4 digits. Full Aadhaar number is never stored."
            >
              {verification?.aadhaarLast4 && (
                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="rounded-2xl px-4 py-3"
                >
                  <Text
                    style={{ color: colors.primary }}
                    className="font-extrabold"
                  >
                    Aadhaar ending with {verification.aadhaarLast4}
                  </Text>
                </View>
              )}

              <Input
                label="Aadhaar Number"
                value={aadhaarNumber}
                onChangeText={(value) =>
                  setAadhaarNumber(value.replace(/\D/g, "").slice(0, 12))
                }
                placeholder="12 digit Aadhaar number"
                keyboardType="number-pad"
                maxLength={12}
                editable={!busy}
              />

              <Text style={{ color: colors.muted }} className="text-xs leading-5">
                This is currently self-verification for redemption eligibility.
                Provider based verification can be added later.
              </Text>

              <PrimaryButton
                label="Submit Aadhaar"
                loading={aadhaarMutation.isPending}
                disabled={busy}
                onPress={handleAadhaarSubmit}
              />
            </StepCard>
          )}

          {activeStep === "bank" && (
            <StepCard
              icon={<Banknote size={24} color={colors.primary} />}
              title="Bank Details"
              subtitle="Required before redeeming rewards or withdrawing future earnings."
            >
              <Input
                label="Account Holder Name"
                value={bankAccountHolder}
                onChangeText={setBankAccountHolder}
                placeholder="Enter account holder name"
                editable={!busy}
              />

              <Input
                label="Account Number"
                value={bankAccountNumber}
                onChangeText={(value) =>
                  setBankAccountNumber(value.replace(/\D/g, ""))
                }
                placeholder="Enter account number"
                keyboardType="number-pad"
                editable={!busy}
              />

              <Input
                label="IFSC Code"
                value={bankAccountIfsc}
                onChangeText={(value) =>
                  setBankAccountIfsc(value.toUpperCase().slice(0, 11))
                }
                placeholder="Example: SBIN0001234"
                autoCapitalize="characters"
                maxLength={11}
                editable={!busy}
              />

              <Input
                label="Bank Name"
                value={bankName}
                onChangeText={setBankName}
                placeholder="Enter bank name"
                editable={!busy}
              />

              <PrimaryButton
                label="Finish Verification"
                loading={bankMutation.isPending}
                disabled={busy}
                onPress={handleBankSubmit}
              />
            </StepCard>
          )}

          {activeStep === "completed" && (
            <CompletedCard />
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function ProgressHeader({
  activeStep,
  currentStepIndex,
}: {
  activeStep: StepKey;
  currentStepIndex: number;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-6 rounded-[28px] border p-4"
    >
      <View className="flex-row items-center justify-between">
        {steps.map((step, index) => {
          const done = activeStep === "completed" || index < currentStepIndex;
          const active = activeStep === step.key;

          return (
            <View key={step.key} className="flex-1 items-center">
              <View
                style={{
                  backgroundColor: done
                    ? colors.success
                    : active
                      ? colors.primary
                      : colors.input,
                }}
                className="h-9 w-9 items-center justify-center rounded-full"
              >
                {done ? (
                  <Check size={17} color="#FFFFFF" />
                ) : (
                  <Text
                    style={{ color: active ? "#FFFFFF" : colors.muted }}
                    className="text-xs font-extrabold"
                  >
                    {index + 1}
                  </Text>
                )}
              </View>

              <Text
                style={{ color: active ? colors.primary : colors.muted }}
                className="mt-2 text-xs font-bold"
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function StepCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-6 rounded-[32px] border p-5"
    >
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-14 w-14 items-center justify-center rounded-2xl"
      >
        {icon}
      </View>

      <Text style={{ color: colors.text }} className="mt-5 text-2xl font-extrabold">
        {title}
      </Text>

      <Text style={{ color: colors.muted }} className="mt-2 text-sm leading-5">
        {subtitle}
      </Text>

      <View className="mt-6 gap-4">{children}</View>
    </View>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  multiline,
  autoCapitalize,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
  maxLength?: number;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View>
      <Text style={{ color: colors.muted }} className="mb-2 text-xs font-bold uppercase">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        editable={editable}
        autoCapitalize={autoCapitalize}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          color: colors.text,
          backgroundColor: colors.input,
          minHeight: multiline ? 96 : 52,
          opacity: editable ? 1 : 0.65,
        }}
        className="rounded-2xl px-4 py-3 text-base font-semibold"
      />
    </View>
  );
}

function PrimaryButton({
  label,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={loading || disabled}
      onPress={onPress}
      style={{
        backgroundColor: colors.primary,
        opacity: loading || disabled ? 0.7 : 1,
      }}
      className="mt-2 flex-row items-center justify-center gap-2 rounded-2xl py-4"
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text className="font-extrabold text-white">{label}</Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </>
      )}
    </TouchableOpacity>
  );
}

function CompletedCard() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-6 items-center rounded-[32px] border p-7"
    >
      <View
        style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
        className="h-20 w-20 items-center justify-center rounded-full"
      >
        <BadgeCheck size={42} color={colors.success} />
      </View>

      <Text
        style={{ color: colors.text }}
        className="mt-5 text-center text-2xl font-extrabold"
      >
        Verification Completed
      </Text>

      <Text
        style={{ color: colors.muted }}
        className="mt-2 text-center text-sm leading-5"
      >
        Your account is ready for future rewards and earnings redemption.
      </Text>

      <View style={{ backgroundColor: colors.input }} className="mt-6 w-full rounded-2xl p-4">
        <StatusLine label="Profile" done />
        <StatusLine label="Aadhaar" done />
        <StatusLine label="Bank Details" done />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.back()}
        style={{ backgroundColor: colors.primary }}
        className="mt-6 w-full rounded-2xl py-4"
      >
        <Text className="text-center font-extrabold text-white">Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatusLine({ label, done }: { label: string; done: boolean }) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center justify-between py-2">
      <Text style={{ color: colors.text }} className="font-bold">
        {label}
      </Text>

      <View className="flex-row items-center gap-2">
        <ShieldCheck size={16} color={done ? colors.success : colors.muted} />
        <Text
          style={{ color: done ? colors.success : colors.muted }}
          className="text-xs font-extrabold"
        >
          {done ? "Done" : "Pending"}
        </Text>
      </View>
    </View>
  );
}

function CenterLoading({ title }: { title: string }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg }}
      className="items-center justify-center px-6"
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 font-bold">
        {title}
      </Text>
    </View>
  );
}

function CenterError({ onRetry }: { onRetry: () => void }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg }}
      className="items-center justify-center px-6"
    >
      <Text style={{ color: colors.text }} className="text-xl font-extrabold">
        Unable to load verification
      </Text>

      <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
        Please check your connection and try again.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onRetry}
        style={{ backgroundColor: colors.primary }}
        className="mt-5 rounded-2xl px-6 py-3"
      >
        <Text className="font-extrabold text-white">Retry</Text>
      </TouchableOpacity>
    </View>
  );
}