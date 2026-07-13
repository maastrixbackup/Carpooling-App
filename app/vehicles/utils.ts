import { useAppTheme } from "@/theme/ThemeProvider";
import type { Vehicle, VehicleStatusMeta } from "./types";

export function getVehicleStatus(
  vehicle: Vehicle,
  colors: ReturnType<typeof useAppTheme>["colors"],
): VehicleStatusMeta {
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
