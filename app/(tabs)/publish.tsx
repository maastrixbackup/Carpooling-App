import {
  getPlaceDetails,
  PlaceSuggestion,
  searchIndiaPlaces,
} from "@/services/location.service";
import { getRouteOptionsApi, publishRideApi } from "@/services/ride.service";
import { getMyVehiclesApi } from "@/services/vehicle.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  AlertCircle,
  CalendarDays,
  Car,
  Check,
  Clock,
  IndianRupee,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Route,
  Search,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type DateOption = {
  id: string;
  label: string;
  dateText: string;
  fullText: string;
  value: string;
};

type PickedPlace = {
  address: string;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type RouteOption = {
  route_index: number;
  summary?: string;
  distance_text?: string;
  duration_text?: string;
  distance_meters?: number;
  duration_seconds?: number;
};

function getNextDates(): DateOption[] {
  const today = new Date();

  return Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      id: date.toISOString(),
      label:
        index === 0
          ? "Today"
          : index === 1
            ? "Tomorrow"
            : date.toLocaleDateString("en-IN", { weekday: "short" }),
      dateText: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      fullText: date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }),
      value: date.toISOString(),
    };
  });
}

const quickTimes = [
  "06:00 AM",
  "07:30 AM",
  "09:00 AM",
  "12:00 PM",
  "03:00 PM",
  "06:00 PM",
  "08:30 PM",
];

