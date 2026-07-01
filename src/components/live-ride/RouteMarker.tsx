import { Text, View } from "react-native";

type Props = {
  color: string;
  label: string;
  icon: React.ReactNode;
};

export default function RouteMarker({ color, label, icon }: Props) {
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 4,
          borderColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 5 },
          elevation: 9,
        }}
      >
        {icon}
      </View>

      <View
        style={{
          marginTop: -2,
          backgroundColor: "#020617",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: "800",
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}