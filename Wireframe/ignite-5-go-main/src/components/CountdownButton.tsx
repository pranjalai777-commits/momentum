import { useState, useCallback, useRef, useEffect } from "react";
import { playTick, playUrgentTick, playSuccess, playLaunch } from "@/lib/sounds";

type Phase = "idle" | "counting" | "confirm" | "success" | "taskComplete";

interface Props {
  onComplete: () => void;
  onTaskFinished: () => void;
  onCancel: () => void;
}

export default function CountdownButton({ onComplete, onTaskFinished, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(5);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => () => cleanup(), []);

  const animateProgress = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 5000;
    setProgress(Math.min(elapsed, 1));
    if (elapsed < 1) {
      rafRef.current = requestAnimationFrame(animateProgress);
    }
  }, []);

  const startCountdown = useCallback(() => {
    playLaunch();
    setPhase("counting");
    setCount(5);
    setProgress(0);
    startTimeRef.current = Date.now();
    let c = 5;
    cleanup();
    rafRef.current = requestAnimationFrame(animateProgress);
    intervalRef.current = setInterval(() => {
      c--;
      if (c <= 0) {
        cleanup();
        setCount(0);
        setProgress(1);
        setPhase("confirm");
        playUrgentTick();
      } else {
        setCount(c);
        if (c <= 2) playUrgentTick();
        else playTick(1 + (5 - c) * 0.15);
      }
    }, 1000);
  }, [animateProgress]);

  const confirmAction = () => {
    cleanup();
    playSuccess();
    onComplete();
    if (navigator.vibrate) navigator.vibrate([30, 50, 60]);
    // Show success briefly, then ask about task completion
    setPhase("success");
    setTimeout(() => setPhase("taskComplete"), 1400);
  };

  const handleTaskFinished = () => {
    onTaskFinished();
    if (navigator.vibrate) navigator.vibrate([20, 40, 30, 40, 50]);
    playSuccess();
    setPhase("idle");
  };

  const handleTaskSkip = () => {
    setPhase("idle");
  };

  const cancel = () => {
    cleanup();
    setPhase("idle");
    setCount(5);
    setProgress(0);
    onCancel();
  };

  const sizeClass = "w-52 h-52 sm:w-64 sm:h-64";
  const circumference = 2 * Math.PI * 90;

  if (phase === "idle") {
    return (
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute ${sizeClass} rounded-full`}
          style={{
            padding: "3px",
            background: "conic-gradient(from 0deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)), hsl(var(--neon-pink)), hsl(var(--neon-cyan)))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
            opacity: 0.7,
            animation: "ring-spin 6s linear infinite",
            willChange: "transform",
          }}
        />
        <button
          onClick={startCountdown}
          className={`${sizeClass} rounded-full flex items-center justify-center 
            ring-breathe hover:scale-105 active:scale-95 
            cursor-pointer select-none relative z-10`}
          style={{
            background: "linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(270 80% 55%))",
            transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            willChange: "transform",
          }}
        >
          <span className="text-primary-foreground font-display text-2xl sm:text-3xl font-bold tracking-wider drop-shadow-lg">
            LAUNCH
          </span>
        </button>
      </div>
    );
  }

  if (phase === "counting") {
    const urgency = progress;
    const isUrgent = count <= 2 && count > 0;

    return (
      <div className="relative flex items-center justify-center">
        <button
          onClick={confirmAction}
          className={`${sizeClass} rounded-full cursor-pointer absolute z-10`}
          aria-label="I'm moving"
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "130%",
            height: "130%",
            background: `radial-gradient(circle, ${
              isUrgent ? "hsl(var(--heat-fire) / 0.18)" : "hsl(var(--neon-cyan) / 0.1)"
            }, transparent 70%)`,
            opacity: 0.5 + urgency * 0.5,
            animation: "countdown-pulse 1.5s ease-in-out infinite",
            willChange: "transform, opacity",
          }}
        />
        <svg className={`${sizeClass} -rotate-90`} viewBox="0 0 200 200">
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
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
            stroke="url(#ring-grad)"
            strokeWidth={5 + urgency * 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{
              filter: `drop-shadow(0 0 ${6 + urgency * 12}px ${
                isUrgent ? "hsl(var(--heat-fire) / 0.7)" : "hsl(var(--neon-cyan) / 0.5)"
              })`,
              willChange: "stroke-dashoffset, stroke-width, filter",
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
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: `drop-shadow(0 0 ${isUrgent ? 18 : 10}px ${
                isUrgent ? "hsl(var(--heat-fire) / 0.6)" : "hsl(var(--neon-cyan) / 0.4)"
              })`,
              willChange: "transform, opacity",
            }}
          >
            {count}
          </span>
        </div>
        <div className="absolute -bottom-14 flex items-center gap-4">
          <button onClick={confirmAction} className="text-sm font-display font-bold text-success hover:text-success/80 transition-colors">
            I'm moving ✓
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button onClick={cancel} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (phase === "confirm") {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-wide shake-it">
          Are you moving?
        </p>
        <div className="flex gap-4">
          <button
            onClick={confirmAction}
            className="px-8 py-3 rounded-full font-display font-bold text-lg hover:scale-105 active:scale-95 text-success-foreground"
            style={{
              background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--neon-cyan)))",
              boxShadow: "0 0 20px hsl(var(--success) / 0.3), 0 0 40px hsl(var(--neon-cyan) / 0.15)",
              transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            YES
          </button>
          <button onClick={cancel} className="px-8 py-3 rounded-full bg-secondary text-secondary-foreground font-display font-bold text-lg hover:scale-105 active:scale-95 transition-all">
            NO
          </button>
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="relative flex items-center justify-center">
        {[0, 0.12, 0.24].map((delay, i) => (
          <div
            key={i}
            className="absolute rounded-full success-particles pointer-events-none"
            style={{
              width: "208px", height: "208px",
              border: `${2 - i * 0.5}px solid`,
              borderColor: i === 0 ? "hsl(var(--neon-cyan) / 0.5)" : i === 1 ? "hsl(var(--neon-purple) / 0.3)" : "hsl(var(--success) / 0.2)",
              animationDelay: `${delay}s`,
              willChange: "transform, opacity",
            }}
          />
        ))}
        <div
          className={`${sizeClass} rounded-full flex flex-col items-center justify-center success-burst relative z-10`}
          style={{
            background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--neon-cyan) / 0.8), hsl(var(--success)))",
            boxShadow: `0 0 30px 8px hsl(var(--success) / 0.5), 0 0 60px 15px hsl(var(--neon-cyan) / 0.25), 0 0 100px 30px hsl(var(--success) / 0.1)`,
            willChange: "transform",
          }}
        >
          <svg viewBox="0 0 52 52" className="w-14 h-14 sm:w-16 sm:h-16 mb-1">
            <path className="success-checkmark" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7.8 7.8L38 17" />
          </svg>
          <span className="font-display text-xl sm:text-2xl font-bold" style={{
            background: "linear-gradient(135deg, white, hsl(var(--neon-cyan) / 0.9))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            MOVING!
          </span>
        </div>
      </div>
    );
  }

  // taskComplete phase — ask if they finished
  return (
    <div className="flex flex-col items-center gap-5 fade-slide-up">
      <div className="text-center space-y-1">
        <p className="text-xl sm:text-2xl font-display font-bold text-foreground tracking-wide">
          Did you finish the task?
        </p>
        <p className="text-xs text-muted-foreground">
          Complete it for bonus XP
        </p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleTaskFinished}
          className="px-8 py-3 rounded-full font-display font-bold text-lg hover:scale-105 active:scale-95 text-primary-foreground"
          style={{
            background: "linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-cyan)))",
            boxShadow: "0 0 20px hsl(var(--neon-purple) / 0.3), 0 0 40px hsl(var(--neon-cyan) / 0.1)",
            transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          DONE ✓
        </button>
        <button
          onClick={handleTaskSkip}
          className="px-6 py-3 rounded-full bg-secondary text-secondary-foreground font-display font-bold text-lg hover:scale-105 active:scale-95 transition-all"
        >
          Not yet
        </button>
      </div>
    </div>
  );
}
