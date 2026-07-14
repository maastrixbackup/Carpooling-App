import { useAppTheme } from "@/theme/ThemeProvider";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import {
  BadgeCheck,
  Car,
  FileText,
  Hash,
  Palette,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

// ─── AppInput ────────────────────────────────────────────────────────────────

function AppInput({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-4">
      <Text
        style={{ color: colors.muted }}
        className="mb-2 text-xs font-bold uppercase tracking-wider"
      >
        {label}
      </Text>
      <View
        style={{ backgroundColor: colors.input, borderColor: colors.border }}
        className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border px-4 py-3"
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
          style={{ color: colors.text, flex: 1 }}
          className="text-base font-semibold"
        />
      </View>
    </View>
  );
}

// ─── SeatSelector ─────────────────────────────────────────────────────────────

function SeatSelector({
  seats,
  setSeats,
}: {
  seats: string;
  setSeats: (v: string) => void;
}) {
  const { colors } = useAppTheme();
  const n = Math.max(1, Number(seats || 1));

  return (
    <View className="mb-4">
      <Text
        style={{ color: colors.muted }}
        className="mb-2 text-xs font-bold uppercase tracking-wider"
      >
        Seats
      </Text>
      <View
        style={{ backgroundColor: colors.input, borderColor: colors.border }}
        className="min-h-[52px] flex-row items-center justify-between rounded-2xl border px-3"
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSeats(String(Math.max(1, n - 1)))}
          style={{ backgroundColor: colors.card }}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <Text style={{ color: colors.text }} className="text-xl font-extrabold">
            −
          </Text>
        </TouchableOpacity>

        <View className="items-center">
          <Text style={{ color: colors.text }} className="text-lg font-extrabold">
            {n}
          </Text>
          <Text style={{ color: colors.muted }} className="text-[10px] font-bold">
            seats
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSeats(String(Math.min(8, n + 1)))}
          style={{ backgroundColor: colors.primary }}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <Text className="text-xl font-extrabold text-white">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── UploadCard ───────────────────────────────────────────────────────────────

function UploadCard({
  title,
  subtitle,
  file,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  file: DocumentPicker.DocumentPickerAsset | null;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const uploaded = !!file;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        backgroundColor: uploaded ? colors.primarySoft : colors.input,
        borderColor: uploaded ? colors.primary : colors.border,
      }}
      className="flex-1 rounded-[22px] border border-dashed p-4"
    >
      <View
        style={{ backgroundColor: colors.card }}
        className="h-11 w-11 items-center justify-center rounded-xl"
      >
        {uploaded ? <BadgeCheck size={20} color={colors.success} /> : icon}
      </View>

      <Text style={{ color: colors.text }} className="mt-3 text-sm font-extrabold">
        {title}
      </Text>

      <Text
        style={{ color: colors.muted }}
        className="mt-1 text-xs leading-4"
        numberOfLines={2}
      >
        {uploaded ? file?.name || "Uploaded" : subtitle}
      </Text>

      <Text
        style={{ color: uploaded ? colors.success : colors.primary }}
        className="mt-3 text-xs font-bold"
      >
        {uploaded ? "✓ Uploaded" : "Tap to upload"}
      </Text>
    </TouchableOpacity>
  );
}

// ─── AddVehicleModal (main export) ───────────────────────────────────────────

