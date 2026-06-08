import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  createVehicleApi,
  deleteVehicleApi,
  getMyVehiclesApi,
} from "@/services/vehicle.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ArrowLeft,
  Car,
  Hash,
  Plus,
  Trash2,
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
  color?: string;
  seats: number;
  available_seats?: number;
  fuel_type?: string;
  status?: string;
};

export default function VehiclesScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: getMyVehiclesApi,
  });

  const vehicles: Vehicle[] = data?.data?.vehicles || [];

  const canSubmit = useMemo(() => {
    return (
      brand.trim().length > 0 &&
      model.trim().length > 0 &&
      registrationNumber.trim().length > 0 &&
      Number(seats) > 0
    );
  }, [brand, model, registrationNumber, seats]);

  const createMutation = useMutation({
    mutationFn: createVehicleApi,
    onSuccess: async () => {
      toast.success("Vehicle added successfully.");

      setBrand("");
      setModel("");
      setRegistrationNumber("");
      setColor("");
      setSeats("4");

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

  const handleAddVehicle = () => {
    if (!canSubmit) {
      toast.error("Please fill brand, model, vehicle number, and seats.");
      return;
    }

    createMutation.mutate({
      vehicle_type: "car",
      brand: brand.trim(),
      model: model.trim(),
      manufacture_year: null,
      registration_number: registrationNumber.trim().toUpperCase(),
      rc_number: registrationNumber.trim().toUpperCase(),
      color: color.trim() || null,
      seats: Number(seats),
      available_seats: Number(seats),
      fuel_type: null,
    });
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Delete Vehicle?",
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
              paddingBottom: 130,
            }}
          >
            <Header title="My Vehicles" subtitle="Manage cars for publishing rides" />

            <View className="mt-6 gap-4">
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

            <Section title="Add Vehicle">
              <AppInput
                icon={<Car size={18} color={colors.primary} />}
                label="Brand"
                value={brand}
                onChangeText={setBrand}
                placeholder="Example: Hyundai"
              />

              <AppInput
                icon={<Car size={18} color={colors.primary} />}
                label="Model"
                value={model}
                onChangeText={setModel}
                placeholder="Example: i20"
              />

              <AppInput
                icon={<Hash size={18} color={colors.primary} />}
                label="Vehicle Number"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                placeholder="Example: OD 02 AB 1234"
                autoCapitalize="characters"
              />

              <AppInput
                icon={<Car size={18} color={colors.primary} />}
                label="Color"
                value={color}
                onChangeText={setColor}
                placeholder="Example: White"
              />

              <AppInput
                icon={<Car size={18} color={colors.primary} />}
                label="Total Seats"
                value={seats}
                onChangeText={setSeats}
                placeholder="Example: 4"
                keyboardType="phone-pad"
                last
              />
            </Section>
          </ScrollView>

          <View
            style={{ backgroundColor: colors.card, borderTopColor: colors.border }}
            className="absolute bottom-0 left-0 right-0 border-t px-5 pb-8 pt-4"
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddVehicle}
              disabled={!canSubmit || createMutation.isPending}
              style={{
                backgroundColor: canSubmit ? colors.primary : colors.muted,
                opacity: createMutation.isPending ? 0.75 : 1,
              }}
              className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Plus size={19} color="#FFFFFF" />
                  <Text className="text-base font-extrabold text-white">
                    Add Vehicle
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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

        <View style={{ backgroundColor: "rgba(34,197,94,0.14)" }} className="rounded-full px-3 py-1.5">
          <Text style={{ color: colors.success }} className="text-xs font-bold">
            Active
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.text }} className="mt-4 text-xl font-extrabold">
        {title || "Vehicle"}
      </Text>

      <Text style={{ color: colors.muted }} className="mt-1 text-sm font-semibold">
        {vehicle.registration_number}
      </Text>

      <Text style={{ color: colors.muted }} className="mt-3 text-xs">
        {vehicle.seats} total seats{vehicle.color ? ` • ${vehicle.color}` : ""}
      </Text>

      <View style={{ borderTopColor: colors.border }} className="mt-5 flex-row gap-3 border-t pt-4">
        <TouchableOpacity
          activeOpacity={0.85}
          disabled
          style={{ backgroundColor: colors.primarySoft }}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3 opacity-70"
        >
          <Text style={{ color: colors.primary }} className="text-xs font-extrabold">
            Vehicle Ready
          </Text>
        </TouchableOpacity>

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
        Add your first vehicle to publish rides.
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
        className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
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