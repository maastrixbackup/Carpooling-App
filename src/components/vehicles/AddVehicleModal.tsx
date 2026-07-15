import { useAppTheme } from "@/theme/ThemeProvider";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import {
  AlertCircle,
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type VehicleFormErrors = {
  brand?: string;
  model?: string;
  registrationNumber?: string;
  seats?: string;
  vehiclePhoto?: string;
  rcFile?: string;
};

// ─── FieldLabel ───────────────────────────────────────────────────────────────

function FieldLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
  );
}

// ─── FieldError ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.errorRow}>
      <AlertCircle size={11} color="#EF4444" />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

// ─── AppInput ────────────────────────────────────────────────────────────────

function AppInput({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  error,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  colors: any;
}) {
  return (
    <View style={{ flex: 1, marginBottom: 14 }}>
      <FieldLabel label={label} colors={colors} />

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={{ opacity: 0.75 }}>{icon}</View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={[styles.textInput, { color: colors.text }]}
        />
      </View>

      <FieldError message={error} />
    </View>
  );
}

// ─── SeatSelector ─────────────────────────────────────────────────────────────

function SeatSelector({
  seats,
  setSeats,
  error,
  colors,
}: {
  seats: string;
  setSeats: (v: string) => void;
  error?: string;
  colors: any;
}) {
  const n = Math.max(1, Number(seats || 1));

  return (
    <View style={{ marginBottom: 14 }}>
      <FieldLabel label="Seats" colors={colors} />

      <View
        style={[
          styles.seatRow,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setSeats(String(Math.max(1, n - 1)))}
          style={[styles.seatBtn, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.seatBtnText, { color: colors.text }]}>−</Text>
        </TouchableOpacity>

        <View style={styles.seatCenter}>
          <Text style={[styles.seatCount, { color: colors.text }]}>{n}</Text>
          <Text style={[styles.seatUnit, { color: colors.muted }]}>
            {n === 1 ? "seat" : "seats"}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setSeats(String(Math.min(8, n + 1)))}
          style={[styles.seatBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.seatBtnTextWhite}>+</Text>
        </TouchableOpacity>
      </View>

      <FieldError message={error} />
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
  error,
  colors,
}: {
  title: string;
  subtitle: string;
  file: DocumentPicker.DocumentPickerAsset | null;
  icon: React.ReactNode;
  onPress: () => void;
  error?: string;
  colors: any;
}) {
  const uploaded = !!file;

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.uploadCard,
          {
            backgroundColor: uploaded ? colors.primarySoft : colors.input,
            borderColor: uploaded ? colors.primary : colors.border,
          },
        ]}
      >
        {/* Icon badge */}
        <View style={[styles.uploadIconBadge, { backgroundColor: colors.card }]}>
          {uploaded ? <BadgeCheck size={18} color="#10B981" /> : icon}
        </View>

        {/* Labels */}
        <Text
          style={[styles.uploadTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.uploadSubtitle, { color: colors.muted }]}
          numberOfLines={2}
        >
          {uploaded ? file?.name : subtitle}
        </Text>

        {/* Status */}
        <Text
          style={[
            styles.uploadStatus,
            { color: uploaded ? "#10B981" : colors.primary },
          ]}
        >
          {uploaded ? "✓ Uploaded" : "Tap to upload"}
        </Text>
      </TouchableOpacity>

      <FieldError message={error} />
    </View>
  );
}

