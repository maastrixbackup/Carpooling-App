import { useConfirm } from "@/components/common/ConfirmProvider";
import {
    cancelRideApi,
    completeRideApi,
    getDriverRideDetailsApi,
    startRideApi,
    updateRideApi,
} from "@/services/ride.service";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Car,
    IndianRupee,
    Minus,
    Navigation,
    Pencil,
    Phone,
    Plus,
    Ticket,
    User,
    Users,
    X,
    XCircle
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Linking,
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

type ActiveTab = "overview" | "bookings";

type DriverRideUi = {
    id: string;
    from: string;
    to: string;
    fullFrom: string;
    fullTo: string;
    date: string;
    time: string;
    price: number;
    totalSeats: number;
    availableSeats: number;
    status: string;
    vehicle: string;
    registrationNumber: string;
    color: string;
    distanceMeters: number;
    durationSeconds: number;
    petAllowed: boolean;
    smokingAllowed: boolean;
    instantBooking: boolean;
    maxTwoInBack: boolean;
};

type DriverBookingUi = {
    id: string;
    passengerName: string;
    passengerPhone?: string | null;
    seats: number;
    status: string;
    totalPrice: number;
    paymentStatus: string;
    createdAt: string;
};

const cardShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
};

export default function DriverRideDetailsScreen() {
    const { colors } = useAppTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const confirm = useConfirm();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
    const [editVisible, setEditVisible] = useState(false);

    const { data, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ["driver-ride-details", id],
        queryFn: () => getDriverRideDetailsApi(id!),
        enabled: !!id,
    });

    const ride: DriverRideUi | null = data?.data?.ride
        ? mapRideToUi(data.data.ride)
        : null;

    const bookings: DriverBookingUi[] = useMemo(() => {
        return (data?.data?.bookings || []).map(mapBookingToUi);
    }, [data]);

    const bookedSeats = bookings.reduce((sum, item) => sum + item.seats, 0);
    const totalEarning = bookings.reduce((sum, item) => sum + item.totalPrice, 0);

    const startMutation = useMutation({
        mutationFn: startRideApi,
        onSuccess: async () => {
            toast.success("Ride started successfully.");
            await queryClient.invalidateQueries({ queryKey: ["driver-ride-details", id] });
            await queryClient.invalidateQueries({ queryKey: ["my-rides"] });
            await queryClient.invalidateQueries({ queryKey: ["rides"] });
        },
        onError: (error: any) => {
            toast.error(error?.message || "Unable to start ride.");
        },
    });

    const completeMutation = useMutation({
        mutationFn: completeRideApi,
        onSuccess: async () => {
            toast.success("Ride completed successfully.");
            await queryClient.invalidateQueries({ queryKey: ["driver-ride-details", id] });
            await queryClient.invalidateQueries({ queryKey: ["my-rides"] });
            await queryClient.invalidateQueries({ queryKey: ["rides"] });
        },
        onError: (error: any) => {
            toast.error(error?.message || "Unable to complete ride.");
        },
    });

    const handleStartRide = async () => {
        if (!ride) return;

        const ok = await confirm({
            title: "Start ride?",
            message: "Passengers will see that this ride has started.",
            confirmText: "Start Ride",
            cancelText: "Not Now",
            iconType: "success",
        });

        if (!ok) return;

        startMutation.mutate(ride.id);
    };

    const handleCompleteRide = async () => {
        if (!ride) return;

        const ok = await confirm({
            title: "Complete ride?",
            message: "This will mark the ride and related bookings as completed.",
            confirmText: "Complete Ride",
            cancelText: "Not Yet",
            iconType: "success",
        });

        if (!ok) return;

        completeMutation.mutate(ride.id);
    };

    const cancelMutation = useMutation({
        mutationFn: cancelRideApi,
        onSuccess: async () => {
            toast.success("Ride cancelled successfully.");
            await queryClient.invalidateQueries({ queryKey: ["driver-ride-details", id] });
            await queryClient.invalidateQueries({ queryKey: ["my-rides"] });
            await queryClient.invalidateQueries({ queryKey: ["rides"] });
            router.back();
        },
        onError: (error: any) => {
            toast.error(error?.message || "Unable to cancel ride.");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ rideId, payload }: { rideId: string; payload: any }) =>
            updateRideApi(rideId, payload),
        onSuccess: async () => {
            toast.success("Ride updated successfully.");
            setEditVisible(false);
            await queryClient.invalidateQueries({ queryKey: ["driver-ride-details", id] });
            await queryClient.invalidateQueries({ queryKey: ["my-rides"] });
            await queryClient.invalidateQueries({ queryKey: ["rides"] });
        },
        onError: (error: any) => {
            toast.error(error?.message || "Unable to update ride.");
        },
    });

    const handleCancelRide = async () => {
        if (!ride) return;

        const ok = await confirm({
            title: "Cancel ride?",
            message: "This will cancel the ride. Passengers with bookings may be affected.",
            confirmText: "Cancel Ride",
            cancelText: "Keep Ride",
            danger: true,
        });

        if (!ok) return;

        cancelMutation.mutate(ride.id);
    };

    const handleCallPassenger = (phone?: string | null) => {
        if (!phone) {
            toast.error("Passenger phone number is not available.");
            return;
        }

        Linking.openURL(`tel:${phone}`);
    };

    const handleViewMap = () => {
        if (!ride) return;

        router.push({
            pathname: "/ride-map/[id]" as any,
            params: { id: ride.id },
        });
    };

    if (isLoading) {
        return (
            <CenterState
                title="Loading ride..."
                subtitle="Fetching your published ride details."
                loading
            />
        );
    }

    if (isError || !ride) {
        return (
            <CenterState
                title="Ride not found"
                subtitle="This ride may not exist or may not belong to your account."
                actionText="Go Back"
                onAction={() => router.back()}
            />
        );
    }

    const statusTheme = getStatusTheme(ride.status, colors);
    const canCancel = ride.status !== "cancelled" && ride.status !== "ongoing" && ride.status !== "completed";
    const canEdit = ride.status === "scheduled";
    const canStart = ride.status === "scheduled";
    const canComplete = ride.status === "ongoing";
    const isActionLoading = startMutation.isPending || completeMutation.isPending || cancelMutation.isPending;

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isFetching} onRefresh={refetch} />
                    }
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingTop: Platform.OS === "android" ? 16 : 12,
                        paddingBottom: canCancel ? 165 : 120,
                    }}
                >
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => router.back()}
                            style={{
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            }}
                            className="h-11 w-11 items-center justify-center rounded-full border"
                        >
                            <ArrowLeft size={22} color={colors.text} />
                        </TouchableOpacity>

                        <View
                            style={{ backgroundColor: statusTheme.bg }}
                            className="rounded-full px-4 py-2"
                        >
                            <Text style={{ color: statusTheme.text }} className="text-xs font-extrabold">
                                {statusTheme.label}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={{
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            ...cardShadow,
                        }}
                        className="mt-6 rounded-[30px] border p-5"
                    >
                        <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
                            Published Ride
                        </Text>

                        <View className="mt-5 flex-row gap-3">
                            <View className="items-center pt-1">
                                <View style={{ backgroundColor: colors.primary }} className="h-3 w-3 rounded-full" />
                                <View style={{ backgroundColor: colors.border }} className="my-1 h-10 w-[1px]" />
                                <View style={{ backgroundColor: colors.success }} className="h-3 w-3 rounded-full" />
                            </View>

                            <View className="flex-1">
                                <Text style={{ color: colors.text }} className="text-xl font-extrabold" numberOfLines={1}>
                                    {ride.from}
                                </Text>

                                <Text style={{ color: colors.text }} className="mt-5 text-xl font-extrabold" numberOfLines={1}>
                                    {ride.to}
                                </Text>
                            </View>
                        </View>

                        <View className="mt-5 flex-row flex-wrap gap-2">
                            <Pill text={`${formatDate(ride.date)} • ${formatTime(ride.time)}`} />
                            <Pill text={`${formatDistance(ride.distanceMeters)} • ${formatDuration(ride.durationSeconds)}`} />
                        </View>
                    </View>

                    <View className="mt-5 flex-row gap-3">
                        <MiniStat icon={<Ticket size={17} color={colors.primary} />} label="Bookings" value={`${bookings.length}`} />
                        <MiniStat icon={<Users size={17} color={colors.success} />} label="Available" value={`${ride.availableSeats}/${ride.totalSeats}`} />
                    </View>

                    <View className="mt-3 flex-row gap-3">
                        <MiniStat icon={<IndianRupee size={17} color={colors.primary} />} label="Earning" value={`₹${totalEarning}`} />
                        <MiniStat icon={<Users size={17} color={colors.success} />} label="Booked" value={`${bookedSeats}`} />
                    </View>

                    {ride.status === "completed" && (
                        <PaymentReceivedCard
                            totalAmount={totalEarning}
                            totalBookings={bookings.length}
                        />
                    )}

                    <View
                        style={{
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            ...cardShadow,
                        }}
                        className="mt-6 flex-row rounded-[24px] border p-2"
                    >
                        <SegmentButton label="Overview" active={activeTab === "overview"} onPress={() => setActiveTab("overview")} />
                        <SegmentButton label={`Bookings (${bookings.length})`} active={activeTab === "bookings"} onPress={() => setActiveTab("bookings")} />
                    </View>

                    {activeTab === "overview" ? (
                        <OverviewTab ride={ride} onViewMap={handleViewMap} />
                    ) : (
                        <BookingsTab bookings={bookings} onCallPassenger={handleCallPassenger} />
                    )}
                </ScrollView>

                <View
                    style={{
                        backgroundColor: colors.card,
                        borderTopColor: colors.border,
                        ...cardShadow,
                    }}
                    className="absolute bottom-0 left-0 right-0 rounded-t-[28px] border-t px-5 pb-8 pt-4"
                >
                    <View className="flex-row gap-3">
                        {canEdit && (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setEditVisible(true)}
                                disabled={isActionLoading}
                                style={{
                                    backgroundColor: colors.primary,
                                    opacity: isActionLoading ? 0.7 : 1,
                                }}
                                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
                            >
                                <Pencil size={18} color="#FFFFFF" />
                                <Text className="font-extrabold text-white">Edit</Text>
                            </TouchableOpacity>
                        )}

                        {canStart && (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleStartRide}
                                disabled={isActionLoading}
                                style={{
                                    backgroundColor: colors.success,
                                    opacity: isActionLoading ? 0.7 : 1,
                                }}
                                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
                            >
                                {startMutation.isPending ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Navigation size={18} color="#FFFFFF" />
                                        <Text className="font-extrabold text-white">Start</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {canComplete && (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleCompleteRide}
                                disabled={isActionLoading}
                                style={{
                                    backgroundColor: colors.success,
                                    opacity: isActionLoading ? 0.7 : 1,
                                }}
                                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
                            >
                                {completeMutation.isPending ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ticket size={18} color="#FFFFFF" />
                                        <Text className="font-extrabold text-white">Complete</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {canCancel && (
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleCancelRide}
                                disabled={isActionLoading}
                                style={{
                                    backgroundColor: colors.danger,
                                    opacity: isActionLoading ? 0.7 : 1,
                                }}
                                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4"
                            >
                                {cancelMutation.isPending ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <XCircle size={18} color="#FFFFFF" />
                                        <Text className="font-extrabold text-white">Cancel</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <EditRideModal
                    visible={editVisible}
                    ride={ride}
                    loading={updateMutation.isPending}
                    onClose={() => setEditVisible(false)}
                    onSubmit={(payload) => {
                        updateMutation.mutate({
                            rideId: ride.id,
                            payload,
                        });
                    }}
                />
            </SafeAreaView>
        </View>
    );
}

function OverviewTab({ ride, onViewMap }: { ride: DriverRideUi; onViewMap: () => void }) {
    const { colors } = useAppTheme();

    return (
        <>
            <SectionCard title="Ride">
                <InfoRow
                    icon={<Calendar size={18} color={colors.primary} />}
                    label="Schedule"
                    value={`${formatDate(ride.date)} • ${formatTime(ride.time)}`}
                />

                <InfoRow
                    icon={<Car size={18} color={colors.primary} />}
                    label="Vehicle"
                    value={`${ride.vehicle} • ${ride.color} • ${ride.registrationNumber}`}
                />

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onViewMap}
                    style={{ backgroundColor: colors.primarySoft }}
                    className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
                >
                    <Navigation size={18} color={colors.primary} />
                    <Text style={{ color: colors.primary }} className="font-extrabold">
                        View Route Map
                    </Text>
                </TouchableOpacity>
            </SectionCard>

            <SectionCard title="Ride Settings">
                <View className="flex-row flex-wrap gap-2">
                    <PreferencePill label="Pet" enabled={ride.petAllowed} />
                    <PreferencePill label="Smoking" enabled={ride.smokingAllowed} />
                    <PreferencePill label="Instant Booking" enabled={ride.instantBooking} />
                    <PreferencePill label="Max Two Back" enabled={ride.maxTwoInBack} />
                </View>
            </SectionCard>
        </>
    );
}

function BookingsTab({
    bookings,
    onCallPassenger,
}: {
    bookings: DriverBookingUi[];
    onCallPassenger: (phone?: string | null) => void;
}) {
    const { colors } = useAppTheme();

    if (bookings.length === 0) {
        return (
            <View
                style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    ...cardShadow,
                }}
                className="mt-5 items-center rounded-[30px] border p-8"
            >
                <Ticket size={38} color={colors.muted} />
                <Text style={{ color: colors.text }} className="mt-4 text-lg font-extrabold">
                    No passengers yet
                </Text>
                <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
                    Passenger bookings will appear here.
                </Text>
            </View>
        );
    }

    return (
        <View className="mt-5 gap-4">
            {bookings.map((booking) => (
                <PassengerCard
                    key={booking.id}
                    booking={booking}
                    onCall={() => onCallPassenger(booking.passengerPhone)}
                />
            ))}
        </View>
    );
}

function PassengerCard({ booking, onCall }: { booking: DriverBookingUi; onCall: () => void }) {
    const { colors } = useAppTheme();
    const statusTheme = getBookingStatusTheme(booking.status, colors);

    return (
        <View
            style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...cardShadow,
            }}
            className="rounded-[28px] border p-5"
        >
            <View className="flex-row items-center justify-between gap-3">
                <View className="flex-row flex-1 items-center gap-3">
                    <View style={{ backgroundColor: colors.primarySoft }} className="h-12 w-12 items-center justify-center rounded-full">
                        <User size={22} color={colors.primary} />
                    </View>

                    <View className="flex-1">
                        <Text style={{ color: colors.text }} className="font-extrabold" numberOfLines={1}>
                            {booking.passengerName}
                        </Text>
                        <Text style={{ color: colors.muted }} className="mt-1 text-xs font-semibold">
                            {booking.seats} seat{booking.seats > 1 ? "s" : ""} • ₹{booking.totalPrice}
                        </Text>
                    </View>
                </View>

                <View style={{ backgroundColor: statusTheme.bg }} className="rounded-full px-3 py-1.5">
                    <Text style={{ color: statusTheme.text }} className="text-xs font-bold">
                        {statusTheme.label}
                    </Text>
                </View>
            </View>

            <View style={{ borderTopColor: colors.border }} className="mt-4 flex-row items-center justify-between border-t pt-4">
                <Text style={{ color: colors.muted }} className="text-xs font-bold">
                    {formatDate(booking.createdAt)}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onCall}
                    style={{ backgroundColor: colors.primarySoft }}
                    className="flex-row items-center gap-2 rounded-full px-4 py-2"
                >
                    <Phone size={15} color={colors.primary} />
                    <Text style={{ color: colors.primary }} className="text-xs font-bold">
                        Call
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function EditRideModal({
    visible,
    ride,
    loading,
    onClose,
    onSubmit,
}: {
    visible: boolean;
    ride: DriverRideUi;
    loading: boolean;
    onClose: () => void;
    onSubmit: (payload: any) => void;
}) {
    const { colors } = useAppTheme();

    const [price, setPrice] = useState(String(ride.price));
    const [availableSeats, setAvailableSeats] = useState(ride.availableSeats);
    const [petAllowed, setPetAllowed] = useState(ride.petAllowed);
    const [smokingAllowed, setSmokingAllowed] = useState(ride.smokingAllowed);
    const [instantBooking, setInstantBooking] = useState(ride.instantBooking);
    const [maxTwoInBack, setMaxTwoInBack] = useState(ride.maxTwoInBack);

    useEffect(() => {
        if (visible) {
            setPrice(String(ride.price));
            setAvailableSeats(ride.availableSeats);
            setPetAllowed(ride.petAllowed);
            setSmokingAllowed(ride.smokingAllowed);
            setInstantBooking(ride.instantBooking);
            setMaxTwoInBack(ride.maxTwoInBack);
        }
    }, [visible, ride]);

    const handleSave = () => {
        const priceNumber = Number(price);

        if (!priceNumber || priceNumber <= 0) {
            toast.error("Please enter a valid price.");
            return;
        }

        if (availableSeats < 0 || availableSeats > ride.totalSeats) {
            toast.error(`Available seats must be between 0 and ${ride.totalSeats}.`);
            return;
        }

        onSubmit({
            price_per_seat: priceNumber,
            available_seats: availableSeats,
            pet_allowed: petAllowed ? "yes" : "no",
            smoking_allowed: smokingAllowed ? "yes" : "no",
            instant_booking: instantBooking ? "yes" : "no",
            max_two_in_back: maxTwoInBack ? "yes" : "no",
        });
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/45">
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <View
                        style={{
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        }}
                        className="rounded-t-[34px] border-t px-5 pb-8 pt-5"
                    >
                        <View className="mb-5 flex-row items-center justify-between">
                            <View>
                                <Text style={{ color: colors.text }} className="text-2xl font-extrabold">
                                    Edit Ride
                                </Text>
                                <Text style={{ color: colors.muted }} className="mt-1 text-sm">
                                    Location, date and time cannot be changed.
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={onClose}
                                disabled={loading}
                                style={{ backgroundColor: colors.input }}
                                className="h-10 w-10 items-center justify-center rounded-full"
                            >
                                <X size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-4">
                            <View>
                                <Text style={{ color: colors.muted }} className="mb-2 text-xs font-bold uppercase">
                                    Price per seat
                                </Text>
                                <View
                                    style={{ backgroundColor: colors.input }}
                                    className="flex-row items-center gap-2 rounded-2xl px-4 py-3"
                                >
                                    <IndianRupee size={18} color={colors.primary} />
                                    <TextInput
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="numeric"
                                        placeholder="120"
                                        placeholderTextColor={colors.muted}
                                        style={{ color: colors.text }}
                                        className="flex-1 text-base font-extrabold"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={{ color: colors.muted }} className="mb-2 text-xs font-bold uppercase">
                                    Available seats
                                </Text>

                                <View
                                    style={{ backgroundColor: colors.input }}
                                    className="flex-row items-center justify-between rounded-2xl p-3"
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => setAvailableSeats((prev) => Math.max(0, prev - 1))}
                                        style={{ backgroundColor: colors.card }}
                                        className="h-10 w-10 items-center justify-center rounded-full"
                                    >
                                        <Minus size={17} color={colors.text} />
                                    </TouchableOpacity>

                                    <Text style={{ color: colors.text }} className="text-xl font-extrabold">
                                        {availableSeats} / {ride.totalSeats}
                                    </Text>

                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => setAvailableSeats((prev) => Math.min(ride.totalSeats, prev + 1))}
                                        style={{ backgroundColor: colors.primary }}
                                        className="h-10 w-10 items-center justify-center rounded-full"
                                    >
                                        <Plus size={17} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="flex-row flex-wrap gap-2">
                                <TogglePill label="Pet" active={petAllowed} onPress={() => setPetAllowed((prev) => !prev)} />
                                <TogglePill label="Smoking" active={smokingAllowed} onPress={() => setSmokingAllowed((prev) => !prev)} />
                                <TogglePill label="Instant Booking" active={instantBooking} onPress={() => setInstantBooking((prev) => !prev)} />
                                <TogglePill label="Max Two Back" active={maxTwoInBack} onPress={() => setMaxTwoInBack((prev) => !prev)} />
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={handleSave}
                                disabled={loading}
                                style={{
                                    backgroundColor: colors.primary,
                                    opacity: loading ? 0.75 : 1,
                                }}
                                className="mt-2 rounded-2xl py-4"
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text className="text-center font-extrabold text-white">
                                        Save Changes
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

