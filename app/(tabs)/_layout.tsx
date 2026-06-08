import { useAppTheme } from "@/theme/ThemeProvider";
import { Tabs } from "expo-router";
import { Car, House, PlusCircle, Ticket, User } from "lucide-react-native";

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Avoid flicker
        animation: "none",
        lazy: true,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: {
          backgroundColor: colors.bg,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <House size={size} color={color} /> }} />
      <Tabs.Screen name="rides" options={{ title: "Rides", tabBarIcon: ({ color, size }) => <Car size={size} color={color} /> }} />
      <Tabs.Screen name="publish" options={{ title: "Publish", tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings", tabBarIcon: ({ color, size }) => <Ticket size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}