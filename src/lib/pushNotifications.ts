import { savePushTokenApi } from "@/services/notification.service";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

const PUSH_TOKEN_KEY = "expo_push_token";
const DEVICE_ID_KEY = "app_device_id";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function createDeviceId() {
  return `device-${Platform.OS}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

async function getOrCreateDeviceId() {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const deviceId = createDeviceId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

function getDeviceType(): "ios" | "android" | "web" | "unknown" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "web") return "web";
  return "unknown";
}

function getAppVersion() {
  return (
    Constants.expoConfig?.version || Constants.nativeAppVersion || "unknown"
  );
}

function getBuildNumber() {
  return (
    Constants.expoConfig?.ios?.buildNumber ||
    Constants.expoConfig?.android?.versionCode?.toString?.() ||
    Constants.nativeBuildVersion ||
    "unknown"
  );
}

function getDeviceName() {
  return Device.deviceName || Device.modelName || `${Platform.OS} device`;
}

function getOsVersion() {
  return Device.osVersion
    ? `${Device.osName || Platform.OS} ${Device.osVersion}`
    : String(Platform.OS);
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice && process.env.NODE_ENV === "production") {
    console.log("Push notifications require a physical device.");
    return null;
  }

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

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function registerAndSavePushTokenAsync({
  useDemoToken = false,
}: {
  useDemoToken?: boolean;
} = {}) {
  try {
    const deviceId = await getOrCreateDeviceId();

    const token = useDemoToken
      ? `ExpoPushToken[demo-${Platform.OS}-${Date.now()}]`
      : await registerForPushNotificationsAsync();

    if (!token) return null;

    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);

    await savePushTokenApi({
      expo_push_token: token,
      device_type: getDeviceType(),
      device_name: getDeviceName(),
      device_id: deviceId,
      app_version: getAppVersion(),
      build_number: getBuildNumber(),
      os_version: getOsVersion(),
    });

    console.log("PUSH TOKEN SAVED:", token);

    return token;
  } catch (error) {
    console.log("PUSH TOKEN SAVE FAILED:", error);
    return null;
  }
}

export async function getSavedPushToken() {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function getSavedDeviceId() {
  return SecureStore.getItemAsync(DEVICE_ID_KEY);
}

function navigateFromNotification(data: any) {
  if (data?.screen === "booking" && data?.bookingId) {
    router.push({
      pathname: "/booking/[id]",
      params: { id: String(data.bookingId) },
    });
    return;
  }

  if (
    (data?.screen === "driver-ride" || data?.screen === "driver_booking") &&
    data?.rideId
  ) {
    router.push({
      pathname: "/driver-ride/[id]" as any,
      params: { id: String(data.rideId) },
    });
    return;
  }

  if (data?.screen === "ride" && data?.rideId) {
    router.push({
      pathname: "/ride/[id]" as any,
      params: { id: String(data.rideId) },
    });
    return;
  }

  if (data?.screen === "chat" && data?.roomId) {
    router.push({
      pathname: "/chat/[roomId]" as any,
      params: {
        roomId: String(data.roomId),
        title: data?.title ? String(data.title) : "Chat",
      },
    });
    return;
  }

  if (data?.screen === "rewards") {
    router.push("/rewards");
    return;
  }

  if (data?.screen === "notifications") {
    router.push("/notifications");
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
        navigateFromNotification(data);
      });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