function TogglePill({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    const { colors } = useAppTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={{
                backgroundColor: active ? colors.primary : colors.input,
                borderColor: active ? colors.primary : colors.border,
            }}
            className="rounded-full border px-4 py-2"
        >
            <Text style={{ color: active ? "#FFFFFF" : colors.text }} className="text-xs font-extrabold">
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    const { colors } = useAppTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={{ backgroundColor: active ? colors.primary : "transparent" }}
            className="flex-1 rounded-2xl py-3"
        >
            <Text style={{ color: active ? "#FFFFFF" : colors.muted }} className="text-center text-sm font-extrabold">
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    const { colors } = useAppTheme();

    return (
        <View
            style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...cardShadow,
            }}
            className="flex-1 rounded-[24px] border p-4"
        >
            <View className="flex-row items-center gap-2">
                {icon}
                <Text style={{ color: colors.muted }} className="text-xs font-bold">
                    {label}
                </Text>
            </View>
            <Text style={{ color: colors.text }} className="mt-2 text-2xl font-extrabold">
                {value}
            </Text>
        </View>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    const { colors } = useAppTheme();

    return (
        <View
            style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...cardShadow,
            }}
            className="mt-5 rounded-[30px] border p-5"
        >
            <Text style={{ color: colors.text }} className="text-lg font-extrabold">
                {title}
            </Text>
            <View className="mt-5 gap-4">{children}</View>
        </View>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    const { colors } = useAppTheme();

    return (
        <View style={{ backgroundColor: colors.input }} className="flex-row items-center gap-3 rounded-2xl p-3">
            <View style={{ backgroundColor: colors.primarySoft }} className="h-10 w-10 items-center justify-center rounded-2xl">
                {icon}
            </View>
            <View className="flex-1">
                <Text style={{ color: colors.muted }} className="text-xs font-bold">
                    {label}
                </Text>
                <Text style={{ color: colors.text }} className="mt-1 text-sm font-semibold leading-5" numberOfLines={3}>
                    {value || "Not available"}
                </Text>
            </View>
        </View>
    );
}

