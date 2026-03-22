import { useState, useCallback, useRef, useEffect } from "react";
import { playTick, playUrgentTick, playSuccess, playLaunch, playWarning, playTimerTick, playEpicSuccess } from "@/lib/sounds";
import { X } from "lucide-react";
import type { Task } from "@/lib/momentum";
import TimerPicker from "./TimerPicker";
import TimeUpDialog from "./TimeUpDialog";

export type CompletionType = "early" | "on-time" | "late" | "gave-up";

interface Props {
  task: Task;
  onComplete: (type: CompletionType, timerMinutes: number) => void;
  onCancel: () => void;
}

type Phase = "pick-time" | "countdown" | "working" | "time-up" | "extend-pick" | "add-time";

export default function TaskTimer({ task, onComplete, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>("pick-time");
  const [count, setCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState(0); // seconds remaining
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [warned, setWarned] = useState(false);
  const [extensions, setExtensions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);
  const warnedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  };

  useEffect(() => () => cleanup(), []);

  const startCountdown = useCallback(() => {
    setPhase("countdown");
    playLaunch();
    startRef.current = Date.now();
    let c = 5;
    setCount(5);
    setProgress(0);

    const animateProgress = () => {
      const el = (Date.now() - startRef.current) / 5000;
      setProgress(Math.min(el, 1));
      if (el < 1) rafRef.current = requestAnimationFrame(animateProgress);
    };
    rafRef.current = requestAnimationFrame(animateProgress);

    intervalRef.current = setInterval(() => {
      c--;
      if (c <= 0) {
        cleanup();
        setCount(0);
        setProgress(1);
        setPhase("working");
        playSuccess();
        if (navigator.vibrate) navigator.vibrate([30, 50, 60]);
      } else {
        setCount(c);
        if (c <= 2) playUrgentTick();
        else playTick(1 + (5 - c) * 0.15);
      }
    }, 1000);
  }, []);

  const startWorkTimer = useCallback((minutes: number) => {
    const secs = minutes * 60;
    setTotalSeconds(prev => prev + secs);
    setRemaining(secs);
    endTimeRef.current = Date.now() + secs * 1000;
    warnedRef.current = false;
    setWarned(false);
    startCountdown();
  }, [startCountdown]);

  // Working phase countdown
  useEffect(() => {
    if (phase !== "working") return;

    tickRef.current = setInterval(() => {
      const now = Date.now();
      const secsLeft = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setRemaining(secsLeft);

      // 2-minute warning
      if (secsLeft <= 120 && secsLeft > 118 && !warnedRef.current) {
        warnedRef.current = true;
        setWarned(true);
        playWarning();
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      }

      // Last 10 seconds tick
      if (secsLeft <= 10 && secsLeft > 0) {
        playTimerTick();
      }

      // Time's up
      if (secsLeft <= 0) {
        if (tickRef.current) clearInterval(tickRef.current);
        setPhase("time-up");
      }
    }, 1000);

    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [phase]);

  const handleSetTimer = (minutes: number) => {
    startWorkTimer(minutes);
  };

  const handleExtendTimer = () => {
    setExtensions(prev => prev + 1);
    setPhase("extend-pick");
  };

  const handleExtendSet = (minutes: number) => {
    const secs = minutes * 60;
    setTotalSeconds(prev => prev + secs);
    setRemaining(prev => prev + secs);
    endTimeRef.current = endTimeRef.current + secs * 1000;
    warnedRef.current = false;
    setWarned(false);
    setPhase("working");
    playLaunch();
  };

  const handleAddTime = () => {
    setExtensions(prev => prev + 1);
    setPhase("add-time");
  };

  const handleAddTimeSet = (minutes: number) => {
    const secs = minutes * 60;
    setTotalSeconds(prev => prev + secs);
    setRemaining(prev => prev + secs);
    endTimeRef.current = endTimeRef.current + secs * 1000;
    warnedRef.current = false;
    setWarned(false);
    setPhase("working");
    playLaunch();
  };

  const handleDoneEarly = () => {
    cleanup();
    const type: CompletionType = extensions > 0 ? "on-time" : "early";
    if (type === "early") {
      playEpicSuccess();
      if (navigator.vibrate) navigator.vibrate([20, 40, 30, 40, 50, 40, 80]);
    } else {
      playSuccess();
      if (navigator.vibrate) navigator.vibrate([20, 40, 30, 40, 50]);
    }
    onComplete(type, Math.round(totalSeconds / 60));
  };

  const handleDoneLate = () => {
    cleanup();
    playSuccess();
    if (navigator.vibrate) navigator.vibrate([20, 40, 30, 40, 50]);
    onComplete(extensions > 0 ? "on-time" : "late", Math.round(totalSeconds / 60));
  };

  const handleGiveUp = () => {
    cleanup();
    onComplete("gave-up", Math.round(totalSeconds / 60));
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const circumference = 2 * Math.PI * 90;

  // Timer picker
  if (phase === "pick-time") {
    return <TimerPicker taskText={task.text} onSetTimer={handleSetTimer} onCancel={onCancel} />;
  }

  // Extension picker
  if (phase === "extend-pick") {
    return <TimerPicker taskText={task.text} onSetTimer={handleExtendSet} onCancel={() => setPhase("time-up")} isExtension />;
  }

  // Add time picker (during working phase)
  if (phase === "add-time") {
    return <TimerPicker taskText={task.text} onSetTimer={handleAddTimeSet} onCancel={() => setPhase("working")} isExtension />;
  }

  // Time's up dialog
  if (phase === "time-up") {
    return <TimeUpDialog taskText={task.text} onDone={handleDoneLate} onExtend={handleExtendTimer} onGiveUp={handleGiveUp} />;
  }

  // Countdown phase
  if (phase === "countdown") {
    const urgency = progress;
    const isUrgent = count <= 2 && count > 0;

    return (
      <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm ceremony-enter">
        <p className="text-sm text-muted-foreground mb-6 font-display tracking-wide max-w-[80%] text-center truncate">
          {task.text}
        </p>

        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "130%", height: "130%",
              background: `radial-gradient(circle, ${
                isUrgent ? "hsl(var(--heat-fire) / 0.18)" : "hsl(var(--neon-cyan) / 0.1)"
              }, transparent 70%)`,
              opacity: 0.5 + urgency * 0.5,
              animation: "countdown-pulse 1.5s ease-in-out infinite",
            }}
          />
          <svg className="w-52 h-52 sm:w-64 sm:h-64 -rotate-90" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                {isUrgent ? (
                  <>
                    <stop offset="0%" stopColor="hsl(var(--heat-fire))" />
                    <stop offset="100%" stopColor="hsl(var(--neon-pink))" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="hsl(var(--neon-cyan))" />
                    <stop offset="100%" stopColor="hsl(var(--neon-purple))" />
                  </>
                )}
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity="0.3" />
            <circle
              cx="100" cy="100" r="90" fill="none"
              stroke="url(#timer-grad)"
              strokeWidth={5 + urgency * 6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{
                filter: `drop-shadow(0 0 ${6 + urgency * 12}px ${
                  isUrgent ? "hsl(var(--heat-fire) / 0.7)" : "hsl(var(--neon-cyan) / 0.5)"
                })`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              key={count}
              className="text-7xl sm:text-8xl font-display font-black countdown-tick"
              style={{
                background: isUrgent
                  ? "linear-gradient(135deg, hsl(var(--heat-fire)), hsl(var(--neon-pink)))"
                  : "linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 ${isUrgent ? 18 : 10}px ${
                  isUrgent ? "hsl(var(--heat-fire) / 0.6)" : "hsl(var(--neon-cyan) / 0.4)"
                })`,
              }}
            >
              {count}
            </span>
          </div>
        </div>

        <button onClick={onCancel} className="mt-8 text-muted-foreground text-sm hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    );
  }

  // Working phase — countdown timer
  const totalSecs = Math.round((endTimeRef.current - (endTimeRef.current - (remaining * 1000 + (Date.now() - (endTimeRef.current - remaining * 1000))))) / 1000);
  const timerProgress = totalSeconds > 0 ? 1 - (remaining / totalSeconds) : 0;
  const isUrgentTime = remaining <= 120;
  const isLastMinute = remaining <= 60;

  return (
    <div className={`fixed inset-0 z-[90] flex flex-col items-center justify-center backdrop-blur-sm ceremony-enter ${
      warned ? "bg-background/97" : "bg-background/95"
    }`}>
      <button
        onClick={onCancel}
        className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <p className="text-xs text-muted-foreground font-display tracking-[0.2em] uppercase mb-2">
        {isUrgentTime ? "⚡ HURRY UP" : "WORKING ON"}
      </p>
      <p className="text-lg sm:text-xl font-display font-bold text-foreground mb-6 max-w-[80%] text-center">
        {task.text}
      </p>

      {/* Timer circle */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Urgency glow */}
        {isUrgentTime && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "140%", height: "140%",
              background: `radial-gradient(circle, hsl(var(--heat-fire) / ${isLastMinute ? 0.15 : 0.08}), transparent 70%)`,
              animation: "countdown-pulse 1.5s ease-in-out infinite",
            }}
          />
        )}

        <svg className="w-44 h-44 sm:w-52 sm:h-52 -rotate-90" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="work-timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              {isLastMinute ? (
                <>
                  <stop offset="0%" stopColor="hsl(var(--heat-fire))" />
                  <stop offset="100%" stopColor="hsl(var(--neon-pink))" />
                </>
              ) : isUrgentTime ? (
                <>
                  <stop offset="0%" stopColor="hsl(var(--heat-hot))" />
                  <stop offset="100%" stopColor="hsl(var(--heat-fire))" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="hsl(var(--neon-cyan))" />
                  <stop offset="100%" stopColor="hsl(var(--neon-purple))" />
                </>
              )}
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity="0.3" />
          <circle
            cx="100" cy="100" r="90" fill="none"
            stroke="url(#work-timer-grad)"
            strokeWidth={isUrgentTime ? 8 : 5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - timerProgress)}
            style={{
              filter: `drop-shadow(0 0 ${isUrgentTime ? 15 : 8}px ${
                isUrgentTime ? "hsl(var(--heat-fire) / 0.5)" : "hsl(var(--neon-cyan) / 0.3)"
              })`,
              transition: "stroke-width 0.3s ease",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className={`font-display font-black text-foreground ${
              isLastMinute ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"
            }`}
            style={{
              color: isLastMinute ? "hsl(var(--heat-fire))" : isUrgentTime ? "hsl(var(--heat-hot))" : undefined,
              textShadow: isUrgentTime ? "0 0 15px hsl(var(--heat-fire) / 0.4)" : undefined,
              transition: "all 0.3s ease",
            }}
          >
            {formatTime(remaining)}
          </span>
          <span className="text-[10px] text-muted-foreground font-display tracking-widest uppercase mt-1">
            remaining
          </span>
        </div>
      </div>

      {/* 2-min warning badge */}
      {warned && remaining > 0 && (
        <div className="mb-4 px-4 py-2 rounded-full fade-slide-up" style={{
          background: "hsl(var(--heat-fire) / 0.15)",
          border: "1px solid hsl(var(--heat-fire) / 0.3)",
        }}>
          <span className="text-xs font-display font-bold tracking-wide" style={{ color: "hsl(var(--heat-fire))" }}>
            ⏰ LESS THAN 2 MINUTES LEFT!
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleDoneEarly}
          className="px-12 py-4 rounded-2xl font-display font-bold text-xl hover:scale-105 active:scale-95 text-primary-foreground"
          style={{
            background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--neon-cyan)))",
            boxShadow: "0 0 30px hsl(var(--success) / 0.3), 0 0 60px hsl(var(--neon-cyan) / 0.15)",
            transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          DONE ✓
        </button>
        <button
          onClick={handleAddTime}
          className="px-6 py-2.5 rounded-xl font-display font-bold text-sm hover:scale-105 active:scale-95 transition-transform border border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
        >
          + NEED MORE TIME
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Finish early for <span style={{ color: "hsl(var(--neon-cyan))" }}>bonus XP!</span>
      </p>
    </div>
  );
}
