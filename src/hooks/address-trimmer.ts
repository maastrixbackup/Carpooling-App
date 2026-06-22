export function shortAddress(address?: string) {
  if (!address) return "";

  const parts = address
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.slice(0, 2).join(", ");
}

export function shortAddress1(address?: string) {
  if (!address) return "";

  const cleaned = address.replace(/\s+/g, " ").trim();

  // Handle addresses containing "-"
  const dashParts = cleaned
    .split("-")
    .map((item) => item.trim())
    .filter(Boolean);

  if (dashParts.length > 1) {
    return dashParts[0];
  }

  // Handle comma separated addresses
  const commaParts = cleaned
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (commaParts.length > 0) {
    return commaParts[0];
  }

  return cleaned;
}
