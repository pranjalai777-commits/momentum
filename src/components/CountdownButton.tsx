import { BORDER_RADIUS, COLORS, FONTS } from "@/constants/theme";
import ScalePressable from "@/components/ui/ScalePressable";
import { hapticCancel, hapticCountdownTick, hapticSuccess, hapticTimerLaunch } from "@/lib/haptics";
import { playLaunch, playSuccess, playTick, playUrgentTick } from "@/lib/sounds";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

type Phase = "idle" | "counting" | "success";

type CountdownButtonProps = {
  onComplete: () => void;
  onTaskFinished: () => void;
  onCancel: () => void;
};

function CountdownButton({ onComplete, onTaskFinished, onCancel }: CountdownButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  const circumference = useMemo(() => 2 * Math.PI * 90, []);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startCountdown = useCallback(() => {
    playLaunch();
    hapticTimerLaunch();
    setPhase("counting");
    setCount(5);
    setProgress(0);
    startTimeRef.current = Date.now();
    let c = 5;
    cleanup();

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 5000;
      setProgress(Math.min(elapsed, 1));
      if (elapsed < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    intervalRef.current = setInterval(() => {
      c -= 1;
      if (c <= 0) {
        cleanup();
        setCount(0);
        setProgress(1);
        setPhase("success");
        playSuccess();
        hapticSuccess();
        onComplete();
        setTimeout(() => {
          onTaskFinished();
          setPhase("idle");
        }, 900);
      } else {
        setCount(c);
        if (c <= 2) {
          playUrgentTick();
          hapticCountdownTick(true);
        } else {
          playTick(1 + (5 - c) * 0.15);
          hapticCountdownTick(false);
        }
      }
    }, 1000);
  }, [cleanup, onComplete, onTaskFinished]);

  if (phase === "idle") {
    return (
      <ScalePressable onPress={startCountdown} style={styles.launch} pressedStyle={styles.pressed}>
        <Text style={styles.launchText}>LAUNCH</Text>
      </ScalePressable>
    );
  }

  if (phase === "success") {
    return (
      <View style={[styles.launch, styles.success]}>
        <Text style={styles.launchText}>MOVING!</Text>
      </View>
    );
  }

  return (
    <View style={styles.countWrap}>
      <Svg width={230} height={230} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="countGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={count <= 2 ? COLORS.heatFire : COLORS.neonCyan} />
            <Stop offset="100%" stopColor={count <= 2 ? COLORS.neonPink : COLORS.neonPurple} />
          </LinearGradient>
        </Defs>
        <Circle cx={100} cy={100} r={90} fill="none" stroke={COLORS.muted} strokeWidth={4} opacity={0.3} />
        <Circle
          cx={100}
          cy={100}
          r={90}
          fill="none"
          stroke="url(#countGrad)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 100 100)"
        />
      </Svg>
      <Text style={[styles.countText, count <= 2 && styles.countUrgent]}>{count}</Text>
      <Pressable
        onPress={() => {
          hapticCancel();
          onCancel();
        }}
        style={styles.cancelBtn}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  launch: {
    width: 210,
    height: 210,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.neonCyan,
    borderWidth: 2,
    borderColor: "#7ff6ff",
  },
  success: {
    backgroundColor: COLORS.success,
    borderColor: "#98ffd2",
  },
  launchText: { color: "#081120", fontFamily: FONTS.display, fontSize: 30, letterSpacing: 1.4 },
  countWrap: { alignItems: "center", justifyContent: "center", width: 230, height: 260 },
  countText: {
    position: "absolute",
    color: COLORS.neonCyan,
    fontFamily: FONTS.display,
    fontSize: 72,
  },
  countUrgent: { color: COLORS.heatFire },
  cancelBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.muted,
  },
  cancelText: { color: COLORS.mutedForeground, fontFamily: FONTS.body, fontSize: 13 },
  pressed: { transform: [{ scale: 0.97 }] },
});

export default CountdownButton;
