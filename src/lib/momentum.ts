import {
  DAILY_FIRST_BONUS,
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  MOTIVATIONAL_PROMPTS,
  TURBO_DURATION_MS,
  XP_MULTIPLIERS,
} from "@/constants/levels";
import type { CompletionType, MomentumData } from "@/types";

export const DEFAULT_DATA: MomentumData = {
  xp: 0,
  heat: 0,
  totalActions: 0,
  lastActionTime: null,
  streak: 0,
  dailyStreak: 0,
  lastDayUsed: null,
  todayActions: 0,
  bestStreak: 0,
  bestDailyStreak: 0,
  tasksCompleted: 0,
  turboActivatedAt: null,
  turboLastUsedDay: null,
  heatBeforeTurbo: 0,
  treeHealth: 100,
  lastHealthDecayDay: null,
};

export const HEALTH_DECAY_PER_IDLE_DAY = 18;
export const HEALTH_PER_TASK = 6;
export const HEALTH_WARNING_THRESHOLD = 60;
export const HEALTH_CRITICAL_THRESHOLD = 30;

export function getDateKey(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelProgress(xp: number): { current: number; next: number; progress: number } {
  const level = getLevel(xp);
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? current + 500;
  const progress = ((xp - current) / (next - current)) * 100;
  return { current, next, progress: Math.min(progress, 100) };
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

export function getHeatLabel(heat: number): string {
  if (heat >= 80) return "ON FIRE";
  if (heat >= 60) return "HOT";
  if (heat >= 40) return "WARM";
  if (heat >= 20) return "COOL";
  return "COLD";
}

export function getHeatColor(heat: number): string {
  if (heat >= 80) return "heat-fire";
  if (heat >= 60) return "heat-hot";
  if (heat >= 40) return "heat-warm";
  return "heat-cold";
}

export function getTreeHealthLabel(health: number): string {
  if (health >= 80) return "Thriving";
  if (health >= HEALTH_WARNING_THRESHOLD) return "Healthy";
  if (health >= HEALTH_CRITICAL_THRESHOLD) return "Wilting";
  if (health > 0) return "Dying";
  return "Dead";
}

export function getTreeHealthColor(health: number): string {
  if (health >= 80) return "#22c97e";
  if (health >= HEALTH_WARNING_THRESHOLD) return "#7ac943";
  if (health >= HEALTH_CRITICAL_THRESHOLD) return "#f0ad00";
  if (health > 0) return "#f07000";
  return "#8b2d2d";
}

export function isTreeInDanger(data: MomentumData): boolean {
  return data.treeHealth <= HEALTH_WARNING_THRESHOLD && data.xp > 0;
}

export function restoreTreeHealth(data: MomentumData): MomentumData {
  return {
    ...data,
    treeHealth: Math.min(100, data.treeHealth + HEALTH_PER_TASK),
  };
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month, day);
}

export function applyTreeHealthDecay(data: MomentumData, now = Date.now()): MomentumData {
  const today = getDateKey(now);
  if (data.lastHealthDecayDay === today) return data;

  const baselineDay = data.lastHealthDecayDay ?? data.lastDayUsed ?? today;
  const baselineDate = parseDateKey(baselineDay);
  const todayDate = parseDateKey(today);
  const diffDays = Math.floor((todayDate.getTime() - baselineDate.getTime()) / 86400000);
  const decayDays = Math.min(5, Math.max(0, diffDays));

  const shouldDecay = data.xp > 0 && data.todayActions === 0 && decayDays > 0;
  const nextHealth = shouldDecay
    ? Math.max(0, data.treeHealth - decayDays * HEALTH_DECAY_PER_IDLE_DAY)
    : data.treeHealth;

  return {
    ...data,
    treeHealth: nextHealth,
    lastHealthDecayDay: today,
  };
}

export function getHeatMultiplier(heat: number): number {
  if (heat >= 90) return 3.0;
  if (heat >= 80) return 2.5;
  if (heat >= 60) return 1.8;
  if (heat >= 40) return 1.3;
  return 1.0;
}

export function calculateXP(streak: number, heat: number, isFirstToday: boolean): number {
  const base = 15;
  const streakBonus = streak * 3;
  const dailyBonus = isFirstToday ? DAILY_FIRST_BONUS : 0;
  const multiplier = getHeatMultiplier(heat);
  return Math.round((base + streakBonus + dailyBonus) * multiplier);
}

export function applyCompletionMultiplier(baseXp: number, completionType: CompletionType): number {
  return Math.round(baseXp * XP_MULTIPLIERS[completionType]);
}

export function getMotivationalPrompt(): string {
  return MOTIVATIONAL_PROMPTS[Math.floor(Math.random() * MOTIVATIONAL_PROMPTS.length)];
}

export function isTurboActive(data: MomentumData): boolean {
  if (!data.turboActivatedAt) return false;
  return Date.now() - data.turboActivatedAt < TURBO_DURATION_MS;
}

export function getTurboRemainingMs(data: MomentumData): number {
  if (!data.turboActivatedAt) return 0;
  return Math.max(0, TURBO_DURATION_MS - (Date.now() - data.turboActivatedAt));
}

export function canActivateTurbo(data: MomentumData): boolean {
  return data.turboLastUsedDay !== getDateKey();
}

export function activateTurbo(data: MomentumData): MomentumData {
  return {
    ...data,
    turboActivatedAt: Date.now(),
    turboLastUsedDay: getDateKey(),
    heatBeforeTurbo: data.heat,
    heat: 100,
  };
}

export function deactivateTurbo(data: MomentumData): MomentumData {
  return {
    ...data,
    turboActivatedAt: null,
    heat: data.heatBeforeTurbo,
  };
}

export function createInitialMomentumData(): MomentumData {
  return { ...DEFAULT_DATA };
}

export function normalizeDailyMomentumData(data: MomentumData, now = Date.now()): MomentumData {
  const today = getDateKey(now);
  const yesterday = getDateKey(now - 86400000);
  const lastDay = data.lastDayUsed;

  if (!lastDay || lastDay === today) return data;

  return {
    ...data,
    heat: 0,
    todayActions: 0,
    dailyStreak: lastDay === yesterday ? data.dailyStreak : 0,
  };
}

export function isFirstActionToday(data: MomentumData): boolean {
  return data.todayActions === 0;
}
