import { COLORS } from "@/constants/theme";

// Epic "early finish" uses a gold/amber palette instead of flat hot pink
const EPIC_GOLD = "#fbbf24";
const EPIC_AMBER = "#f59e0b";
import { hapticLevelUp } from "@/lib/haptics";
import { getLevel, getLevelProgress, getLevelTitle } from "@/lib/momentum";
import { playLevelUp, playSmallReward } from "@/lib/sounds";
import type { CompletionType } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { TrendingUp } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type XPCeremonyProps = {
  xp: number;
  prevXp: number;
  xpGained: number;
  leveledUp: boolean;
  completionType: CompletionType;
  onFinish: () => void;
};

const COMPLETION_MESSAGES: Record<CompletionType, { title: string; subtitle: string; emoji: string }> = {
  early: { title: "CRUSHED IT!", subtitle: "Finished before the timer — you're on fire!", emoji: "🔥" },
  "on-time": { title: "NICE SAVE!", subtitle: "Extended and delivered — respect!", emoji: "💪" },
  late: { title: "TASK DONE!", subtitle: "You got it done — that's what counts!", emoji: "✅" },
  "gave-up": { title: "GOOD TRY!", subtitle: "You showed up. Next one will be stronger.", emoji: "🌱" },
};

type CeremonyParticle = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
};

type OrbitParticle = {
  radius: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
  reverse: boolean;
};

type BurstParticle = {
  angleRad: number;
  distance: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
};

function createParticles(count: number, epic: boolean): CeremonyParticle[] {
  const palette = epic
    ? [EPIC_GOLD, COLORS.neonPurple, EPIC_AMBER, COLORS.neonCyan]
    : [COLORS.neonCyan, COLORS.neonPurple, COLORS.success];
  return Array.from({ length: count }, (_, i) => ({
    left: 8 + Math.random() * 84,
    top: 16 + Math.random() * 68,
    size: 4 + Math.random() * (epic ? 10 : 6),
    duration: 2200 + Math.random() * 1700,
    delay: i * 90,
    color: palette[i % palette.length],
  }));
}

function createOrbitParticles(count: number, epic: boolean): OrbitParticle[] {
  const palette = epic
    ? [EPIC_GOLD, COLORS.neonCyan, COLORS.neonPurple, EPIC_AMBER]
    : [COLORS.neonCyan, COLORS.neonPurple, COLORS.success];
  return Array.from({ length: count }, (_, i) => ({
    radius: 56 + Math.random() * (epic ? 92 : 70),
    size: 3 + Math.random() * (epic ? 5 : 4),
    duration: 2600 + Math.random() * 2600,
    delay: i * 80,
    color: palette[i % palette.length],
    reverse: i % 2 === 0,
  }));
}

function createBurstParticles(count: number, epic: boolean): BurstParticle[] {
  const palette = epic
    ? [EPIC_GOLD, COLORS.neonCyan, COLORS.neonPurple, EPIC_AMBER]
    : [COLORS.neonCyan, COLORS.neonPurple, COLORS.success];
  return Array.from({ length: count }, (_, i) => {
    const angleRad = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
    return {
      angleRad,
      distance: 64 + Math.random() * (epic ? 150 : 105),
      size: 4 + Math.random() * (epic ? 7 : 5),
      duration: 700 + Math.random() * 700,
      delay: Math.random() * 120,
      color: palette[i % palette.length],
    };
  });
}

