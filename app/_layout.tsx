import { ConfirmProvider } from "@/components/common/ConfirmProvider";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { registerAndSavePushTokenAsync, useNotificationListeners } from "@/lib/pushNotifications";
import { queryClient } from "@/lib/queryClient";
import { AppThemeProvider, useAppTheme } from "@/theme/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import "../global.css";
import CustomSplashScreen from "../src/components/common/splashscreen";

SplashScreen.preventAutoHideAsync().catch(() => { });

function AppContent() {
  const { isDark, colors } = useAppTheme();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSplashTimingComplete, setIsSplashTimingComplete] = useState(false);

  useNotificationListeners();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    registerAndSavePushTokenAsync({
      useDemoToken: false,
    });
  }, [isAuthenticated, user?.id]);

  if (isLoading || !isSplashTimingComplete) {
    return (
      <CustomSplashScreen
        onFinish={() => setIsSplashTimingComplete(true)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 100,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          contentStyle: {
            backgroundColor: colors.bg,
          },
        }}
      >
        {/* Absolute Override Routes */}
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="(auth)" options={{ animation: "none" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "none" }} />

        {/* Override sub-screens only if they require a unique property, like rewards */}
        <Stack.Screen name="rewards" options={{ fullScreenGestureEnabled: false }} />


      </Stack>

      <ExpoStatusBar style={isDark ? "light" : "dark"} />
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
