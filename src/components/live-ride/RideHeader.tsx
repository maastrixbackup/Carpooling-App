import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import { ArrowLeft, LocateFixed } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  onLocate: () => void;
};

export default function RideHeader({ onLocate }: Props) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
      }}
    >
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.back()}
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="h-11 w-11 items-center justify-center rounded-full border"
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onLocate}
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          className="h-11 w-11 items-center justify-center rounded-full border"
        >
          <LocateFixed size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}