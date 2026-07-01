// src/utils/statusTheme.ts

export type AppStatus =
  | "pending"
  | "confirmed"
  | "accepted"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "canceled"
  | "rejected"
  | "scheduled";

export type StatusTheme = {
  label: string;
  bg: string;
  text: string;
};

export function normalizeStatus(status?: string): AppStatus {
  const value = String(status || "").toLowerCase();

  if (value === "accepted" || value === "confirmed") return "confirmed";
  if (value === "ongoing") return "ongoing";
  if (value === "completed" || value === "complete") return "completed";
  if (value === "cancelled" || value === "canceled" || value === "rejected") {
    return "cancelled";
  }
  if (value === "scheduled") return "scheduled";

  return "pending";
}

export function getStatusTheme(
  status: string | undefined,
  colors: any,
): StatusTheme {
  const value = normalizeStatus(status);

  if (value === "ongoing") {
    return {
      label: "Ongoing",
      bg: "rgba(59,130,246,0.14)",
      text: colors.primary,
    };
  }

  if (value === "confirmed") {
    return {
      label: "Accepted",
      bg: "rgba(34,197,94,0.14)",
      text: colors.success,
    };
  }

  if (value === "completed") {
    return {
      label: "Completed",
      bg: "rgba(34,197,94,0.14)",
      text: colors.success,
    };
  }

  if (value === "cancelled") {
    return {
      label: "Cancelled",
      bg: colors.dangerSoft,
      text: colors.danger,
    };
  }

  if (value === "scheduled") {
    return {
      label: "Scheduled",
      bg: colors.primarySoft,
      text: colors.primary,
    };
  }

  return {
    label: "Pending",
    bg: colors.primarySoft,
    text: colors.primary,
  };
}
