export type ThemeMode = "light" | "dark" | "system";

export const lightColors = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  input: "#F1F5F9",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  primary: "#2563EB",
  primarySoft: "#DBEAFE",
  success: "#16A34A",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
};

export const darkColors = {
  bg: "#000000",
  card: "#0A0A0A",
  cardSoft: "#111111",
  input: "#121212",
  text: "#FFFFFF",
  muted: "#A1A1AA",
  border: "#1F1F1F",
  primary: "#0066CC",
  primarySoft: "#0A2747",
  success: "#22C55E",
  danger: "#F87171",
  dangerSoft: "#2A0E0E",
};

export type AppColors = typeof lightColors;
