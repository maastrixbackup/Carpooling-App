import { RideCard } from "@/components/ride/RideCard";
import { shortAddress } from "@/hooks/address-trimmer";
import {
  getPlaceDetails,
  PlaceSuggestion,
  searchIndiaPlaces,
} from "@/services/location.service";
import { getRidesApi } from "@/services/ride.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  CalendarDays,
  Car,
  Check,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const filters = ["All", "Today", "Tomorrow", "This Week"];
type SortType = "recommended" | "price_low" | "rating_high";

type PickedPlace = {
  address: string;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function getDateByFilter(filter: string) {
  const date = new Date();

  if (filter === "Tomorrow") {
    date.setDate(date.getDate() + 1);
  }

  if (filter !== "Today" && filter !== "Tomorrow") {
    return undefined;
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}
function mapApiRideToCard(ride: any) {
  const vehicle = ride.vehicles || {
    brand: ride.vehicle_brand,
    model: ride.vehicle_model,
    registration_number: ride.vehicle_registration_number,
    color: ride.vehicle_color,
    rating: ride.driver_rating,
  };

  return {
    id: String(ride.id),

    from: shortAddress(ride.source_address),
    to: shortAddress(ride.destination_address),

    date: ride.ride_date,
    time: ride.departure_time,

    price: Number(
      ride.price_per_km ||
      ride.price_per_seat ||
      0,
    ),

    seats: Number(ride.available_seats || 0),
    driver: ride.driver_name || "Driver",
    rating: Number(ride.driver_rating || 0),
    total_rides: Number(ride.driver_total_rides || 0),
    car:
      `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() ||
      "Vehicle",
    pickup: shortAddress(ride.source_address).split(",")[0],
    drop: shortAddress(ride.destination_address),
    pickupCoordinate: {
      latitude: Number(ride.source_lat),
      longitude: Number(ride.source_lng),
    },
    dropCoordinate: {
      latitude: Number(ride.destination_lat),
      longitude: Number(ride.destination_lng),
    },
    bookingDistanceKm: Number(
      ride.booking_distance_km || 0,
    ),
    matchType: ride.match_type || "full_route",
    isVerified: Boolean(ride.is_verified),
    profilePicture: ride.profile_picture || null,
    vehicleColor: vehicle.color || null,
    vehicleRegistration:
      vehicle.registration_number || null,
  };
}

export default function RidesScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("All");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [minSeats, setMinSeats] = useState(1);
  const [sortType, setSortType] = useState<SortType>("recommended");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [fromPlace, setFromPlace] = useState<PickedPlace>({ address: "" });
  const [toPlace, setToPlace] = useState<PickedPlace>({ address: "" });

  const rideDate = useMemo(() => getDateByFilter(activeFilter), [activeFilter]);

  const hasRouteSearch =
    Number.isFinite(Number(fromPlace.latitude)) &&
    Number.isFinite(Number(fromPlace.longitude)) &&
    Number.isFinite(Number(toPlace.latitude)) &&
    Number.isFinite(Number(toPlace.longitude));

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "rides",
      activeFilter,
      rideDate,
      minSeats,
      from,
      to,
      fromPlace.latitude,
      fromPlace.longitude,
      toPlace.latitude,
      toPlace.longitude,
    ],
    queryFn: () =>
      getRidesApi({
        ride_date: rideDate,
        min_seats: minSeats,
        source: fromPlace.address || from || undefined,
        destination: toPlace.address || to || undefined,
        source_lat: hasRouteSearch ? fromPlace.latitude : undefined,
        source_lng: hasRouteSearch ? fromPlace.longitude : undefined,
        destination_lat: hasRouteSearch ? toPlace.latitude : undefined,
        destination_lng: hasRouteSearch ? toPlace.longitude : undefined,
      }),
  });

  const rides = useMemo(() => {
    const apiRides = data?.data?.rides || [];
    const mapped = apiRides.map(mapApiRideToCard);

    if (sortType === "price_low") {
      return [...mapped].sort((a: any, b: any) => a.price - b.price);
    }

    if (sortType === "rating_high") {
      return [...mapped].sort((a: any, b: any) => b.rating - a.rating);
    }

    return mapped;
  }, [data, sortType]);

  const totalSeats = useMemo(
    () => rides.reduce((sum: number, ride: any) => sum + ride.seats, 0),
    [rides],
  );

  const cheapestRide = useMemo(() => {
    if (!rides.length) return null;
    return rides.reduce((min: any, ride: any) =>
      ride.price < min.price ? ride : min,
    );
  }, [rides]);

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch {
      toast.error("Unable to refresh rides.");
    }
  };

  const clearFrom = () => {
    setFrom("");
    setFromPlace({ address: "" });
  };

  const clearTo = () => {
    setTo("");
    setToPlace({ address: "" });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 90,
          }}
          ListHeaderComponent={
            <>
              <Header />

              <SearchPanel
                from={from}
                to={to}
                setFrom={setFrom}
                setTo={setTo}
                setFromPlace={setFromPlace}
                setToPlace={setToPlace}
                clearFrom={clearFrom}
                clearTo={clearTo}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                onOpenFilters={() => setFilterModalVisible(true)}
              />

              <View className="mt-6 flex-row gap-3">
                <SummaryCard
                  icon={<MapPin size={17} color={colors.primary} />}
                  label="Routes"
                  value={`${rides.length}`}
                />
                <SummaryCard
                  icon={<Users size={17} color={colors.success} />}
                  label="Seats"
                  value={`${totalSeats}`}
                />
                <SummaryCard
                  icon={<Car size={17} color={colors.primary} />}
                  label="From"
                  value={cheapestRide ? `₹${cheapestRide.price}` : "—"}
                />
              </View>

              <View className="mt-7 flex-row items-center justify-between">
                <View>
                  <Text
                    style={{ color: colors.text }}
                    className="text-xl font-extrabold"
                  >
                    Available Rides
                  </Text>

                  <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                    {isLoading
                      ? "Loading rides..."
                      : `${rides.length} matching ride${rides.length === 1 ? "" : "s"
                      } found`}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setFilterModalVisible(true)}
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }}
                  className="flex-row items-center gap-2 rounded-full border px-4 py-2"
                >
                  <ArrowUpDown size={15} color={colors.primary} />
                  <Text
                    style={{ color: colors.primary }}
                    className="text-xs font-extrabold"
                  >
                    Sort
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => <RideCard ride={item} />}
          ListEmptyComponent={isLoading ? <LoadingState /> : <EmptyState />}
        />

        <FilterModal
          visible={filterModalVisible}
          minSeats={minSeats}
          setMinSeats={setMinSeats}
          sortType={sortType}
          setSortType={setSortType}
          onClose={() => setFilterModalVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
}

function Header() {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1">
        <Text style={{ color: colors.muted }} className="text-sm font-semibold">
          Explore routes
        </Text>

        <Text
          style={{ color: colors.text }}
          className="mt-1 text-3xl font-extrabold"
        >
          Search Rides
        </Text>

        <Text style={{ color: colors.muted }} className="mt-2 text-sm">
          Find verified rides around your route.
        </Text>
      </View>

      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="h-12 w-12 items-center justify-center rounded-full"
      >
        <Car size={22} color={colors.primary} />
      </View>
    </View>
  );
}

function SearchPanel({
  from,
  to,
  setFrom,
  setTo,
  setFromPlace,
  setToPlace,
  clearFrom,
  clearTo,
  activeFilter,
  setActiveFilter,
  onOpenFilters,
}: {
  from: string;
  to: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setFromPlace: (place: PickedPlace) => void;
  setToPlace: (place: PickedPlace) => void;
  clearFrom: () => void;
  clearTo: () => void;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
  onOpenFilters: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-6 rounded-[32px] border p-4"
    >
      <PlaceInput
        icon={<MapPin size={18} color={colors.primary} />}
        label="From"
        value={from}
        placeholder="Choose pickup location"
        onChangeText={(value) => {
          setFrom(value);
          setFromPlace({ address: value });
        }}
        onClear={clearFrom}
        onSelectPlace={(place) => {
          setFrom(place.address);
          setFromPlace(place);
        }}
      />

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1">
          <PlaceInput
            icon={<Search size={18} color={colors.success} />}
            label="To"
            value={to}
            placeholder="Choose destination"
            onChangeText={(value) => {
              setTo(value);
              setToPlace({ address: value });
            }}
            onClear={clearTo}
            onSelectPlace={(place) => {
              setTo(place.address);
              setToPlace(place);
            }}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onOpenFilters}
          style={{ backgroundColor: colors.primary }}
          className="h-14 w-14 items-center justify-center rounded-2xl"
        >
          <SlidersHorizontal size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
        contentContainerStyle={{ gap: 8 }}
      >
        {filters.map((item) => {
          const active = activeFilter === item;

          return (
            <TouchableOpacity
              key={item}
              activeOpacity={0.85}
              onPress={() => setActiveFilter(item)}
              style={{
                backgroundColor: active ? colors.primary : colors.input,
                borderColor: active ? colors.primary : colors.border,
              }}
              className="flex-row items-center gap-2 rounded-full border px-4 py-2"
            >
              {active && <Check size={13} color="#FFFFFF" />}

              <Text
                style={{ color: active ? "#FFFFFF" : colors.text }}
                className="text-xs font-extrabold"
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PlaceInput({
  icon,
  label,
  value,
  placeholder,
  onChangeText,
  onSelectPlace,
  onClear,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onSelectPlace: (place: PickedPlace) => void;
  onClear: () => void;
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
    <View>
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
            placeholder={placeholder}
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
              onClear();
              setSuggestions([]);
            }}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.card }}
          >
            <X size={16} color={colors.muted} />
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

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="flex-1 rounded-[24px] border p-4"
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text
          style={{ color: colors.muted }}
          className="text-[11px] font-bold"
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>

      <Text
        style={{ color: colors.text }}
        className="mt-2 text-2xl font-extrabold"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function LoadingState() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-4 items-center rounded-[30px] border p-8"
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-bold">
        Loading rides...
      </Text>
    </View>
  );
}

function EmptyState() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="mt-4 items-center rounded-[30px] border p-8"
    >
      <Search size={34} color={colors.muted} />

      <Text
        style={{ color: colors.text }}
        className="mt-4 text-lg font-extrabold"
      >
        No rides found
      </Text>

      <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
        Try changing your route, date, or seat filter.
      </Text>
    </View>
  );
}

function FilterModal({
  visible,
  minSeats,
  setMinSeats,
  sortType,
  setSortType,
  onClose,
}: {
  visible: boolean;
  minSeats: number;
  setMinSeats: React.Dispatch<React.SetStateAction<number>>;
  sortType: SortType;
  setSortType: React.Dispatch<React.SetStateAction<SortType>>;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();

  const sortOptions: { label: string; value: SortType }[] = [
    { label: "Recommended", value: "recommended" },
    { label: "Lowest price", value: "price_low" },
    { label: "Highest rating", value: "rating_high" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="rounded-t-[34px] border px-5 pb-8 pt-5"
        >
          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.text }} className="text-xl font-extrabold">
                Filters
              </Text>
              <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                Refine rides by seats and sorting.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={{ backgroundColor: colors.input }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: colors.input }} className="rounded-3xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Users size={18} color={colors.primary} />
                <Text style={{ color: colors.text }} className="font-extrabold">
                  Minimum Seats
                </Text>
              </View>

              <Text style={{ color: colors.primary }} className="font-extrabold">
                {minSeats}
              </Text>
            </View>

            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setMinSeats((prev) => Math.max(1, prev - 1))}
                style={{ backgroundColor: colors.card }}
                className="h-12 flex-1 items-center justify-center rounded-2xl"
              >
                <Text style={{ color: colors.text }} className="text-xl font-bold">
                  −
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setMinSeats((prev) => Math.min(6, prev + 1))}
                style={{ backgroundColor: colors.primary }}
                className="h-12 flex-1 items-center justify-center rounded-2xl"
              >
                <Text className="text-xl font-bold text-white">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text
            style={{ color: colors.muted }}
            className="mb-3 mt-5 text-xs font-extrabold uppercase tracking-wider"
          >
            Sort by
          </Text>

          <View className="gap-3">
            {sortOptions.map((item) => {
              const selected = sortType === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.85}
                  onPress={() => setSortType(item.value)}
                  style={{
                    backgroundColor: selected ? colors.primarySoft : colors.input,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                  className="flex-row items-center justify-between rounded-2xl border px-4 py-4"
                >
                  <View className="flex-row items-center gap-3">
                    <CalendarDays size={18} color={colors.primary} />
                    <Text style={{ color: colors.text }} className="font-extrabold">
                      {item.label}
                    </Text>
                  </View>

                  {selected && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={{ backgroundColor: colors.primary }}
            className="mt-5 rounded-2xl py-4"
          >
            <Text className="text-center font-extrabold text-white">
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}