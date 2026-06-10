import { COLORS, FONTS } from "@/constants/theme";
import { hapticLevelUp } from "@/lib/haptics";
import { fillCurve, springy } from "@/lib/easing";
import { getLevel, getLevelProgress, getLevelTitle } from "@/lib/momentum";
import { playLevelUp, playSmallReward } from "@/lib/sounds";
import type { CompletionType } from "@/types";
import GradientText from "@/components/ui/GradientText";
import Shimmer from "@/components/ui/Shimmer";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

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
  "gave-up": { title: "GOOD TRY!", subtitle: "You showed up — next time you'll crush it!", emoji: "🌱" },
};

type Phase = "enter" | "fill" | "levelup" | "exit";

type ParticleSpec = {
  left: number;
  top: number;
  size: number;
  color: string;
  delay: number;
};

function createParticles(count: number, epic: boolean): ParticleSpec[] {
  const epicPalette = [COLORS.neonCyan, COLORS.neonPurple, COLORS.neonPink, COLORS.success];
  return Array.from({ length: count }, (_, i) => ({
    left: 10 + Math.random() * 80,
    top: 20 + Math.random() * 60,
    size: 4 + Math.random() * (epic ? 10 : 6),
    color: epic
      ? epicPalette[i % 4] + "b3" // /0.7
      : (i % 2 === 0 ? COLORS.neonCyan : COLORS.neonPurple) + "99", // /0.6
    delay: i * 150,
  }));
}

