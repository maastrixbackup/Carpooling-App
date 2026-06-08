import { RideCard } from "@/components/ride/RideCard";
import { getHomeBootstrap } from "@/services/home.service";
import {
  getPlaceDetails,
  PlaceSuggestion,
  searchIndiaPlaces,
} from "@/services/location.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
  Bell,
  CalendarDays,
  Car,
  Check,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  Keyboard,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = 20;
const HERO_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;

const heroSlides = [
  {
    id: "1",
    badge: "Smart car pooling",
    title: "Save money on every trip",
    desc: "Share rides with trusted people around your route.",
    image: require("@/assets/images/home-banner/ride-city.jpg"),
  },
  {
    id: "2",
    badge: "Verified rides",
    title: "Earn money from empty seats",
    desc: "Book rides with rated drivers and verified passengers.",
    image: require("@/assets/images/home-banner/ride-driver.jpg"),
  },
  {
    id: "3",
    badge: "Driver mode",
    title: "Travel safer together",
    desc: "Publish your route and reduce daily travel cost.",
    image: require("@/assets/images/home-banner/ride-family.jpg"),
  },
];

type DateOption = {
  id: string;
  label: string;
  dateText: string;
  fullText: string;
  value: string;
  apiValue: string;
};

type PickedPlace = {
  address: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
};

function getNextDates(): DateOption[] {
  const today = new Date();

  return Array.from({ length: 14 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

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
      apiValue: `${yyyy}-${mm}-${dd}`,
    };
  });
}

function mapApiRideToCard(ride: any) {
  return {
    id: String(ride.id),
    from: ride.source_address,
    to: ride.destination_address,
    date: ride.ride_date,
    time: ride.departure_time,
    price: Number(ride.price_per_seat || 0),
    seats: Number(ride.available_seats || 0),
    driver: ride.driver_name || "Driver",
    rating: Number(ride.vehicle_rating || 4.8),
    car: `${ride.brand || ""} ${ride.model || ""}`.trim() || "Vehicle",
    pickup: ride.source_address,
    drop: ride.destination_address,
    pickupCoordinate: {
      latitude: Number(ride.source_lat),
      longitude: Number(ride.source_lng),
    },
    dropCoordinate: {
      latitude: Number(ride.destination_lat),
      longitude: Number(ride.destination_lng),
    },
  };
}

