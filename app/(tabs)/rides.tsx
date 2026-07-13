import { RideCard } from "@/components/ride/RideCard";
import { shortAddress } from "@/hooks/address-trimmer";
import * as Location from "expo-location";
import { LocateFixed } from "lucide-react-native";
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
  Car,
  Check,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X
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
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { toast } from "sonner-native";

// ─── Types & constants ────────────────────────────────────────────────────────

const DATE_FILTERS = ["All", "Today", "Tomorrow", "This Week"];
type SortType = "recommended" | "price_low" | "rating_high";

type PickedPlace = {
  address: string;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateByFilter(filter: string): string | undefined {
  const date = new Date();
  if (filter === "Tomorrow") date.setDate(date.getDate() + 1);
  if (filter !== "Today" && filter !== "Tomorrow") return undefined;
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
    price: Number(ride.price_per_km || ride.price_per_seat || 0),
    seats: Number(ride.available_seats || 0),
    driver: ride.driver_name || "Driver",
    rating: Number(ride.driver_rating || 0),
    total_rides: Number(ride.driver_total_rides || 0),
    car: `${vehicle.brand || ""} ${vehicle.model || ""}`.trim() || "Vehicle",
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
    bookingDistanceKm: Number(ride.booking_distance_km || 0),
    matchType: ride.match_type || "full_route",
    isVerified: Boolean(ride.is_verified),
    profilePicture: ride.profile_picture || null,
    vehicleColor: vehicle.color || null,
    vehicleRegistration: vehicle.registration_number || null,
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

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
    const mapped = (data?.data?.rides || []).map(mapApiRideToCard);
    if (sortType === "price_low")
      return [...mapped].sort((a: any, b: any) => a.price - b.price);
    if (sortType === "rating_high")
      return [...mapped].sort((a: any, b: any) => b.rating - a.rating);
    return mapped;
  }, [data, sortType]);

  const totalSeats = useMemo(
    () => rides.reduce((sum: number, r: any) => sum + r.seats, 0),
    [rides],
  );

  const cheapestRide = useMemo(
    () =>
      rides.length
        ? rides.reduce((min: any, r: any) => (r.price < min.price ? r : min))
        : null,
    [rides],
  );

  const clearFrom = () => { setFrom(""); setFromPlace({ address: "" }); };
  const clearTo   = () => { setTo("");   setToPlace({ address: "" });   };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={async () => {
              try { await refetch(); } catch { toast.error("Unable to refresh rides."); }
            }} />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 90,
          }}
          ListHeaderComponent={
            <>
              {/* ── Page header ── */}
              <PageHeader />

              {/* ── Search panel with route connector ── */}
              <SearchPanel
                from={from}
                to={to}
                setFrom={setFrom}
                setTo={setTo}
                setFromPlace={setFromPlace}
                setToPlace={setToPlace}
                clearFrom={clearFrom}
                clearTo={clearTo}
                onOpenFilters={() => setFilterModalVisible(true)}
              />

              {/* ── Date filter chips — bare horizontal scroll ── */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
              >
                {DATE_FILTERS.map((item) => {
                  const active = activeFilter === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.8}
                      onPress={() => setActiveFilter(item)}
                      style={{
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                      className="flex-row items-center gap-1.5 rounded-full border px-4 py-2"
                    >
                      {active && <Check size={12} color="#fff" strokeWidth={3} />}
                      <Text
                        style={{ color: active ? "#fff" : colors.muted }}
                        className="text-xs font-bold"
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ── Stats row ── */}
              <View
                style={{ borderColor: colors.border }}
                className="mt-5 flex-row rounded-2xl border overflow-hidden"
              >
                <StatCell
                  label="Rides"
                  value={String(rides.length)}
                  accent={colors.primary}
                  border={false}
                />
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <StatCell
                  label="Seats"
                  value={String(totalSeats)}
                  accent={colors.success}
                  border={false}
                />
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <StatCell
                  label="Starts From"
                  value={cheapestRide ? `₹${cheapestRide.price}` : "—"}
                  accent={colors.primary}
                  border={false}
                />
              </View>

              {/* ── Section header ── */}
              <View className="mt-6 flex-row items-center justify-between">
                <View>
                  <Text
                    style={{ color: colors.text }}
                    className="text-lg font-extrabold"
                  >
                    Available Rides
                  </Text>
                  <Text style={{ color: colors.muted }} className="mt-0.5 text-xs">
                    {isLoading
                      ? "Searching…"
                      : `${rides.length} ride${rides.length === 1 ? "" : "s"} found`}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setFilterModalVisible(true)}
                  style={{ backgroundColor: colors.card, borderColor: colors.border }}
                  className="flex-row items-center gap-2 rounded-full border px-4 py-2"
                >
                  <ArrowUpDown size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary }} className="text-xs font-bold">
                    Sort
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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

// ─── Page header ──────────────────────────────────────────────────────────────

function PageHeader() {
  const { colors } = useAppTheme();
  return (
    <View className="mb-5 flex-row items-start justify-between">
      <View className="flex-1">
        <Text style={{ color: colors.muted }} className="text-xs font-semibold uppercase tracking-widest">
          Carpooling
        </Text>
        <Text style={{ color: colors.text }} className="mt-1 text-3xl font-extrabold tracking-tight">
          Find a Ride
        </Text>
      </View>
      <View
        style={{ backgroundColor: colors.primarySoft }}
        className="mt-1 h-11 w-11 items-center justify-center rounded-full"
      >
        <Car size={20} color={colors.primary} />
      </View>
    </View>
  );
}

// ─── Search panel ─────────────────────────────────────────────────────────────
// Signature element: From→To connected by a vertical dotted route line

function SearchPanel({
  from,
  to,
  setFrom,
  setTo,
  setFromPlace,
  setToPlace,
  clearFrom,
  clearTo,
  onOpenFilters,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  setFromPlace: (p: PickedPlace) => void;
  setToPlace: (p: PickedPlace) => void;
  clearFrom: () => void;
  clearTo: () => void;
  onOpenFilters: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="rounded-[28px] border overflow-hidden"
    >
      {/* From row */}
      <View
        style={{ borderBottomColor: colors.border }}
        className="flex-row items-center border-b px-4"
        // Fixed height — no stacked label, just one clean row
      >
        {/* Route connector — origin dot */}
        <View className="mr-3 items-center" style={{ width: 20 }}>
          <View
            style={{ backgroundColor: colors.primary }}
            className="h-3 w-3 rounded-full"
          />
        </View>

        <PlaceInput
          value={from}
          placeholder="Pickup location"
          onChangeText={(v) => { setFrom(v); setFromPlace({ address: v }); }}
          onClear={clearFrom}
          onSelectPlace={(p) => { setFrom(p.address); setFromPlace(p); }}
        />
      </View>

      {/* Connector line between rows */}
      <View
        style={{
          position: "absolute",
          left: 29,           // center of the 20px icon column + 4px px padding
          top: 45,            // below origin dot
          bottom: 45,         // above destination dot
          width: 1,
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
          borderStyle: "dashed",
        }}
        pointerEvents="none"
      />

      {/* To row + filter button */}
      <View className="flex-row items-center px-4">
        <View className="mr-3 items-center" style={{ width: 20 }}>
          <View
            style={{ borderColor: colors.primary, borderWidth: 2 }}
            className="h-3 w-3 rounded-full"
          />
        </View>

        <View className="flex-1">
          <PlaceInput
            value={to}
            placeholder="Destination"
            onChangeText={(v) => { setTo(v); setToPlace({ address: v }); }}
            onClear={clearTo}
            onSelectPlace={(p) => { setTo(p.address); setToPlace(p); }}
          />
        </View>

        {/* Filter button lives at the right edge of the To row */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onOpenFilters}
          style={{ backgroundColor: colors.primary }}
          className="ml-3 h-10 w-10 items-center justify-center rounded-2xl"
        >
          <SlidersHorizontal size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── PlaceInput — single-line, no stacked label ───────────────────────────────

function PlaceInput({
  value,
  placeholder,
  onChangeText,
  onSelectPlace,
  onClear,
}: {
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
  onSelectPlace: (p: PickedPlace) => void;
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
        if (mounted) setSuggestions(results);
      } catch {
        // silent
      } finally {
        if (mounted) setSearching(false);
      }
    }, 350);
    return () => { mounted = false; clearTimeout(timer); };
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
    } catch {
      toast.error("Unable to select this location.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Input row — slim single-line height */}
      <View className="h-[52px] flex-row items-center">
        <TextInput
          value={value}
          onFocus={() => setFocused(true)}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          style={{ color: colors.text, flex: 1 }}
          className="text-[15px] font-semibold"
        />

        {searching && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
        )}

        {value.length > 0 && !searching && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => { onClear(); setSuggestions([]); }}
            style={{ backgroundColor: colors.input }}
            className="ml-2 h-7 w-7 items-center justify-center rounded-full"
          >
            <X size={13} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions dropdown */}
      {focused && suggestions.length > 0 && (
        <View
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="absolute left-0 right-0 top-[52px] z-50 overflow-hidden rounded-2xl border shadow-sm"
        >
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.place_id}
              activeOpacity={0.8}
              onPress={() => handleSelect(item)}
              style={{
                borderBottomColor: colors.border,
                borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
              }}
              className="flex-row items-start gap-3 px-4 py-3"
            >
              <MapPin size={14} color={colors.primary} style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text
                  style={{ color: colors.text }}
                  className="text-[13px] font-bold"
                  numberOfLines={1}
                >
                  {item.main_text}
                </Text>
                <Text
                  style={{ color: colors.muted }}
                  className="mt-0.5 text-xs"
                  numberOfLines={1}
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

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  accent,
  border,
}: {
  label: string;
  value: string;
  accent: string;
  border: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{ backgroundColor: colors.card }}
      className="flex-1 items-center py-3"
    >
      <Text style={{ color: accent }} className="text-xl font-extrabold">
        {value}
      </Text>
      <Text style={{ color: colors.muted }} className="mt-0.5 text-[11px] font-semibold">
        {label}
      </Text>
    </View>
  );
}