function XPCeremony({
  xp,
  prevXp,
  xpGained,
  leveledUp,
  completionType,
  onFinish,
}: XPCeremonyProps) {
  console.log("[🔬CEREMONY] XPCeremony render — xp:", xp, "prevXp:", prevXp, "xpGained:", xpGained, "leveledUp:", leveledUp, "type:", completionType);
  const [displayXp, setDisplayXp] = useState(prevXp);
  const [phase, setPhase] = useState<"enter" | "charge" | "fill" | "burst" | "exit">("enter");
  const xpIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const cardFloat = useSharedValue(0);
  const cardScale = useSharedValue(0.94);
  const glowPulse = useSharedValue(0);
  const progressWidth = useSharedValue(getLevelProgress(prevXp).progress);

  const level = getLevel(xp);
  const prevLevel = getLevel(prevXp);
  const levelsGained = Math.max(1, level - prevLevel); // at least 1 when leveledUp
  const PER_LEVEL_MS = 480;
  const LEVEL_RESET_MS = 80;
  const FINAL_FILL_MS = 520;
  const totalBarMs = leveledUp
    ? levelsGained * (PER_LEVEL_MS + LEVEL_RESET_MS) + FINAL_FILL_MS
    : 1000;
  const title = getLevelTitle(level);
  const msg = COMPLETION_MESSAGES[completionType];
  const progress = useMemo(() => getLevelProgress(displayXp), [displayXp]);
  const isEpic = completionType === "early";
  const particleCount = completionType === "gave-up" ? 6 : isEpic ? 14 : 10;
  const particles = useMemo(() => createParticles(particleCount, isEpic), [particleCount, isEpic]);
  const orbitParticles = useMemo(
    () => createOrbitParticles(isEpic ? 8 : 6, isEpic),
    [isEpic]
  );
  const burstParticles = useMemo(
    () => createBurstParticles(isEpic ? 16 : 12, isEpic),
    [isEpic]
  );

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const y = interpolate(cardFloat.value, [0, 1], [0, -8]);
    return {
      transform: [{ translateY: y }, { scale: cardScale.value }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const pulseScale = interpolate(glowPulse.value, [0, 1], [0.95, 1.14]);
    const pulseOpacity = interpolate(glowPulse.value, [0, 1], [0.18, isEpic ? 0.4 : 0.3]);
    return {
      opacity: phase === "exit" ? 0 : pulseOpacity,
      transform: [{ scale: pulseScale }],
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(progressWidth.value, 100))}%`,
  }));

  useEffect(() => {
    console.log("[🔬CEREMONY] XPCeremony MOUNTED");
    return () => console.log("[🔬CEREMONY] XPCeremony UNMOUNTED");
  }, []);

  useEffect(() => {
    cardFloat.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    glowPulse.value = withRepeat(
      withTiming(1, { duration: isEpic ? 1200 : 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [cardFloat, glowPulse, isEpic]);

  useEffect(() => {
    console.log("[🔬CEREMONY] phase-sequence effect mounted — leveledUp:", leveledUp, "isEpic:", isEpic);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const FILL_START_MS = 1080;
    const burstDuration = leveledUp ? 1750 : 1050;
    const burstStartMs = leveledUp ? FILL_START_MS + totalBarMs + 120 : 2400;
    const onFinishMs = burstStartMs + burstDuration + (leveledUp ? 600 : 500);
    timers.push(
      setTimeout(() => {
        console.log("[🔬CEREMONY] phase → charge");
        setPhase("charge");
        cardScale.value = withTiming(1.02, { duration: 420, easing: Easing.out(Easing.cubic) });
      }, 520)
    );
    timers.push(setTimeout(() => { console.log("[🔬CEREMONY] phase → fill"); setPhase("fill"); }, FILL_START_MS));
    timers.push(
      setTimeout(() => {
        console.log("[🔬CEREMONY] phase → burst");
        setPhase("burst");
        cardScale.value = withTiming(1.12, { duration: 380, easing: Easing.out(Easing.exp) });
        if (leveledUp || isEpic) {
          playLevelUp();
          hapticLevelUp();
        }
        timers.push(setTimeout(() => { console.log("[🔬CEREMONY] phase → exit"); setPhase("exit"); }, burstDuration));
      }, burstStartMs)
    );
    timers.push(setTimeout(() => { console.log("[🔬CEREMONY] onFinish timeout fired"); onFinishRef.current(); }, onFinishMs));
    return () => {
      console.log("[🔬CEREMONY] phase-sequence effect CLEANUP (unmount or deps changed)");
      timers.forEach(clearTimeout);
      if (xpIntervalRef.current) clearInterval(xpIntervalRef.current);
    };
  }, [cardScale, isEpic, leveledUp]); // onFinish intentionally excluded — accessed via ref

  useEffect(() => {
    if (phase === "fill") playSmallReward();
  }, [phase]);

  useEffect(() => {
    if (phase !== "fill") return;
    const steps = 40;
    let step = 0;

    if (leveledUp) {
      // For each level crossed: fill to 100%, flash reset. Then fill final level's progress.
      // e.g. level 1→3: fill100 → reset → fill100 → reset → fillNewProgress
      const newProgress = getLevelProgress(xp).progress;
      const segments: number[] = [];
      for (let i = 0; i < levelsGained; i++) {
        segments.push(withTiming(100, { duration: PER_LEVEL_MS, easing: Easing.out(Easing.cubic) }));
        segments.push(withTiming(0, { duration: LEVEL_RESET_MS }));
      }
      segments.push(withTiming(newProgress, { duration: FINAL_FILL_MS, easing: Easing.out(Easing.cubic) }));
      progressWidth.value = withSequence(...segments);
    } else {
      progressWidth.value = withTiming(getLevelProgress(xp).progress, {
        duration: totalBarMs,
        easing: Easing.out(Easing.cubic),
      });
    }
    if (xpIntervalRef.current) clearInterval(xpIntervalRef.current);
    xpIntervalRef.current = setInterval(() => {
      step += 1;
      const t = Math.min(1, step / steps);
      const eased = 1 - (1 - t) ** 3;
      setDisplayXp(Math.round(prevXp + (xp - prevXp) * eased));
      if (t >= 1 && xpIntervalRef.current) {
        clearInterval(xpIntervalRef.current);
        xpIntervalRef.current = null;
      }
    }, Math.round(totalBarMs / steps));
    return () => {
      if (xpIntervalRef.current) clearInterval(xpIntervalRef.current);
    };
  }, [phase, prevXp, progressWidth, xp, levelsGained, leveledUp, totalBarMs]); // PER_LEVEL_MS/LEVEL_RESET_MS/FINAL_FILL_MS are stable constants

  useEffect(() => {
    if (phase === "exit") {
      cardScale.value = withTiming(0.97, { duration: 480, easing: Easing.inOut(Easing.quad) });
    }
  }, [cardScale, phase]);

  const shownLevel = phase === "burst" || phase === "exit" ? level : prevLevel;

  return (
    <View className="absolute inset-0 z-[100] items-center justify-center bg-[rgba(6,10,22,0.97)] px-4 overflow-hidden">
      <LinearGradient
        colors={isEpic ? ["rgba(251,191,36,0.16)", "rgba(136,51,255,0.10)", "rgba(6,10,22,0.96)"] : ["rgba(0,217,245,0.14)", "rgba(136,51,255,0.10)", "rgba(6,10,22,0.96)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        className="absolute inset-0"
      />

      <Animated.View
        style={[
          {
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 9999,
            backgroundColor: isEpic ? "rgba(251,191,36,0.14)" : "rgba(0,217,245,0.12)",
          },
          glowAnimatedStyle,
        ]}
      />

      <MotiView
        from={{ opacity: 0.28, scale: 0.9 }}
        animate={{ opacity: phase === "exit" ? 0 : 0.65, scale: phase === "burst" ? 1.26 : 1.04 }}
        transition={{ type: "timing", duration: phase === "burst" ? 720 : 1800 }}
        style={{
          position: "absolute",
          width: 580,
          height: 580,
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: isEpic ? EPIC_GOLD + "50" : COLORS.neonCyan + "40",
        }}
      />

      <MotiView
        from={{ opacity: 0.15, scale: 0.7 }}
        animate={{ opacity: phase === "exit" ? 0 : phase === "burst" ? 0.52 : 0.24, scale: phase === "burst" ? 1.5 : 1.04 }}
        transition={{ type: "timing", duration: phase === "burst" ? 560 : 1900 }}
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: 9999,
          borderWidth: phase === "burst" ? 2 : 1,
          borderColor: isEpic ? EPIC_GOLD + "66" : COLORS.neonCyan + "50",
        }}
      />

      <View className="absolute inset-0 pointer-events-none">
        {particles.map((particle, index) => (
          <MotiView
            key={`${index}-${particle.left.toFixed(2)}`}
            from={{ opacity: 0, translateY: 12, scale: 0.7 }}
            animate={{ opacity: phase === "exit" ? 0 : 0.95, translateY: -26, scale: 1.25 }}
            transition={{
              type: "timing",
              duration: particle.duration,
              delay: particle.delay,
              loop: true,
              repeatReverse: true,
            }}
            style={{
              position: "absolute",
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              borderRadius: 999,
              backgroundColor: particle.color,
            }}
          />
        ))}
      </View>

      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        {orbitParticles.map((particle, index) => (
          <MotiView
            key={`orbit-${index}`}
            from={{ opacity: 0, rotate: "0deg" }}
            animate={{ opacity: phase === "exit" ? 0 : 0.82, rotate: particle.reverse ? "-360deg" : "360deg" }}
            transition={{
              type: "timing",
              duration: particle.duration,
              delay: particle.delay,
              loop: true,
            }}
            style={{ position: "absolute", width: 1, height: 1 }}
          >
            <MotiView
              from={{ translateX: particle.radius, scale: 0.75 }}
              animate={{ translateX: particle.radius, scale: phase === "burst" ? 1.15 : 1 }}
              transition={{
                type: "timing",
                duration: 220,
                delay: index * 18,
              }}
              style={{
                width: particle.size,
                height: particle.size,
                borderRadius: 999,
                backgroundColor: particle.color,
              }}
            />
          </MotiView>
        ))}
      </View>

      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        {burstParticles.map((particle, index) => {
          const x = Math.cos(particle.angleRad) * particle.distance;
          const y = Math.sin(particle.angleRad) * particle.distance;
          return (
            <MotiView
              key={`burst-${index}`}
              from={{ opacity: 0, scale: 0.2, translateX: 0, translateY: 0 }}
              animate={{
                opacity: phase === "burst" ? 0.95 : 0,
                scale: phase === "burst" ? 1 : 0.2,
                translateX: phase === "burst" ? x : 0,
                translateY: phase === "burst" ? y : 0,
              }}
              transition={{
                type: "timing",
                duration: particle.duration,
                delay: particle.delay,
              }}
              style={{
                position: "absolute",
                width: particle.size,
                height: particle.size,
                borderRadius: 999,
                backgroundColor: particle.color,
              }}
            />
          );
        })}
      </View>

      <MotiView
        from={{ opacity: 0, scale: 0.96, translateY: 18 }}
        animate={{
          opacity: phase === "exit" ? 0 : 1,
          scale: phase === "burst" ? (leveledUp ? 1.07 : 1.04) : 1,
          translateY: 0,
        }}
        transition={{ type: "timing", duration: 350 }}
      >
        <Animated.View style={cardAnimatedStyle}>
          <View
            style={{
              width: "100%",
              maxWidth: 390,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: isEpic ? EPIC_GOLD + "55" : COLORS.border,
              backgroundColor: COLORS.cardElevated,
              paddingHorizontal: 20,
              paddingVertical: 24,
              gap: 18,
                shadowColor: isEpic ? EPIC_AMBER : COLORS.neonCyan,
                shadowOpacity: phase === "burst" ? 0.2 : 0.14,
                shadowRadius: phase === "burst" ? 32 : 24,
                shadowOffset: { width: 0, height: 0 },
              }}
              shouldRasterizeIOS
              renderToHardwareTextureAndroid
            >
            <View className="items-center gap-1">
              <Text className="text-[40px]">{msg.emoji}</Text>
              <Text
                className="text-foreground font-display text-[30px]"
                style={{ color: isEpic ? EPIC_GOLD : COLORS.foreground }}
              >
                {msg.title}
              </Text>
              <Text className="text-muted-foreground font-sans text-[13px] text-center">{msg.subtitle}</Text>
              {isEpic ? (
                <View
                  className="mt-1 px-3 py-[5px] rounded-full border"
                  style={{ borderColor: COLORS.success + "55", backgroundColor: COLORS.successDark }}
                >
                  <Text className="text-success font-display text-[11px] tracking-[1px]">⚡ EARLY FINISH BONUS</Text>
                </View>
              ) : null}
            </View>

            <View className="items-center gap-2">
              <MotiView
                from={{ scale: 0.86 }}
                animate={{ scale: phase === "burst" ? 1.2 : 1 }}
                transition={{ type: "timing", duration: 320 }}
                style={[
                  {
                    width: 90,
                    height: 90,
                    borderRadius: 99,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isEpic ? "#1a1200" : "#0c1e33",
                    borderWidth: 2,
                    borderColor: isEpic ? EPIC_GOLD + "88" : COLORS.neonCyan + "55",
                  },
                  phase === "burst" && {
                    borderColor: isEpic ? EPIC_GOLD : COLORS.neonCyan,
                    shadowColor: isEpic ? EPIC_AMBER : COLORS.neonCyan,
                    shadowOpacity: 0.72,
                    shadowRadius: 26,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              >
                <Text className="font-display text-[36px]" style={{ color: isEpic ? EPIC_GOLD : COLORS.neonCyan }}>
                  {shownLevel}
                </Text>
              </MotiView>
              <Text className="text-muted-foreground font-display text-[11px] tracking-[1.4px]">{title}</Text>
              {leveledUp && phase === "burst" ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.76, translateY: 8 }}
                  animate={{ opacity: 1, scale: 1, translateY: 0 }}
                  transition={{ type: "spring", damping: 11, stiffness: 170 }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 9999,
                    backgroundColor: isEpic ? "#1a1400" : "#061c2e",
                    borderWidth: 1,
                    borderColor: (isEpic ? EPIC_GOLD : COLORS.neonCyan) + "66",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TrendingUp size={16} color={isEpic ? EPIC_GOLD : COLORS.neonCyan} strokeWidth={2.5} />
                    <Text
                      className="font-display text-[16px] tracking-[1px]"
                      style={{ color: isEpic ? EPIC_GOLD : COLORS.neonCyan }}
                    >
                      LEVEL UP!
                    </Text>
                  </View>
                </MotiView>
              ) : null}
            </View>

            <View className="h-3 rounded-full overflow-hidden bg-muted border border-border">
              <Animated.View
                className="h-full rounded-full"
                style={[
                  progressAnimatedStyle,
                  {
                    backgroundColor: isEpic ? EPIC_AMBER : COLORS.neonCyan,
                    shadowColor: isEpic ? EPIC_AMBER : COLORS.neonCyan,
                    shadowOpacity: phase === "burst" ? 0.85 : 0.62,
                    shadowRadius: phase === "burst" ? 14 : 8,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              />
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-foreground font-display text-[17px]">
                {displayXp} <Text className="text-muted-foreground font-sans text-[13px]">/ {progress.next} XP</Text>
              </Text>
              <View
                className="px-3 py-[5px] rounded-full border"
                style={{
                  borderColor: isEpic ? EPIC_GOLD + "55" : COLORS.success + "55",
                  backgroundColor: isEpic ? "#1a1100" : "#0a2416",
                }}
              >
                <Text
                  className="font-display text-[20px]"
                  style={{
                    color: isEpic ? EPIC_GOLD : COLORS.success,
                    shadowColor: isEpic ? EPIC_AMBER : COLORS.success,
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  +{xpGained} XP
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </MotiView>
    </View>
  );
}

export default XPCeremony;
