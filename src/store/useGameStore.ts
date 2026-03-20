import { HEAT_PER_ACTION, XP_MULTIPLIERS } from "@/constants/levels";
import {
  activateTurbo as activateTurboData,
  applyTreeHealthDecay,
  calculateXP,
  createInitialMomentumData,
  deactivateTurbo as deactivateTurboData,
  getDateKey,
  getLevel,
  isFirstActionToday,
  isTurboActive,
  normalizeDailyMomentumData,
  restoreTreeHealth,
} from "@/lib/momentum";
import type { CompletionType, MomentumData } from "@/types";
import { create } from "zustand";

type GameStore = {
  data: MomentumData;
  turboActive: boolean;
  lastXpGained: number | null;
  showDailyBonus: boolean;
  setData: (data: MomentumData) => void;
  completeTask: (completionType: CompletionType) => {
    xpEarned: number;
    leveledUp: boolean;
    prevLevel: number;
    newLevel: number;
    isGiveUp: boolean;
  };
  activateTurbo: () => void;
  deactivateTurbo: () => void;
  checkTurboExpiry: () => void;
  checkDailyReset: () => void;
  dismissDailyBonus: () => void;
  reset: () => void;
};

const initialData = createInitialMomentumData();

export const useGameStore = create<GameStore>((set, get) => ({
  data: initialData,
  turboActive: isTurboActive(initialData),
  lastXpGained: null,
  showDailyBonus: false,

  setData: (data) => set({ data, turboActive: isTurboActive(data) }),

  completeTask: (completionType) => {
    console.log("[🔬CEREMONY] useGameStore.completeTask called — type:", completionType, "currentXp:", get().data.xp);
    const prev = get().data;
    const isGiveUp = completionType === "gave-up";
    const firstToday = isFirstActionToday(prev);
    const streakForXp = isGiveUp ? prev.streak : prev.streak + 1;
    const baseEarned = calculateXP(streakForXp, prev.heat, firstToday);
    const xpEarned = Math.round(baseEarned * XP_MULTIPLIERS[completionType]);
    const prevLevel = getLevel(prev.xp);
    const nextXp = prev.xp + xpEarned;
    const nextLevel = getLevel(nextXp);
    const today = getDateKey();
    const nextDailyStreak =
      firstToday && !isGiveUp
        ? prev.lastDayUsed === today
          ? prev.dailyStreak
          : prev.dailyStreak + 1
        : prev.dailyStreak;
    const turboActive = get().turboActive;
    const withTree = isGiveUp ? prev : restoreTreeHealth(prev);
    const next: MomentumData = {
      ...withTree,
      xp: nextXp,
      heat: turboActive ? 100 : Math.min(100, prev.heat + (completionType === "early" ? HEAT_PER_ACTION : 0)),
      totalActions: prev.totalActions + 1,
      lastActionTime: Date.now(),
      streak: isGiveUp ? 0 : prev.streak + 1,
      dailyStreak: nextDailyStreak,
      lastDayUsed: today,
      todayActions: prev.todayActions + (isGiveUp ? 0 : 1),
      bestStreak: Math.max(prev.bestStreak, isGiveUp ? 0 : prev.streak + 1),
      bestDailyStreak: Math.max(prev.bestDailyStreak, nextDailyStreak),
      tasksCompleted: prev.tasksCompleted + (isGiveUp ? 0 : 1),
    };

    set({
      data: next,
      turboActive: isTurboActive(next),
      lastXpGained: xpEarned,
      showDailyBonus: firstToday && !isGiveUp,
    });

    return { xpEarned, leveledUp: nextLevel > prevLevel, prevLevel, newLevel: nextLevel, isGiveUp };
  },

  activateTurbo: () => {
    const next = activateTurboData(get().data);
    set({ data: next, turboActive: true });
  },

  deactivateTurbo: () => {
    const next = deactivateTurboData(get().data);
    set({ data: next, turboActive: false });
  },

  checkTurboExpiry: () => {
    const state = get();
    if (!state.turboActive) return;
    if (isTurboActive(state.data)) return;
    state.deactivateTurbo();
  },

  checkDailyReset: () => {
    const normalized = normalizeDailyMomentumData(get().data);
    const data = applyTreeHealthDecay(normalized);
    set({ data, turboActive: isTurboActive(data) });
  },

  dismissDailyBonus: () => set({ showDailyBonus: false }),

  reset: () =>
    set({
      data: createInitialMomentumData(),
      turboActive: false,
      lastXpGained: null,
      showDailyBonus: false,
    }),
}));
