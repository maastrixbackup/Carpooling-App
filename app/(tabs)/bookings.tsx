import { demoRides } from "@/data/demoRides";
import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Ticket,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BookingStatus = "upcoming" | "completed" | "cancelled";

type BookingRide = (typeof demoRides)[number] & {
  bookingStatus: BookingStatus;
};

const bookingTabs: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function BookingsScreen() {
  const { colors } = useAppTheme();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedRide, setSelectedRide] = useState<BookingRide | null>(null);

  const bookings: BookingRide[] = useMemo(
    () =>
      demoRides.map((ride, index) => ({
        ...ride,
        bookingStatus:
          index === 0 ? "upcoming" : index === 1 ? "completed" : "cancelled",
      })),
    []
  );

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((ride) => {
      const routeText = `${ride.from} ${ride.to} ${ride.driver} ${ride.car}`.toLowerCase();

      const matchesSearch = query ? routeText.includes(query) : true;
      const matchesTab =
        activeTab === "all" ? true : ride.bookingStatus === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [bookings, search, activeTab]);

  const handleCancelPress = (ride: BookingRide) => {
    setSelectedRide(ride);
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = () => {
    setCancelModalVisible(false);
    setSelectedRide(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 120,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text style={{ color: colors.muted }} className="text-sm">
                Travel history
              </Text>
              <Text
                style={{ color: colors.text }}
                className="mt-1 text-3xl font-extrabold"
              >
                My Bookings
              </Text>
            </View>

            <View
              style={{ backgroundColor: colors.primarySoft }}
              className="h-12 w-12 items-center justify-center rounded-full"
            >
              <Ticket size={22} color={colors.primary} />
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
            className="mt-6 rounded-[30px] border p-4"
          >
            <View
              style={{ backgroundColor: colors.input }}
              className="flex-row items-center gap-3 rounded-2xl px-4 py-3"
            >
              <Search size={18} color={colors.muted} />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search booking, route, driver"
                placeholderTextColor={colors.muted}
                style={{ color: colors.text }}
                className="flex-1 text-base font-semibold"
              />

              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <X size={17} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              {bookingTabs.map((tab) => {
                const active = activeTab === tab.value;

                return (
                  <TouchableOpacity
                    key={tab.value}
                    activeOpacity={0.85}
                    onPress={() => setActiveTab(tab.value)}
                    style={{
                      backgroundColor: active ? colors.primary : colors.input,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                    className="rounded-full border px-4 py-2"
                  >
                    <Text
                      style={{ color: active ? "#FFFFFF" : colors.text }}
                      className="text-xs font-extrabold"
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mt-6 flex-row gap-3">
            <SummaryCard
              label="Upcoming"
              value={`${bookings.filter((b) => b.bookingStatus === "upcoming").length}`}
              icon={<Clock size={17} color={colors.primary} />}
            />
            <SummaryCard
              label="Completed"
              value={`${bookings.filter((b) => b.bookingStatus === "completed").length}`}
              icon={<CheckCircle2 size={17} color={colors.success} />}
            />
          </View>

          <View className="mt-8 flex-row items-center justify-between">
            <Text
              style={{ color: colors.text }}
              className="text-xl font-extrabold"
            >
              Trips
            </Text>

            <Text style={{ color: colors.muted }} className="text-sm font-bold">
              {filteredBookings.length} booking
              {filteredBookings.length === 1 ? "" : "s"}
            </Text>
          </View>

          <View className="mt-4 gap-4">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((ride) => (
                <BookingCard
                  key={ride.id}
                  ride={ride}
                  onCancel={() => handleCancelPress(ride)}
                />
              ))
            ) : (
              <EmptyBookings />
            )}
          </View>
        </ScrollView>

        <CancelBookingModal
          visible={cancelModalVisible}
          ride={selectedRide}
          onClose={() => setCancelModalVisible(false)}
          onConfirm={handleConfirmCancel}
        />
      </SafeAreaView>
    </View>
  );
}

function BookingCard({
  ride,
  onCancel,
}: {
  ride: BookingRide;
  onCancel: () => void;
}) {
  const { colors } = useAppTheme();

  const statusTheme = getStatusTheme(ride.bookingStatus, colors);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/booking/[id]",
          params: { id: ride.id },
        })
      }
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className="overflow-hidden rounded-[30px] border p-5"
    >
      <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10" />

      <View className="flex-row items-center justify-between">
        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="h-12 w-12 items-center justify-center rounded-2xl"
        >
          <Ticket size={22} color={colors.primary} />
        </View>

        <View
          style={{ backgroundColor: statusTheme.bg }}
          className="rounded-full px-3 py-1.5"
        >
          <Text style={{ color: statusTheme.text }} className="text-xs font-bold">
            {statusTheme.label}
          </Text>
        </View>
      </View>

      <Text
        style={{ color: colors.text }}
        className="mt-4 text-xl font-extrabold"
      >
        {ride.from} → {ride.to}
      </Text>

      <View className="mt-4 gap-3">
        <InfoRow
          icon={<Calendar size={16} color={colors.primary} />}
          text={`${ride.date}, ${ride.time}`}
        />

        <InfoRow
          icon={<MapPin size={16} color={colors.primary} />}
          text={`${ride.pickup} to ${ride.drop}`}
        />

        <InfoRow icon={<Car size={16} color={colors.primary} />} text={ride.car} />
      </View>

      <View
        style={{ borderTopColor: colors.border }}
        className="mt-5 flex-row items-center justify-between border-t pt-4"
      >
        <View>
          <Text style={{ color: colors.muted }} className="text-xs">
            Paid amount
          </Text>
          <Text
            style={{ color: colors.primary }}
            className="mt-1 text-lg font-extrabold"
          >
            ₹{ride.price}
          </Text>
        </View>

        {ride.bookingStatus === "upcoming" ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(event) => {
              event.stopPropagation();
              onCancel();
            }}
            style={{ backgroundColor: colors.dangerSoft }}
            className="rounded-full px-4 py-2"
          >
            <Text style={{ color: colors.danger }} className="text-xs font-bold">
              Cancel
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(event) => {
              event.stopPropagation();
              router.push({
                pathname: "/booking/[id]",
                params: { id: ride.id },
              });
            }}
            style={{ backgroundColor: colors.primarySoft }}
            className="rounded-full px-4 py-2"
          >
            <Text style={{ color: colors.primary }} className="text-xs font-bold">
              View
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text
        style={{ color: colors.muted }}
        className="flex-1 text-sm font-medium"
        numberOfLines={1}
      >
        {text}
      </Text>
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
        <Text style={{ color: colors.muted }} className="text-xs font-bold">
          {label}
        </Text>
      </View>

      <Text
        style={{ color: colors.text }}
        className="mt-2 text-2xl font-extrabold"
      >
        {value}
      </Text>
    </View>
  );
}

function EmptyBookings() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="items-center rounded-[30px] border p-8"
    >
      <Ticket size={36} color={colors.muted} />

      <Text style={{ color: colors.text }} className="mt-4 text-lg font-extrabold">
        No bookings found
      </Text>

      <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
        Your upcoming and completed trips will appear here.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/rides")}
        style={{ backgroundColor: colors.primary }}
        className="mt-5 rounded-2xl px-5 py-3"
      >
        <Text className="font-extrabold text-white">Find Rides</Text>
      </TouchableOpacity>
    </View>
  );
}