function PreferencePill({ label, enabled }: { label: string; enabled: boolean }) {
    const { colors } = useAppTheme();

    return (
        <View
            style={{
                backgroundColor: enabled ? "rgba(34,197,94,0.14)" : colors.dangerSoft,
            }}
            className="rounded-full px-4 py-2"
        >
            <Text style={{ color: enabled ? colors.success : colors.danger }} className="text-xs font-bold">
                {label}: {enabled ? "Yes" : "No"}
            </Text>
        </View>
    );
}

function Pill({ text }: { text: string }) {
    const { colors } = useAppTheme();

    return (
        <View style={{ backgroundColor: colors.primarySoft }} className="rounded-full px-4 py-2">
            <Text style={{ color: colors.primary }} className="text-xs font-bold">
                {text}
            </Text>
        </View>
    );
}

function CenterState({
    title,
    subtitle,
    loading,
    actionText,
    onAction,
}: {
    title: string;
    subtitle: string;
    loading?: boolean;
    actionText?: string;
    onAction?: () => void;
}) {
    const { colors } = useAppTheme();

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }} className="items-center justify-center px-5">
            <View
                style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    ...cardShadow,
                }}
                className="w-full items-center rounded-[30px] border p-8"
            >
                {loading ? <ActivityIndicator color={colors.primary} /> : <Car size={42} color={colors.muted} />}
                <Text style={{ color: colors.text }} className="mt-4 text-xl font-extrabold">
                    {title}
                </Text>
                <Text style={{ color: colors.muted }} className="mt-2 text-center text-sm">
                    {subtitle}
                </Text>

                {actionText && onAction && (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={onAction}
                        style={{ backgroundColor: colors.primary }}
                        className="mt-6 rounded-2xl px-6 py-3"
                    >
                        <Text className="font-extrabold text-white">{actionText}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

function mapRideToUi(ride: any): DriverRideUi {
    return {
        id: String(ride.id),
        from: shortAddress(ride.source_address),
        to: shortAddress(ride.destination_address),
        fullFrom: ride.source_address || "",
        fullTo: ride.destination_address || "",
        date: ride.ride_date || "",
        time: ride.departure_time || "",
        price: Number(ride.price_per_seat || 0),
        totalSeats: Number(ride.total_seats || 0),
        availableSeats: Number(ride.available_seats || 0),
        status: ride.status || "scheduled",
        vehicle: `${ride.brand || ""} ${ride.model || ""}`.trim() || "Vehicle",
        registrationNumber: ride.registration_number || "Not available",
        color: ride.color || "Vehicle",
        distanceMeters: Number(ride.distance_meters || 0),
        durationSeconds: Number(ride.duration_seconds || 0),
        petAllowed: ride.pet_allowed === "yes",
        smokingAllowed: ride.smoking_allowed === "yes",
        instantBooking: ride.instant_booking === "yes",
        maxTwoInBack: ride.max_two_in_back === "yes",
    };
}

function mapBookingToUi(booking: any): DriverBookingUi {
    return {
        id: String(booking.id),
        passengerName: booking.passenger_name || "Passenger",
        passengerPhone: booking.passenger_phone || null,
        seats: Number(booking.seats || 1),
        status: booking.status || "pending",
        totalPrice: Number(booking.total_price || 0),
        paymentStatus: booking.payment_status || "unpaid",
        createdAt: booking.created_at || "",
    };
}

function shortAddress(address?: string) {
    if (!address) return "";
    return address.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 3).join(", ");
}

function formatDate(value?: string) {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });
}

