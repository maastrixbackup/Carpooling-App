import { RideCard } from "@/components/ride/RideCard";
import { shortAddress } from "@/hooks/address-trimmer";
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
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const filters = ["All", "Today", "Tomorrow", "This Week"];

type SortType = "recommended" | "price_low" | "rating_high";

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
  return {
    id: String(ride.id),
    from: shortAddress(ride.source_address),
    to: shortAddress(ride.destination_address),
    date: ride.ride_date,
    time: ride.departure_time,
    price: Number(ride.price_per_seat || 0),
    seats: Number(ride.available_seats || 0),
    driver: ride.driver_name || "Driver",
    rating: Number(ride.vehicle_rating || 4.8),
    car: `${ride.brand || ""} ${ride.model || ""}`.trim() || "Vehicle",
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
  };
}

export default function RidesScreen() {
  const { colors } = useAppTheme();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [minSeats, setMinSeats] = useState(1);
  const [sortType, setSortType] = useState<SortType>("recommended");

  const rideDate = useMemo(
    () => getDateByFilter(activeFilter),
    [activeFilter]
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["rides", activeFilter, minSeats],
    queryFn: () =>
      getRidesApi({
        ride_date: rideDate,
        min_seats: minSeats,
      }),
  });

  const rides = useMemo(() => {
    const apiRides = data?.data?.rides || [];
    const mapped = apiRides.map(mapApiRideToCard);

    const query = search.trim().toLowerCase();

    const searched = query
      ? mapped.filter((ride: any) => {
          const routeText =
            `${ride.from} ${ride.to} ${ride.pickup} ${ride.drop} ${ride.car} ${ride.driver}`.toLowerCase();

          return routeText.includes(query);
        })
      : mapped;

    if (sortType === "price_low") {
      return [...searched].sort((a: any, b: any) => a.price - b.price);
    }

    if (sortType === "rating_high") {
      return [...searched].sort((a: any, b: any) => b.rating - a.rating);
    }

    return searched;
  }, [data, search, sortType]);

  const totalSeats = useMemo(
    () => rides.reduce((sum: number, ride: any) => sum + ride.seats, 0),
    [rides]
  );

  const cheapestRide = useMemo(() => {
    if (!rides.length) return null;
    return rides.reduce((min: any, ride: any) =>
      ride.price < min.price ? ride : min
    );
  }, [rides]);

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch {
      toast.error("Unable to refresh rides.");
    }
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
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 120,
          }}
          ListHeaderComponent={
            <>
              <Header />

              <SearchPanel
                search={search}
                setSearch={setSearch}
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
                      : `${rides.length} matching ride${
                          rides.length === 1 ? "" : "s"
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
          ListEmptyComponent={
            isLoading ? <LoadingState /> : <EmptyState />
          }
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
  search,
  setSearch,
  activeFilter,
  setActiveFilter,
  onOpenFilters,
}: {
  search: string;
  setSearch: (value: string) => void;
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
      <View className="flex-row gap-3">
        <View
          style={{ backgroundColor: colors.input }}
          className="h-14 flex-1 flex-row items-center gap-3 rounded-2xl px-4"
        >
          <Search size={18} color={colors.muted} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search city, route, car, driver"
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            style={{ color: colors.text }}
            className="flex-1 text-base font-semibold"
          />

          {search.length > 0 && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setSearch("")}>
              <X size={17} color={colors.muted} />
            </TouchableOpacity>
          )}
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