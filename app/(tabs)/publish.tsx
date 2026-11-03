import {
  getPlaceDetails,
  PlaceSuggestion,
  searchIndiaPlaces,
} from "@/services/location.service";
import { getRouteOptionsApi, publishRideApi } from "@/services/ride.service";
import { getMyVehiclesApi } from "@/services/vehicle.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  Users,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

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

function getInitialRideTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 60);
  return date;
}

function formatApiDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatApiTime(date: Date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDisplayTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDepartureDateTime(rideDate: Date, rideTime: Date) {
  const date = new Date(rideDate);
  date.setHours(rideTime.getHours(), rideTime.getMinutes(), 0, 0);
  return date;
}

export default function PublishRideScreen() {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();

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
  const [seats, setSeats] = useState(3);
  const [pricePerKm, setPricePerKm] = useState(10);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null,
  );
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const [rideDate, setRideDate] = useState(new Date());
  const [rideTime, setRideTime] = useState(getInitialRideTime());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const insets = useSafeAreaInsets();
  const bottomBarHeight = 126 + Math.max(insets.bottom, 12);

  const selectedRoute = routes.find(
    (route) => (route.route_index ?? 0) === selectedRouteIndex,
  );

  const departureDateTime = useMemo(
    () => getDepartureDateTime(rideDate, rideTime),
    [rideDate, rideTime],
  );

  const isFutureDeparture = departureDateTime.getTime() > Date.now();

  const estimatedFullRoutePrice = useMemo(() => {
    if (!selectedRoute?.distance_meters) return 0;
    const distanceKm = selectedRoute.distance_meters / 1000;
    return Math.round(distanceKm * pricePerKm * seats);
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
    !!selectedVehicleId &&
    seats > 0 &&
    pricePerKm > 0 &&
    selectedRouteIndex !== null &&
    isFutureDeparture;

  const publishMutation = useMutation({
    mutationFn: publishRideApi,
    onSuccess: async () => {
      toast.success("Ride published successfully.");
      await queryClient.invalidateQueries({ queryKey: ["home-bootstrap"] });
      await queryClient.invalidateQueries({ queryKey: ["rides"] });
      await queryClient.invalidateQueries({ queryKey: ["my-rides"] });
      router.push("/(tabs)/rides");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to publish ride.");
    },
  });

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
      setSelectedRouteIndex(
        routeList.length > 0 ? routeList[0].route_index ?? 0 : null,
      );

      if (routeList.length > 0) {
        toast.success(
          `${routeList.length} route option${routeList.length > 1 ? "s" : ""
          } found.`,
        );
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

    if (!selectedVehicle) {
      toast.error("Please select a vehicle.");
      return;
    }

    if (selectedRouteIndex === null) {
      toast.error("Please find and select a route.");
      return;
    }

    if (!isFutureDeparture) {
      toast.error("Please select a future departure date and time.");
      return;
    }

    if (!isFormValid) {
      toast.error("Please complete all ride details.");
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

        ride_date: formatApiDate(rideDate),
        departure_time: formatApiTime(rideTime),

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

  const handleDateChange = (_event: any, selected?: Date) => {
    setShowDatePicker(false);

    if (!selected) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cleanSelected = new Date(selected);
    cleanSelected.setHours(0, 0, 0, 0);

    if (cleanSelected.getTime() < today.getTime()) {
      toast.error("Past dates are not allowed.");
      return;
    }

    setRideDate(cleanSelected);
  };

  const handleTimeChange = (_event: any, selected?: Date) => {
    setShowTimePicker(false);

    if (!selected) return;

    setRideTime(selected);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Header />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: Platform.OS === "android" ? 16 : 12,
              paddingBottom: 150,
            }}
          >

            <PublishRouteInputCard
              from={from}
              to={to}
              onChangeFrom={(value) => {
                setFrom(value);
                setFromPlace({ address: value });
                clearRoutes();
              }}
              onChangeTo={(value) => {
                setTo(value);
                setToPlace({ address: value });
                clearRoutes();
              }}
              onSelectFrom={(place) => {
                setFrom(place.address);
                setFromPlace(place);
                clearRoutes();
              }}
              onSelectTo={(place) => {
                setTo(place.address);
                setToPlace(place);
                clearRoutes();
              }}
              onClearFrom={() => {
                setFrom("");
                setFromPlace({ address: "" });
                clearRoutes();
              }}
              onClearTo={() => {
                setTo("");
                setToPlace({ address: "" });
                clearRoutes();
              }}
              onDetectLocation={handleDetectLocation}
              isLocationLoading={isLocationLoading}
            />

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
                <View className="mt-2 gap-3">
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
                          <View className="flex-1 flex-row items-center gap-3">
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

            <SectionTitle
              title="Schedule"
              subtitle="Select date and departure time using native picker."
            />

            <Card>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowDatePicker(true)}
                style={{ backgroundColor: colors.input }}
                className="mb-4 flex-row items-center gap-3 rounded-2xl px-4"
              >
                <CalendarDays size={20} color={colors.primary} />

                <View className="flex-1">
                  <Text
                    style={{ color: colors.muted }}
                    className="text-xs font-bold uppercase"
                  >
                    Ride Date
                  </Text>
                  <Text
                    style={{ color: colors.text }}
                    className="mt-1 text-base font-extrabold"
                  >
                    {formatDisplayDate(rideDate)}
                  </Text>
                </View>

                <Text style={{ color: colors.primary }} className="text-xs font-bold">
                  Change
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowTimePicker(true)}
                style={{ backgroundColor: colors.input }}
                className="flex-row items-center gap-3 rounded-2xl px-4 py-4"
              >
                <Clock size={20} color={colors.primary} />

                <View className="flex-1">
                  <Text
                    style={{ color: colors.muted }}
                    className="text-xs font-bold uppercase"
                  >
                    Departure Time
                  </Text>
                  <Text
                    style={{ color: colors.text }}
                    className="mt-1 text-base font-extrabold"
                  >
                    {formatDisplayTime(rideTime)}
                  </Text>
                </View>

                <Text style={{ color: colors.primary }} className="text-xs font-bold">
                  Change
                </Text>
              </TouchableOpacity>

              {!isFutureDeparture && (
                <View
                  style={{ backgroundColor: colors.dangerSoft }}
                  className="mt-4 flex-row items-start gap-2 rounded-2xl px-4 py-3"
                >
                  <AlertCircle size={16} color={colors.danger} />
                  <Text
                    style={{ color: colors.danger }}
                    className="flex-1 text-xs font-bold leading-5"
                  >
                    Selected departure time is already past. Please choose a future time.
                  </Text>
                </View>
              )}
            </Card>

            <SectionTitle
              title="Vehicle Details"
              subtitle="Select a vehicle for this ride."
            />

            <Card>
              {vehiclesLoading ? (
                <View className="items-center py-2">
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
                          style={{
                            backgroundColor: selected ? colors.primary : colors.card,
                          }}
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

            <SummaryCard
              estimatedFullRoutePrice={estimatedFullRoutePrice}
              seats={seats}
              pricePerKm={pricePerKm}
              selectedRoute={selectedRoute}
            />

            {!isFormValid && (
              <View
                style={{ backgroundColor: colors.dangerSoft }}
                className="mt-5 flex-row items-start gap-3 rounded-2xl px-4 py-3"
              >
                <AlertCircle size={18} color={colors.danger} />
                <Text
                  style={{ color: colors.danger }}
                  className="flex-1 text-xs font-bold leading-5"
                >
                  Complete all required fields, select a future schedule, and choose a route.
                </Text>
              </View>
            )}
          </ScrollView>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              value={rideDate}
              minimumDate={new Date()}
              onValueChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              mode="time"
              value={rideTime}
              is24Hour={false}
              onValueChange={handleTimeChange}
            />
          )}

          <BottomPublishBar
            from={from}
            to={to}
            rideDate={rideDate}
            rideTime={rideTime}
            seats={seats}
            pricePerKm={pricePerKm}
            isFormValid={isFormValid}
            loading={publishMutation.isPending}
            onPress={handlePublish}
            bottomInset={insets.bottom}
          />
        </KeyboardAvoidingView>
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

        if (mounted) setSuggestions(results);
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
    <View
      style={{
        backgroundColor: colors.bg,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 10 : 8,
        paddingBottom: 12,
        zIndex: 50,
        ...Platform.select({
          ios: {
            shadowColor: "#000000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.05,
            shadowRadius: 7,
          },
          android: {
            elevation: 3,
          },
        }),
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          style={{
            backgroundColor: colors.primarySoft,
            borderColor: colors.border,
          }}
          className="h-11 w-11 items-center justify-center rounded-2xl border"
        >
          <Car size={21} color={colors.primary} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              style={{ color: colors.text }}
              className="text-xl font-extrabold"
              numberOfLines={1}
            >
              Publish Ride
            </Text>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="rounded-full px-2.5 py-1"
            >
              <Text
                style={{ color: colors.primary }}
                className="text-[10px] font-extrabold uppercase tracking-wide"
              >
                Driver
              </Text>
            </View>
          </View>

          <Text
            style={{ color: colors.muted }}
            className="mt-0.5 text-xs font-semibold"
            numberOfLines={1}
          >
            Create a route and start earning from empty seats
          </Text>
        </View>
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
      className="rounded-[24px] border p-4"
    >
      {children}
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-2.5 mt-5 px-0.5">
      <Text
        style={{ color: colors.text }}
        className="text-[17px] font-extrabold"
      >
        {title}
      </Text>

      <Text
        style={{ color: colors.muted }}
        className="mt-1 text-xs leading-4"
      >
        {subtitle}
      </Text>
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
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className="flex-1 rounded-[24px] border px-4 py-5"
    >
      {/* Header */}
      <View className="flex-row items-center gap-2">
        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="h-10 w-10 items-center justify-center rounded-2xl"
        >
          {icon}
        </View>

        <View className="flex-1">
          <Text
            style={{ color: colors.muted }}
            className="text-xs font-bold uppercase"
          >
            {label}
          </Text>
        </View>
      </View>

      {/* Counter */}
      <View className="mt-6 flex-row items-center justify-between">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onMinus}
          style={{
            backgroundColor: colors.input,
            borderColor: colors.border,
          }}
          className="h-12 w-12 items-center justify-center rounded-2xl border"
        >
          <Minus size={18} color={colors.text} />
        </TouchableOpacity>

        <View className="items-center flex-1">
          <Text
            style={{ color: colors.text }}
            className="text-[30px] font-black"
          >
            {prefix}
            {value}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPlus}
          style={{
            backgroundColor: colors.primary,
          }}
          className="h-12 w-12 items-center justify-center rounded-2xl"
        >
          <Plus size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryCard({
  estimatedFullRoutePrice,
  seats,
  pricePerKm,
  selectedRoute,
}: {
  estimatedFullRoutePrice: number;
  seats: number;
  pricePerKm: number;
  selectedRoute?: RouteOption;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className=" rounded-[30px] border p-5"
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
            Estimated earning
          </Text>
          <Text style={{ color: colors.text }} className="mt-2 text-3xl font-extrabold">
            {estimatedFullRoutePrice > 0 ? `₹${estimatedFullRoutePrice}` : "--"}
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
        {selectedRoute
          ? `${selectedRoute.distance_text || "Distance unavailable"} • ${selectedRoute.duration_text || "Duration unavailable"
          }`
          : "Select route to calculate full route earning."}
      </Text>
    </View>
  );
}

function BottomPublishBar({
  from,
  to,
  rideDate,
  rideTime,
  seats,
  pricePerKm,
  isFormValid,
  loading,
  bottomInset,
  onPress,
}: {
  from: string;
  to: string;
  rideDate: Date;
  rideTime: Date;
  seats: number;
  pricePerKm: number;
  isFormValid: boolean;
  loading: boolean;
  bottomInset: number;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
        // paddingBottom: Math.max(bottomInset, 14),
        ...Platform.select({
          ios: {
            shadowColor: "#000000",
            shadowOffset: {
              width: 0,
              height: -4,
            },
            shadowOpacity: 0.07,
            shadowRadius: 12,
          },
          android: {
            elevation: 12,
          },
        }),
      }}
    >
      <View className="mb-2.5 flex-row items-center gap-12">
        <View className="flex-1">
          <Text
            style={{ color: colors.text }}
            className="text-sm font-extrabold"
            numberOfLines={1}
          >
            {from || "From"} → {to || "To"}
          </Text>

          <Text
            style={{ color: colors.muted }}
            className="mt-1 text-[11px] font-semibold"
            numberOfLines={1}
          >
            {formatDisplayTime(rideTime)} • {seats} seat
            {seats > 1 ? "s" : ""}
          </Text>
        </View>

        <View className="items-end">
          <Text
            style={{ color: colors.primary }}
            className="text-lg font-extrabold"
          >
            ₹{pricePerKm}/km
          </Text>

          <Text
            style={{ color: colors.muted }}
            className="text-[10px] font-semibold"
          >
            Passenger rate
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={!isFormValid || loading}
        style={{
          backgroundColor: isFormValid
            ? colors.primary
            : colors.muted,
          opacity: loading ? 0.75 : 1,
          minHeight: 54,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-base font-extrabold text-white">
            {isFormValid
              ? "Publish Ride"
              : "Complete Ride Details"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}


function ConnectedPlaceInput({
  value,
  placeholder,
  onChangeText,
  onSelectPlace,
  onClear,
  rightAction,
}: {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onSelectPlace: (place: PickedPlace) => void;
  onClear: () => void;
  rightAction?: React.ReactNode;
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
          if (mounted) {
            setSuggestions([]);
          }
          return;
        }

        setSearching(true);

        const results = await searchIndiaPlaces(value);

        if (mounted) {
          setSuggestions(results);
        }
      } catch (error) {
        console.log("PLACE SEARCH ERROR:", error);

        if (mounted) {
          setSuggestions([]);
        }
      } finally {
        if (mounted) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [focused, value]);

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
    <View
      style={{
        flex: 1,
        position: "relative",
        zIndex: focused ? 999 : 1,
      }}
    >
      <View
        style={{
          height: 56,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TextInput
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              setFocused(false);
            }, 180);
          }}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          returnKeyType="next"
          style={{
            flex: 1,
            height: "100%",
            color: colors.text,
            fontSize: 15,
            fontWeight: "600",
            paddingVertical: 0,
          }}
        />

        {searching ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginLeft: 8 }}
          />
        ) : value.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              onClear();
              setSuggestions([]);
            }}
            style={{
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              backgroundColor: colors.input,
              marginLeft: 8,
            }}
          >
            <X size={13} color={colors.muted} />
          </TouchableOpacity>
        ) : null}

        {rightAction}
      </View>

      {focused && suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 58,
            left: -48,
            right: -16,
            maxHeight: 260,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 18,
            overflow: "hidden",
            zIndex: 9999,
            elevation: 16,
            ...Platform.select({
              ios: {
                shadowColor: "#000000",
                shadowOffset: {
                  width: 0,
                  height: 6,
                },
                shadowOpacity: 0.13,
                shadowRadius: 16,
              },
            }),
          }}
        >
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.slice(0, 5).map((item, index) => (
              <TouchableOpacity
                key={item.place_id}
                activeOpacity={0.8}
                onPress={() => handleSelect(item)}
                style={{
                  minHeight: 58,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 11,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderBottomWidth:
                    index < Math.min(suggestions.length, 5) - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: colors.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MapPin size={15} color={colors.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                    numberOfLines={1}
                  >
                    {item.main_text}
                  </Text>

                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 11,
                      marginTop: 3,
                    }}
                    numberOfLines={1}
                  >
                    {item.secondary_text || item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}


function PublishRouteInputCard({
  from,
  to,
  onChangeFrom,
  onChangeTo,
  onSelectFrom,
  onSelectTo,
  onClearFrom,
  onClearTo,
  onDetectLocation,
  isLocationLoading,
}: {
  from: string;
  to: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  onSelectFrom: (place: PickedPlace) => void;
  onSelectTo: (place: PickedPlace) => void;
  onClearFrom: () => void;
  onClearTo: () => void;
  onDetectLocation: () => void;
  isLocationLoading: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 24,
        zIndex: 100,
        elevation: 5,
      }}
    >
      {/* Pickup row */}
      <View
        style={{
          minHeight: 58,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          zIndex: 110,
        }}
      >
        <View
          style={{
            width: 20,
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.primary,
            }}
          />
        </View>

        <ConnectedPlaceInput
          value={from}
          placeholder="Pickup location"
          onChangeText={onChangeFrom}
          onSelectPlace={onSelectFrom}
          onClear={onClearFrom}
          rightAction={
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onDetectLocation}
              disabled={isLocationLoading}
              style={{
                width: 34,
                height: 34,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 17,
                backgroundColor: colors.primarySoft,
                marginLeft: 8,
                opacity: isLocationLoading ? 0.65 : 1,
              }}
            >
              {isLocationLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <LocateFixed size={17} color={colors.primary} />
              )}
            </TouchableOpacity>
          }
        />
      </View>

      {/* Dashed route connector */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 25.5,
          top: 39,
          bottom: 39,
          width: 1,
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
          borderStyle: "dashed",
          zIndex: 1,
        }}
      />

      {/* Destination row */}
      <View
        style={{
          minHeight: 58,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          zIndex: 90,
        }}
      >
        <View
          style={{
            width: 20,
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: colors.primary,
              backgroundColor: colors.card,
            }}
          />
        </View>

        <ConnectedPlaceInput
          value={to}
          placeholder="Destination"
          onChangeText={onChangeTo}
          onSelectPlace={onSelectTo}
          onClear={onClearTo}
        />
      </View>
    </View>
  );
}