import { APP_INFO } from "@/config/appInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import { Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
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
                Privacy Policy
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
              <ShieldCheck size={24} color={colors.primary} />

              <View className="flex-1">
                <Text
                  style={{ color: colors.text }}
                  className="font-extrabold"
                >
                  Your Privacy Matters
                </Text>

                <Text
                  style={{ color: colors.muted }}
                  className="mt-1 text-xs leading-5"
                >
                  We collect only the information required to operate ride
                  sharing services safely and securely.
                </Text>
              </View>
            </View>
          </View>

          <PolicySection
            title="1. Information We Collect"
            content="
• Profile information such as name, email, phone number and profile photo.

• Vehicle information including registration details and verification documents.

• Ride information including routes, bookings and trip history.

• Device information required for app functionality and security.
"
          />

          <PolicySection
            title="2. How We Use Information"
            content="
• Create and manage your account.

• Match drivers and passengers.

• Improve ride safety and fraud prevention.

• Send notifications regarding rides, bookings and messages.

• Provide customer support.
"
          />

          <PolicySection
            title="3. Location Information"
            content="
Location information is used only to provide ride search, route matching, navigation assistance and safety related services.
"
          />

          <PolicySection
            title="4. Information Sharing"
            content="
We do not sell your personal information. Information may only be shared with ride participants, legal authorities when required, or trusted service providers helping operate the platform.
"
          />

          <PolicySection
            title="5. Security"
            content="
We use reasonable security measures to protect your data. However, no internet service can guarantee absolute security.
"
          />

          <PolicySection
            title="6. Account Deletion"
            content="
Users may request account deletion through the application or by contacting support. Some information may be retained where required by law.
"
          />

          <PolicySection
            title="7. Contact"
            content="
For privacy related concerns please contact support through the application.
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
              {APP_INFO.name} v{APP_INFO.version}
            </Text>

            <Text
              style={{ color: colors.muted }}
              className="mt-1 text-[11px]"
            >
              Effective Date: {APP_INFO.effective_date}
            </Text>

            <Text
              style={{ color: colors.muted }}
              className="mt-1 text-[11px]"
            >
              © 2026 PoolShare. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PolicySection({
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