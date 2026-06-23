import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import { ArrowLeft, FileText } from "lucide-react-native";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: Platform.OS === "android" ? 16 : 12,
            paddingBottom: 120,
          }}
        >
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="h-11 w-11 items-center justify-center rounded-full border"
            >
              <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <View>
              <Text
                style={{ color: colors.text }}
                className="text-2xl font-extrabold"
              >
                Terms & Conditions
              </Text>

              <Text
                style={{ color: colors.muted }}
                className="text-sm mt-1"
              >
                Last updated: June 2026
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderColor: colors.border,
            }}
            className="mt-6 rounded-[28px] border p-5"
          >
            <View className="flex-row items-center gap-3">
              <FileText size={24} color={colors.primary} />

              <View className="flex-1">
                <Text
                  style={{ color: colors.text }}
                  className="font-extrabold"
                >
                  User Agreement
                </Text>

                <Text
                  style={{ color: colors.muted }}
                  className="mt-1 text-xs leading-5"
                >
                  By using Carpooling you agree to the following terms and
                  responsibilities.
                </Text>
              </View>
            </View>
          </View>

          <TermsSection
            title="1. Eligibility"
            content="
Users must be legally eligible to drive or travel and provide accurate information during registration.
"
          />

          <TermsSection
            title="2. Ride Responsibilities"
            content="
Drivers are responsible for maintaining valid licenses, insurance and vehicle documents.

Passengers must behave respectfully and follow local laws.
"
          />

          <TermsSection
            title="3. Safety"
            content="
Users must not engage in illegal, abusive, fraudulent or unsafe activities while using the platform.
"
          />

          <TermsSection
            title="4. Payments & Rewards"
            content="
Rewards and future redemption programs may be modified or discontinued at any time.

Ride payments remain subject to applicable platform rules.
"
          />

          <TermsSection
            title="5. Account Suspension"
            content="
Accounts may be suspended or terminated for policy violations, fraud, abuse or safety concerns.
"
          />

          <TermsSection
            title="6. Liability"
            content="
The platform facilitates ride matching between users and is not responsible for user conduct, delays, accidents or losses occurring during rides.
"
          />

          <TermsSection
            title="7. Updates"
            content="
These terms may be updated periodically. Continued use of the application constitutes acceptance of revised terms.
"
          />

          <View
            style={{
              borderTopColor: colors.border,
              borderTopWidth: 1,
            }}
            className="mt-8 pt-5 items-center"
          >
            <Text
              style={{ color: colors.muted }}
              className="text-xs"
            >
              CarPooling v1.0.0
            </Text>

            <Text
              style={{ color: colors.muted }}
              className="mt-1 text-[11px]"
            >
              Effective Date: 22 June 2026
            </Text>

            <Text
              style={{ color: colors.muted }}
              className="mt-1 text-[11px]"
            >
              © 2026 CarPooling. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TermsSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      className="mt-4 rounded-[24px] border p-5"
    >
      <Text
        style={{ color: colors.text }}
        className="text-base font-extrabold"
      >
        {title}
      </Text>

      <Text
        style={{ color: colors.muted }}
        className="mt-3 text-sm leading-6"
      >
        {content}
      </Text>
    </View>
  );
}