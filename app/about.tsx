import { useAppTheme } from "@/theme/ThemeProvider";
import { router } from "expo-router";
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    Car,
    ChevronRight,
    Code2,
    HeartHandshake,
    Info,
    Mail,
    ShieldCheck,
    Sparkles,
} from "lucide-react-native";
import {
    Image,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const logo = require("../assets/images/notification-icon.png")

export default function AboutScreen() {
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
                    <Header />

                    <View
                        style={{ backgroundColor: colors.card, borderColor: colors.border }}
                        className="mt-6 overflow-hidden rounded-[34px] border p-6"
                    >
                        <View className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-500/10" />

                        <View className="flex-row items-center gap-4">
                            <View
                                style={{
                                    backgroundColor: "#005de7",
                                    shadowColor: "#1407c7",
                                    shadowOpacity: 0.08,
                                    shadowRadius: 12,
                                    shadowOffset: { width: 0, height: 6 },
                                    elevation: 5,
                                }}
                                className="h-20 w-20 items-center justify-center rounded-[26px]"
                            >
                                <Image
                                    source={logo}
                                    resizeMode="contain"
                                    style={{
                                        width: 58,
                                        height: 58,
                                    }}
                                />
                            </View>

                            <View className="flex-1">
                                <Text
                                    style={{ color: colors.text }}
                                    className="text-3xl font-extrabold"
                                >
                                    PoolShare
                                </Text>

                                <Text
                                    style={{ color: colors.muted }}
                                    className="mt-1 text-sm font-semibold"
                                >
                                    Ride together. Save smarter.
                                </Text>
                            </View>
                        </View>

                        <Text style={{ color: colors.muted }} className="mt-2 text-sm leading-6">
                            A modern ride sharing app built to make daily travel simpler,
                            safer, and more affordable.
                        </Text>

                        <View className="mt-5 flex-row gap-3">
                            <MiniBadge label="v1.0.0" />
                            <MiniBadge label="Build 1" />
                            <MiniBadge label="Beta" />
                        </View>
                    </View>

                    <Section title="About the App">
                        <InfoRow
                            icon={<Sparkles size={20} color={colors.primary} />}
                            title="Smart ride sharing"
                            subtitle="Find rides, publish trips, manage bookings, and chat securely in one place."
                        />

                        <InfoRow
                            icon={<ShieldCheck size={20} color={colors.success} />}
                            title="Safety first"
                            subtitle="Designed with user verification, vehicle checks, and controlled chat access."
                        />

                        <InfoRow
                            icon={<HeartHandshake size={20} color="#F59E0B" />}
                            title="Community focused"
                            subtitle="Built for people who want reliable travel options and shared savings."
                            last
                        />
                    </Section>

                    <Section title="Developed By">
                        <View className="p-5">
                            <View className="flex-row items-center gap-4">
                                <View
                                    style={{ backgroundColor: colors.primarySoft }}
                                    className="h-14 w-14 items-center justify-center rounded-2xl"
                                >
                                    <Building2 size={26} color={colors.primary} />
                                </View>

                                <View className="flex-1">
                                    <Text
                                        style={{ color: colors.text }}
                                        className="text-lg font-extrabold"
                                    >
                                        Maastrix Solutions
                                    </Text>
                                    <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                                        Software Development & Digital Product Engineering
                                    </Text>
                                </View>
                            </View>

                            <Text style={{ color: colors.muted }} className="mt-4 text-sm leading-6">
                                PoolShare is being developed by Maastrix Solutions with a focus
                                on clean user experience, secure backend systems, scalable app
                                architecture, and practical mobility workflows.
                            </Text>
                        </View>
                    </Section>

                    <Section title="Product Highlights">
                        <InfoRow
                            icon={<Car size={20} color={colors.primary} />}
                            title="Ride publishing"
                            subtitle="Drivers can publish trips with vehicle, route, date, time, and seat details."
                        />

                        <InfoRow
                            icon={<BadgeCheck size={20} color={colors.success} />}
                            title="Verification ready"
                            subtitle="Supports user identity, vehicle RC verification, and safe account controls."
                        />

                        <InfoRow
                            icon={<Code2 size={20} color={colors.primary} />}
                            title="Built for scale"
                            subtitle="Designed with modern mobile, backend, database, notification, and reward systems."
                            last
                        />
                    </Section>

                    <Section title="Support & Legal">
                        <ActionRow
                            icon={<Mail size={20} color={colors.primary} />}
                            title="Help & Support"
                            subtitle="Create tickets and track support requests"
                            onPress={() => router.push("/help-support" as any)}
                        />

                        <ActionRow
                            icon={<ShieldCheck size={20} color={colors.primary} />}
                            title="Privacy Policy"
                            subtitle="How app data is collected and protected"
                            onPress={() => router.push("/privacy-policy" as any)}
                        />

                        <ActionRow
                            icon={<Info size={20} color={colors.primary} />}
                            title="Terms & Conditions"
                            subtitle="Rules for using PoolShare"
                            onPress={() => router.push("/terms-conditions" as any)}
                            last
                        />
                    </Section>

                    <View
                        style={{ borderTopColor: colors.border, borderTopWidth: 1 }}
                        className="mt-8 items-center pt-5"
                    >
                        <Text style={{ color: colors.muted }} className="text-xs font-semibold">
                            PoolShare v1.0.0
                        </Text>
                        <Text style={{ color: colors.muted }} className="mt-1 text-[11px]">
                            Developed by Maastrix Solutions
                        </Text>
                        <Text style={{ color: colors.muted }} className="mt-1 text-[11px]">
                            © 2026 PoolShare. All rights reserved.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function Header() {
    const { colors } = useAppTheme();

    return (
        <View className="flex-row items-center gap-4">
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.back()}
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="h-11 w-11 items-center justify-center rounded-full border"
            >
                <ArrowLeft size={22} color={colors.text} />
            </TouchableOpacity>

            <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-3xl font-extrabold">
                    About App
                </Text>
                <Text style={{ color: colors.muted }} className="mt-1 text-sm">
                    App information and developer details
                </Text>
            </View>
        </View>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    const { colors } = useAppTheme();

    return (
        <View className="mt-7">
            <Text style={{ color: colors.text }} className="mb-3 text-lg font-extrabold">
                {title}
            </Text>

            <View
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
                className="overflow-hidden rounded-[28px] border"
            >
                {children}
            </View>
        </View>
    );
}

function InfoRow({
    icon,
    title,
    subtitle,
    last,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    last?: boolean;
}) {
    const { colors } = useAppTheme();

    return (
        <View
            style={{ borderBottomColor: last ? "transparent" : colors.border }}
            className="flex-row items-start gap-3 border-b px-4 py-4"
        >
            <View
                style={{ backgroundColor: colors.primarySoft }}
                className="h-11 w-11 items-center justify-center rounded-2xl"
            >
                {icon}
            </View>

            <View className="flex-1">
                <Text style={{ color: colors.text }} className="font-extrabold">
                    {title}
                </Text>
                <Text style={{ color: colors.muted }} className="mt-1 text-xs leading-5">
                    {subtitle}
                </Text>
            </View>
        </View>
    );
}

function ActionRow({
    icon,
    title,
    subtitle,
    onPress,
    last,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
    last?: boolean;
}) {
    const { colors } = useAppTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={{ borderBottomColor: last ? "transparent" : colors.border }}
            className="flex-row items-center gap-3 border-b px-4 py-4"
        >
            <View
                style={{ backgroundColor: colors.primarySoft }}
                className="h-11 w-11 items-center justify-center rounded-2xl"
            >
                {icon}
            </View>

            <View className="flex-1">
                <Text style={{ color: colors.text }} className="font-extrabold">
                    {title}
                </Text>
                <Text style={{ color: colors.muted }} className="mt-1 text-xs">
                    {subtitle}
                </Text>
            </View>

            <ChevronRight size={18} color={colors.muted} />
        </TouchableOpacity>
    );
}

function MiniBadge({ label }: { label: string }) {
    const { colors } = useAppTheme();

    return (
        <View style={{ backgroundColor: colors.input }} className="rounded-full px-3 py-1.5">
            <Text style={{ color: colors.muted }} className="text-xs font-bold">
                {label}
            </Text>
        </View>
    );
}