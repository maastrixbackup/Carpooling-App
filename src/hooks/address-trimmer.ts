export function shortAddress(address?: string) {
  if (!address) return "";

  const parts = address
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.slice(0, 3).join(", ");
}
