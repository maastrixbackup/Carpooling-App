import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  createVehicleApi,
  deleteVehicleApi,
  getMyVehiclesApi,
} from "@/services/vehicle.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ArrowLeft, Car, Plus, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { AddVehicleModal } from "../../src/components/vehicles/AddVehicleModal";
import { VehicleCard } from "../../src/components/vehicles/VehicleCard";
import type { Vehicle } from "../../src/components/vehicles/types";

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VehiclesScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: getMyVehiclesApi,
  });

  const vehicles: Vehicle[] = data?.data?.vehicles || [];

  const createMutation = useMutation({
    mutationFn: createVehicleApi,
    onSuccess: async () => {
      toast.success("Vehicle submitted for verification.");
      setModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to add vehicle.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicleApi,
    onSuccess: async () => {
      toast.success("Vehicle removed.");
      await queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to delete vehicle.");
    },
  });

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Remove vehicle?",
      message:
        "This vehicle will be removed from your profile. Existing ride history stays intact.",
      confirmText: "Remove",
      cancelText: "Cancel",
      danger: true,
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  // FAB sits above the tab bar — 80px tab bar + bottom inset
  const fabBottom = Math.max(insets.bottom, 16) + 80;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>

        {/* ── Sticky header ── */}
        <View
          style={{
            backgroundColor: colors.bg,
            borderBottomColor: colors.border,
          }}
          className="border-b px-5 pb-4 pt-3"
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.back()}
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
              className="h-11 w-11 items-center justify-center rounded-full border"
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text
                style={{ color: colors.text }}
                className="text-lg font-extrabold"
                numberOfLines={1}
              >
                My Vehicles
              </Text>
              <Text
                style={{ color: colors.muted }}
                className="mt-0.5 text-xs font-semibold"
              >
                {vehicles.length > 0
                  ? `${vehicles.length} vehicle${vehicles.length > 1 ? "s" : ""} registered`
                  : "No vehicles yet"}
              </Text>
            </View>

            {/* Spacer to keep title centered */}
            <View className="h-11 w-11" />
          </View>
        </View>

        {/* ── Content ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            // Leave room for FAB
            paddingBottom: fabBottom + 32,
          }}
        >
          {/* Info banner */}
          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderColor: colors.border,
            }}
            className="mb-6 flex-row items-start gap-3 rounded-[26px] border p-4"
          >
            <ShieldCheck size={20} color={colors.primary} />
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="text-sm font-extrabold">
                RC verification required
              </Text>
              <Text style={{ color: colors.muted }} className="mt-1 text-xs leading-5">
                Every vehicle needs an RC document. New vehicles stay pending
                until our team approves them.
              </Text>
            </View>
          </View>

          {/* Section header */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text
              style={{ color: colors.text }}
              className="text-lg font-extrabold"
            >
              Your Vehicles
            </Text>
            <Text style={{ color: colors.muted }} className="text-xs font-bold">
              {vehicles.length} added
            </Text>
          </View>

          {/* Vehicle list / states */}
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
              <EmptyCard onAdd={() => setModalVisible(true)} />
            )}
          </View>
        </ScrollView>

        {/* ── FAB ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setModalVisible(true)}
          style={{
            position: "absolute",
            bottom: fabBottom,
            right: 20,
            backgroundColor: colors.primary,
            // Elevation / shadow
            ...Platform.select({
              ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
              },
              android: {
                elevation: 10,
              },
            }),
          }}
          className="h-15 w-15 flex-row items-center justify-center gap-2 rounded-[22px] px-5 py-4"
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-sm font-extrabold text-white">Add Vehicle</Text>
        </TouchableOpacity>

      </SafeAreaView>

      {/* ── Add Vehicle Modal ── */}
      <AddVehicleModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        loading={createMutation.isPending}
        onSubmit={(formData) => createMutation.mutate(formData)}
      />
    </View>
  );
}

// ─── Loading card ─────────────────────────────────────────────────────────────

function LoadingCard() {
  const { colors } = useAppTheme();
  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="items-center rounded-[28px] border p-10"
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
        Loading vehicles…
      </Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCard({ onAdd }: { onAdd: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="items-center rounded-[28px] border p-10"
    >
      {/* Soft icon background */}
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="mb-5 h-20 w-20 items-center justify-center rounded-full"
      >
        <Car size={36} color={colors.primary} />
      </View>

      <Text style={{ color: colors.text }} className="text-lg font-extrabold">
        No vehicles yet
      </Text>
      <Text
        style={{ color: colors.muted }}
        className="mt-2 max-w-[220px] text-center text-sm leading-5"
      >
        Add your first verified vehicle to start publishing rides.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onAdd}
        style={{ backgroundColor: colors.primary }}
        className="mt-6 flex-row items-center gap-2 rounded-2xl px-6 py-3"
      >
        <Plus size={17} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="text-sm font-extrabold text-white">Add Vehicle</Text>
      </TouchableOpacity>
    </View>
  );
}