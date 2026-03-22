import { useState, useEffect } from "react";
import { getLevelProgress, getLevel, getLevelTitle } from "@/lib/momentum";

interface Props {
  xp: number;
  xpGained: number | null;
}

export default function XPBar({ xp, xpGained }: Props) {
  const level = getLevel(xp);
  const title = getLevelTitle(level);
  const { next, progress } = getLevelProgress(xp);
  const [showPop, setShowPop] = useState(false);

  useEffect(() => {
    if (xpGained && xpGained > 0) {
      setShowPop(true);
      const t = setTimeout(() => setShowPop(false), 1500);
      return () => clearTimeout(t);
    }
  }, [xpGained, xp]);

  return (
    <div className="w-full max-w-xs space-y-1.5 relative">
      <div className="flex items-center justify-between text-sm">
        <span className="font-display font-bold text-primary">
          LVL {level} <span className="text-muted-foreground font-sans font-normal text-xs">· {title}</span>
        </span>
        <span className="text-muted-foreground text-xs relative">
          {xp} / {next} XP
          {showPop && xpGained && (
            <span
              className="absolute -top-10 right-0 font-display font-black text-2xl xp-pop"
              style={{
                background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--neon-cyan)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 6px hsl(var(--neon-cyan) / 0.5))",
              }}
            >
              +{xpGained}
            </span>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)))`,
            boxShadow: progress > 30 ? "0 0 10px hsl(var(--neon-cyan) / 0.4), 0 0 20px hsl(var(--neon-purple) / 0.2)" : "none",
            transition: "width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
            willChange: "width",
          }}
        />
      </div>
    </div>
  );
}
