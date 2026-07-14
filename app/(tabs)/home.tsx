import { RideCard } from "@/components/ride/RideCard";
import { useAuth } from "@/context/AuthContext";
import { shortAddress } from "@/hooks/address-trimmer";
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
  ArrowUpDown,
  CalendarDays,
  Car,
  Check,
  LocateFixed,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_PADDING = 20;

const heroSlides = [
  {
    id: "1",
    badge: "Smart carpooling",
    title: "Save money on every trip",
    desc: "Share rides with verified people on your route.",
    image: require("@/assets/images/home-banner/ride-city.jpg"),
  },
  {
    id: "2",
    badge: "Earn as you drive",
    title: "Get paid for every seat.",
    desc: "Publish your route once and let passengers come to you.",
    image: require("@/assets/images/home-banner/ride-driver.jpg"),
  },
  {
    id: "3",
    badge: "Travel together",
    title: "Safer rides, lower cost",
    desc: "Rated drivers, verified passengers — every trip.",
    image: require("@/assets/images/home-banner/ride-family.jpg"),
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    from: shortAddress(ride.source_address),
    to: shortAddress(ride.destination_address),
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  // FIX 1: useWindowDimensions instead of static Dimensions.get —
  // updates on orientation change and on some Android soft-keyboard resize modes
  const { width: screenWidth } = useWindowDimensions();
  const heroWidth = screenWidth - CONTENT_PADDING * 2;

  const dates = useMemo(() => getNextDates(), []);
  const heroListRef = useRef<FlatList<(typeof heroSlides)[number]>>(null);

  const [from, setFrom] = useState("Bhubaneswar");
  const [to, setTo] = useState("Cuttack");
  const [fromPlace, setFromPlace] = useState<PickedPlace>({
    address: "Bhubaneswar",
  });
  const [toPlace, setToPlace] = useState<PickedPlace>({ address: "Cuttack" });
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
    enabled: isAuthenticated,
    retry: false,
  });

  const homeData = data?.data;
  const userName = homeData?.user?.name || user?.full_name || "there";
  const rides = useMemo(
    () => (homeData?.available_rides || []).map(mapApiRideToCard),
    [homeData],
  );

  // ── Hero auto-scroll ──────────────────────────────────────────────────────

  const sliderViewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const index = viewableItems[0]?.index;
      if (typeof index === "number") setActiveSlide(index);
    },
  ).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        activeSlide === heroSlides.length - 1 ? 0 : activeSlide + 1;
      heroListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveSlide(nextIndex);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeSlide]);

  // ── Location detect ───────────────────────────────────────────────────────

  const handleDetectLocation = async () => {
    try {
      setIsLocationLoading(true);
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        toast.error("Enable location services and try again.");
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error("Location permission denied.");
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const addressList = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      const addr = addressList[0];
      const pickedLocation =
        addr?.city ||
        addr?.district ||
        addr?.subregion ||
        addr?.region ||
        addr?.name ||
        "Current location";

      setFrom(pickedLocation);
      setFromPlace({
        address: pickedLocation,
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      toast.success("Location detected.");
    } catch {
      toast.error("Couldn't detect your location.");
    } finally {
      setIsLocationLoading(false);
    }
  };

  // ── Swap ─────────────────────────────────────────────────────────────────

  const handleSwap = () => {
    const tempFrom = from;
    const tempFromPlace = fromPlace;
    setFrom(to);
    setFromPlace(toPlace);
    setTo(tempFrom);
    setToPlace(tempFromPlace);
  };

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    Keyboard.dismiss();
    if (!from.trim() || !to.trim()) {
      toast.error("Enter both a pickup and destination.");
      return;
    }
    await refetch();
    router.push({
      pathname: "/(tabs)/rides",
      params: {
        source: from.trim(),
        destination: to.trim(),
        ride_date: selectedDate.apiValue,
        seats: String(seats),
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Fixed header below the status bar */}
          <View
            style={{
              backgroundColor: colors.bg,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
              paddingHorizontal: CONTENT_PADDING,
              paddingTop: Platform.OS === "android" ? 10 : 8,
              paddingBottom: 12,
              zIndex: 100,
              ...Platform.select({
                ios: {
                  shadowColor: "#000000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.04,
                  shadowRadius: 5,
                },
                android: {
                  elevation: 3,
                },
              }),
            }}
          >
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: colors.muted }}
                  className="text-xs font-bold uppercase tracking-widest"
                >
                  PoolShare
                </Text>

                <Text
                  style={{ color: colors.text }}
                  className="mt-1 text-[18px] font-extrabold leading-tight"
                  numberOfLines={1}
                >
                  Hi, {userName.split(" ")[0]} 👋
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/messages" as any)}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                className="h-11 w-11 items-center justify-center rounded-full"
              >
                <MessageCircle size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Only this content scrolls */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            refreshControl={
              <RefreshControl
                refreshing={isFetching}
                onRefresh={refetch}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={{
              paddingHorizontal: CONTENT_PADDING,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 32) + 80,
            }}
          >
            {/* Hero slider */}
            <View style={{ marginTop: 8 }}>
              <FlatList
                ref={heroListRef}
                horizontal
                data={heroSlides}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                snapToInterval={heroWidth}
                snapToAlignment="start"
                decelerationRate="fast"
                bounces={false}
                nestedScrollEnabled
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={sliderViewabilityConfig}
                scrollEventThrottle={16}
                getItemLayout={(_, index) => ({
                  length: heroWidth,
                  offset: heroWidth * index,
                  index,
                })}
                renderItem={({ item }) => (
                  <ImageBackground
                    source={item.image}
                    resizeMode="cover"
                    style={{
                      width: heroWidth,
                      aspectRatio: screenWidth > 400 ? 16 / 9 : 4 / 3,
                      borderRadius: 28,
                      overflow: "hidden",
                      backgroundColor: colors.primary,
                    }}
                  >
                    <View style={StyleSheet.absoluteFill}>
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            backgroundColor: "rgba(0,0,0,0.48)",
                          },
                        ]}
                      />
                    </View>

                    <View
                      style={{
                        position: "absolute",
                        right: -40,
                        top: -40,
                        width: 160,
                        height: 160,
                        borderRadius: 80,
                        backgroundColor: "rgba(255,255,255,0.08)",
                      }}
                    />

                    <View style={styles.heroContent}>
                      <View style={styles.heroBadge}>
                        <Sparkles size={13} color="#FFFFFF" />

                        <Text style={styles.heroBadgeText}>
                          {item.badge}
                        </Text>
                      </View>

                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.heroTitle}>
                          {item.title}
                        </Text>

                        <Text style={styles.heroDesc}>
                          {item.desc}
                        </Text>
                      </View>

                      <View style={styles.heroBtnRow}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() =>
                            router.push("/(tabs)/publish")
                          }
                          style={styles.heroBtnPrimary}
                        >
                          <Text style={styles.heroBtnPrimaryText}>
                            Publish ride
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() =>
                            router.push("/(tabs)/rides")
                          }
                          style={styles.heroBtnGhost}
                        >
                          <Text style={styles.heroBtnGhostText}>
                            Find ride
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ImageBackground>
                )}
              />

              <View style={styles.dotsRow}>
                {heroSlides.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          activeSlide === index
                            ? colors.primary
                            : colors.border,
                        width: activeSlide === index ? 24 : 7,
                        opacity: activeSlide === index ? 1 : 0.5,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Route search */}
            <View style={{ marginTop: 24 }}>
              <Text
                style={{ color: colors.muted }}
                className="mb-3 text-xs font-bold uppercase tracking-widest"
              >
                Your journey
              </Text>

              <View
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 28,
                  overflow: "visible",
                  zIndex: 20,
                }}
              >
                {/* From */}
                <View style={styles.routeRow}>
                  <View style={styles.railCol}>
                    <View
                      style={[
                        styles.railDot,
                        {
                          backgroundColor: "#22C55E",
                        },
                      ]}
                    />

                    <View
                      style={[
                        styles.railLine,
                        {
                          backgroundColor: colors.border,
                        },
                      ]}
                    />
                  </View>

                  <RouteInput
                    value={from}
                    placeholder="Leaving from"
                    onChangeText={(value) => {
                      setFrom(value);
                      setFromPlace({
                        address: value,
                      });
                    }}
                    onSelectPlace={(place) => {
                      setFrom(place.address);
                      setFromPlace(place);
                    }}
                    onClear={() => {
                      setFrom("");
                      setFromPlace({
                        address: "",
                      });
                    }}
                    rightAction={
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleDetectLocation}
                        disabled={isLocationLoading}
                        style={{
                          backgroundColor: colors.input,
                          borderRadius: 20,
                          padding: 7,
                          opacity: isLocationLoading ? 0.7 : 1,
                        }}
                      >
                        {isLocationLoading ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        ) : (
                          <LocateFixed
                            size={16}
                            color={colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    }
                  />
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: colors.border,
                    marginLeft: 44,
                  }}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSwap}
                  style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    marginTop: -16,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 6,
                    zIndex: 30,
                  }}
                >
                  <ArrowUpDown
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>

                {/* To */}
                <View style={styles.routeRow}>
                  <View style={styles.railCol}>
                    <View
                      style={[
                        styles.railDot,
                        {
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>

                  <RouteInput
                    value={to}
                    placeholder="Going to"
                    onChangeText={(value) => {
                      setTo(value);
                      setToPlace({
                        address: value,
                      });
                    }}
                    onSelectPlace={(place) => {
                      setTo(place.address);
                      setToPlace(place);
                    }}
                    onClear={() => {
                      setTo("");
                      setToPlace({
                        address: "",
                      });
                    }}
                  />
                </View>
              </View>

              {/* Date and seats */}
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 12,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setDateModalVisible(true)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    gap: 8,
                  }}
                >
                  <CalendarDays
                    size={16}
                    color={colors.primary}
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      DATE
                    </Text>

                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "700",
                        fontSize: 13,
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {selectedDate.label} · {selectedDate.dateText}
                    </Text>
                  </View>
                </TouchableOpacity>

                <SeatSelector
                  seats={seats}
                  setSeats={setSeats}
                  colors={colors}
                />
              </View>

              {/* Search */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSearch}
                disabled={isFetching}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 20,
                  minHeight: 54,
                  marginTop: 12,
                  opacity: isFetching ? 0.8 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isFetching ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Search size={18} color="#FFFFFF" />

                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 15,
                        fontWeight: "800",
                      }}
                    >
                      Search rides
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Trust information */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 20,
                gap: 16,
                paddingHorizontal: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ShieldCheck
                  size={14}
                  color={colors.success}
                />

                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Verified users
                </Text>
              </View>

              <View
                style={{
                  width: 1,
                  height: 14,
                  backgroundColor: colors.border,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Car size={14} color={colors.primary} />

                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {rides.length} live{" "}
                  {rides.length === 1 ? "ride" : "rides"}
                </Text>
              </View>
            </View>

            {/* Available rides header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 28,
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  Available rides
                </Text>

                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {isLoading
                    ? "Looking for rides…"
                    : `${rides.length} ride${rides.length === 1 ? "" : "s"
                    } near your route`}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push("/(tabs)/rides")
                }
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ride cards */}
            {isLoading ? (
              <HomeLoadingCard colors={colors} />
            ) : rides.length > 0 ? (
              <View style={{ gap: 12 }}>
                {rides.map((ride: any) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                  />
                ))}
              </View>
            ) : (
              <EmptyRides colors={colors} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
    </View>
  );
}

// ─── RouteInput ───────────────────────────────────────────────────────────────
// Stripped-down — no label text, no wrapper card, just the input + suggestions.
// Lives inside the route strip rows.

function RouteInput({
  value,
  placeholder,
  onChangeText,
  onSelectPlace,
  onClear,
  rightAction,
}: {
  value: string;
  placeholder: string;
  onChangeText: (v: string) => void;
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
    } catch {
      toast.error("Couldn't load that location.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Input row — no extra padding, all spacing comes from routeRow */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          onFocus={() => setFocused(true)}
          // FIX 7: 150ms delay so suggestion tap registers before blur hides list
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onChangeText={onChangeText}
          autoCorrect={false}
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 15,
            fontWeight: "600",
            paddingVertical: 4,
          }}
        />

        {searching ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : value.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              onClear();
              setSuggestions([]);
            }}
            style={{
              backgroundColor: colors.input,
              borderRadius: 14,
              padding: 5,
            }}
          >
            <X size={13} color={colors.muted} />
          </TouchableOpacity>
        ) : rightAction ? (
          rightAction
        ) : null}
      </View>

      {/* Suggestions */}
      {focused && suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: "100%",
            left: -52, // bleed back past the rail
            right: -16,
            marginTop: 6,
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 20,
            overflow: "hidden",
            zIndex: 999,
            // Shadow for depth
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              },
              android: { elevation: 6 },
            }),
          }}
        >
          {suggestions.slice(0, 5).map((item, idx) => (
            <TouchableOpacity
              key={item.place_id}
              activeOpacity={0.8}
              onPress={() => handleSelect(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: idx < Math.min(suggestions.length, 5) - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={14} color={colors.primary} />
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
                    marginTop: 2,
                  }}
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

// ─── SeatSelector ─────────────────────────────────────────────────────────────

function SeatSelector({
  seats,
  setSeats,
  colors,
}: {
  seats: number;
  setSeats: React.Dispatch<React.SetStateAction<number>>;
  colors: any;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 10,
        gap: 10,
        minWidth: 120,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSeats((p) => Math.max(1, p - 1))}
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.input,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Minus size={13} color={colors.text} />
      </TouchableOpacity>

      <View style={{ flex: 1, alignItems: "center" }}>
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700" }}>
          SEATS
        </Text>
        {/* FIX 8: Correct pluralisation */}
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800", marginTop: 2 }}>
          {seats}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSeats((p) => Math.min(6, p + 1))}
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={13} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

function HomeLoadingCard({ colors }: { colors: any }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 26,
        padding: 32,
        alignItems: "center",
      }}
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.muted, marginTop: 12, fontSize: 13, fontWeight: "600" }}>
        Finding rides near you…
      </Text>
    </View>
  );
}

