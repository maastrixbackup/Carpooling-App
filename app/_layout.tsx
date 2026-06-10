import { ConfirmProvider } from "@/components/common/ConfirmProvider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { registerAndSavePushTokenAsync, useNotificationListeners } from "@/lib/pushNotifications";
import { queryClient } from "@/lib/queryClient";
import { AppThemeProvider, useAppTheme } from "@/theme/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StatusBar as RNStatusBar, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import "../global.css";

function AppContent() {
  const { isDark, colors } = useAppTheme();
  const { user, isAuthenticated } = useAuth();

  useNotificationListeners();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    registerAndSavePushTokenAsync({
      useDemoToken: false,
    });
  }, [isAuthenticated, user?.id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.bg,
          },
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="(auth)" options={{ animation: "none" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "none" }} />

        <Stack.Screen
          name="ride/[id]"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />

        <Stack.Screen
          name="booking/[id]"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />

        <Stack.Screen
          name="settings"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />

        <Stack.Screen
          name="notifications"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />

        <Stack.Screen
          name="vehicles"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="rewards"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="payments"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />

        <Stack.Screen
          name="ride-map/[id]"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />

        <Stack.Screen
          name="privacy-policy"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />

        <Stack.Screen
          name="terms-conditions"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="my-pub-rides"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />

        <Stack.Screen
          name="driver-ride/[id]"
          options={{
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </Stack>

      <ExpoStatusBar style={isDark ? "light" : "dark"} />

      <RNStatusBar
        backgroundColor={colors.bg}
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent={false}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppThemeProvider>
          <AuthProvider>
            <ConfirmProvider>
              <AppContent />
              <Toaster position="top-center" richColors duration={2500} />
            </ConfirmProvider>
          </AuthProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
