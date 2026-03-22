// XP & Level system
const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000];

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
  const titles = [
    "Starter", "Mover", "Doer", "Hustler", "Driven",
    "Relentless", "Unstoppable", "Legendary", "Mythic", "Titan", "Immortal"
  ];
  return titles[Math.min(level - 1, titles.length - 1)];
}

// Heat system (0-100)
export function getHeatLabel(heat: number): string {
  if (heat >= 80) return "ON FIRE";
  if (heat >= 60) return "HOT";
  if (heat >= 40) return "WARM";
  if (heat >= 20) return "COOL";
  return "COLD";
}

export function getHeatColor(heat: number): string {
  if (heat >= 80) return "text-heat-fire";
  if (heat >= 60) return "text-heat-hot";
  if (heat >= 40) return "text-heat-warm";
  return "text-heat-cold";
}

// Heat multiplier for XP — steeper scaling
export function getHeatMultiplier(heat: number): number {
  if (heat >= 90) return 3.0;
  if (heat >= 80) return 2.5;
  if (heat >= 60) return 1.8;
  if (heat >= 40) return 1.3;
  return 1.0;
}

// Daily bonus for first task of the day
const DAILY_FIRST_BONUS = 15;

// Calculate XP earned for completing a task
export function calculateXP(streak: number, heat: number, isFirstToday: boolean): number {
  const base = 15; // higher base for task completion
  const streakBonus = streak * 3;
  const multiplier = getHeatMultiplier(heat);
  const dailyBonus = isFirstToday ? DAILY_FIRST_BONUS : 0;
  return Math.round((base + streakBonus + dailyBonus) * multiplier);
}

// Date helpers
function getDateKey(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Motivational prompts — task-completion focused
const MOTIVATIONAL_PROMPTS = [
  "Crush the next task.",
  "One more. You can do it.",
  "Your streak is calling.",
  "Finish it. Feel the rush.",
  "Tasks don't complete themselves.",
  "Momentum doesn't wait.",
  "You didn't come this far to stop.",
  "Every task makes you stronger.",
  "The list won't beat you.",
  "Discipline beats motivation.",
  "Clear the board. Own the day.",
  "Action kills doubt.",
  "How many can you finish today?",
  "Your future self is watching.",
];

export function getMotivationalPrompt(): string {
  return MOTIVATIONAL_PROMPTS[Math.floor(Math.random() * MOTIVATIONAL_PROMPTS.length)];
}

// Task model
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
}

// Persistence
const STORAGE_KEY = "momentum_data";
const TASKS_KEY = "momentum_tasks";

export interface MomentumData {
  xp: number;
  heat: number;
  totalActions: number;
  lastActionTime: number | null;
  streak: number;
  dailyStreak: number;
  lastDayUsed: string | null;
  todayActions: number;
  bestStreak: number;
  bestDailyStreak: number;
  tasksCompleted: number;
  turboActivatedAt: number | null;
  turboLastUsedDay: string | null;
  heatBeforeTurbo: number;
}

const DEFAULT_DATA: MomentumData = {
  xp: 0, heat: 0, totalActions: 0, lastActionTime: null,
  streak: 0, dailyStreak: 0, lastDayUsed: null, todayActions: 0,
  bestStreak: 0, bestDailyStreak: 0, tasksCompleted: 0,
  turboActivatedAt: null, turboLastUsedDay: null, heatBeforeTurbo: 0,
};

export const TURBO_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export function isTurboActive(data: MomentumData): boolean {
  if (!data.turboActivatedAt) return false;
  return Date.now() - data.turboActivatedAt < TURBO_DURATION_MS;
}

export function getTurboRemainingMs(data: MomentumData): number {
  if (!data.turboActivatedAt) return 0;
  const remaining = TURBO_DURATION_MS - (Date.now() - data.turboActivatedAt);
  return Math.max(0, remaining);
}

export function canActivateTurbo(data: MomentumData): boolean {
  const today = getDateKey();
  return data.turboLastUsedDay !== today;
}

export function activateTurbo(data: MomentumData): MomentumData {
  const today = getDateKey();
  return {
    ...data,
    turboActivatedAt: Date.now(),
    turboLastUsedDay: today,
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

export function loadData(): MomentumData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = { ...DEFAULT_DATA, ...JSON.parse(raw) } as MomentumData;
      const today = getDateKey();
      const lastDay = data.lastDayUsed;

      if (lastDay && lastDay !== today) {
        data.heat = 0;
        data.todayActions = 0;
      }

      if (lastDay && lastDay !== today) {
        const yesterday = getDateKey(Date.now() - 86400000);
        if (lastDay !== yesterday) {
          data.dailyStreak = 0;
        }
      }

      return data;
    }
  } catch {}
  return { ...DEFAULT_DATA };
}

export function saveData(data: MomentumData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function isFirstActionToday(data: MomentumData): boolean {
  return data.todayActions === 0;
}

// Task persistence
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch {}
  return [];
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