function EmptyRides({ colors }: { colors: any }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 26,
        padding: 36,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
        }}
      >
        <Search size={26} color={colors.primary} />
      </View>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
        No rides found
      </Text>
      <Text
        style={{
          color: colors.muted,
          fontSize: 13,
          marginTop: 6,
          textAlign: "center",
          lineHeight: 19,
          maxWidth: 220,
        }}
      >
        Try a different destination, date, or reduce your seat count.
      </Text>
    </View>
  );
}

// ─── DatePickerModal ──────────────────────────────────────────────────────────

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
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderWidth: 1,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            <View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
                Pick a date
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                Next 14 days available
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={{
                backgroundColor: colors.input,
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Date grid */}
          <ScrollView
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: 16,
              gap: 10,
              paddingBottom: 8,
            }}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 320 }}
          >
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
                    borderWidth: 1,
                    borderRadius: 18,
                    alignItems: "center",
                    paddingVertical: 14,
                    width: "30.5%",
                  }}
                >
                  <Text
                    style={{
                      color: selected ? "rgba(255,255,255,0.75)" : colors.muted,
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                  >
                    {date.label}
                  </Text>
                  <Text
                    style={{
                      color: selected ? "#fff" : colors.text,
                      fontWeight: "800",
                      marginTop: 4,
                      fontSize: 13,
                    }}
                  >
                    {date.dateText}
                  </Text>
                  {selected && (
                    <View style={{ marginTop: 6 }}>
                      <Check size={14} color="#fff" strokeWidth={2.5} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
// Static layout styles — extracted so they don't re-create on every render

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  heroContent: {
    flex: 1,
    padding: 22,
    justifyContent: "space-between",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    maxWidth: "88%",
  },
  heroDesc: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: "80%",
  },
  heroBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  heroBtnPrimary: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  heroBtnPrimaryText: {
    color: "#1D4ED8",
    fontWeight: "800",
    fontSize: 13,
  },
  heroBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  heroBtnGhostText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  railCol: {
    width: 20,
    alignItems: "center",
  },
  railDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  railLine: {
    width: 1.5,
    height: 30,
    marginTop: 4,
  },
});