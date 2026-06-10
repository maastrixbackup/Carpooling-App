import { savePushTokenApi } from "@/services/notification.service";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  //   if (!Device.isDevice) {
  //     console.log("Push notifications work best on a real device.");
  //     return null;
  //   }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0066CC",
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermission.status;
  if (existingPermission.status !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission not granted.");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.log("Missing EAS projectId.");
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  console.log("EXPO PUSH TOKEN:", token.data);
  return token.data;
}

export async function registerAndSavePushTokenAsync({
  useDemoToken = false,
}: {
  useDemoToken?: boolean;
} = {}) {
  try {
    let token: string | null = null;

    if (useDemoToken) {
      token = `demo-token-${Platform.OS}-${Date.now()}`;
    } else {
      token = await registerForPushNotificationsAsync();
    }

    if (!token) return null;

    await savePushTokenApi({
      expo_push_token: token,
      device_type: Platform.OS,
      device_name: `${Platform.OS} device`,
    });

    console.log("PUSH TOKEN SAVED:", token);

    return token;
  } catch (error) {
    console.log("PUSH TOKEN SAVE FAILED:", error);
    return null;
  }
}

export function useNotificationListeners() {
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    receivedListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("NOTIFICATION RECEIVED:", notification);
      },
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as any;

        console.log("NOTIFICATION TAPPED:", data);

        if (data?.screen === "booking" && data?.bookingId) {
          router.push({
            pathname: "/booking/[id]",
            params: { id: String(data.bookingId) },
          });
          return;
        }

        if (data?.screen === "driver-ride" && data?.rideId) {
          router.push({
            pathname: "/driver-ride/[id]" as any,
            params: { id: String(data.rideId) },
          });
          return;
        }

        if (data?.screen === "notifications") {
          router.push("/notifications");
        }
      });

    return () => {
      if (receivedListener.current) {
        receivedListener.current.remove();
      }

      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
}
