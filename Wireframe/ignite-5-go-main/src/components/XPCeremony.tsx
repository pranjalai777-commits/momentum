import { useState, useEffect, useRef } from "react";
import { getLevelProgress, getLevel, getLevelTitle } from "@/lib/momentum";
import { playLevelUp } from "@/lib/sounds";
import type { CompletionType } from "./TaskTimer";

interface Props {
  xp: number;
  prevXp: number;
  xpGained: number;
  leveledUp: boolean;
  completionType: CompletionType;
  onFinish: () => void;
}

const COMPLETION_MESSAGES: Record<CompletionType, { title: string; subtitle: string; emoji: string }> = {
  early: { title: "CRUSHED IT!", subtitle: "Finished before the timer — you're on fire!", emoji: "🔥" },
  "on-time": { title: "NICE SAVE!", subtitle: "Extended and delivered — respect!", emoji: "💪" },
  late: { title: "TASK DONE!", subtitle: "You got it done — that's what counts!", emoji: "✅" },
  "gave-up": { title: "GOOD TRY!", subtitle: "You showed up — next time you'll crush it!", emoji: "🌱" },
};

export default function XPCeremony({ xp, prevXp, xpGained, leveledUp, completionType, onFinish }: Props) {
  const [phase, setPhase] = useState<"enter" | "fill" | "levelup" | "exit">("enter");
  const [displayXp, setDisplayXp] = useState(prevXp);
  const rafRef = useRef<number>();
  const startRef = useRef(0);

  const level = getLevel(xp);
  const prevLevel = getLevel(prevXp);
  const title = getLevelTitle(level);
  const { next, progress } = getLevelProgress(displayXp);
  const prevProgress = getLevelProgress(prevXp);
  const msg = COMPLETION_MESSAGES[completionType];

  const isEpic = completionType === "early";
  const particleCount = isEpic ? 16 : completionType === "gave-up" ? 4 : 8;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("fill"), 800));
    timers.push(setTimeout(() => {
      if (leveledUp) {
        setPhase("levelup");
        playLevelUp();
        timers.push(setTimeout(() => setPhase("exit"), 2000));
      } else {
        setPhase("exit");
      }
    }, 2400));
    timers.push(setTimeout(onFinish, leveledUp ? 4800 : 3200));
    return () => timers.forEach(clearTimeout);
  }, [leveledUp, onFinish]);

  useEffect(() => {
    if (phase !== "fill") return;
    startRef.current = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayXp(Math.round(prevXp + (xp - prevXp) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, prevXp, xp]);

  const currentProgress = phase === "enter" ? prevProgress.progress : progress;
  const displayLevel = phase === "levelup" || phase === "exit" ? level : prevLevel;

  const bgGradient = isEpic
    ? "radial-gradient(ellipse at center, hsl(var(--neon-cyan) / 0.15) 0%, hsl(var(--neon-purple) / 0.08) 40%, hsl(var(--background) / 0.97) 70%)"
    : leveledUp && (phase === "levelup" || phase === "exit")
    ? "radial-gradient(ellipse at center, hsl(var(--neon-purple) / 0.25) 0%, hsl(var(--background) / 0.97) 70%)"
    : "hsl(var(--background) / 0.95)";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center ${
        phase === "exit" ? "ceremony-exit" : "ceremony-enter"
      }`}
      style={{ background: bgGradient, transition: "background 1s ease-out" }}
    >
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(particleCount)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full ceremony-particle"
            style={{
              width: 4 + Math.random() * (isEpic ? 10 : 6),
              height: 4 + Math.random() * (isEpic ? 10 : 6),
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              background: isEpic
                ? `hsl(var(${["--neon-cyan", "--neon-purple", "--neon-pink", "--success"][i % 4]}) / 0.7)`
                : i % 2 === 0 ? "hsl(var(--neon-cyan) / 0.6)" : "hsl(var(--neon-purple) / 0.6)",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <div className={`flex flex-col items-center gap-6 w-full max-w-sm px-6 ${
        phase === "enter" ? "ceremony-content-enter" : ""
      }`}>
        {/* Completion message */}
        <div className="text-center space-y-1 fade-slide-up">
          <span className="text-3xl">{msg.emoji}</span>
          <h2 className="font-display font-black text-2xl" style={{
            background: isEpic
              ? "linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--success)))"
              : "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--neon-cyan) / 0.7))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {msg.title}
          </h2>
          <p className="text-sm text-muted-foreground">{msg.subtitle}</p>
        </div>

        {/* Level badge */}
        <div className={`flex flex-col items-center gap-2 ${
          phase === "levelup" ? "ceremony-level-burst" : ""
        }`}>
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center relative ${
              phase === "levelup" ? "ceremony-level-glow" : ""
            }`}
            style={{
              background: leveledUp && phase === "levelup"
                ? "linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)), hsl(var(--neon-pink)))"
                : "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--muted)))",
              boxShadow: phase === "levelup"
                ? "0 0 40px hsl(var(--neon-purple) / 0.5), 0 0 80px hsl(var(--neon-cyan) / 0.3)"
                : isEpic ? "0 0 30px hsl(var(--neon-cyan) / 0.25)" : "0 0 20px hsl(var(--neon-purple) / 0.15)",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <span className="font-display font-black text-3xl" style={{
              background: "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--neon-cyan)))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              filter: phase === "levelup" ? "drop-shadow(0 0 8px hsl(var(--neon-cyan) / 0.6))" : "none",
            }}>
              {displayLevel}
            </span>
            {phase === "levelup" && (
              <div className="absolute inset-0 rounded-full ceremony-ring-expand"
                style={{ border: "2px solid hsl(var(--neon-cyan) / 0.6)" }} />
            )}
          </div>
          <span className="font-display font-bold text-xs tracking-wider uppercase text-muted-foreground">{title}</span>
          {leveledUp && phase === "levelup" && (
            <span className="font-display font-black text-2xl text-glow ceremony-levelup-text">LEVEL UP!</span>
          )}
        </div>

        {/* XP Bar */}
        <div className="w-full space-y-3">
          <div className="h-4 rounded-full bg-muted overflow-hidden relative" style={{
            boxShadow: phase === "fill" || phase === "levelup"
              ? `0 0 15px hsl(var(${isEpic ? "--neon-cyan" : "--neon-cyan"}) / 0.2), inset 0 0 10px hsl(var(--background) / 0.3)`
              : "none",
          }}>
            <div className="h-full rounded-full relative overflow-hidden" style={{
              width: `${currentProgress}%`,
              background: isEpic
                ? "linear-gradient(90deg, hsl(var(--success)), hsl(var(--neon-cyan)), hsl(var(--neon-purple)))"
                : "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)))",
              boxShadow: isEpic
                ? "0 0 16px hsl(var(--neon-cyan) / 0.5), 0 0 30px hsl(var(--success) / 0.3)"
                : "0 0 12px hsl(var(--neon-cyan) / 0.4), 0 0 24px hsl(var(--neon-purple) / 0.2)",
              transition: "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
              willChange: "width",
            }}>
              {(phase === "fill" || phase === "levelup") && (
                <div className="absolute inset-0 ceremony-bar-shimmer"
                  style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.3), transparent)" }} />
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-display font-bold text-foreground">
              {displayXp} <span className="text-muted-foreground font-sans text-sm">/ {next} XP</span>
            </span>
            <span
              className={`font-display font-black text-xl ${phase === "fill" ? "ceremony-xp-pop" : "opacity-0"}`}
              style={{
                background: isEpic
                  ? "linear-gradient(135deg, hsl(var(--success)), hsl(var(--neon-cyan)))"
                  : completionType === "gave-up"
                  ? "linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--muted-foreground)))"
                  : "linear-gradient(135deg, hsl(var(--success)), hsl(var(--neon-cyan)))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 6px hsl(var(--neon-cyan) / ${isEpic ? "0.7" : "0.5"}))`,
              }}
            >
              +{xpGained} XP
            </span>
          </div>

          {/* Bonus label for early completion */}
          {isEpic && phase === "fill" && (
            <div className="text-center fade-slide-up">
              <span className="text-xs font-display font-bold tracking-wider px-3 py-1 rounded-full" style={{
                background: "hsl(var(--success) / 0.15)",
                color: "hsl(var(--success))",
                border: "1px solid hsl(var(--success) / 0.3)",
              }}>
                ⚡ EARLY FINISH BONUS
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
