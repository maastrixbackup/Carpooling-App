import { useAppTheme } from "@/theme/ThemeProvider";
import { CheckCircle2, ChevronRight } from "lucide-react-native";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    PanResponder,
    Text,
    View,
    useWindowDimensions,
} from "react-native";

type Props = {
    label: string;
    completedLabel?: string;
    loading?: boolean;
    disabled?: boolean;
    onComplete: () => void;
};

const BUTTON_HEIGHT = 58;
const THUMB_SIZE = 48;

export default function SlideActionButton({
    label,
    completedLabel = "Completed",
    loading = false,
    disabled = false,
    onComplete,
}: Props) {
    const { colors } = useAppTheme();
    const { width } = useWindowDimensions();

    const containerWidth = Math.min(width - 40, 520);
    const maxTranslate = containerWidth - THUMB_SIZE - 10;

    const translateX = useRef(new Animated.Value(0)).current;
    const [done, setDone] = useState(false);

    const reset = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 60,
        }).start();
    };

    const complete = () => {
        setDone(true);

        Animated.spring(translateX, {
            toValue: maxTranslate,
            useNativeDriver: true,
            friction: 8,
            tension: 60,
        }).start(() => {
            onComplete();

            setTimeout(() => {
                setDone(false);
                reset();
            }, 800);
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => !loading && !disabled,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dx < 0) return;

                translateX.setValue(Math.min(gesture.dx, maxTranslate));
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > maxTranslate * 0.72) {
                    complete();
                } else {
                    reset();
                }
            },
        }),
    ).current;

    return (
        <View
            style={{
                width: "100%",
                height: BUTTON_HEIGHT,
                borderRadius: 22,
                backgroundColor: disabled ? colors.input : colors.success,
                opacity: disabled ? 0.65 : 1,
                overflow: "hidden",
            }}
            className="justify-center"
        >
            <Animated.View
                style={{
                    position: "absolute",
                    left: 0,
                    width: containerWidth,
                    height: BUTTON_HEIGHT,
                    backgroundColor: "rgba(255,255,255,0.12)",
                    transform: [
                        {
                            translateX: translateX.interpolate({
                                inputRange: [0, maxTranslate],
                                outputRange: [-containerWidth + THUMB_SIZE + 10, 0],
                                extrapolate: "clamp",
                            }),
                        },
                    ],
                }}
            />

            <Text className="text-center text-base font-extrabold text-white">
                {loading ? "Completing ride..." : done ? completedLabel : label}
            </Text>

            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    position: "absolute",
                    left: 5,
                    transform: [{ translateX }],
                    width: THUMB_SIZE,
                    height: THUMB_SIZE,
                    borderRadius: 18,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {loading ? (
                    <ActivityIndicator color={colors.success} />
                ) : done ? (
                    <CheckCircle2 size={22} color={colors.success} />
                ) : (
                    <ChevronRight size={25} color={colors.success} />
                )}
            </Animated.View>
        </View>
    );
}