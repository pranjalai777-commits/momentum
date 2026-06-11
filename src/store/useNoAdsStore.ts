import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface NoAdsState {
  noAds: boolean;
  setNoAds: (noAds: boolean) => void;
}

export const useNoAdsStore = create<NoAdsState>()(
  persist(
    (set) => ({
      noAds: false,
      setNoAds: (noAds) => set({ noAds }),
    }),
    {
      name: "no-ads-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
