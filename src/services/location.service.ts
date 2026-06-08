// services/location.service.ts
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
export type PlaceSuggestion = {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export async function searchIndiaPlaces(
  input: string,
): Promise<PlaceSuggestion[]> {
  if (!GOOGLE_KEY) {
    throw new Error("Missing Google Maps API key.");
  }

  if (!input.trim() || input.trim().length < 2) {
    return [];
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(input.trim())}` +
    `&key=${GOOGLE_KEY}` +
    `&components=country:in` +
    `&language=en`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || data.status || "Place search failed");
  }

  return (data.predictions || []).map((item: any) => ({
    place_id: item.place_id,
    description: item.description,
    main_text: item.structured_formatting?.main_text || item.description,
    secondary_text: item.structured_formatting?.secondary_text || "",
  }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  if (!GOOGLE_KEY) {
    throw new Error("Missing Google Maps API key.");
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}` +
    `&key=${GOOGLE_KEY}` +
    `&fields=place_id,formatted_address,geometry,name`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(
      data.error_message || data.status || "Place details failed",
    );
  }

  const result = data.result;

  return {
    placeId: result.place_id,
    name: result.name,
    address: result.formatted_address,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
  };
}

export async function geocodeAddress(address: string) {
  if (!GOOGLE_KEY) {
    throw new Error("Missing Google Maps API key.");
  }

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encodeURIComponent(address)}` +
    `&key=${GOOGLE_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(data.error_message || data.status || "Geocoding failed");
  }

  const result = data.results[0];

  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}