export default function HomeScreen() {
  const { colors } = useAppTheme();

  const dates = useMemo(() => getNextDates(), []);
  const heroListRef = useRef<FlatList<(typeof heroSlides)[number]>>(null);

  const [from, setFrom] = useState("Bhubaneswar");
  const [to, setTo] = useState("Cuttack");

  const [fromPlace, setFromPlace] = useState<PickedPlace>({
    address: "Bhubaneswar",
  });
  const [toPlace, setToPlace] = useState<PickedPlace>({
    address: "Cuttack",
  });

  const [selectedDate, setSelectedDate] = useState<DateOption>(dates[0]);
  const [seats, setSeats] = useState(1);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "home-bootstrap",
      from.trim(),
      to.trim(),
      selectedDate.apiValue,
      seats,
    ],
    queryFn: () =>
      getHomeBootstrap({
        source: from.trim(),
        destination: to.trim(),
        ride_date: selectedDate.apiValue,
        seats,
      }),
  });

  const homeData = data?.data;
  const apiRides = homeData?.available_rides || [];
  const rides = apiRides.map(mapApiRideToCard);

  const sliderViewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;

      if (typeof index === "number") {
        setActiveSlide(index);
      }
    }
  ).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        activeSlide === heroSlides.length - 1 ? 0 : activeSlide + 1;

      heroListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveSlide(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [activeSlide]);

  const handleDetectLocation = async () => {
    try {
      setIsLocationLoading(true);

      const serviceEnabled = await Location.hasServicesEnabledAsync();

      if (!serviceEnabled) {
        toast.error("Please enable location services.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        toast.error("Location permission is required.");
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

      const pickedLocation =
        address?.city ||
        address?.district ||
        address?.subregion ||
        address?.region ||
        address?.name ||
        "Current Location";

      setFrom(pickedLocation);
      setFromPlace({
        address: pickedLocation,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      toast.success("Location detected.");
    } catch (error) {
      console.log("LOCATION ERROR:", error);
      toast.error("Unable to detect your location.");
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleSearch = async () => {
    Keyboard.dismiss();

    if (!from.trim() || !to.trim()) {
      toast.error("Please enter both pickup and destination.");
      return;
    }

    await refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          contentContainerStyle={{
            paddingHorizontal: CONTENT_PADDING,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 120,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text style={{ color: colors.muted }} className="text-sm font-medium">
                Good morning 👋 {homeData?.user?.name || ""}
              </Text>

              <Text style={{ color: colors.text }} className="mt-1 text-3xl font-extrabold">
                Find your ride
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="h-12 w-12 items-center justify-center rounded-full border"
            >
              <Bell size={21} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View className="mt-6">
            <FlatList
              ref={heroListRef}
              horizontal
              pagingEnabled
              data={heroSlides}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={HERO_WIDTH}
              snapToAlignment="start"
              decelerationRate="fast"
              bounces={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={sliderViewabilityConfig}
              renderItem={({ item }) => (
                <ImageBackground
                  source={item.image}
                  resizeMode="cover"
                  style={{
                    width: HERO_WIDTH,
                    minHeight: 230,
                    overflow: "hidden",
                    borderRadius: 34,
                    backgroundColor: colors.primary,
                  }}
                  imageStyle={{ borderRadius: 34 }}
                >
                  <View className="flex-1 justify-between p-6">
                    <View className="absolute inset-0 bg-black/45" />
                    <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
                    <View className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/10" />

                    <View>
                      <View className="self-start flex-row items-center gap-2 rounded-full bg-white/15 px-3 py-2">
                        <Sparkles size={15} color="#FFFFFF" />
                        <Text className="text-xs font-extrabold text-white">
                          {item.badge}
                        </Text>
                      </View>

                      <Text className="mt-5 max-w-[92%] text-3xl font-extrabold leading-9 text-white">
                        {item.title}
                      </Text>

                      <Text className="mt-2 max-w-[90%] text-sm leading-5 text-white/85">
                        {item.desc}
                      </Text>
                    </View>

                    <View className="mt-7 flex-row items-center justify-between">
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.push("/(tabs)/publish")}
                        className="rounded-full bg-white px-5 py-3"
                      >
                        <Text className="font-extrabold text-blue-600">
                          Publish Ride
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => router.push("/(tabs)/rides")}
                        className="rounded-full bg-white/15 px-5 py-3"
                      >
                        <Text className="font-extrabold text-white">Find Ride</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ImageBackground>
              )}
            />

            <View className="mt-4 flex-row justify-center gap-2">
              {heroSlides.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor:
                      activeSlide === index ? colors.primary : colors.border,
                    width: activeSlide === index ? 24 : 8,
                    opacity: activeSlide === index ? 1 : 0.7,
                  }}
                  className="h-2 rounded-full"
                />
              ))}
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
            className="mt-6 rounded-[30px] border p-4"
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text style={{ color: colors.text }} className="text-lg font-extrabold">
                  Where are you going?
                </Text>
                <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                  Detect location, pick date, choose seats
                </Text>
              </View>

              <View
                style={{ backgroundColor: colors.primarySoft }}
                className="h-10 w-10 items-center justify-center rounded-2xl"
              >
                <Navigation size={18} color={colors.primary} />
              </View>
            </View>

            <PlaceInput
              icon={<MapPin size={18} color={colors.primary} />}
              label="From"
              value={from}
              onChangeText={(value) => {
                setFrom(value);
                setFromPlace({ address: value });
              }}
              onSelectPlace={(place) => {
                setFrom(place.address);
                setFromPlace(place);
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
              }}
              onSelectPlace={(place) => {
                setTo(place.address);
                setToPlace(place);
              }}
            />

            <View className="mt-3 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setDateModalVisible(true)}
                style={{ backgroundColor: colors.input }}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3"
              >
                <CalendarDays size={16} color={colors.muted} />
                <Text
                  style={{ color: colors.text }}
                  className="font-bold"
                  numberOfLines={1}
                >
                  {selectedDate.label}
                </Text>
              </TouchableOpacity>

              <SeatSelector seats={seats} setSeats={setSeats} />
            </View>

            <View
              style={{ backgroundColor: colors.input }}
              className="mt-3 rounded-2xl px-4 py-3"
            >
              <Text style={{ color: colors.muted }} className="text-xs font-bold">
                Selected trip
              </Text>
              <Text style={{ color: colors.text }} className="mt-1 font-extrabold">
                {fromPlace.address || "From"} → {toPlace.address || "To"}
              </Text>
              <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                {selectedDate.fullText} • {seats} seat{seats > 1 ? "s" : ""}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSearch}
              disabled={isFetching}
              style={{ backgroundColor: colors.primary }}
              className="mt-4 rounded-2xl py-4"
            >
              {isFetching ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-center text-base font-extrabold text-white">
                  Search Rides
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-6 flex-row gap-3">
            <InfoPill
              icon={<ShieldCheck size={16} color={colors.success} />}
              label="Verified users"
            />
            <InfoPill
              icon={<Car size={16} color={colors.primary} />}
              label={`${rides.length} live rides`}
            />
          </View>

          <View className="mt-8 flex-row items-center justify-between">
            <Text style={{ color: colors.text }} className="text-xl font-extrabold">
              Available rides
            </Text>

            <TouchableOpacity onPress={() => router.push("/(tabs)/rides")}>
              <Text style={{ color: colors.primary }} className="font-extrabold">
                See all
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-4">
            {isLoading ? (
              <HomeLoadingCard />
            ) : rides.length > 0 ? (
              rides.map((ride: any) => <RideCard key={ride.id} ride={ride} />)
            ) : (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
                className="items-center rounded-[30px] border p-6"
              >
                <Search size={34} color={colors.muted} />
                <Text
                  style={{ color: colors.text }}
                  className="mt-4 text-lg font-extrabold"
                >
                  No rides found
                </Text>
                <Text
                  style={{ color: colors.muted }}
                  className="mt-2 text-center text-sm"
                >
                  Try changing your destination, date, or seat count.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onSelectPlace: (place: PickedPlace) => void;
  onDetectLocation?: () => void;
  isLoading?: boolean;
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
    <View className="mb-3">
      <View
        style={{ backgroundColor: colors.input }}
        className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
      >
        {icon}

        <View className="flex-1">
          <Text
            style={{ color: colors.muted }}
            className="mb-1 text-[11px] font-bold uppercase"
          >
            {label}
          </Text>

          <TextInput
            placeholder={label}
            placeholderTextColor={colors.muted}
            value={value}
            onFocus={() => setFocused(true)}
            onChangeText={onChangeText}
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

function HomeLoadingCard() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="rounded-[30px] border p-5"
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-center text-sm font-semibold">
        Loading available rides...
      </Text>
    </View>
  );
}

function SeatSelector({
  seats,
  setSeats,
}: {
  seats: number;
  setSeats: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.input }}
      className="flex-1 flex-row items-center justify-between rounded-2xl px-3 py-3"
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSeats((prev) => Math.max(1, prev - 1))}
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.card }}
      >
        <Minus size={15} color={colors.text} />
      </TouchableOpacity>

      <View className="items-center">
        <Users size={15} color={colors.muted} />
        <Text style={{ color: colors.text }} className="mt-1 text-xs font-bold">
          {seats} Seat
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSeats((prev) => Math.min(6, prev + 1))}
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.primary }}
      >
        <Plus size={15} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border py-3"
    >
      {icon}
      <Text style={{ color: colors.text }} className="text-xs font-bold">
        {label}
      </Text>
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
                Choose your travel date
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