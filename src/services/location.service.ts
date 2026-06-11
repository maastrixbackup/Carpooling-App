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

// export async function searchIndiaPlaces(
//   input: string,
// ): Promise<PlaceSuggestion[]> {
//   if (!GOOGLE_KEY) {
//     throw new Error("Missing Google Maps API key.");
//   }

//   if (!input.trim() || input.trim().length < 2) {
//     return [];
//   }

//   const url =
//     `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
//     `?input=${encodeURIComponent(input.trim())}` +
//     `&key=${GOOGLE_KEY}` +
//     `&components=country:in` +
//     `&language=en`;

//   const response = await fetch(url);
//   const data = await response.json();

//   if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
//     throw new Error(data.error_message || data.status || "Place search failed");
//   }

//   return (data.predictions || []).map((item: any) => ({
//     place_id: item.place_id,
//     description: item.description,
//     main_text: item.structured_formatting?.main_text || item.description,
//     secondary_text: item.structured_formatting?.secondary_text || "",
//   }));
// }

// export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
//   if (!GOOGLE_KEY) {
//     throw new Error("Missing Google Maps API key.");
//   }

//   const url =
//     `https://maps.googleapis.com/maps/api/place/details/json` +
//     `?place_id=${placeId}` +
//     `&key=${GOOGLE_KEY}` +
//     `&fields=place_id,formatted_address,geometry,name`;

//   const response = await fetch(url);
//   const data = await response.json();

//   if (data.status !== "OK") {
//     throw new Error(
//       data.error_message || data.status || "Place details failed",
//     );
//   }

//   const result = data.result;

//   return {
//     placeId: result.place_id,
//     name: result.name,
//     address: result.formatted_address,
//     latitude: result.geometry.location.lat,
//     longitude: result.geometry.location.lng,
//   };
// }

// export async function geocodeAddress(address: string) {
//   if (!GOOGLE_KEY) {
//     throw new Error("Missing Google Maps API key.");
//   }

//   const url =
//     `https://maps.googleapis.com/maps/api/geocode/json` +
//     `?address=${encodeURIComponent(address)}` +
//     `&key=${GOOGLE_KEY}`;

//   const response = await fetch(url);
//   const data = await response.json();

//   if (data.status !== "OK") {
//     throw new Error(data.error_message || data.status || "Geocoding failed");
//   }

//   const result = data.results[0];

//   return {
//     latitude: result.geometry.location.lat,
//     longitude: result.geometry.location.lng,
//     formattedAddress: result.formatted_address,
//   };
// }

//// New

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  try {
    // Check if the placeId contains our packed context token
    if (placeId && placeId.startsWith("photon-ctx-")) {
      const cleanJsonString = decodeURIComponent(
        placeId.replace("photon-ctx-", ""),
      );
      const parsedLocation = JSON.parse(cleanJsonString);

      // Return the precise data immediately without hitting the network!
      return {
        placeId: placeId,
        name: parsedLocation.name || "Selected Location",
        address: parsedLocation.address || "Odisha, India",
        latitude: parsedLocation.latitude, // Exact Jaydev Vihar Latitude
        longitude: parsedLocation.longitude, // Exact Jaydev Vihar Longitude
      };
    }

    // Fallback error if string structure doesn't match
    throw new Error("Invalid Photon Context ID string pattern passed.");
  } catch (error: any) {
    throw new Error(error.message || "Failed to resolve free place details");
  }
}

export async function searchIndiaPlaces(
  input: string,
): Promise<PlaceSuggestion[]> {
  if (!input.trim() || input.trim().length < 2) {
    return [];
  }

  const odishaBBox = "81.39,17.78,87.50,22.57";
  const odishaLat = "20.2961";
  const odishaLng = "85.8245";

  const url =
    `https://photon.komoot.io/api/` +
    `?q=${encodeURIComponent(input.trim())}` +
    `&limit=10` +
    `&lang=en` +
    `&bbox=${odishaBBox}` +
    `&lat=${odishaLat}` +
    `&lon=${odishaLng}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data || !data.features) {
    return [];
  }

  return data.features.map((feature: any) => {
    const props = feature.properties;
    const geometry = feature.geometry?.coordinates || [0, 0];

    const name = props.name || "";
    const street = props.street ? `${props.street}, ` : "";
    const city = props.city || props.town || props.village || "";
    const state = props.state ? `, ${props.state}` : "Odisha";

    const fullDescription =
      `${name} ${name && (street || city) ? "-" : ""} ${street}${city}${state}`.trim();

    // 🌟 THE FIX: Pack all details into an object, stringify it, and encode it into the ID
    const customPayload = {
      name: name,
      address: fullDescription,
      latitude: geometry[1], // lat
      longitude: geometry[0], // lng
    };
    const securePlaceId = `photon-ctx-${encodeURIComponent(JSON.stringify(customPayload))}`;

    return {
      place_id: securePlaceId, // Pass this heavy token down to your click event
      description: fullDescription,
      main_text: name,
      secondary_text: `${street}${city}`.trim().replace(/,$/, "") || state,
    };
  });
}

export async function geocodeAddress(address: string) {
  // No API key checks needed!

  if (!address || !address.trim()) {
    throw new Error("Address string cannot be empty");
  }

  // Bounding box strictly for Odisha, India (minLon, minLat, maxLon, maxLat)
  const odishaBBox = "81.39,17.78,87.50,22.57";

  // Center point of Odisha to bias the search engine accuracy
  const odishaLat = "20.2961";
  const odishaLng = "85.8245";

  // Hit Photon's geocoding endpoint
  const url =
    `https://photon.komoot.io/api/` +
    `?q=${encodeURIComponent(address.trim())}` +
    `&limit=1` + // We only need the top matching result
    `&lang=en` +
    `&bbox=${odishaBBox}` +
    `&lat=${odishaLat}` +
    `&lon=${odishaLng}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data || !data.features || data.features.length === 0) {
    throw new Error(
      "Geocoding failed: No locations found matching that address in Odisha",
    );
  }

  const topResult = data.features[0];
  const props = topResult.properties;
  const geometry = topResult.geometry.coordinates; // [lng, lat]

  // Construct a clean, human-readable formatted address from OpenStreetMap attributes
  const name = props.name || "";
  const houseNumber = props.housenumber ? `${props.housenumber}, ` : "";
  const street = props.street ? `${props.street}, ` : "";
  const city = props.city || props.town || props.village || "";
  const state = props.state ? `, ${props.state}` : "";
  const postcode = props.postcode ? ` - ${props.postcode}` : "";

  // Combine elements smoothly
  let formattedAddress =
    `${name} ${name && (street || city) ? "-" : ""} ${houseNumber}${street}${city}${state}${postcode}`.trim();

  // Clean up any double spaces or accidental hanging hyphens
  formattedAddress = formattedAddress.replace(/\s+/g, " ").replace(/^-\s*/, "");

  return {
    latitude: geometry[1], // Photon returns coordinates as [lng, lat]
    longitude: geometry[0],
    formattedAddress: formattedAddress || address, // Fallback to input address if formatting fails
  };
}