function formatTime(value?: string) {
    if (!value) return "Time unavailable";
    const parts = value.split(":");
    if (parts.length < 2) return value;

    let hour = Number(parts[0]);
    const minute = parts[1];

    if (Number.isNaN(hour)) return value;

    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${minute} ${ampm}`;
}

function formatDistance(meters: number) {
    if (!meters) return "Distance unavailable";
    return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
    if (!seconds) return "Duration unavailable";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function getStatusTheme(status: string, colors: ReturnType<typeof useAppTheme>["colors"]) {
    const value = String(status || "").toLowerCase();

    if (value === "ongoing") {
        return {
            label: "In Progress", bg: colors.primarySoft, text: colors.primary,
        };
    }

    if (value === "cancelled") {
        return { label: "Cancelled", bg: colors.dangerSoft, text: colors.danger };
    }

    if (value === "completed") {
        return { label: "Completed", bg: colors.primarySoft, text: colors.primary };
    }

    return { label: "Scheduled", bg: "rgba(34,197,94,0.14)", text: colors.success };
}

function getBookingStatusTheme(status: string, colors: ReturnType<typeof useAppTheme>["colors"]) {
    const value = String(status || "").toLowerCase();

    if (value === "cancelled") {
        return { label: "Cancelled", bg: colors.dangerSoft, text: colors.danger };
    }

    if (value === "confirmed") {
        return { label: "Confirmed", bg: "rgba(34,197,94,0.14)", text: colors.success };
    }

    if (value === "completed") {
        return { label: "Completed", bg: colors.primarySoft, text: colors.primary };
    }

    return { label: "Pending", bg: colors.primarySoft, text: colors.primary };
}

function PaymentReceivedCard({
  totalAmount,
  totalBookings,
}: {
  totalAmount: number;
  totalBookings: number;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        ...cardShadow,
      }}
      className="mt-5 overflow-hidden rounded-[30px] border p-5"
    >
      <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-green-500/10" />

      <View className="flex-row items-start justify-between gap-4">
        <View
          style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
          className="h-12 w-12 items-center justify-center rounded-2xl"
        >
          <IndianRupee size={22} color={colors.success} />
        </View>

        <View
          style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
          className="rounded-full px-3 py-1.5"
        >
          <Text style={{ color: colors.success }} className="text-xs font-bold">
            Cash Received
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.text }} className="mt-4 text-xl font-extrabold">
        Payment Collected
      </Text>

      <Text style={{ color: colors.muted }} className="mt-2 text-sm leading-5">
        This ride is completed. Cash payment is considered received from passengers for now.
      </Text>

      <View
        style={{ backgroundColor: colors.input }}
        className="mt-5 flex-row items-center justify-between rounded-2xl px-4 py-3"
      >
        <View>
          <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
            Total Cash
          </Text>
          <Text style={{ color: colors.success }} className="mt-1 text-2xl font-extrabold">
            ₹{totalAmount}
          </Text>
        </View>

        <View className="items-end">
          <Text style={{ color: colors.muted }} className="text-xs font-bold uppercase">
            Bookings
          </Text>
          <Text style={{ color: colors.text }} className="mt-1 font-extrabold">
            {totalBookings}
          </Text>
        </View>
      </View>
    </View>
  );
}