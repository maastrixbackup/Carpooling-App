import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  createVehicleApi,
  deleteVehicleApi,
  getMyVehiclesApi,
} from "@/services/vehicle.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import {
  ArrowLeft,
  BadgeCheck,
  Car,
  FileText,
  Hash,
  Palette,
  Plus,
  ShieldCheck,
  Trash2
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type Vehicle = {
  id: number;
  vehicle_type?: string;
  brand: string;
  model: string;
  manufacture_year?: string;
  registration_number: string;
  rc_number?: string;
  rc_document_url?: string | null;
  color?: string;
  seats: number;
  available_seats?: number;
  fuel_type?: string;
  status?: string;
  verification_status?: "pending" | "approved" | "rejected";
  is_active?: boolean;
};

export default function VehiclesScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [rcFile, setRcFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: getMyVehiclesApi,
  });

  const vehicles: Vehicle[] = data?.data?.vehicles || [];

  const canSubmit = useMemo(() => {
    return (
      brand.trim().length > 0 &&
      model.trim().length > 0 &&
      registrationNumber.trim().length > 0 &&
      Number(seats) > 0 &&
      !!rcFile &&
      !!vehiclePhoto
    );
  }, [brand, model, registrationNumber, seats, rcFile, vehiclePhoto]);

  const createMutation = useMutation({
    mutationFn: createVehicleApi,
    onSuccess: async () => {
      toast.success("Vehicle submitted for verification.");
      setBrand("");
      setModel("");
      setRegistrationNumber("");
      setColor("");
      setSeats("4");
      setRcFile(null);
      setVehiclePhoto(null);
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to add vehicle.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicleApi,
    onSuccess: async () => {
      toast.success("Vehicle removed successfully.");
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to delete vehicle.");
    },
  });

  const pickRcDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (file.size && file.size > 5 * 1024 * 1024) {
        toast.error("RC file must be under 5 MB.");
        return;
      }

      setRcFile(file);
    } catch {
      toast.error("Unable to select RC document.");
    }
  };

  const handleAddVehicle = () => {
    if (!brand.trim()) return toast.error("Brand is required.");
    if (!model.trim()) return toast.error("Model is required.");
    if (!registrationNumber.trim()) return toast.error("Vehicle number is required.");
    if (!Number(seats) || Number(seats) < 1) return toast.error("Enter valid seats.");
    if (!rcFile) return toast.error("Please upload RC document.");
    if (!vehiclePhoto) return toast.error("Please upload vehicle photo.");

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
    formData.append(
      "vehicle_photo",
      {
        uri: vehiclePhoto!.uri,
        name: vehiclePhoto!.name || "vehicle-photo.jpg",
        type: vehiclePhoto!.mimeType || "image/jpeg",
      } as any
    );

    createMutation.mutate(formData);
  };

  const pickVehiclePhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (file.size && file.size > 5 * 1024 * 1024) {
        toast.error("Vehicle image must be under 5 MB.");
        return;
      }

      setVehiclePhoto(file);
    } catch {
      toast.error("Unable to select vehicle image.");
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Delete vehicle?",
      message:
        "This vehicle will be removed from your profile. Existing ride history will remain safe.",
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });

    if (!ok) return;

    deleteMutation.mutate(id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: Platform.OS === "android" ? 16 : 12,
              paddingBottom: 150,
            }}
          >
            <Header />

            <InfoBanner />

            <View className="mt-6">
              <View className="mb-3 flex-row items-center justify-between">
                <Text
                  style={{ color: colors.text }}
                  className="text-lg font-extrabold"
                >
                  Your Vehicles
                </Text>

                <Text
                  style={{ color: colors.muted }}
                  className="text-xs font-bold"
                >
                  {vehicles.length} added
                </Text>
              </View>

              <View className="gap-4">
                {isLoading ? (
                  <LoadingCard />
                ) : vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      deleting={deleteMutation.isPending}
                      onDelete={() => handleDelete(vehicle.id)}
                    />
                  ))
                ) : (
                  <EmptyVehicleCard />
                )}
              </View>
            </View>

            <Section title="Add New Vehicle">
              <View className="mb-5 flex-row items-center gap-3">
                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                >
                  <Car size={22} color={colors.primary} />
                </View>

                <View className="flex-1">
                  <Text
                    style={{ color: colors.text }}
                    className="font-extrabold"
                  >
                    Vehicle information
                  </Text>
                  <Text
                    style={{ color: colors.muted }}
                    className="mt-1 text-xs leading-4"
                  >
                    Add accurate vehicle details. RC upload is required for
                    verification.
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <AppInput
                    icon={<Car size={18} color={colors.primary} />}
                    label="Brand"
                    value={brand}
                    onChangeText={setBrand}
                    placeholder="Hyundai"
                  />
                </View>

                <View className="flex-1">
                  <AppInput
                    icon={<Car size={18} color={colors.primary} />}
                    label="Model"
                    value={model}
                    onChangeText={setModel}
                    placeholder="i20"
                  />
                </View>
              </View>

              <AppInput
                icon={<Hash size={18} color={colors.primary} />}
                label="Vehicle Number"
                value={registrationNumber}
                onChangeText={(value) => setRegistrationNumber(value.toUpperCase())}
                placeholder="OD 02 AB 1234"
                autoCapitalize="characters"
              />



              <View className="mb-4">
                <Text
                  style={{ color: colors.muted }}
                  className="mb-2 text-xs font-bold uppercase"
                >
                  Required Uploads
                </Text>

                <View className="gap-3 flex-row">
                  <UploadCard
                    title="Vehicle Photo"
                    subtitle="Upload a clear front or side photo"
                    file={vehiclePhoto}
                    icon={<Car size={22} color={colors.primary} />}
                    onPress={pickVehiclePhoto}
                  />

                  <UploadCard
                    title="RC Document"
                    subtitle="Upload PDF, JPG, or PNG under 5 MB"
                    file={rcFile}
                    icon={<FileText size={22} color={colors.primary} />}
                    onPress={pickRcDocument}
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <AppInput
                    icon={<Palette size={18} color={colors.primary} />}
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
            </Section>
          </ScrollView>

          <BottomAction
            canSubmit={canSubmit}
            loading={createMutation.isPending}
            onPress={handleAddVehicle}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Header() {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center gap-4">
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.back()}
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="h-11 w-11 items-center justify-center rounded-full border"
      >
        <ArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>

      <View className="flex-1">
        <Text style={{ color: colors.text }} className="text-3xl font-extrabold">
          My Vehicles
        </Text>
        <Text style={{ color: colors.muted }} className="mt-1 text-sm">
          Add and verify cars for publishing rides.
        </Text>
      </View>
    </View>
  );
}

