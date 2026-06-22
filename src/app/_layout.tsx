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
import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import { useNoAdsStore } from "@/store/useNoAdsStore";
import { useAdsStore } from "@/store/useAdsStore";
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

function waitForActiveApp() {
  if (Platform.OS !== "ios" || AppState.currentState === "active") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        subscription.remove();
        resolve();
      }
    });
  });
}

async function requestTrackingIfNeeded() {
  if (Platform.OS !== "ios") return true;

  try {
    await waitForActiveApp();
    const current = await getTrackingPermissionsAsync();
    if (current.status !== PermissionStatus.UNDETERMINED) {
      return current.status === PermissionStatus.GRANTED;
    }

    const requested = await requestTrackingPermissionsAsync();
    return requested.status === PermissionStatus.GRANTED;
  } catch (error) {
    console.warn("[ATT] Failed to resolve tracking permission", error);
    return false;
  }
}

export default function RootLayout() {
  const setNoAds = useNoAdsStore((s) => s.setNoAds);
  const setAdsReady = useAdsStore((s) => s.setAdsReady);
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
    let cancelled = false;

    async function initializePrivacyGatedSdks() {
      const personalizedAds = await requestTrackingIfNeeded();

      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      const apiKey = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;
      try {
        Purchases.configure({ apiKey });
      } catch {
        // Already configured - safe to ignore.
      }

      try {
        const info = await Purchases.getCustomerInfo();
        if (!cancelled) setNoAds(ENTITLEMENT_ID in info.entitlements.active);
      } catch (error) {
        console.warn("[RevenueCat] Failed to get customer info on init", error);
      }

      try {
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });
        await mobileAds().initialize();
        if (!cancelled) setAdsReady(true, personalizedAds);
      } catch (error) {
        console.warn("[AdMob] Failed to initialize", error);
        if (!cancelled) setAdsReady(false, personalizedAds);
      }
    }

    void initializePrivacyGatedSdks();

    return () => {
      cancelled = true;
    };
  }, [setAdsReady, setNoAds]);

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
