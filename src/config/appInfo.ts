import Constants from "expo-constants";
import { Platform } from "react-native";

const expoConfig = Constants.expoConfig;

export const APP_INFO = {
  name: expoConfig?.name ?? "PoolShare",
  version: expoConfig?.version ?? "1.0.0",
  effective_date: "26 June 2026",

  build:
    Platform.OS === "android"
      ? String(expoConfig?.android?.versionCode ?? "1")
      : String(expoConfig?.ios?.buildNumber ?? "1"),

  stage: expoConfig?.extra?.appStage ?? "Beta",
};
