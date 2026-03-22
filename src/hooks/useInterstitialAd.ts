import { useCallback, useEffect, useRef } from "react";
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { Platform } from "react-native";

/**
 * Ad Unit IDs — uses test IDs in dev, real IDs in production.
 * TODO: Replace the placeholder strings below with your real AdMob ad unit IDs.
 * Create them at https://admob.google.com → Apps → Ad units → Interstitial
 */
const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : (Platform.select({
      ios: "ca-app-pub-2468139254817625/8977745119",
      android: "ca-app-pub-2468139254817625/2622554907",
    }) as string);

/**
 * Hook that manages a preloaded interstitial ad.
 * Automatically reloads after each show so the next ad is always ready.
 */
export function useInterstitialAd() {
  const adRef = useRef<InterstitialAd | null>(null);
  const isLoadedRef = useRef(false);
  const loadFnRef = useRef<(() => void) | undefined>(undefined);

  loadFnRef.current = () => {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID);
    adRef.current = ad;
    isLoadedRef.current = false;

    ad.addAdEventListener(AdEventType.LOADED, () => {
      isLoadedRef.current = true;
    });

    ad.addAdEventListener(AdEventType.ERROR, () => {
      isLoadedRef.current = false;
    });

    ad.addAdEventListener(AdEventType.CLOSED, () => {
      isLoadedRef.current = false;
      // Preload next ad immediately so it's ready for the next trigger
      loadFnRef.current?.();
    });

    ad.load();
  };

  useEffect(() => {
    loadFnRef.current?.();
  }, []);

  /**
   * Shows the interstitial ad if loaded.
   * Returns true if the ad was shown, false if it wasn't ready yet.
   */
  const showAd = useCallback((): boolean => {
    if (isLoadedRef.current && adRef.current) {
      adRef.current.show();
      return true;
    }
    return false;
  }, []);

  return { showAd };
}