// ─── AddVehicleModal ─────────────────────────────────────────────────────────

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
  // FIX 1: useWindowDimensions for responsive layout decisions
  const { width: screenWidth } = useWindowDimensions();
  // On narrow screens (< 360px) stack brand/model vertically instead of side by side
  const stackInputs = screenWidth < 360;

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");
  const [rcFile, setRcFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [errors, setErrors] = useState<VehicleFormErrors>({});

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

  const clearError = (key: keyof VehicleFormErrors) =>
    setErrors((p) => ({ ...p, [key]: undefined }));

  const resetForm = () => {
    setBrand(""); setModel(""); setRegistrationNumber("");
    setColor(""); setSeats("4");
    setRcFile(null); setVehiclePhoto(null);
    setErrors({});
  };

  const handleClose = () => { resetForm(); onClose(); };

  const pickFile = async (
    type: string[],
    setter: (f: DocumentPicker.DocumentPickerAsset) => void,
    fieldKey: keyof VehicleFormErrors,
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
        setErrors((p) => ({ ...p, [fieldKey]: "Must be under 5 MB." }));
        return;
      }
      clearError(fieldKey);
      setter(file);
    } catch {
      setErrors((p) => ({ ...p, [fieldKey]: "Couldn't select file." }));
    }
  };

  const validate = (): boolean => {
    const e: VehicleFormErrors = {};
    if (!brand.trim()) e.brand = "Brand is required.";
    if (!model.trim()) e.model = "Model is required.";
    if (!registrationNumber.trim()) e.registrationNumber = "Vehicle number is required.";
    if (!Number(seats) || Number(seats) < 1) e.seats = "At least 1 seat required.";
    if (!rcFile) e.rcFile = "RC document is required.";
    if (!vehiclePhoto) e.vehiclePhoto = "Vehicle photo is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      // toast.error("Please fill in all required fields.");
      // logger.error("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("vehicle_type", "car");
    formData.append("brand", brand.trim());
    formData.append("model", model.trim());
    formData.append("registration_number", registrationNumber.trim().toUpperCase());
    formData.append("rc_number", registrationNumber.trim().toUpperCase());
    formData.append("color", color.trim() || "");
    formData.append("seats", String(Number(seats)));
    formData.append("available_seats", String(Number(seats)));

    // FIX 2: Use expo-file-system File class — satisfies SDK 56's new FormData
    // validator. The old {uri, name, type} plain-object pattern is no longer
    // accepted by the new native networking stack.
    if (rcFile) {
      try {
        const rcFileObj = new File(rcFile.uri);
        formData.append("rc_document", rcFileObj, rcFile.name || "rc-document.pdf");
      } catch {
        formData.append("rc_document", {
          uri: rcFile.uri,
          name: rcFile.name || "rc-document.pdf",
          type: rcFile.mimeType || "application/pdf",
        } as any);
      }
    }

    if (vehiclePhoto) {
      try {
        const photoFileObj = new File(vehiclePhoto.uri);
        formData.append("vehicle_photo", photoFileObj, vehiclePhoto.name || "vehicle-photo.jpg");
      } catch {
        formData.append("vehicle_photo", {
          uri: vehiclePhoto.uri,
          name: vehiclePhoto.name || "vehicle-photo.jpg",
          type: vehiclePhoto.mimeType || "image/jpeg",
        } as any);
      }
    }

    onSubmit(formData);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/*
        FIX 3: BlurView only on iOS — on Android it causes frame drops.
        Android gets a plain semi-transparent dark overlay instead.
      */}
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={28}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]} />
      )}

      {/*
        FIX 4: KAV behavior — padding on iOS (standard), undefined on Android.
        Android uses keyboardDismissMode="on-drag" on ScrollView instead.
        This prevents the modal from erratically shrinking on Android.
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Tap-outside to close */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleClose}
            style={{ flex: 1 }}
          />

          {/* Sheet */}
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 20),
                // FIX 5: maxHeight with safe floor — 88% on normal phones,
                // but no more than 92% so the tap-target above is always reachable
                maxHeight: "88%",
              },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            {/* Sheet header */}
            <View
              style={[styles.sheetHeader, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1, paddingRight: 14 }}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  Add vehicle
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.muted }]}>
                  Your vehicle will be reviewed before it's activated
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClose}
                disabled={loading}
                style={[styles.closeBtn, { backgroundColor: colors.input }]}
              >
                <X size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 8,
              }}
            >
              {/* RC info banner */}
              <View
                style={[
                  styles.infoBanner,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ShieldCheck size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bannerTitle, { color: colors.text }]}>
                    RC document required
                  </Text>
                  <Text style={[styles.bannerBody, { color: colors.muted }]}>
                    Upload a clear copy of your registration certificate (PDF, JPG, or PNG, max 5 MB). New vehicles are pending until approved.
                  </Text>
                </View>
              </View>

              {/*
                FIX 6: Brand + Model — side-by-side on normal screens,
                stacked on very narrow ones (< 360px)
              */}
              <View style={stackInputs ? styles.inputColStack : styles.inputRowSplit}>
                <AppInput
                  colors={colors}
                  icon={<Car size={17} color={colors.primary} />}
                  label="Brand"
                  value={brand}
                  onChangeText={(v) => { setBrand(v); clearError("brand"); }}
                  placeholder="Hyundai"
                  error={errors.brand}
                />
                {!stackInputs && <View style={{ width: 12 }} />}
                <AppInput
                  colors={colors}
                  icon={<Car size={17} color={colors.primary} />}
                  label="Model"
                  value={model}
                  onChangeText={(v) => { setModel(v); clearError("model"); }}
                  placeholder="i20"
                  error={errors.model}
                />
              </View>

              {/* Registration number — full width */}
              <AppInput
                colors={colors}
                icon={<Hash size={17} color={colors.primary} />}
                label="Vehicle number"
                value={registrationNumber}
                onChangeText={(v) => {
                  setRegistrationNumber(v.toUpperCase());
                  clearError("registrationNumber");
                }}
                placeholder="OD 02 AB 1234"
                autoCapitalize="characters"
                error={errors.registrationNumber}
              />

              {/* Upload cards */}
              <View style={{ marginBottom: 14 }}>
                <FieldLabel label="Documents & photo" colors={colors} />
                <View style={styles.uploadRow}>
                  <UploadCard
                    colors={colors}
                    title="Vehicle photo"
                    subtitle="Clear front or side view"
                    file={vehiclePhoto}
                    icon={<Car size={18} color={colors.primary} />}
                    onPress={() => pickFile(["image/*"], setVehiclePhoto, "vehiclePhoto")}
                    error={errors.vehiclePhoto}
                  />
                  <View style={{ width: 10 }} />
                  <UploadCard
                    colors={colors}
                    title="RC document"
                    subtitle="PDF, JPG, or PNG"
                    file={rcFile}
                    icon={<FileText size={18} color={colors.primary} />}
                    onPress={() =>
                      pickFile(["image/*", "application/pdf"], setRcFile, "rcFile")
                    }
                    error={errors.rcFile}
                  />
                </View>
              </View>

              {/* Color + Seats — responsive row */}
              <View style={[styles.inputRowSplit, { alignItems: "flex-start" }]}>
                <AppInput
                  colors={colors}
                  icon={<Palette size={17} color={colors.primary} />}
                  label="Color (optional)"
                  value={color}
                  onChangeText={setColor}
                  placeholder="White"
                />
                <View style={{ width: 12 }} />
                <View style={{ width: "42%" }}>
                  <SeatSelector
                    colors={colors}
                    seats={seats}
                    setSeats={(v) => { setSeats(v); clearError("seats"); }}
                    error={errors.seats}
                  />
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loading}
                onPress={handleSubmit}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: canSubmit ? colors.primary : colors.input,
                    opacity: loading ? 0.75 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Plus size={17} color={canSubmit ? "#fff" : colors.muted} />
                    <Text
                      style={[
                        styles.submitBtnText,
                        { color: canSubmit ? "#fff" : colors.muted },
                      ]}
                    >
                      {canSubmit ? "Add vehicle" : "Fill in all fields"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Sheet
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: "hidden",
  },
  handleBar: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Info banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  bannerBody: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },

  // Field layout
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    paddingLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },

  // Input layout arrangements
  inputRowSplit: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  inputColStack: {
    flexDirection: "column",
  },

  // Seat selector
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 52,
  },
  seatBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  seatBtnText: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  seatBtnTextWhite: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
    color: "#fff",
  },
  seatCenter: {
    alignItems: "center",
  },
  seatCount: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 20,
  },
  seatUnit: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },

  // Upload cards
  uploadRow: {
    flexDirection: "row",
  },
  uploadCard: {
    flex: 1,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 14,
    minHeight: 130,
    justifyContent: "space-between",
  },
  uploadIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  uploadSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  uploadStatus: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },

  // Error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
    paddingLeft: 2,
  },
  errorText: {
    fontSize: 11,
    color: "#EF4444",
    fontWeight: "600",
  },

  // Submit button
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 15,
    marginTop: 4,
    marginBottom: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },
});