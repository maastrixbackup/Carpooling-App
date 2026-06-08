import * as SecureStore from "expo-secure-store";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useColorScheme } from "react-native";
import { AppColors, darkColors, lightColors, ThemeMode } from "./tokens";

const THEME_KEY = "car_pooling_theme";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      const saved = await SecureStore.getItemAsync(THEME_KEY);

      if (saved === "light" || saved === "dark" || saved === "system") {
        setMode(saved);
      }

      setReady(true);
    }

    loadTheme();
  }, []);

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  const setThemeMode = async (nextMode: ThemeMode) => {
    setMode(nextMode);
    await SecureStore.setItemAsync(THEME_KEY, nextMode);
  };

  const toggleTheme = async () => {
    await setThemeMode(isDark ? "light" : "dark");
  };

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
      setThemeMode,
      toggleTheme,
    }),
    [mode, isDark]
  );

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }

  return context;
}