function CancelBookingModal({
  visible,
  ride,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  ride: BookingRide | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useAppTheme();

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
                Cancel booking?
              </Text>
              <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                This action is only demo for now.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: colors.input }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {ride && (
            <View
              style={{ backgroundColor: colors.input }}
              className="rounded-3xl p-4"
            >
              <Text style={{ color: colors.text }} className="font-extrabold">
                {ride.from} → {ride.to}
              </Text>
              <Text style={{ color: colors.muted }} className="mt-1 text-sm">
                {ride.date}, {ride.time}
              </Text>
            </View>
          )}

          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: colors.input }}
              className="flex-1 rounded-2xl py-4"
            >
              <Text
                style={{ color: colors.text }}
                className="text-center font-extrabold"
              >
                Keep Booking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={{ backgroundColor: colors.danger }}
              className="flex-1 rounded-2xl py-4"
            >
              <Text className="text-center font-extrabold text-white">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStatusTheme(status: BookingStatus, colors: ReturnType<typeof useAppTheme>["colors"]) {
  if (status === "completed") {
    return {
      label: "Completed",
      bg: colors.primarySoft,
      text: colors.primary,
    };
  }

  if (status === "cancelled") {
    return {
      label: "Cancelled",
      bg: colors.dangerSoft,
      text: colors.danger,
    };
  }

  return {
    label: "Upcoming",
    bg: "rgba(34,197,94,0.14)",
    text: colors.success,
  };
}