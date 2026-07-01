import type { LatLng } from "@/types/liveRide.types";

export function getDistanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;

  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function getNearestRouteIndex(route: LatLng[], point: LatLng) {
  if (!route.length) return 0;

  let nearestIndex = 0;
  let nearestDistance = Number.MAX_SAFE_INTEGER;

  route.forEach((routePoint, index) => {
    const distance = getDistanceMeters(routePoint, point);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

export function splitRouteByDriver(route: LatLng[], driver?: LatLng | null) {
  if (!route.length) {
    return {
      completedRoute: [],
      remainingRoute: [],
    };
  }

  if (!driver) {
    return {
      completedRoute: [],
      remainingRoute: route,
    };
  }

  const nearestIndex = getNearestRouteIndex(route, driver);

  return {
    completedRoute: route.slice(0, nearestIndex + 1),
    remainingRoute: [driver, ...route.slice(nearestIndex + 1)],
  };
}

export function getRouteDistance(route: LatLng[]) {
  if (route.length < 2) return 0;

  return route.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + getDistanceMeters(route[index - 1], point);
  }, 0);
}

export function getBearing(from: LatLng, to: LatLng) {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360;
}

export const premiumDarkMapStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    elementType: "geometry",
    stylers: [{ color: "#111827" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#94A3B8" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#0F172A" }],
  },
];

export const premiumLightMapStyle = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#E5E7EB" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#F1F5F9" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#DBEAFE" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#F8FAFC" }],
  },
];
