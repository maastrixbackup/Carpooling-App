// app/location-picker.tsx

import * as Location from "expo-location";
import { router } from "expo-router";
import { ArrowLeft, LocateFixed, MapPin } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationPickerScreen() {
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 20.2961,
    longitude: 85.8245,
  });

  const [address, setAddress] = useState("Loading address...");

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLoading(false);
        return;
      }

      const current =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setSelectedLocation(coords);

      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      await reverseGeocode(
        coords.latitude,
        coords.longitude,
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (
    latitude: number,
    longitude: number,
  ) => {
    try {
      const result =
        await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

      if (result?.length) {
        const item = result[0];

        const formatted = [
          item.name,
          item.street,
          item.city,
          item.region,
        ]
          .filter(Boolean)
          .join(", ");

        setAddress(formatted);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onRegionChangeComplete = async (
    region: any,
  ) => {
    const coords = {
      latitude: region.latitude,
      longitude: region.longitude,
    };

    setSelectedLocation(coords);

    await reverseGeocode(
      coords.latitude,
      coords.longitude,
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={onRegionChangeComplete}
        initialRegion={{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      />

      {/* Fixed Pin */}
      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        <View className="items-center">
          <MapPin size={42} color="#0066CC" fill="#0066CC" />
        </View>
      </View>

      <SafeAreaView
        edges={["top"]}
        className="absolute top-0 left-0 right-0 px-4"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <ArrowLeft size={22} />
        </TouchableOpacity>
      </SafeAreaView>

      <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5">
        <Text className="font-bold text-gray-500">
          Selected Location
        </Text>

        <Text
          className="mt-2 text-base font-semibold"
          numberOfLines={2}
        >
          {address}
        </Text>

        <TouchableOpacity
          onPress={getCurrentLocation}
          className="mt-4 flex-row items-center"
        >
          <LocateFixed size={18} color="#0066CC" />

          <Text className="ml-2 font-semibold text-blue-600">
            Use Current Location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-5 rounded-2xl bg-blue-600 py-4"
          onPress={() => {
            router.dismiss();

            router.setParams({
              selectedLocation: JSON.stringify({
                latitude:
                  selectedLocation.latitude,
                longitude:
                  selectedLocation.longitude,
                address,
              }),
            });
          }}
        >
          <Text className="text-center font-bold text-white">
            Confirm Location
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}