import { useAppTheme } from "@/theme/ThemeProvider";
import { BadgeCheck, Car, Trash2 } from "lucide-react-native";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import type { Vehicle } from "./types";
import { getVehicleStatus } from "./utils";

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

export function VehicleCard({
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
      className="overflow-hidden rounded-[28px] border p-5"
    >
      {/* Decorative accent circle */}
      <View className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/[0.07]" />

      {/* Top row — icon + status badge */}
      <View className="flex-row items-start justify-between">
        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="h-12 w-12 items-center justify-center rounded-2xl"
        >
          <Car size={22} color={colors.primary} />
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

      {/* Vehicle name + reg */}
      <Text
        style={{ color: colors.text }}
        className="mt-4 text-xl font-extrabold tracking-tight"
      >
        {title || "Vehicle"}
      </Text>
      <Text
        style={{ color: colors.muted }}
        className="mt-0.5 text-sm font-semibold tracking-widest"
      >
        {vehicle.registration_number}
      </Text>

      {/* Pills */}
      <View className="mt-4 flex-row flex-wrap gap-2">
        <Pill label={`${vehicle.seats || 0} seats`} />
        {vehicle.color ? <Pill label={vehicle.color} /> : null}
        {vehicle.rc_document_url ? <Pill label="RC uploaded" /> : null}
      </View>

      {/* Footer row */}
      <View
        style={{ borderTopColor: colors.border }}
        className="mt-5 flex-row gap-3 border-t pt-4"
      >
        <View
          style={{ backgroundColor: colors.input }}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3"
        >
          <BadgeCheck size={15} color={status.color} />
          <Text style={{ color: status.color }} className="text-xs font-extrabold">
            {status.actionText}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDelete}
          disabled={deleting}
          style={{ backgroundColor: colors.dangerSoft }}
          className="h-11 w-11 items-center justify-center rounded-2xl"
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Trash2 size={17} color={colors.danger} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}