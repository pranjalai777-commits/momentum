import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type HapticEventKey =
  | "countdown-tick"
  | "countdown-urgent"
  | "last-ten-pulse"
  | "warning"
  | "time-up"
  | "launch"
  | "success"
  | "success-epic"
  | "success-epic-impact"
  | "level-up"
  | "level-up-impact"
  | "extend"
  | "cancel"
  | "give-up"
  | "task-add"
  | "task-start"
  | "task-delete"
  | "turbo-activate"
  | "picker-select"
  | "auth-tap"
  | "auth-success"
  | "auth-error";

const SUPPORTED_PLATFORM = Platform.OS === "ios" || Platform.OS === "android";
const lastFiredAt = new Map<HapticEventKey, number>();

function canFire(event: HapticEventKey, throttleMs = 0): boolean {
  if (!SUPPORTED_PLATFORM) return false;
  if (throttleMs <= 0) return true;
  const now = Date.now();
  const previous = lastFiredAt.get(event) ?? 0;
  if (now - previous < throttleMs) return false;
  lastFiredAt.set(event, now);
  return true;
}

function fire(event: HapticEventKey, run: () => Promise<void>, throttleMs = 0): void {
  if (!canFire(event, throttleMs)) return;
  void run().catch((error: unknown) => {
    console.warn(`[haptics] Failed to trigger "${event}"`, error);
  });
}

export function hapticTimerLaunch(): void {
  fire("launch", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
}

export function hapticCountdownTick(urgent = false): void {
  if (urgent) {
    fire("countdown-urgent", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 300);
    return;
  }
  fire("countdown-tick", () => Haptics.selectionAsync(), 180);
}

export function hapticTwoMinuteWarning(): void {
  fire("warning", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 1500);
}

export function hapticLastTenPulse(): void {
  fire("last-ten-pulse", () => Haptics.selectionAsync(), 850);
}

export function hapticTimeUp(): void {
  fire("time-up", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), 1200);
}

export function hapticSuccess(epic = false): void {
  if (epic) {
    fire("success-epic", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 500);
    fire("success-epic-impact", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 500);
    return;
  }
  fire("success", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
}

export function hapticLevelUp(): void {
  fire("level-up", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 500);
  fire("level-up-impact", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 500);
}

export function hapticExtend(): void {
  fire("extend", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 120);
}

export function hapticCancel(): void {
  fire("cancel", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
}

export function hapticGiveUp(): void {
  fire("give-up", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 300);
}

export function hapticTaskAdd(): void {
  fire("task-add", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
}

export function hapticTaskStart(): void {
  fire("task-start", () => Haptics.selectionAsync(), 100);
}

export function hapticTaskDelete(): void {
  fire("task-delete", () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 120);
}

export function hapticTurboActivate(): void {
  fire("turbo-activate", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
}

export function hapticPickerSelect(): void {
  fire("picker-select", () => Haptics.selectionAsync(), 100);
}

export function hapticAuthTap(): void {
  fire("auth-tap", () => Haptics.selectionAsync(), 90);
}

export function hapticAuthSuccess(): void {
  fire("auth-success", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 250);
}

export function hapticAuthError(): void {
  fire("auth-error", () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error), 250);
}

export function hapticChipTap(): void {
  fire("auth-tap", () => Haptics.selectionAsync(), 80);
}
