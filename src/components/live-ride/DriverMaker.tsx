import { useAppTheme } from "@/theme/ThemeProvider";
import { Car } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

type Props = {
  rotation?: Animated.AnimatedInterpolation<string> | string;
  size?: number;
};

export default function DriverMarker({ rotation = "0deg", size = 64 }: Props) {
  const { colors } = useAppTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.55,
          duration: 1300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: size - 6,
          height: size - 6,
          borderRadius: size,
          backgroundColor: colors.primary,
          opacity: 0.16,
          transform: [{ scale: pulse }],
        }}
      />

      <Animated.View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 4,
          borderColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOpacity: 0.28,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
          transform: [{ rotate: rotation }],
        }}
      >
        <Car size={23} color="#FFFFFF" strokeWidth={2.8} />
      </Animated.View>
    </View>
  );
}