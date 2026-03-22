import { useCallback, useState } from "react";
import Purchases from "react-native-purchases";
import { useNoAdsStore } from "@/store/useNoAdsStore";

const ENTITLEMENT_ID = "Momentum Pro";

export function useRevenueCat() {
  const setNoAds = useNoAdsStore((s) => s.setNoAds);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEntitlement = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isActive = ENTITLEMENT_ID in customerInfo.entitlements.active;
      setNoAds(isActive);
      return isActive;
    } catch (e) {
      console.warn("[RevenueCat] Failed to check entitlement", e);
      return false;
    }
  }, [setNoAds]);

  const purchaseRemoveAds = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsPurchasing(true);
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0];
      if (!pkg) {
        throw new Error(
          "No packages available. Make sure your product is set up in App Store Connect and linked in RevenueCat."
        );
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isActive = ENTITLEMENT_ID in customerInfo.entitlements.active;
      setNoAds(isActive);
      return isActive;
    } catch (e: unknown) {
      if (e && typeof e === "object" && "userCancelled" in e && (e as { userCancelled: boolean }).userCancelled) {
        return false;
      }
      setError(e instanceof Error ? e.message : "Purchase failed. Please try again.");
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [setNoAds]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isActive = ENTITLEMENT_ID in customerInfo.entitlements.active;
      setNoAds(isActive);
      return isActive;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed. Please try again.");
      return false;
    } finally {
      setIsRestoring(false);
    }
  }, [setNoAds]);

  return {
    checkEntitlement,
    purchaseRemoveAds,
    restorePurchases,
    isPurchasing,
    isRestoring,
    error,
  };
}
