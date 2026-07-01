export function shortAddress(address?: string) {
  if (!address) return "--";

  return address
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

export function capitalize(value?: string) {
  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDuration(seconds?: number | string) {
  const value = Number(seconds || 0);

  if (!value) return "--";

  const minutes = Math.round(value / 60);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function formatDistanceMeters(meters?: number | string) {
  const value = Number(meters || 0);

  if (!value) return "--";

  if (value < 1000) return `${Math.round(value)} m`;

  return `${(value / 1000).toFixed(1)} km`;
}

export function formatSpeed(speedMetersPerSecond?: number | null) {
  if (
    speedMetersPerSecond == null ||
    Number.isNaN(Number(speedMetersPerSecond))
  ) {
    return "--";
  }

  const kmh = Number(speedMetersPerSecond) * 3.6;

  return `${Math.max(0, Math.round(kmh))} km/h`;
}

export function getConnectionLabel({
  isConnected,
  hasJoined,
  trackingStopped,
  error,
}: {
  isConnected: boolean;
  hasJoined: boolean;
  trackingStopped: boolean;
  error?: string | null;
}) {
  if (error) return "Issue";
  if (trackingStopped) return "Stopped";
  if (hasJoined) return "Live";
  if (isConnected) return "Joining";
  return "Offline";
}
