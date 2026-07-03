export type CompletionType = "early" | "on-time" | "late" | "gave-up";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  routineId?: string;
  taskDate?: string;
}

export interface RoutineTask {
  id: string;
  text: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

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
  treeHealth: number;
  lastHealthDecayDay: string | null;
}

export interface CeremonyState {
  active: boolean;
  prevXp: number;
  newXp: number;
  xpGained: number;
  leveledUp: boolean;
  completionType: CompletionType;
}
