import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

type SoundKey =
  | "tick"
  | "tick-115"
  | "tick-130"
  | "urgent-tick"
  | "success"
  | "epic-success"
  | "alarm"
  | "small-reward"
  | "launch"
  | "warning"
  | "level-up"
  | "timer-tick"
  | "extend";

const SOURCES: Record<SoundKey, number> = {
  tick: require("../../assets/sounds-v2/tick.wav"),
  "tick-115": require("../../assets/sounds-v2/tick-115.wav"),
  "tick-130": require("../../assets/sounds-v2/tick-130.wav"),
  "urgent-tick": require("../../assets/sounds-v2/urgent-tick.wav"),
  success: require("../../assets/sounds-v2/success.wav"),
  "epic-success": require("../../assets/sounds-v2/epic-success.wav"),
  alarm: require("../../assets/sounds-v2/alarm.wav"),
  "small-reward": require("../../assets/sounds-v2/small-reward.wav"),
  launch: require("../../assets/sounds-v2/launch.wav"),
  warning: require("../../assets/sounds-v2/warning.wav"),
  "level-up": require("../../assets/sounds-v2/level-up.wav"),
  "timer-tick": require("../../assets/sounds-v2/timer-tick.wav"),
  extend: require("../../assets/sounds-v2/extend.wav"),
};

const players = new Map<SoundKey, AudioPlayer>();
let initialized = false;
let preloadPromise: Promise<void> | null = null;

export async function preloadSounds(): Promise<void> {
  if (initialized) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "mixWithOthers",
    shouldPlayInBackground: false,
  });

  (Object.keys(SOURCES) as SoundKey[]).forEach((key) => {
    const player = createAudioPlayer(SOURCES[key]);
    player.volume = 1.0; // WAV samples encode wireframe's exact gain values; no extra attenuation
    players.set(key, player);
  });
  initialized = true;
}

async function ensureSoundsReady(): Promise<void> {
  if (initialized) return;
  if (!preloadPromise) {
    preloadPromise = preloadSounds().finally(() => {
      preloadPromise = null;
    });
  }
  await preloadPromise;
}

function applyPlayback(player: AudioPlayer, key: SoundKey, playbackRate: number): void {
  try {
    player.setPlaybackRate(playbackRate);
  } catch (error) {
    console.warn(`[sounds] Failed to set playback rate for "${key}".`, error);
  }
  void player.seekTo(0).then(() => player.play());
}

function playSound(key: SoundKey, playbackRate = 1): void {
  const player = players.get(key);
  if (player) {
    applyPlayback(player, key, playbackRate);
    return;
  }

  void ensureSoundsReady()
    .then(() => {
      const readyPlayer = players.get(key);
      if (!readyPlayer) {
        console.warn(`[sounds] Player for "${key}" is not available after preload.`);
        return;
      }
      applyPlayback(readyPlayer, key, playbackRate);
    })
    .catch((error: unknown) => {
      console.warn(`[sounds] Failed to initialize sounds for "${key}".`, error);
    });
}

export function unloadSounds(): void {
  players.forEach((player) => player.remove());
  players.clear();
  initialized = false;
}

export function playTick(pitch = 1): void {
  // Use pre-generated files at the exact pitches used during countdown so
  // setPlaybackRate doesn't shorten the duration (wireframe uses direct
  // osc.frequency — pitch only, never changes duration).
  if (Math.abs(pitch - 1.15) < 0.01) {
    playSound("tick-115");
  } else if (Math.abs(pitch - 1.30) < 0.01) {
    playSound("tick-130");
  } else {
    playSound("tick", pitch);
  }
}

export function playUrgentTick(): void {
  playSound("urgent-tick");
}

export function playSuccess(): void {
  playSound("success");
}

export function playEpicSuccess(): void {
  playSound("epic-success");
}

export function playAlarm(): void {
  playSound("alarm");
}

export function playSmallReward(): void {
  playSound("small-reward");
}

export function playLaunch(): void {
  playSound("launch");
}

export function playWarning(): void {
  playSound("warning");
}

export function playLevelUp(): void {
  playSound("level-up");
}

export function playTimerTick(): void {
  playSound("timer-tick");
}

export function playExtend(): void {
  playSound("extend");
}
