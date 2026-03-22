import { create } from "zustand";

interface NoAdsState {
  noAds: boolean;
  setNoAds: (noAds: boolean) => void;
}

export const useNoAdsStore = create<NoAdsState>((set) => ({
  noAds: false,
  setNoAds: (noAds) => set({ noAds }),
}));
