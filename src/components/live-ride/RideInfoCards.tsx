import { useAppTheme } from "@/theme/ThemeProvider";
import { formatDuration, formatSpeed } from "@/utils/liveRide";
import { Clock, Gauge, Radio, ShieldCheck } from "lucide-react-native";
import { Text, View } from "react-native";

type Props = {
  connectionLabel: string;
  durationSeconds?: number | string;
  isVerified?: boolean;
  speed?: number | null;
};

export default function RideInfoCards({
  connectionLabel,
  durationSeconds,
  isVerified,
  speed,
}: Props) {
  const { colors } = useAppTheme();

  return (
    <View className="mt-5 flex-row gap-3">
      <InfoCard
        icon={<Radio size={17} color={connectionLabel === "Live" ? colors.success : colors.muted} />}
        label="Status"
        value={connectionLabel}
      />

      <InfoCard
        icon={<Clock size={17} color={colors.primary} />}
        label="ETA"
        value={formatDuration(durationSeconds)}
      />

      <InfoCard
        icon={<Gauge size={17} color={colors.primary} />}
        label="Speed"
        value={formatSpeed(speed)}
      />

      <InfoCard
        icon={<ShieldCheck size={17} color={colors.success} />}
        label="Driver"
        value={isVerified ? "Verified" : "Basic"}
      />
    </View>
  );
}

function InfoCard({
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
    <View style={{ backgroundColor: colors.input }} className="flex-1 rounded-2xl p-3">
      {icon}

      <Text style={{ color: colors.muted }} className="mt-2 text-[10px] font-bold">
        {label}
      </Text>

      <Text
        style={{ color: colors.text }}
        className="mt-0.5 text-xs font-extrabold"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}