// Web `ceremony-float` keyframes: rise + scale-in + fade-out, 3s ease-in-out infinite
function CeremonyParticle({ spec, hidden }: { spec: ParticleSpec; hidden: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(withTiming(1, { duration: 3000 }), -1, false)
    );
  }, [progress, spec.delay]);

  const style = useAnimatedStyle(() => ({
    opacity: hidden ? 0 : interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 0.7, 0.4, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 0.2, 0.8, 1], [20, 0, -30, -50]) },
      { scale: interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 0.8, 0.3]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: `${spec.left}%`,
          top: `${spec.top}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: 999,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

function XPCeremony({ xp, prevXp, xpGained, leveledUp, completionType, onFinish }: XPCeremonyProps) {
  const [phase, setPhase] = useState<Phase>("enter");
  const [displayXp, setDisplayXp] = useState(prevXp);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const level = getLevel(xp);
  const prevLevel = getLevel(prevXp);
  const title = getLevelTitle(level);
  const { next, progress } = getLevelProgress(displayXp);
  const prevProgress = useMemo(() => getLevelProgress(prevXp), [prevXp]);
  const msg = COMPLETION_MESSAGES[completionType];

  const isEpic = completionType === "early";
  const particleCount = isEpic ? 16 : completionType === "gave-up" ? 4 : 8;
  const particles = useMemo(() => createParticles(particleCount, isEpic), [particleCount, isEpic]);

  // Web phase machine: fill @800ms, levelup @2400ms (+2000ms), finish @3200/4800ms
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("fill"), 800));
    timers.push(
      setTimeout(() => {
        if (leveledUp) {
          setPhase("levelup");
          playLevelUp();
          hapticLevelUp();
          timers.push(setTimeout(() => setPhase("exit"), 2000));
        } else {
          setPhase("exit");
        }
      }, 2400)
    );
    timers.push(setTimeout(() => onFinishRef.current(), leveledUp ? 4800 : 3200));
    return () => timers.forEach(clearTimeout);
  }, [leveledUp]);

  // XP count-up: 1200ms cubic ease-out (web rAF loop)
  useEffect(() => {
    if (phase !== "fill") return;
    playSmallReward();
    startRef.current = Date.now();
    const duration = 1200;
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplayXp(Math.round(prevXp + (xp - prevXp) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, prevXp, xp]);

  // Level badge burst (web ceremony-level-burst: scale 1 → 1.2 → 1, 0.8s springy)
  const badgeScale = useSharedValue(1);
  useEffect(() => {
    if (phase === "levelup") {
      badgeScale.value = withSequence(
        withTiming(1.2, { duration: 320, easing: springy }),
        withTiming(1, { duration: 480, easing: springy })
      );
    }
  }, [badgeScale, phase]);
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  // +XP pop (web ceremony-xp-appear: scale 0.5→1.2→1, translateY 10→-5→0, 0.6s springy)
  const xpPop = useSharedValue(0);
  useEffect(() => {
    if (phase === "fill") {
      xpPop.value = withTiming(1, { duration: 600, easing: springy });
    }
  }, [phase, xpPop]);
  const xpPopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(xpPop.value, [0, 0.6, 1], [0, 1, 1]),
    transform: [
      { scale: interpolate(xpPop.value, [0, 0.6, 1], [0.5, 1.2, 1]) },
      { translateY: interpolate(xpPop.value, [0, 0.6, 1], [10, -5, 0]) },
    ],
  }));

  // Bar fill: width follows displayXp via 1.2s fillCurve-style count-up; level
  // crossings wrap naturally since progress is per-level.
  const currentProgress = phase === "enter" ? prevProgress.progress : progress;
  const barWidth = useSharedValue(prevProgress.progress);
  useEffect(() => {
    barWidth.value = withTiming(currentProgress, {
      duration: phase === "enter" ? 0 : 120,
      easing: fillCurve,
    });
  }, [barWidth, currentProgress, phase]);
  const barFillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(barWidth.value, 100))}%`,
  }));

  const displayLevel = phase === "levelup" || phase === "exit" ? level : prevLevel;
  const showLevelGlow = phase === "levelup";
  const filling = phase === "fill" || phase === "levelup";

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ type: "timing", duration: 600 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(8,9,13,0.95)",
        overflow: "hidden",
      }}
    >
      {/* Radial background — web: epic cyan/purple ellipse; levelup purple ellipse */}
      <MotiView
        animate={{ opacity: isEpic ? 1 : 0 }}
        transition={{ type: "timing", duration: 1000 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="ceremony-epic" cx="50%" cy="50%" r="70%">
              <Stop offset="0%" stopColor={COLORS.neonCyan} stopOpacity="0.15" />
              <Stop offset="40%" stopColor={COLORS.neonPurple} stopOpacity="0.08" />
              <Stop offset="70%" stopColor={COLORS.neonPurple} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#ceremony-epic)" />
        </Svg>
      </MotiView>
      <MotiView
        animate={{ opacity: !isEpic && leveledUp && (phase === "levelup" || phase === "exit") ? 1 : 0 }}
        transition={{ type: "timing", duration: 1000 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="ceremony-levelup" cx="50%" cy="50%" r="70%">
              <Stop offset="0%" stopColor={COLORS.neonPurple} stopOpacity="0.25" />
              <Stop offset="70%" stopColor={COLORS.neonPurple} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#ceremony-levelup)" />
        </Svg>
      </MotiView>

      {/* Floating particles */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        {particles.map((spec, i) => (
          <CeremonyParticle key={i} spec={spec} hidden={phase === "exit"} />
        ))}
      </View>

      {/* Content — web ceremony-content-enter: rise from 60px, scale 0.8 → 1, 0.7s springy */}
      <MotiView
        from={{ opacity: 0, translateY: 60, scale: 0.8 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: "timing", duration: 700, easing: springy }}
        style={{ alignItems: "center", gap: 24, width: "100%", maxWidth: 384, paddingHorizontal: 24 }}
      >
        {/* Completion message */}
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={{ alignItems: "center", gap: 4 }}
        >
          <Text style={{ fontSize: 30, lineHeight: 38 }}>{msg.emoji}</Text>
          <GradientText
            text={msg.title}
            fontSize={24}
            fontFamily={FONTS.display}
            colors={isEpic ? [COLORS.neonCyan, COLORS.success] : [COLORS.foreground, COLORS.neonCyan]}
            stopOpacities={isEpic ? [1, 1] : [1, 0.7]}
          />
          <Text style={{ color: COLORS.mutedForeground, fontFamily: FONTS.body, fontSize: 14, textAlign: "center" }}>
            {msg.subtitle}
          </Text>
        </MotiView>

        {/* Level badge */}
        <View style={{ alignItems: "center", gap: 8 }}>
          <Animated.View style={badgeAnimatedStyle}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 9999,
                overflow: "hidden",
                shadowColor: showLevelGlow ? COLORS.neonPurple : isEpic ? COLORS.neonCyan : COLORS.neonPurple,
                shadowOpacity: showLevelGlow ? 0.5 : isEpic ? 0.25 : 0.15,
                shadowRadius: showLevelGlow ? 40 : isEpic ? 30 : 20,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <LinearGradient
                colors={
                  leveledUp && showLevelGlow
                    ? [COLORS.neonCyan, COLORS.neonPurple, COLORS.neonPink]
                    : [COLORS.secondary, COLORS.muted]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <GradientText
                  text={String(displayLevel)}
                  fontSize={30}
                  fontFamily={FONTS.display}
                  colors={[COLORS.foreground, COLORS.neonCyan]}
                />
              </LinearGradient>
            </View>
            {/* Level-up expanding ring (web ceremony-ring-expand: scale 1 → 2.5, fade out, 1.2s) */}
            {showLevelGlow ? (
              <MotiView
                from={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ type: "timing", duration: 1200 }}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 9999,
                  borderWidth: 2,
                  borderColor: COLORS.neonCyan + "99",
                }}
              />
            ) : null}
          </Animated.View>
          <Text
            style={{
              fontFamily: FONTS.display,
              fontSize: 12,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: COLORS.mutedForeground,
            }}
          >
            {title}
          </Text>
          {leveledUp && showLevelGlow ? (
            <MotiView
              from={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 800, easing: springy }}
            >
              <Text
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 24,
                  color: COLORS.foreground,
                  textShadowColor: COLORS.neonPurple + "99",
                  textShadowRadius: 15,
                  textShadowOffset: { width: 0, height: 0 },
                }}
              >
                LEVEL UP!
              </Text>
            </MotiView>
          ) : null}
        </View>

        {/* XP bar */}
        <View style={{ width: "100%", gap: 12 }}>
          <View
            style={{
              height: 16,
              borderRadius: 9999,
              backgroundColor: COLORS.muted,
              overflow: "hidden",
              shadowColor: COLORS.neonCyan,
              shadowOpacity: filling ? 0.2 : 0,
              shadowRadius: 15,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Animated.View style={[barFillStyle, { height: "100%", borderRadius: 9999, overflow: "hidden" }]}>
              <LinearGradient
                colors={
                  isEpic
                    ? [COLORS.success, COLORS.neonCyan, COLORS.neonPurple]
                    : [COLORS.neonCyan, COLORS.neonPurple]
                }
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
              {filling ? <Shimmer /> : null}
            </Animated.View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: FONTS.display, fontSize: 16, color: COLORS.foreground }}>
              {displayXp}{" "}
              <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.mutedForeground }}>
                / {next} XP
              </Text>
            </Text>
            <Animated.View style={xpPopStyle}>
              <GradientText
                text={`+${xpGained} XP`}
                fontSize={20}
                fontFamily={FONTS.display}
                colors={
                  completionType === "gave-up"
                    ? [COLORS.neonPurple, COLORS.mutedForeground]
                    : [COLORS.success, COLORS.neonCyan]
                }
              />
            </Animated.View>
          </View>

          {/* Early-finish bonus chip */}
          {isEpic && filling ? (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
              style={{ alignItems: "center" }}
            >
              <Text
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 12,
                  letterSpacing: 0.6,
                  color: COLORS.success,
                  backgroundColor: COLORS.success + "26",
                  borderWidth: 1,
                  borderColor: COLORS.success + "4d",
                  borderRadius: 9999,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  overflow: "hidden",
                }}
              >
                ⚡ EARLY FINISH BONUS
              </Text>
            </MotiView>
          ) : null}
        </View>
      </MotiView>
    </MotiView>
  );
}

export default XPCeremony;
