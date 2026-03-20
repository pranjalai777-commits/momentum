import { useGameStore } from "@/store/useGameStore";
import { useRemoteMutations } from "@/hooks/useRemoteData";
import { useEffect } from "react";
import { AppState } from "react-native";

export function useDailyReset(): void {
  const checkDailyReset = useGameStore((state) => state.checkDailyReset);
  const { syncTreeHealthRemote } = useRemoteMutations();

  useEffect(() => {
    checkDailyReset();
    void syncTreeHealthRemote().catch((error: unknown) => {
      console.warn("[daily-reset] tree sync failed", error);
    });
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkDailyReset();
        void syncTreeHealthRemote().catch((error: unknown) => {
          console.warn("[daily-reset] tree sync failed", error);
        });
      }
    });
    return () => subscription.remove();
  }, [checkDailyReset, syncTreeHealthRemote]);
}
