import { Zap, Flame, Trophy } from "lucide-react";

interface Props {
  totalActions: number;
  streak: number;
  bestStreak: number;
}

export default function StatsBar({ totalActions, streak, bestStreak }: Props) {
  return (
    <div className="flex items-center gap-4 text-muted-foreground text-sm">
      <div className="flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span>{totalActions} task{totalActions !== 1 ? "s" : ""} crushed</span>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1.5">
          <Flame className={`w-3.5 h-3.5 ${streak >= 5 ? "text-heat-fire" : streak >= 3 ? "text-heat-hot" : "text-primary"}`} />
          <span className={`font-display font-bold ${streak >= 5 ? "text-heat-fire streak-glow" : streak >= 3 ? "text-heat-hot" : "text-primary"}`}>
            {streak}×
          </span>
        </div>
      )}
      {bestStreak >= 3 && (
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-primary/50" />
          <span className="text-muted-foreground/60">best {bestStreak}×</span>
        </div>
      )}
    </div>
  );
}
