import { Calendar, Sparkles, Target } from "lucide-react";

interface Props {
  dailyStreak: number;
  todayActions: number;
  isFirstToday: boolean;
}

export default function DailyBanner({ dailyStreak, todayActions, isFirstToday }: Props) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {/* Daily streak */}
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <span className={`font-display font-bold ${dailyStreak >= 3 ? "text-primary streak-glow" : ""}`}>
          {dailyStreak}d streak
        </span>
      </div>

      <span className="text-border">·</span>

      {/* Today's actions */}
      <div className="flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5 text-muted-foreground" />
        <span>{todayActions} today</span>
      </div>

      {/* First action bonus hint */}
      {isFirstToday && (
        <>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1 subtle-float">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(var(--daily-bonus))" }} />
            <span className="font-display font-bold" style={{ color: "hsl(var(--daily-bonus))" }}>
              Bonus ready!
            </span>
          </div>
        </>
      )}
    </div>
  );
}