export function AddVehicleModal({
  visible,
  onClose,
  loading,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");
  const [rcFile, setRcFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [vehiclePhoto, setVehiclePhoto] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const canSubmit = useMemo(
    () =>
      brand.trim().length > 0 &&
      model.trim().length > 0 &&
      registrationNumber.trim().length > 0 &&
      Number(seats) > 0 &&
      !!rcFile &&
      !!vehiclePhoto,
    [brand, model, registrationNumber, seats, rcFile, vehiclePhoto],
  );

  const resetForm = () => {
    setBrand("");
    setModel("");
    setRegistrationNumber("");
    setColor("");
    setSeats("4");
    setRcFile(null);
    setVehiclePhoto(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickFile = async (
    type: string[],
    setter: (f: DocumentPicker.DocumentPickerAsset) => void,
    errorLabel: string,
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type,
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) {
        toast.error(`${errorLabel} must be under 5 MB.`);
        return;
      }
      setter(file);
    } catch {
      toast.error(`Unable to select ${errorLabel.toLowerCase()}.`);
    }
  };

  const handleSubmit = () => {
    if (!brand.trim()) return toast.error("Brand is required.");
    if (!model.trim()) return toast.error("Model is required.");
    if (!registrationNumber.trim()) return toast.error("Vehicle number is required.");
    if (!Number(seats) || Number(seats) < 1) return toast.error("Enter valid seat count.");
    if (!rcFile) return toast.error("Please upload the RC document.");
    if (!vehiclePhoto) return toast.error("Please upload a vehicle photo.");

    const formData = new FormData();
    formData.append("vehicle_type", "car");
    formData.append("brand", brand.trim());
    formData.append("model", model.trim());
    formData.append("registration_number", registrationNumber.trim().toUpperCase());
    formData.append("rc_number", registrationNumber.trim().toUpperCase());
    formData.append("color", color.trim() || "");
    formData.append("seats", String(Number(seats)));
    formData.append("available_seats", String(Number(seats)));
    formData.append("rc_document", {
      uri: rcFile.uri,
      name: rcFile.name || "vehicle-rc",
      type: rcFile.mimeType || "application/octet-stream",
    } as any);
    formData.append("vehicle_photo", {
      uri: vehiclePhoto.uri,
      name: vehiclePhoto.name || "vehicle-photo.jpg",
      type: vehiclePhoto.mimeType || "image/jpeg",
    } as any);

    onSubmit(formData);
  };

  // Reset form on successful close (called from parent via onSuccess)
  const handleSuccessClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 30 : 15}
        tint={isDark ? "dark" : "light"}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end">
            {/* Tap outside to close */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleClose}
              className="flex-1"
            />

            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 20),
                maxHeight: "92%",
              }}
              className="overflow-hidden rounded-t-[36px] border-t border-l border-r"
            >
              {/* Handle bar */}
              <View className="items-center pt-3 pb-1">
                <View
                  style={{ backgroundColor: colors.border }}
                  className="h-1 w-10 rounded-full"
                />
              </View>

              {/* Header */}
              <View
                style={{ borderBottomColor: colors.border }}
                className="flex-row items-center justify-between border-b px-5 py-4"
              >
                <View className="flex-1 pr-3">
                  <Text
                    style={{ color: colors.text }}
                    className="text-xl font-extrabold"
                  >
                    Add Vehicle
                  </Text>
                  <Text style={{ color: colors.muted }} className="mt-0.5 text-xs">
                    Details will be reviewed before activation
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleClose}
                  disabled={loading}
                  style={{ backgroundColor: colors.input }}
                  className="h-10 w-10 items-center justify-center rounded-full"
                >
                  <X size={17} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 12,
                }}
              >
                {/* Info banner */}
                <View
                  style={{
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.border,
                  }}
                  className="mb-6 flex-row items-start gap-3 rounded-[22px] border p-4"
                >
                  <ShieldCheck size={20} color={colors.primary} />
                  <View className="flex-1">
                    <Text style={{ color: colors.text }} className="text-sm font-extrabold">
                      RC verification required
                    </Text>
                    <Text
                      style={{ color: colors.muted }}
                      className="mt-1 text-xs leading-5"
                    >
                      Upload your RC as PDF, JPG, or PNG (max 5 MB). Vehicles
                      stay pending until our team approves them.
                    </Text>
                  </View>
                </View>

                {/* Brand + Model row */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <AppInput
                      icon={<Car size={17} color={colors.primary} />}
                      label="Brand"
                      value={brand}
                      onChangeText={setBrand}
                      placeholder="Hyundai"
                    />
                  </View>
                  <View className="flex-1">
                    <AppInput
                      icon={<Car size={17} color={colors.primary} />}
                      label="Model"
                      value={model}
                      onChangeText={setModel}
                      placeholder="i20"
                    />
                  </View>
                </View>

                {/* Registration number */}
                <AppInput
                  icon={<Hash size={17} color={colors.primary} />}
                  label="Vehicle Number"
                  value={registrationNumber}
                  onChangeText={(v) => setRegistrationNumber(v.toUpperCase())}
                  placeholder="OD 02 AB 1234"
                  autoCapitalize="characters"
                />

                {/* Uploads */}
                <View className="mb-4">
                  <Text
                    style={{ color: colors.muted }}
                    className="mb-2 text-xs font-bold uppercase tracking-wider"
                  >
                    Required Uploads
                  </Text>
                  <View className="flex-row gap-3">
                    <UploadCard
                      title="Vehicle Photo"
                      subtitle="Clear front or side photo"
                      file={vehiclePhoto}
                      icon={<Car size={20} color={colors.primary} />}
                      onPress={() =>
                        pickFile(["image/*"], setVehiclePhoto, "Vehicle photo")
                      }
                    />
                    <UploadCard
                      title="RC Document"
                      subtitle="PDF, JPG, or PNG under 5 MB"
                      file={rcFile}
                      icon={<FileText size={20} color={colors.primary} />}
                      onPress={() =>
                        pickFile(
                          ["image/*", "application/pdf"],
                          setRcFile,
                          "RC document",
                        )
                      }
                    />
                  </View>
                </View>

                {/* Color + Seats row */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <AppInput
                      icon={<Palette size={17} color={colors.primary} />}
                      label="Color"
                      value={color}
                      onChangeText={setColor}
                      placeholder="White"
                    />
                  </View>
                  <View className="w-[38%]">
                    <SeatSelector seats={seats} setSeats={setSeats} />
                  </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!canSubmit || loading}
                  onPress={handleSubmit}
                  style={{
                    backgroundColor: canSubmit ? colors.primary : colors.input,
                    opacity: loading ? 0.75 : 1,
                    marginTop: 8,
                  }}
                  className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Plus size={18} color={canSubmit ? "#FFFFFF" : colors.muted} />
                      <Text
                        style={{ color: canSubmit ? "#FFFFFF" : colors.muted }}
                        className="text-base font-extrabold"
                      >
                        {canSubmit ? "Submit for Verification" : "Complete all fields"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}