// ─── Loading / empty states ────────────────────────────────────────────────────

function LoadingState() {
  const { colors } = useAppTheme();
  return (
    <View className="mt-4 items-center py-12">
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted }} className="mt-3 text-sm font-semibold">
        Searching rides…
      </Text>
    </View>
  );
}

function EmptyState() {
  const { colors } = useAppTheme();
  return (
    <View className="mt-4 items-center py-14">
      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className="mb-5 h-16 w-16 items-center justify-center rounded-full border"
      >
        <Search size={28} color={colors.muted} />
      </View>
      <Text style={{ color: colors.text }} className="text-base font-extrabold">
        No rides found
      </Text>
      <Text
        style={{ color: colors.muted }}
        className="mt-2 max-w-[220px] text-center text-sm leading-5"
      >
        Try a different route, date, or fewer required seats.
      </Text>
    </View>
  );
}

// ─── Filter modal ─────────────────────────────────────────────────────────────

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
  const insets = useSafeAreaInsets();

  const sortOptions: { label: string; value: SortType; sub: string }[] = [
    { label: "Recommended", value: "recommended", sub: "Best match for your route" },
    { label: "Lowest price", value: "price_low", sub: "Cheapest rides first" },
    { label: "Highest rated", value: "rating_high", sub: "Top-rated drivers first" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
          className="rounded-t-[32px] border-l border-r border-t px-5 pt-4"
        >
          {/* Handle */}
          <View className="mb-4 items-center">
            <View style={{ backgroundColor: colors.border }} className="h-1 w-10 rounded-full" />
          </View>

          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between">
            <Text style={{ color: colors.text }} className="text-xl font-extrabold">
              Filters
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={{ backgroundColor: colors.input }}
              className="h-9 w-9 items-center justify-center rounded-full"
            >
              <X size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Minimum seats */}
          <Text
            style={{ color: colors.muted }}
            className="mb-3 text-xs font-bold uppercase tracking-widest"
          >
            Minimum seats
          </Text>

          <View
            style={{ backgroundColor: colors.input, borderColor: colors.border }}
            className="mb-6 flex-row items-center justify-between rounded-2xl border px-4 py-3"
          >
            <View className="flex-row items-center gap-2">
              <Users size={17} color={colors.primary} />
              <Text style={{ color: colors.text }} className="font-semibold">
                {minSeats} seat{minSeats > 1 ? "s" : ""}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMinSeats((p) => Math.max(1, p - 1))}
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="h-9 w-9 items-center justify-center rounded-full border"
              >
                <Text style={{ color: colors.text }} className="text-lg font-bold">−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMinSeats((p) => Math.min(6, p + 1))}
                style={{ backgroundColor: colors.primary }}
                className="h-9 w-9 items-center justify-center rounded-full"
              >
                <Text className="text-lg font-bold text-white">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort options */}
          <Text
            style={{ color: colors.muted }}
            className="mb-3 text-xs font-bold uppercase tracking-widest"
          >
            Sort by
          </Text>

          <View className="gap-2 mb-5">
            {sortOptions.map((item) => {
              const selected = sortType === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.8}
                  onPress={() => setSortType(item.value)}
                  style={{
                    backgroundColor: selected ? colors.primarySoft : colors.input,
                    borderColor: selected ? colors.primary : "transparent",
                  }}
                  className="flex-row items-center gap-3 rounded-2xl border px-4 py-3.5"
                >
                  <View className="flex-1">
                    <Text
                      style={{ color: selected ? colors.primary : colors.text }}
                      className="text-[14px] font-bold"
                    >
                      {item.label}
                    </Text>
                    <Text style={{ color: colors.muted }} className="mt-0.5 text-xs">
                      {item.sub}
                    </Text>
                  </View>
                  {selected && (
                    <View
                      style={{ backgroundColor: colors.primary }}
                      className="h-5 w-5 items-center justify-center rounded-full"
                    >
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={{ backgroundColor: colors.primary }}
            className="rounded-2xl py-4"
          >
            <Text className="text-center text-[15px] font-extrabold text-white">
              Apply
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}