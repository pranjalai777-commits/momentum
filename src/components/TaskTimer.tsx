import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";
import GradientText from "@/components/ui/GradientText";
import RadialGlow from "@/components/ui/RadialGlow";
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
import { X } from "lucide-react-native";
import { MotiView } from "moti";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import ScalePressable from "@/components/ui/ScalePressable";
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
    playLaunch();
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
        playSuccess();
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
    // Web: urgency = countdown progress (0 → 1); drives stroke width + glow intensity
    const urgency = progress;
    const isUrgent = count <= 2 && count > 0;
    const gradient = isUrgent ? GRADIENTS.firePink : GRADIENTS.cyanPurple;
    return (
      <View className="absolute inset-0 z-[90] items-center justify-center bg-[rgba(8,9,13,0.95)] px-5">
        <Text
          className="text-muted-foreground text-[14px] mb-6 max-w-[80%] text-center"
          style={{ fontFamily: FONTS.display, letterSpacing: 0.35 }}
          numberOfLines={1}
        >
          {task.text}
        </Text>
        <View className="items-center justify-center">
          <RadialGlow
            color={isUrgent ? COLORS.heatFire : COLORS.neonCyan}
            size={270}
            opacity={isUrgent ? 0.18 : 0.1}
            pulse
            style={{ position: "absolute", opacity: 0.5 + urgency * 0.5 }}
          />
          <Svg width={208} height={208} viewBox="0 0 200 200">
            <Defs>
              <SvgLinearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={gradient[0]} />
                <Stop offset="100%" stopColor={gradient[1]} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={100} cy={100} r={90} fill="none" stroke={COLORS.muted} strokeOpacity={0.3} strokeWidth={3} />
            <Circle
              cx={100}
              cy={100}
              r={90}
              fill="none"
              stroke="url(#countdownGrad)"
              strokeWidth={5 + urgency * 6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              transform="rotate(-90 100 100)"
            />
          </Svg>
          <MotiView
            key={count}
            from={{ scale: 1.2, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "timing", duration: 300 }}
            style={{
              position: "absolute",
              shadowColor: isUrgent ? COLORS.heatFire : COLORS.neonCyan,
              shadowOpacity: isUrgent ? 0.6 : 0.4,
              shadowRadius: isUrgent ? 18 : 10,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <GradientText
              text={String(count)}
              fontSize={72}
              fontFamily={FONTS.display}
              colors={[...gradient]}
              width={100}
              height={92}
            />
          </MotiView>
        </View>
        <Pressable
          onPress={() => {
            hapticCancel();
            onCancel();
          }}
          className="mt-8"
        >
          <Text className="text-muted-foreground font-sans text-[14px]">Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const timerProgress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
  const isUrgentTime = remaining <= 120;
  const isLastMinute = remaining <= 60;
  // Web gradient tiers: normal cyan→purple, urgent hot→fire, last minute fire→pink
  const workGradient = isLastMinute ? GRADIENTS.firePink : isUrgentTime ? GRADIENTS.hotFire : GRADIENTS.cyanPurple;

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <View
      className="absolute inset-0 z-[90] items-center justify-center px-5"
      style={{ backgroundColor: warned ? "rgba(8,9,13,0.97)" : "rgba(8,9,13,0.95)" }}
    >
      <Pressable
        onPress={() => {
          hapticCancel();
          onCancel();
        }}
        className="absolute right-6 top-[54px] z-10 p-2"
      >
        <X size={20} color={COLORS.mutedForeground} />
      </Pressable>

      <Text
        className="text-muted-foreground text-[12px] uppercase mb-2"
        style={{ fontFamily: FONTS.display, letterSpacing: 2.4 }}
      >
        {isUrgentTime ? "⚡ HURRY UP" : "WORKING ON"}
      </Text>
      <Text
        className="text-foreground text-[18px] mb-6 text-center max-w-[80%]"
        style={{ fontFamily: FONTS.display }}
      >
        {task.text}
      </Text>

      <View className="items-center justify-center mb-6">
        {isUrgentTime ? (
          <RadialGlow
            color={COLORS.heatFire}
            size={246}
            opacity={isLastMinute ? 0.15 : 0.08}
            pulse
            style={{ position: "absolute" }}
          />
        ) : null}
        <Svg width={176} height={176} viewBox="0 0 200 200">
          <Defs>
            <SvgLinearGradient id="workGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={workGradient[0]} />
              <Stop offset="100%" stopColor={workGradient[1]} />
            </SvgLinearGradient>
          </Defs>
          <Circle cx={100} cy={100} r={90} fill="none" stroke={COLORS.muted} strokeOpacity={0.3} strokeWidth={3} />
          <Circle
            cx={100}
            cy={100}
            r={90}
            fill="none"
            stroke="url(#workGrad)"
            strokeWidth={isUrgentTime ? 8 : 5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - timerProgress)}
            transform="rotate(-90 100 100)"
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <Text
            className={`${isLastMinute ? "text-heat-fire" : isUrgentTime ? "text-heat-hot" : "text-foreground"}`}
            style={[
              { fontFamily: FONTS.display, fontSize: isLastMinute ? 36 : 30 },
              isUrgentTime && {
                textShadowColor: COLORS.heatFire + "66",
                textShadowRadius: 15,
                textShadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            {formatTime(remaining)}
          </Text>
          <Text
            className="text-muted-foreground text-[10px] uppercase mt-1"
            style={{ fontFamily: FONTS.display, letterSpacing: 1 }}
          >
            remaining
          </Text>
        </View>
      </View>

      {warned && remaining > 0 ? (
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          className="mb-4 rounded-full px-4 py-2"
          style={{ backgroundColor: COLORS.heatFire + "26", borderWidth: 1, borderColor: COLORS.heatFire + "4d" }}
        >
          <Text className="text-heat-fire text-[12px]" style={{ fontFamily: FONTS.display, letterSpacing: 0.3 }}>
            ⏰ LESS THAN 2 MINUTES LEFT!
          </Text>
        </MotiView>
      ) : null}

      <View className="gap-3 items-center">
        <ScalePressable
          onPress={handleDoneEarly}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: COLORS.success,
            shadowOpacity: 0.3,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 0 },
          }}
          pressedStyle={{ transform: [{ scale: 0.95 }] }}
        >
          <LinearGradient
            colors={GRADIENTS.successCyan}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 48,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white text-[20px]" style={{ fontFamily: FONTS.display }}>
              DONE ✓
            </Text>
          </LinearGradient>
        </ScalePressable>

        <ScalePressable
          onPress={() => {
            setExtensions((prev) => prev + 1);
            setPhase("add-time");
            hapticExtend();
          }}
          className="px-6 rounded-[12px] items-center justify-center"
          style={{
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: COLORS.mutedForeground + "33",
          }}
          pressedStyle={{ transform: [{ scale: 0.98 }] }}
        >
          <Text className="text-muted-foreground text-[14px]" style={{ fontFamily: FONTS.display }}>
            + NEED MORE TIME
          </Text>
        </ScalePressable>
      </View>

      <Text className="text-muted-foreground font-sans text-[12px] mt-3">
        Finish early for <Text className="text-neon-cyan font-sans">bonus XP!</Text>
      </Text>
    </View>
  );
}

export default TaskTimer;
