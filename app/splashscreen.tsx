import { useAppTheme } from "@/theme/ThemeProvider";
import { useEffect, useRef } from "react";
import { Animated, Image, Platform, StyleSheet, Text, View } from "react-native";

export default function CustomSplashScreen({ onFinish }: { onFinish?: () => void }) {
  const { colors, isDark } = useAppTheme();

  // Fine-tuned animation dynamics for a smoother fluid entrance
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();

    if (onFinish) {
      const timer = setTimeout(() => {
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onFinish());
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Subtle, soft premium ambient gradients using light opacities */}
      <View
        style={[
          styles.glowTop,
          { backgroundColor: isDark ? "rgba(37, 99, 235, 0.07)" : "rgba(37, 99, 235, 0.03)" }
        ]}
      />

      {/* Main App Logo Container */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] }
        ]}
      >
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: colors.primary, 
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "transparent",
              shadowColor: colors.primary,
            }
          ]}
        >
          <Image
            source={require("@/assets/images/notification-icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* App Branding Typography with enhanced contrast */}
      <Animated.View style={{ opacity: contentOpacity, alignItems: "center", paddingHorizontal: 24 }}>
        <Text style={[styles.brandTitle, { color: colors.text }]}>
          Pool<Text style={{ color: isDark ? "#3B82F6" : colors.primary }}>Share</Text>
        </Text>
        <Text style={[styles.brandSubtitle, { color: colors.muted, opacity: 0.8 }]}>
          Smart Commuting Community
        </Text>
      </Animated.View>

      {/* Bottom Loading Sequence Indicator */}
      <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
        <View className="flex-row items-center justify-center gap-2 mb-3">
          <View style={[styles.dot, { backgroundColor: isDark ? "#3B82F6" : colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: isDark ? "#3B82F6" : colors.primary, opacity: 0.4 }]} />
          <View style={[styles.dot, { backgroundColor: isDark ? "#3B82F6" : colors.primary, opacity: 0.15 }]} />
        </View>
        <Text style={[styles.footerText, { color: colors.muted, opacity: 0.6 }]}>
          Secure Ride Sharing
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    marginBottom: 20,
    alignItems: "center",
  },
  imageContainer: {
    width: 135,
    height: 135,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12, // Let the image breathe perfectly inside the squircle
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  logoImage: {
    width: "100%", // Fixed from 150% to prevent edge clipping and pixelation
    height: "100%",
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
    textAlign: "center",
  },
  brandSubtitle: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    textAlign: "center",
  },
  glowTop: {
    position: "absolute",
    top: -100,
    width: "120%",
    height: 350,
    borderRadius: 999,
  },
  footer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  }
});