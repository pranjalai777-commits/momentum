export const LEVEL_THRESHOLDS = [
  0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000,
] as const;

export const LEVEL_TITLES = [
  "Starter",
  "Mover",
  "Doer",
  "Hustler",
  "Driven",
  "Relentless",
  "Unstoppable",
  "Legendary",
  "Mythic",
  "Titan",
  "Immortal",
] as const;

export const HEAT_PER_ACTION = 12;
export const TURBO_DURATION_MS = 2 * 60 * 60 * 1000;

export const XP_MULTIPLIERS = {
  early: 2.0,
  "on-time": 1.5,
  late: 1.6,
  "gave-up": 0.2,
} as const;

export const DAILY_FIRST_BONUS = 15;

export const MOTIVATIONAL_PROMPTS = [
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
] as const;