function InfoBanner() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.primarySoft, borderColor: colors.border }}
      className="mt-6 rounded-[26px] border p-4"
    >
      <View className="flex-row gap-3">
        <ShieldCheck size={22} color={colors.primary} />

        <View className="flex-1">
          <Text style={{ color: colors.text }} className="font-extrabold">
            RC verification required
          </Text>
          <Text style={{ color: colors.muted }} className="mt-1 text-xs leading-5">
            Upload your vehicle RC as PDF, JPG, or PNG. New vehicles may stay
            pending until approved.
          </Text>
        </View>
      </View>
    </View>
  );
}

function VehicleCard({
  vehicle,
  deleting,
  onDelete,
}: {
  vehicle: Vehicle;
  deleting: boolean;
  onDelete: () => void;
}) {
  const { colors } = useAppTheme();

  const title = `${vehicle.brand || ""} ${vehicle.model || ""}`.trim();
  const status = getVehicleStatus(vehicle, colors);

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="overflow-hidden rounded-[30px] border p-5"
    >
      <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10" />

      <View className="flex-row items-start justify-between">
        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="h-12 w-12 items-center justify-center rounded-2xl"
        >
          <Car size={23} color={colors.primary} />
        </View>

        <View
          style={{ backgroundColor: status.bg }}
          className="rounded-full px-3 py-1.5"
        >
          <Text style={{ color: status.color }} className="text-xs font-bold">
            {status.label}
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.text }} className="mt-4 text-xl font-extrabold">
        {title || "Vehicle"}
      </Text>

      <Text style={{ color: colors.muted }} className="mt-1 text-sm font-semibold">
        {vehicle.registration_number}
      </Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Pill label={`${vehicle.seats || 0} seats`} />
        {vehicle.color ? <Pill label={vehicle.color} /> : null}
        {vehicle.rc_document_url ? <Pill label="RC uploaded" /> : null}
      </View>

      <View
        style={{ borderTopColor: colors.border }}
        className="mt-5 flex-row gap-3 border-t pt-4"
      >
        <View
          style={{ backgroundColor: colors.input }}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3"
        >
          <BadgeCheck size={16} color={status.color} />
          <Text style={{ color: status.color }} className="text-xs font-extrabold">
            {status.actionText}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDelete}
          disabled={deleting}
          style={{ backgroundColor: colors.dangerSoft }}
          className="h-11 w-12 items-center justify-center rounded-2xl"
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Trash2 size={18} color={colors.danger} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Pill({ label }: { label: string }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.input }}
      className="rounded-full px-3 py-1.5"
    >
      <Text style={{ color: colors.muted }} className="text-xs font-bold">
        {label}
      </Text>
    </View>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
        className="rounded-[30px] border p-4"
      >
        {children}
      </View>
    </View>
  );
}

