import { useAppTheme } from "@/theme/ThemeProvider";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React, { createContext, useContext, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from "react-native-reanimated";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  iconType?: "danger" | "success" | "info";
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useAppTheme();

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
  });

  const confirm = (nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);
    setVisible(true);

    Haptics.selectionAsync();

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const resolveAndClose = async (value: boolean) => {
    if (loading) return;

    if (value) {
      setLoading(true);

      await Haptics.notificationAsync(
        options.danger
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );

      setLoading(false);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setVisible(false);

    setTimeout(() => {
      resolverRef.current?.(value);
      resolverRef.current = null;
    }, 120);
  };

  const confirmColor = options.danger ? colors.danger : colors.primary;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <Modal
        transparent
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => resolveAndClose(false)}
      >
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(140)}
          className="flex-1 justify-end"
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 28 : 18}
            tint={isDark ? "dark" : "light"}
            className="absolute inset-0"
          />

          <TouchableOpacity
            activeOpacity={1}
            onPress={() => resolveAndClose(false)}
            className="absolute inset-0 bg-black/25"
          />

          <Animated.View
            entering={SlideInDown.duration(220)}
            exiting={SlideOutDown.duration(170)}
            className="px-3 pb-8"
          >
            <View
              style={{
                backgroundColor: isDark
                  ? "rgba(28,28,30,0.96)"
                  : "rgba(255,255,255,0.96)",
                borderColor: colors.border,
              }}
              className="overflow-hidden rounded-[28px] border"
            >
              <View className="px-5 pb-5 pt-6">
                <Text
                  style={{ color: colors.text }}
                  className="text-center text-[18px] font-extrabold"
                >
                  {options.title}
                </Text>

                <Text
                  style={{ color: colors.muted }}
                  className="mt-2 text-center text-[13px] leading-5"
                >
                  {options.message}
                </Text>
              </View>

              <View
                style={{ backgroundColor: colors.border }}
                className="h-[1px] w-full"
              />

              <TouchableOpacity
                activeOpacity={0.75}
                disabled={loading}
                onPress={() => resolveAndClose(true)}
                className="min-h-[56px] items-center justify-center px-5"
              >
                {loading ? (
                  <ActivityIndicator color={confirmColor} />
                ) : (
                  <Text
                    style={{ color: confirmColor }}
                    className="text-[17px] font-extrabold"
                  >
                    {options.confirmText || "Confirm"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              disabled={loading}
              onPress={() => resolveAndClose(false)}
              style={{
                backgroundColor: isDark
                  ? "rgba(28,28,30,0.96)"
                  : "rgba(255,255,255,0.96)",
                borderColor: colors.border,
              }}
              className="mt-2 min-h-[56px] items-center justify-center rounded-[22px] border px-5"
            >
              <Text
                style={{ color: colors.primary }}
                className="text-[17px] font-extrabold"
              >
                {options.cancelText || "Cancel"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }

  return context.confirm;
}