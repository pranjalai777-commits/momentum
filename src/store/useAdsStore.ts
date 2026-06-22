import { create } from "zustand";

type AdsState = {
  adsReady: boolean;
  personalizedAds: boolean;
  setAdsReady: (adsReady: boolean, personalizedAds: boolean) => void;
};

export const useAdsStore = create<AdsState>((set) => ({
  adsReady: false,
  personalizedAds: false,
  setAdsReady: (adsReady, personalizedAds) => set({ adsReady, personalizedAds }),
}));
