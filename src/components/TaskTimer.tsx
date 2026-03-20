import { COLORS } from "@/constants/theme";
import {
  playEpicSuccess,
  playLaunch,
  playSuccess,
  playTick,
  playTimerTick,
  playUrgentTick,
  playWarning,
} from "@/lib/sounds";
import {
  hapticCancel,
  hapticCountdownTick,
  hapticExtend,
  hapticLastTenPulse,
  hapticSuccess,
  hapticTimeUp,
  hapticTimerLaunch,
  hapticTwoMinuteWarning,
} from "@/lib/haptics";
import type { CompletionType, Task } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, Clock, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import TimerPickerOverlay from "./TimerPicker";
import TimeUpDialogOverlay from "./TimeUpDialog";

type Phase = "pick-time" | "countdown" | "working" | "time-up" | "extend-pick" | "add-time";

type TaskTimerProps = {
  task: Task;
  onComplete: (type: CompletionType, timerMinutes: number) => void;
  onCancel: () => void;
};

function TaskTimer({ task, onComplete, onCancel }: TaskTimerProps) {
  const [phase, setPhase] = useState<Phase>("pick-time");
  const [count, setCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [warned, setWarned] = useState(false);
  const [extensions, setExtensions] = useState(0);

  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(0);
  const endTimeRef = useRef(0);
  const warnedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startCountdown = useCallback(() => {
    cleanup();
    setPhase("countdown");
    hapticTimerLaunch();
    startRef.current = Date.now();
    setCount(5);
    setProgress(0);

    const animate = () => {
      const elapsed = (Date.now() - startRef.current) / 5000;
      setProgress(Math.min(elapsed, 1));
      if (elapsed < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    let expected = 4;
    const runStep = () => {
      setCount(expected);

      if (expected <= 2 && expected > 0) {
        playUrgentTick();
        hapticCountdownTick(true);
      } else if (expected > 2) {
        playTick(1 + (5 - expected) * 0.15);
        hapticCountdownTick(false);
      }

      if (expected <= 0) {
        cleanup();
        setCount(0);
        setProgress(1);
        setPhase("working");
        playUrgentTick();
        hapticSuccess();
        return;
      }

      expected -= 1;
      const nextDelay = Math.max(0, startRef.current + (5 - expected) * 1000 - Date.now());
      countdownTimeoutRef.current = setTimeout(runStep, nextDelay);
    };

    countdownTimeoutRef.current = setTimeout(runStep, 1000);
  }, [cleanup]);

  const startWorkTimer = useCallback(
    (minutes: number) => {
      const secs = minutes * 60;
      setTotalSeconds((prev) => prev + secs);
      setRemaining(secs);
      endTimeRef.current = Date.now() + secs * 1000;
      warnedRef.current = false;
      setWarned(false);
      startCountdown();
    },
    [startCountdown]
  );

  useEffect(() => {
    if (phase !== "working") return;

    tickRef.current = setInterval(() => {
      const secsLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemaining(secsLeft);

      if (secsLeft <= 120 && secsLeft > 118 && !warnedRef.current) {
        warnedRef.current = true;
        setWarned(true);
        playWarning();
        hapticTwoMinuteWarning();
      }

      if (secsLeft <= 10 && secsLeft > 0) {
        playTimerTick();
        if (secsLeft % 2 === 0) hapticLastTenPulse();
      }

      if (secsLeft <= 0) {
        if (tickRef.current) clearInterval(tickRef.current);
        hapticTimeUp();
        setPhase("time-up");
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase]);

  const handleExtendSet = (minutes: number) => {
    const secs = minutes * 60;
    setTotalSeconds((prev) => prev + secs);
    setRemaining((prev) => prev + secs);
    endTimeRef.current += secs * 1000;
    warnedRef.current = false;
    setWarned(false);
    setPhase("working");
    playLaunch();
    hapticExtend();
  };

  const finalize = (type: CompletionType) => {
    cleanup();
    const roundedMinutes = Math.max(1, Math.round(totalSeconds / 60));
    onComplete(type, roundedMinutes);
  };

  const handleDoneEarly = () => {
    const type: CompletionType = extensions > 0 ? "on-time" : "early";
    if (type === "early") {
      playEpicSuccess();
      hapticSuccess(true);
    } else {
      playSuccess();
      hapticSuccess();
    }
    finalize(type);
  };

  const handleDoneLate = () => {
    playSuccess();
    hapticSuccess();
    finalize(extensions > 0 ? "on-time" : "late");
  };

  const handleGiveUp = () => finalize("gave-up");

  if (phase === "pick-time") {
    return <TimerPickerOverlay taskText={task.text} onSetTimer={startWorkTimer} onCancel={onCancel} />;
  }

  if (phase === "extend-pick") {
    return (
      <TimerPickerOverlay
        taskText={task.text}
        onSetTimer={handleExtendSet}
        onCancel={() => setPhase("time-up")}
        isExtension
      />
    );
  }

  if (phase === "add-time") {
    return (
      <TimerPickerOverlay
        taskText={task.text}
        onSetTimer={handleExtendSet}
        onCancel={() => setPhase("working")}
        isExtension
      />
    );
  }

  if (phase === "time-up") {
    return (
      <TimeUpDialogOverlay
        taskText={task.text}
        onDone={handleDoneLate}
        onExtend={() => {
          setExtensions((prev) => prev + 1);
          setPhase("extend-pick");
        }}
        onGiveUp={handleGiveUp}
      />
    );
  }

  const circumference = 2 * Math.PI * 90;

  if (phase === "countdown") {
    const isUrgent = count <= 2 && count > 0;
    return (
      <View className="absolute inset-0 z-[90] items-center justify-center bg-[rgba(6,10,22,0.97)] px-5 gap-[6px]">
        <View className="px-4 py-[6px] rounded-full bg-card border border-border mb-2 max-w-[80%]">
          <Text className="text-muted-foreground font-display text-[12px] tracking-[1.2px]" numberOfLines={1}>
            {task.text}
          </Text>
        </View>
        <Text className="text-muted-foreground font-sans text-[13px] mb-2">Get ready…</Text>
        <View className="items-center justify-center">
          <Svg width={240} height={240} viewBox="0 0 200 200">
            <Defs>
              <SvgLinearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={isUrgent ? COLORS.heatFire : COLORS.neonCyan} />
                <Stop offset="100%" stopColor={isUrgent ? COLORS.neonPink : COLORS.neonPurple} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={100} cy={100} r={90} fill="none" stroke={COLORS.border} strokeWidth={3} />
            <Circle
              cx={100}
              cy={100}
              r={90}
              fill="none"
              stroke="url(#countdownGrad)"
              strokeWidth={isUrgent ? 11 : 8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform="rotate(-90 100 100)"
            />
          </Svg>
          <Text
            className={`absolute font-display text-[80px] ${isUrgent ? "text-heat-fire" : "text-neon-cyan"}`}
            style={
              isUrgent
                ? { shadowColor: COLORS.heatFire, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }
                : { shadowColor: COLORS.neonCyan, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }
            }
          >
            {count}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            hapticCancel();
            onCancel();
          }}
          className="mt-3 px-5 py-[10px] rounded-full bg-card border border-border"
        >
          <Text className="text-muted-foreground font-sans text-[14px]">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const timerProgress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
  const isUrgentTime = remaining <= 120;
  const isLastMinute = remaining <= 60;
  const gradientStart = isLastMinute ? COLORS.heatFire : isUrgentTime ? COLORS.heatHot : COLORS.neonCyan;
  const gradientEnd = isLastMinute ? COLORS.neonPink : isUrgentTime ? COLORS.heatFire : COLORS.neonPurple;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <View className="absolute inset-0 z-[90] items-center justify-center bg-[rgba(6,10,22,0.97)] px-5 gap-[6px]">
      <Pressable
        onPress={() => {
          hapticCancel();
          onCancel();
        }}
        className="absolute right-5 top-[54px] z-10 p-[10px] rounded-full bg-card border border-border"
      >
        <X size={18} color={COLORS.mutedForeground} />
      </Pressable>

      <Text className="text-muted-foreground font-display tracking-[2px] text-[11px] mb-1">
        {isUrgentTime ? "⚡ HURRY UP" : "WORKING ON"}
      </Text>
      <Text className="text-foreground font-display text-[20px] mb-[10px] text-center max-w-[90%]">
        {task.text}
      </Text>

      <View className="items-center justify-center">
        <Svg width={220} height={220} viewBox="0 0 200 200">
          <Defs>
            <SvgLinearGradient id="workGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientStart} />
              <Stop offset="100%" stopColor={gradientEnd} />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={100} cy={100} r={90} fill="none" stroke={COLORS.border} strokeWidth={3} />
          <Circle
            cx={100}
            cy={100}
            r={90}
            fill="none"
            stroke="url(#workGrad)"
            strokeWidth={isUrgentTime ? 11 : 8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - timerProgress)}
            transform="rotate(-90 100 100)"
          />
        </Svg>
        <Text
          className={`absolute font-display text-[46px] ${
            isLastMinute ? "text-heat-fire" : isUrgentTime ? "text-heat-hot" : "text-foreground"
          }`}
          style={
            isLastMinute
              ? { shadowColor: COLORS.heatFire, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }
              : undefined
          }
        >
          {formatTime(remaining)}
        </Text>
        <Text className="absolute top-[128px] text-muted-foreground font-sans text-[11px] tracking-[1.2px] uppercase">
          remaining
        </Text>
      </View>

      {warned && remaining > 0 ? (
        <View className="mt-2 bg-[#2a1010] border border-[#7a2020] rounded-full px-4 py-2">
          <Text className="text-heat-fire font-display text-[12px] tracking-[1.2px]">
            ⚠ LESS THAN 2 MIN LEFT!
          </Text>
        </View>
      ) : null}

      <View className="mt-4 gap-3 items-center w-full">
        <Pressable
          onPress={handleDoneEarly}
          className="w-full"
          style={({ pressed }) => [
            {
              borderRadius: 16,
              overflow: "hidden",
              shadowColor: COLORS.success,
              shadowOpacity: 0.5,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
            },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={["#22c97e", "#0ea568"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 62,
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <CheckCircle2 size={22} color="#061a10" strokeWidth={2.5} />
            <Text className="text-[#061a10] font-display text-[24px] tracking-[1px]">DONE ✓</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => {
            setExtensions((prev) => prev + 1);
            setPhase("add-time");
            hapticExtend();
          }}
          className="h-12 rounded-lg px-6 items-center justify-center flex-row gap-2 bg-[#061824]"
          style={({ pressed }) => [
            {
              borderWidth: 1.5,
              borderColor: COLORS.neonCyan + "55",
            },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
        >
          <Clock size={15} color={COLORS.neonCyan} />
          <Text className="text-neon-cyan font-display text-[13px] tracking-[0.8px]">+ NEED MORE TIME</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default TaskTimer;