function AppInput({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  last,
}: {
  icon: React.ReactNode;
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
      <Text style={{ color: colors.muted }} className="mb-2 text-xs font-bold uppercase">
        {label}
      </Text>

      <View
        style={{ backgroundColor: colors.input }}
        className="min-h-[54px] flex-row items-center gap-3 rounded-2xl px-4 py-3"
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
          style={{ color: colors.text }}
          className="flex-1 text-base font-semibold"
        />
      </View>
    </View>
  );
}

function BottomAction({
  canSubmit,
  loading,
  onPress,
}: {
  canSubmit: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderTopColor: colors.border }}
      className="absolute bottom-0 left-0 right-0 border-t px-5 pb-8 pt-4"
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={!canSubmit || loading}
        style={{
          backgroundColor: canSubmit ? colors.primary : colors.muted,
          opacity: loading ? 0.75 : 1,
        }}
        className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Plus size={19} color="#FFFFFF" />
            <Text className="text-base font-extrabold text-white">
              {canSubmit ? "Submit for Verification" : "Complete Vehicle Details"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function LoadingCard() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="items-center rounded-[30px] border p-8"
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
        Loading vehicles...
      </Text>
    </View>
  );
}

function EmptyVehicleCard() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="items-center rounded-[30px] border p-8"
    >
      <Car size={36} color={colors.muted} />
      <Text style={{ color: colors.text }} className="mt-4 text-lg font-extrabold">
        No vehicles yet
      </Text>
      <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
        Add your first verified vehicle to publish rides.
      </Text>
    </View>
  );
}

function getVehicleStatus(
  vehicle: Vehicle,
  colors: ReturnType<typeof useAppTheme>["colors"],
) {
  const status = vehicle.verification_status || vehicle.status || "pending";

  if (status === "approved" || status === "active") {
    return {
      label: "Approved",
      actionText: "Ready to publish",
      bg: "rgba(34,197,94,0.14)",
      color: colors.success,
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      actionText: "Verification failed",
      bg: colors.dangerSoft,
      color: colors.danger,
    };
  }

  return {
    label: "Pending",
    actionText: "Under review",
    bg: colors.primarySoft,
    color: colors.primary,
  };
}

function SeatSelector({
  seats,
  setSeats,
}: {
  seats: string;
  setSeats: (value: string) => void;
}) {
  const { colors } = useAppTheme();

  const seatNumber = Math.max(1, Number(seats || 1));

  const decrease = () => {
    setSeats(String(Math.max(1, seatNumber - 1)));
  };

  const increase = () => {
    setSeats(String(Math.min(8, seatNumber + 1)));
  };

  return (
    <View>
      <Text
        style={{ color: colors.muted }}
        className="mb-2 text-xs font-bold uppercase"
      >
        Seats
      </Text>

      <View
        style={{ backgroundColor: colors.input }}
        className="min-h-[54px] flex-row items-center justify-between rounded-2xl px-3"
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={decrease}
          style={{ backgroundColor: colors.card }}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <Text style={{ color: colors.text }} className="text-xl font-extrabold">
            −
          </Text>
        </TouchableOpacity>

        <View className="items-center">
          <Text style={{ color: colors.text }} className="text-lg font-extrabold">
            {seatNumber}
          </Text>
          <Text style={{ color: colors.muted }} className="text-[10px] font-bold">
            seats
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={increase}
          style={{ backgroundColor: colors.primary }}
          className="h-8 w-8 items-center justify-center rounded-full"
        >
          <Text className="text-xl font-extrabold text-white">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function UploadCard({
  title,
  subtitle,
  file,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  file: any;
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
        backgroundColor: uploaded
          ? colors.primarySoft
          : colors.input,
        borderColor: uploaded
          ? colors.primary
          : colors.border,
      }}
      className="flex-1 rounded-[24px] border border-dashed p-4"
    >
      <View
        style={{ backgroundColor: colors.card }}
        className="h-12 w-12 items-center justify-center rounded-2xl"
      >
        {uploaded ? (
          <BadgeCheck
            size={22}
            color={colors.success}
          />
        ) : (
          icon
        )}
      </View>

      <Text
        style={{ color: colors.text }}
        className="mt-3 font-extrabold"
      >
        {title}
      </Text>

      <Text
        style={{ color: colors.muted }}
        className="mt-1 text-xs"
        numberOfLines={2}
      >
        {uploaded
          ? file?.name || "Uploaded"
          : subtitle}
      </Text>

      <View className="mt-3">
        <Text
          style={{
            color: uploaded
              ? colors.success
              : colors.primary,
          }}
          className="text-xs font-bold"
        >
          {uploaded ? "Uploaded" : "Tap to Upload"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}