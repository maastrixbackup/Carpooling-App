import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
  Car,
  Clock,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type RideCardProps = {
  ride: {
    id: string;
    from: string;
    to: string;
    date: string;
    time: string;
    price: number;
    seats: number;
    driver: string;
    rating: number;
    total_rides: number;
    car: string;
    pickup: string;
    drop: string;
  };
};

export function RideCard({ ride }: RideCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/ride-map/[id]",
          params: { id: ride.id },
        })
      }
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className="mb-4 overflow-hidden rounded-[32px] border p-5 active:scale-[0.98]"
    >
      <View className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10" />
      <View className="absolute -bottom-14 -left-14 h-36 w-36 rounded-full bg-blue-500/5" />

      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <View
              style={{ backgroundColor: "rgba(34,197,94,0.14)" }}
              className="flex-row items-center gap-1 rounded-full px-3 py-1"
            >
              <ShieldCheck size={13} color={colors.success} />
              <Text style={{ color: colors.success }} className="text-[11px] font-bold">
                Verified
              </Text>
            </View>

            <View className="flex-row items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1">
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <Text style={{ color: colors.text }} className="text-[11px] font-bold">
                {ride.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          <Text style={{ color: colors.text }} className="text-xl font-extrabold">
            {ride.from}
          </Text>

          <Text style={{ color: colors.muted }} className="my-1 text-lg font-bold">
            ↓
          </Text>

          <Text style={{ color: colors.text }} className="text-xl font-extrabold">
            {ride.to}
          </Text>
        </View>

        <View
          style={{ backgroundColor: colors.primarySoft }}
          className="rounded-2xl px-4 py-3"
        >
          <Text style={{ color: colors.primary }} className="text-lg font-extrabold">
            ₹{ride.price}
          </Text>
          <Text style={{ color: colors.muted }} className="text-[10px] font-bold">
            per seat
          </Text>
        </View>
      </View>

      <View
        style={{ borderColor: colors.border }}
        className="mt-5 rounded-3xl border p-4"
      >
        <InfoRow
          icon={<Clock size={16} color={colors.primary} />}
          text={`${ride.date} • ${ride.time}`}
        />

        <InfoRow
          icon={<MapPin size={16} color={colors.primary} />}
          text={`${ride.pickup} to ${ride.drop}`}
        />

        <InfoRow
          icon={<Car size={16} color={colors.primary} />}
          text={ride.car}
        />

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Users size={16} color={colors.primary} />
            <Text style={{ color: colors.muted }} className="text-sm font-semibold">
              {ride.seats} seats left
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Navigation size={15} color={colors.primary} />
            <Text style={{ color: colors.primary }} className="text-sm font-extrabold">
              View route
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{ borderTopColor: colors.border }}
        className="mt-5 flex-row items-center justify-between border-t pt-4"
      >
        <View className="flex-row items-center gap-3">
          <View
            style={{ backgroundColor: colors.primary }}
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <Text className="font-extrabold text-white">
              {ride.driver.charAt(0)}
            </Text>
          </View>

          <View>
            <Text style={{ color: colors.text }} className="text-sm font-extrabold">
              {ride.driver}
            </Text>
            <Text style={{ color: colors.muted }} className="text-xs font-medium">
              Driver • {ride.rating.toFixed(1)} rating •  ({ride.total_rides} rides)
            </Text>
          </View>
        </View>

        <Text style={{ color: colors.primary }} className="text-sm font-extrabold">
          Details
        </Text>
      </View>
    </Pressable>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-3 flex-row items-center gap-2 last:mb-0">
      {icon}
      <Text
        style={{ color: colors.muted }}
        className="flex-1 text-sm font-semibold"
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}