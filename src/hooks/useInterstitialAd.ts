import { useCallback, useEffect, useRef } from "react";
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import { Platform } from "react-native";
import { useAdsStore } from "@/store/useAdsStore";
import { useNoAdsStore } from "@/store/useNoAdsStore";

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
  const adsReady = useAdsStore((s) => s.adsReady);
  const personalizedAds = useAdsStore((s) => s.personalizedAds);
  const noAds = useNoAdsStore((s) => s.noAds);
  const adRef = useRef<InterstitialAd | null>(null);
  const isLoadedRef = useRef(false);
  const loadFnRef = useRef<(() => void) | undefined>(undefined);
  const canLoadAds = adsReady && !noAds;
  const canLoadAdsRef = useRef(canLoadAds);

  canLoadAdsRef.current = canLoadAds;

  const clearAd = useCallback(() => {
    adRef.current?.removeAllListeners();
    adRef.current = null;
    isLoadedRef.current = false;
  }, []);

  const loadAd = useCallback(() => {
    if (!canLoadAds) return;

    clearAd();
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: !personalizedAds,
    });
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
      if (canLoadAdsRef.current) {
        loadFnRef.current?.();
      }
    });

    ad.load();
  }, [canLoadAds, clearAd, personalizedAds]);

  loadFnRef.current = loadAd;

  useEffect(() => {
    if (!canLoadAds) {
      clearAd();
      return;
    }

    loadAd();
    return clearAd;
  }, [canLoadAds, clearAd, loadAd]);

  /**
   * Shows the interstitial ad if loaded.
   * Returns true if the ad was shown, false if it wasn't ready yet.
   */
  const showAd = useCallback((): boolean => {
    if (canLoadAdsRef.current && isLoadedRef.current && adRef.current) {
      void adRef.current.show().catch((error: unknown) => {
        console.warn("[AdMob] Failed to show interstitial", error);
      });
      return true;
    }
    return false;
  }, []);

  return { showAd };
}
