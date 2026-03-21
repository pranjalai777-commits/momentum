import "../../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { useNoAdsStore } from "@/store/useNoAdsStore";
import { preloadSounds } from "@/lib/sounds";

const RC_IOS_KEY = "appl_tsdCXhEcyQTLXNiwndALpbQbulg";
const RC_ANDROID_KEY = "test_GACMaIBsiBFdKjOtmNIKvOzjSGB";
const ENTITLEMENT_ID = "Momentum Pro";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
    mutations: { retry: 1 },
  },
});

export default function RootLayout() {
  const setNoAds = useNoAdsStore((s) => s.setNoAds);
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    const apiKey = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;
    try {
      Purchases.configure({ apiKey });
    } catch {
      // Already configured — safe to ignore
    }
    Purchases.getCustomerInfo()
      .then((info) => {
        setNoAds(ENTITLEMENT_ID in info.entitlements.active);
      })
      .catch((e: unknown) => {
        console.warn("[RevenueCat] Failed to get customer info on init", e);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    void preloadSounds().catch((error: unknown) => {
      console.warn("Failed to preload sounds", error);
    });
  }, []);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