export default function PublishRideScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const dates = useMemo(() => getNextDates(), []);

  const [from, setFrom] = useState("Bhubaneswar");
  const [to, setTo] = useState("Cuttack");

  const [fromPlace, setFromPlace] = useState<PickedPlace>({
    address: "Bhubaneswar",
  });
  const [toPlace, setToPlace] = useState<PickedPlace>({
    address: "Cuttack",
  });

  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(
    null,
  );
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateOption>(dates[0]);
  const [time, setTime] = useState("09:30 AM");
  const [seats, setSeats] = useState(3);
  const [pricePerKm, setPricePerKm] = useState(10);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null,
  );
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const selectedRoute = routes.find(
    route => (route.route_index ?? 0) === selectedRouteIndex
  );

  const estimatedFullRoutePrice = useMemo(() => {
    if (!selectedRoute?.distance_meters) return 0;
    const distanceKm = selectedRoute.distance_meters / 1000;
    return Math.round(
      distanceKm * pricePerKm * seats
    );
  }, [selectedRoute, pricePerKm, seats]);

  const { data: vehiclesResponse, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: getMyVehiclesApi,
  });

  const vehicles = vehiclesResponse?.data?.vehicles || [];

  const selectedVehicle = vehicles.find(
    (item: any) => Number(item.id) === Number(selectedVehicleId),
  );

  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(Number(vehicles[0].id));
    }
  }, [vehicles, selectedVehicleId]);

  const isFormValid =
    !!from.trim() &&
    !!to.trim() &&
    !!time.trim() &&
    !!selectedVehicleId &&
    seats > 0 &&
    pricePerKm > 0 &&
    selectedRouteIndex !== null;

  const publishMutation = useMutation({
    mutationFn: publishRideApi,
    onSuccess: async () => {
      toast.success("Ride published successfully.");
      await queryClient.invalidateQueries({ queryKey: ["home-bootstrap"] });
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      router.push("/(tabs)/rides");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to publish ride.");
    },
  });

  const formatApiDate = (date: DateOption) => {
    const parsed = new Date(date.value);
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  };

  const convertTo24Hour = (timeText: string) => {
    const clean = timeText.trim().toUpperCase();
    const match = clean.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);

    if (!match) return null;

    let hour = Number(match[1]);
    const minute = match[2];
    const period = match[3];

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${minute}:00`;
  };

  const geocodeAddress = async (address: string) => {
    const result = await Location.geocodeAsync(address);

    if (!result.length) {
      throw new Error(`Unable to find location for ${address}`);
    }

    return {
      latitude: result[0].latitude,
      longitude: result[0].longitude,
    };
  };

  const getFinalPlace = async (place: PickedPlace, fallbackText: string) => {
    if (place.latitude && place.longitude) {
      return {
        address: place.address || fallbackText,
        placeId: place.placeId || null,
        latitude: Number(place.latitude),
        longitude: Number(place.longitude),
      };
    }

    const coords = await geocodeAddress(fallbackText);

    return {
      address: fallbackText,
      placeId: null,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  };

  const clearRoutes = () => {
    setRoutes([]);
    setSelectedRouteIndex(null);
  };

  const handleDetectLocation = async () => {
    try {
      setIsLocationLoading(true);

      const serviceEnabled = await Location.hasServicesEnabledAsync();

      if (!serviceEnabled) {
        toast.error("Please enable location services.");
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        toast.error("Please allow location access.");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });

      const addressList = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      const address = addressList[0];

      const city =
        address?.city ||
        address?.district ||
        address?.subregion ||
        address?.region ||
        address?.name ||
        "Current Location";

      setFrom(city);
      setFromPlace({
        address: city,
        placeId: null,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      clearRoutes();
      toast.success("Location detected.");
    } catch (error) {
      console.log("LOCATION ERROR:", error);
      toast.error("Unable to detect your current location.");
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleFetchRoutes = async () => {
    Keyboard.dismiss();

    if (!from.trim() || !to.trim()) {
      toast.error("Please select pickup and destination first.");
      return;
    }

    try {
      setLoadingRoutes(true);

      const source = await getFinalPlace(fromPlace, from.trim());
      const destination = await getFinalPlace(toPlace, to.trim());

      const response = await getRouteOptionsApi({
        source_lat: source.latitude,
        source_lng: source.longitude,
        destination_lat: destination.latitude,
        destination_lng: destination.longitude,
      });

      const routeList: RouteOption[] = response?.data?.routes || [];

      setRoutes(routeList);
      setSelectedRouteIndex(routeList.length > 0 ? routeList[0].route_index ?? 0 : null);

      if (routeList.length > 0) {
        toast.success(`${routeList.length} route option${routeList.length > 1 ? "s" : ""} found.`);
      } else {
        toast.error("No route found between these locations.");
      }
    } catch (error: any) {
      console.log("ROUTE FETCH ERROR:", error);
      setRoutes([]);
      setSelectedRouteIndex(null);
      toast.error(error?.message || "Unable to fetch routes.");
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handlePublish = async () => {
    Keyboard.dismiss();

    if (!isFormValid) {
      toast.error("Please complete all details and select a route.");
      return;
    }

    const departureTime = convertTo24Hour(time);

    if (!departureTime) {
      toast.error("Please enter time like 09:30 AM.");
      return;
    }

    if (!selectedVehicle) {
      toast.error("Please select a vehicle.");
      return;
    }

    try {
      const source = await getFinalPlace(fromPlace, from.trim());
      const destination = await getFinalPlace(toPlace, to.trim());

      publishMutation.mutate({
        vehicle_id: selectedVehicle.id,

        source_address: source.address,
        source_place_id: source.placeId,
        source_lat: source.latitude,
        source_lng: source.longitude,

        destination_address: destination.address,
        destination_place_id: destination.placeId,
        destination_lat: destination.latitude,
        destination_lng: destination.longitude,

        selected_route_index: selectedRouteIndex ?? 0,

        ride_date: formatApiDate(selectedDate),
        departure_time: departureTime,

        pet_allowed: "no",
        smoking_allowed: "no",
        instant_booking: "yes",
        max_two_in_back: "yes",
        price_per_km: pricePerKm,
        price_per_seat: 0,
        total_seats: seats,
        available_seats: seats,
      });
    } catch (error: any) {
      console.log("PUBLISH LOCATION ERROR:", error);
      toast.error(error?.message || "Unable to prepare ride location.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: Platform.OS === "android" ? 16 : 12,
              paddingBottom: 230,
            }}
          >
            <Header />

            <Card>
              <PlaceInput
                icon={<MapPin size={18} color={colors.primary} />}
                label="From"
                value={from}
                onChangeText={(value) => {
                  setFrom(value);
                  setFromPlace({ address: value });
                  clearRoutes();
                }}
                onSelectPlace={(place) => {
                  setFrom(place.address);
                  setFromPlace(place);
                  clearRoutes();
                }}
                onDetectLocation={handleDetectLocation}
                isLoading={isLocationLoading}
              />

              <PlaceInput
                icon={<Search size={18} color={colors.success} />}
                label="To"
                value={to}
                onChangeText={(value) => {
                  setTo(value);
                  setToPlace({ address: value });
                  clearRoutes();
                }}
                onSelectPlace={(place) => {
                  setTo(place.address);
                  setToPlace(place);
                  clearRoutes();
                }}
                last
              />
            </Card>

            <SectionTitle
              title="Route Selection"
              subtitle="Choose the exact road route passengers can join from."
            />

            <Card>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleFetchRoutes}
                disabled={loadingRoutes}
                style={{
                  backgroundColor: colors.primary,
                  opacity: loadingRoutes ? 0.75 : 1,
                }}
                className="rounded-2xl py-4"
              >
                {loadingRoutes ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-center font-extrabold text-white">
                    Find Routes
                  </Text>
                )}
              </TouchableOpacity>

              {routes.length > 0 && (
                <View className="mt-4 gap-3">
                  {routes.map((route, index) => {
                    const routeIndex = route.route_index ?? index;
                    const selected = selectedRouteIndex === routeIndex;

                    return (
                      <TouchableOpacity
                        key={`${routeIndex}-${route.summary || index}`}
                        activeOpacity={0.85}
                        onPress={() => setSelectedRouteIndex(routeIndex)}
                        style={{
                          backgroundColor: selected
                            ? colors.primarySoft
                            : colors.input,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                        }}
                        className="rounded-2xl border p-4"
                      >
                        <View className="flex-row items-center justify-between gap-3">
                          <View className="flex-row flex-1 items-center gap-3">
                            <View
                              style={{
                                backgroundColor: selected
                                  ? colors.primary
                                  : colors.card,
                              }}
                              className="h-10 w-10 items-center justify-center rounded-2xl"
                            >
                              <Route
                                size={18}
                                color={selected ? "#FFFFFF" : colors.primary}
                              />
                            </View>

                            <View className="flex-1">
                              <Text
                                style={{ color: colors.text }}
                                className="font-extrabold"
                                numberOfLines={1}
                              >
                                {route.summary || `Route ${index + 1}`}
                              </Text>

                              <Text
                                style={{ color: colors.muted }}
                                className="mt-1 text-xs font-semibold"
                              >
                                {route.distance_text || "Distance unavailable"} •{" "}
                                {route.duration_text || "Duration unavailable"}
                              </Text>
                            </View>
                          </View>

                          {selected && <Check size={20} color={colors.primary} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Card>

            <SectionTitle title="Schedule" subtitle="Set a date and flexible departure time." />

            <Card>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setDateModalVisible(true)}
                style={{ backgroundColor: colors.input }}
                className="mb-4 flex-row items-center gap-3 rounded-2xl px-4 py-4"
              >
                <CalendarDays size={19} color={colors.primary} />

                <View className="flex-1">
                  <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
                    Date
                  </Text>
                  <Text style={{ color: colors.text }} className="mt-1 text-base font-extrabold">
                    {selectedDate.fullText}
                  </Text>
                </View>

                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="rounded-full px-3 py-1.5"
                >
                  <Text style={{ color: colors.primary }} className="text-xs font-bold">
                    Change
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={{ backgroundColor: colors.input }} className="rounded-2xl px-4 py-3">
                <View className="mb-2 flex-row items-center gap-3">
                  <Clock size={18} color={colors.primary} />
                  <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
                    Departure Time
                  </Text>
                </View>

                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="Example: 09:30 AM"
                  placeholderTextColor={colors.muted}
                  autoCorrect={false}
                  style={{ color: colors.text }}
                  className="text-base font-extrabold"
                />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-4"
                  contentContainerStyle={{ gap: 8 }}
                >
                  {quickTimes.map((item) => {
                    const selected = item === time;

                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.85}
                        onPress={() => setTime(item)}
                        style={{
                          backgroundColor: selected ? colors.primary : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        }}
                        className="rounded-full border px-4 py-2"
                      >
                        <Text
                          style={{ color: selected ? "#FFFFFF" : colors.text }}
                          className="text-xs font-bold"
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Card>

            <SectionTitle title="Vehicle Details" subtitle="Select a vehicle for this ride." />

            <Card>
              {vehiclesLoading ? (
                <View className="items-center py-4">
                  <ActivityIndicator color={colors.primary} />
                  <Text style={{ color: colors.muted }} className="mt-2 text-xs font-bold">
                    Loading vehicles...
                  </Text>
                </View>
              ) : vehicles.length === 0 ? (
                <View className="items-center py-4">
                  <Car size={28} color={colors.muted} />
                  <Text style={{ color: colors.text }} className="mt-3 font-extrabold">
                    No vehicle added
                  </Text>
                  <Text style={{ color: colors.muted }} className="mt-1 text-center text-xs">
                    Add a vehicle before publishing a ride.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push("/vehicles")}
                    style={{ backgroundColor: colors.primary }}
                    className="mt-4 rounded-2xl px-5 py-3"
                  >
                    <Text className="font-extrabold text-white">Add Vehicle</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="gap-3">
                  {vehicles.map((vehicle: any) => {
                    const selected = Number(selectedVehicleId) === Number(vehicle.id);

                    return (
                      <TouchableOpacity
                        key={vehicle.id}
                        activeOpacity={0.85}
                        onPress={() => setSelectedVehicleId(Number(vehicle.id))}
                        style={{
                          backgroundColor: selected ? colors.primarySoft : colors.input,
                          borderColor: selected ? colors.primary : colors.border,
                        }}
                        className="flex-row items-center gap-3 rounded-2xl border px-4 py-4"
                      >
                        <View
                          style={{ backgroundColor: selected ? colors.primary : colors.card }}
                          className="h-11 w-11 items-center justify-center rounded-2xl"
                        >
                          <Car size={20} color={selected ? "#FFFFFF" : colors.primary} />
                        </View>

                        <View className="flex-1">
                          <Text style={{ color: colors.text }} className="font-extrabold">
                            {vehicle.brand} {vehicle.model}
                          </Text>
                          <Text style={{ color: colors.muted }} className="mt-1 text-xs font-semibold">
                            {vehicle.registration_number} • {vehicle.color || "Vehicle"}
                          </Text>
                        </View>

                        {selected && <Check size={20} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Card>

            <SectionTitle
              title="Seats & KM Price"
              subtitle="Passengers will pay based on the distance they travel."
            />

            <View className="flex-row gap-3">
              <CounterCard
                icon={<Users size={20} color={colors.primary} />}
                label="Seats"
                value={seats}
                onMinus={() => setSeats((prev) => Math.max(1, prev - 1))}
                onPlus={() => setSeats((prev) => Math.min(6, prev + 1))}
              />

              <CounterCard
                icon={<IndianRupee size={20} color={colors.primary} />}
                label="Per KM"
                value={pricePerKm}
                prefix="₹"
                onMinus={() => setPricePerKm((prev) => Math.max(1, prev - 1))}
                onPlus={() => setPricePerKm((prev) => prev + 1)}
              />
            </View>

            <View
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
              className="mt-7 rounded-[30px] border p-5"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
                    Estimated earning
                  </Text>
                  <Text style={{ color: colors.text }} className="mt-2 text-3xl font-extrabold">
                    {estimatedFullRoutePrice > 0
                      ? `₹${estimatedFullRoutePrice}`
                      : "--"}
                  </Text>
                </View>

                <View
                  style={{ backgroundColor: colors.primarySoft }}
                  className="rounded-2xl px-4 py-2"
                >
                  <Text style={{ color: colors.primary }} className="text-xs font-extrabold">
                    {seats} seat{seats > 1 ? "s" : ""} × ₹{pricePerKm}/km
                  </Text>
                </View>
              </View>

              <Text style={{ color: colors.muted }} className="mt-3 text-xs leading-5">
                Estimated for full route. Passengers can book partial route and pay only for their travelled distance.
              </Text>
            </View>

            {!isFormValid && (
              <View
                style={{ backgroundColor: colors.dangerSoft }}
                className="mt-5 flex-row items-start gap-3 rounded-2xl px-4 py-3"
              >
                <AlertCircle size={18} color={colors.danger} />
                <Text style={{ color: colors.danger }} className="flex-1 text-xs font-bold leading-5">
                  Complete all required fields and select a route to publish your ride.
                </Text>
              </View>
            )}
          </ScrollView>

          <View
            style={{
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            }}
            className="absolute bottom-[78px] left-0 right-0 border-t px-5 pb-4 pt-4"
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
                  {from || "From"} → {to || "To"}
                </Text>
                <Text style={{ color: colors.text }} className="mt-1 font-extrabold">
                  {selectedDate.label} • {time} • {seats} seat{seats > 1 ? "s" : ""}
                </Text>
              </View>

              <Text style={{ color: colors.primary }} className="text-xl font-extrabold">
                ₹{pricePerKm}/km
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePublish}
              disabled={!isFormValid || publishMutation.isPending}
              style={{
                backgroundColor: isFormValid ? colors.primary : colors.muted,
                opacity: publishMutation.isPending ? 0.75 : 1,
              }}
              className="rounded-2xl py-4"
            >
              {publishMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-center text-base font-extrabold text-white">
                  Publish Ride
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <DatePickerModal
          visible={dateModalVisible}
          dates={dates}
          selectedDate={selectedDate}
          onClose={() => setDateModalVisible(false)}
          onSelect={(date) => {
            setSelectedDate(date);
            setDateModalVisible(false);
          }}
        />
      </SafeAreaView>
    </View>
  );
}
function PlaceInput({
  icon,
  label,
  value,
  onChangeText,
  onSelectPlace,
  onDetectLocation,
  isLoading,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onSelectPlace: (place: PickedPlace) => void;
  onDetectLocation?: () => void;
  isLoading?: boolean;
  last?: boolean;
}) {
  const { colors } = useAppTheme();

  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);

  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(async () => {
      try {
        if (!focused || value.trim().length < 2) {
          if (mounted) setSuggestions([]);
          return;
        }

        setSearching(true);
        const results = await searchIndiaPlaces(value);

        if (mounted) {
          setSuggestions(results);
        }
      } catch (error) {
        console.log("PLACE SEARCH ERROR:", error);
      } finally {
        if (mounted) setSearching(false);
      }
    }, 350);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [value, focused]);

  const handleSelect = async (place: PlaceSuggestion) => {
    try {
      setSearching(true);

      const details = await getPlaceDetails(place.place_id);

      onSelectPlace({
        address: details.address,
        placeId: details.placeId,
        latitude: details.latitude,
        longitude: details.longitude,
      });

      setSuggestions([]);
      setFocused(false);
      Keyboard.dismiss();
    } catch (error) {
      console.log("PLACE DETAILS ERROR:", error);
      toast.error("Unable to select this location.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <View className={last ? "" : "mb-4"}>
      <View
        style={{ backgroundColor: colors.input }}
        className="min-h-[56px] flex-row items-center gap-3 rounded-2xl px-4 py-3"
      >
        {icon}

        <View className="flex-1">
          <Text style={{ color: colors.muted }} className="mb-1 text-xs font-bold uppercase">
            {label}
          </Text>

          <TextInput
            value={value}
            onFocus={() => setFocused(true)}
            onChangeText={onChangeText}
            placeholder={label}
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            style={{ color: colors.text }}
            className="text-base font-semibold"
          />
        </View>

        {searching && <ActivityIndicator size="small" color={colors.primary} />}

        {value.length > 0 && !searching && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              onChangeText("");
              setSuggestions([]);
            }}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.card }}
          >
            <X size={16} color={colors.muted} />
          </TouchableOpacity>
        )}

        {onDetectLocation && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDetectLocation}
            disabled={isLoading}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.card }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <LocateFixed size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {focused && suggestions.length > 0 && (
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
          className="mt-2 overflow-hidden rounded-2xl border"
        >
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              activeOpacity={0.85}
              onPress={() => handleSelect(item)}
              style={{ borderBottomColor: colors.border }}
              className="flex-row items-start gap-3 border-b px-4 py-3"
            >
              <View
                style={{ backgroundColor: colors.primarySoft }}
                className="mt-0.5 h-9 w-9 items-center justify-center rounded-full"
              >
                <MapPin size={16} color={colors.primary} />
              </View>

              <View className="flex-1">
                <Text
                  style={{ color: colors.text }}
                  className="font-extrabold"
                  numberOfLines={1}
                >
                  {item.main_text}
                </Text>
                <Text
                  style={{ color: colors.muted }}
                  className="mt-1 text-xs font-semibold"
                  numberOfLines={2}
                >
                  {item.secondary_text || item.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function Header() {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1">
        <Text style={{ color: colors.muted }} className="text-sm font-semibold">
          Driver mode
        </Text>
        <Text style={{ color: colors.text }} className="mt-1 text-3xl font-extrabold">
          Publish Ride
        </Text>
        <Text style={{ color: colors.muted }} className="mt-2 text-sm">
          Create a ride listing for passengers nearby.
        </Text>
      </View>

      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-12 w-12 items-center justify-center rounded-full"
      >
        <Car size={23} color={colors.primary} />
      </View>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className="rounded-[30px] border p-4"
    >
      {children}
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-3 mt-7">
      <Text style={{ color: colors.text }} className="text-lg font-extrabold">
        {title}
      </Text>
      <Text style={{ color: colors.muted }} className="mt-1 text-xs">
        {subtitle}
      </Text>
    </View>
  );
}

// function RoutePreview({ from, to }: { from: string; to: string }) {
//   const { colors } = useAppTheme();

//   return (
//     <View
//       style={{ backgroundColor: colors.input, borderColor: colors.border }}
//       className="mt-4 rounded-[26px] border p-4"
//     >
//       <View className="flex-row items-center gap-3">
//         <View
//           style={{ backgroundColor: colors.primary }}
//           className="h-10 w-10 items-center justify-center rounded-full"
//         >
//           <MapPin size={18} color="#FFFFFF" />
//         </View>

//         <View className="h-1 flex-1 rounded-full bg-blue-500/30" />

//         <View
//           style={{ backgroundColor: colors.success }}
//           className="h-10 w-10 items-center justify-center rounded-full"
//         >
//           <Route size={18} color="#FFFFFF" />
//         </View>
//       </View>

//       <View className="mt-4 flex-row justify-between gap-4">
//         <View className="flex-1">
//           <Text style={{ color: colors.muted }} className="text-xs">
//             Start
//           </Text>
//           <Text style={{ color: colors.text }} className="mt-1 font-extrabold" numberOfLines={1}>
//             {from || "Starting city"}
//           </Text>
//         </View>

//         <View className="flex-1 items-end">
//           <Text style={{ color: colors.muted }} className="text-xs">
//             Destination
//           </Text>
//           <Text style={{ color: colors.text }} className="mt-1 text-right font-extrabold" numberOfLines={1}>
//             {to || "Destination city"}
//           </Text>
//         </View>
//         <SectionTitle
//           title="Route Selection"
//           subtitle="Choose your preferred route."
//         />

//         <Card>
//           <TouchableOpacity
//             activeOpacity={0.85}
//             onPress={handleFetchRoutes}
//             style={{ backgroundColor: colors.primary }}
//             className="rounded-2xl py-4"
//           >
//             {loadingRoutes ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text className="text-center font-extrabold text-white">
//                 Find Routes
//               </Text>
//             )}
//           </TouchableOpacity>

//           {routes.length > 0 && (
//             <View className="mt-4 gap-3">
//               {routes.map((route) => {
//                 const selected =
//                   selectedRouteIndex === route.route_index;

//                 return (
//                   <TouchableOpacity
//                     key={route.route_index}
//                     activeOpacity={0.85}
//                     onPress={() =>
//                       setSelectedRouteIndex(route.route_index)
//                     }
//                     style={{
//                       backgroundColor: selected
//                         ? colors.primarySoft
//                         : colors.input,
//                       borderColor: selected
//                         ? colors.primary
//                         : colors.border,
//                     }}
//                     className="rounded-2xl border p-4"
//                   >
//                     <View className="flex-row justify-between">
//                       <Text
//                         style={{ color: colors.text }}
//                         className="font-extrabold"
//                       >
//                         {route.summary || "Recommended Route"}
//                       </Text>

//                       {selected && (
//                         <Check
//                           size={18}
//                           color={colors.primary}
//                         />
//                       )}
//                     </View>

//                     <Text
//                       style={{ color: colors.muted }}
//                       className="mt-2 text-xs"
//                     >
//                       {route.distance_text}
//                     </Text>

//                     <Text
//                       style={{ color: colors.muted }}
//                       className="mt-1 text-xs"
//                     >
//                       {route.duration_text}
//                     </Text>
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           )}
//         </Card>
//       </View>
//     </View>
//   );
// }

function AppInput({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  last,
  autoCapitalize,
  rightAction,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  last?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  rightAction?: React.ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View className={last ? "" : "mb-4"}>
      <Text style={{ color: colors.muted }} className="mb-2 text-xs font-bold uppercase">
        {label}
      </Text>

      <View
        style={{ backgroundColor: colors.input }}
        className="min-h-[56px] flex-row items-center gap-3 rounded-2xl px-4 py-3"
      >
        {icon}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCapitalize={autoCapitalize}
          style={{ color: colors.text }}
          className="flex-1 text-base font-semibold"
        />

        {rightAction}
      </View>
    </View>
  );
}

function CounterCard({
  icon,
  label,
  value,
  onMinus,
  onPlus,
  prefix = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  prefix?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="flex-1 rounded-[26px] border p-4"
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text style={{ color: colors.muted }} className="font-bold">
          {label}
        </Text>
      </View>

      <Text style={{ color: colors.text }} className="mt-4 text-3xl font-extrabold">
        {prefix}
        {value}
      </Text>

      <View className="mt-4 flex-row gap-2">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onMinus}
          style={{ backgroundColor: colors.input }}
          className="h-12 flex-1 items-center justify-center rounded-2xl"
        >
          <Minus size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPlus}
          style={{ backgroundColor: colors.primary }}
          className="h-12 flex-1 items-center justify-center rounded-2xl"
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DatePickerModal({
  visible,
  dates,
  selectedDate,
  onClose,
  onSelect,
}: {
  visible: boolean;
  dates: DateOption[];
  selectedDate: DateOption;
  onClose: () => void;
  onSelect: (date: DateOption) => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
          className="rounded-t-[34px] border px-5 pb-8 pt-5"
        >
          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.text }} className="text-xl font-extrabold">
                Select date
              </Text>
              <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                Choose your ride departure date
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={{ backgroundColor: colors.input }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {dates.map((date) => {
              const selected = date.id === selectedDate.id;

              return (
                <TouchableOpacity
                  key={date.id}
                  activeOpacity={0.85}
                  onPress={() => onSelect(date)}
                  style={{
                    backgroundColor: selected ? colors.primary : colors.input,
                    borderColor: selected ? colors.primary : colors.border,
                    width: "30.8%",
                  }}
                  className="items-center rounded-2xl border px-2 py-4"
                >
                  <Text
                    style={{ color: selected ? "#FFFFFF" : colors.muted }}
                    className="text-xs font-bold"
                  >
                    {date.label}
                  </Text>

                  <Text
                    style={{ color: selected ? "#FFFFFF" : colors.text }}
                    className="mt-1 font-extrabold"
                  >
                    {date.dateText}
                  </Text>

                  {selected && (
                    <View className="mt-2">
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}