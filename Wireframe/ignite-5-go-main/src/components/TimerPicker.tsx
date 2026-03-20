import { useState } from "react";
import { Clock, Zap } from "lucide-react";
import { playTick } from "@/lib/sounds";

interface Props {
  taskText: string;
  onSetTimer: (minutes: number) => void;
  onCancel: () => void;
  isExtension?: boolean;
}

const QUICK_OPTIONS = [5, 10, 15, 25, 30, 45, 60];

export default function TimerPicker({ taskText, onSetTimer, onCancel, isExtension = false }: Props) {
  const [customMinutes, setCustomMinutes] = useState("");

  const handleQuickPick = (min: number) => {
    playTick(1.2);
    onSetTimer(min);
  };

  const handleCustomSubmit = () => {
    const val = parseInt(customMinutes);
    if (val > 0 && val <= 480) {
      playTick(1.2);
      onSetTimer(val);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm ceremony-enter">
      <div className="w-full max-w-sm px-6 flex flex-col items-center gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--neon-cyan) / 0.2), hsl(var(--neon-purple) / 0.2))",
              boxShadow: "0 0 30px hsl(var(--neon-cyan) / 0.15)",
            }}
          >
            <Clock className="w-7 h-7" style={{ color: "hsl(var(--neon-cyan))" }} />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground text-center">
            {isExtension ? "How much extra time?" : "Set Your Timer"}
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-[85%] truncate">
            {taskText}
          </p>
          {!isExtension && (
            <p className="text-xs text-muted-foreground/70 text-center">
              Beat the clock for <span style={{ color: "hsl(var(--neon-cyan))" }}>bonus XP</span> ⚡
            </p>
          )}
        </div>

        {/* Quick picks */}
        <div className="grid grid-cols-4 gap-2 w-full">
          {QUICK_OPTIONS.map(min => (
            <button
              key={min}
              onClick={() => handleQuickPick(min)}
              className="py-3 rounded-xl font-display font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                background: "hsl(var(--secondary))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
            >
              {isExtension ? `+ ${min}m` : (min < 60 ? `${min}m` : `${min / 60}h`)}
            </button>
          ))}
          {/* Custom input in grid */}
          <div className="relative">
            <input
              type="number"
              value={customMinutes}
              onChange={e => setCustomMinutes(e.target.value)}
              placeholder="?"
              min={1}
              max={480}
              className="w-full h-full py-3 rounded-xl font-display font-bold text-sm text-center bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Custom submit */}
        {customMinutes && parseInt(customMinutes) > 0 && (
          <button
            onClick={handleCustomSubmit}
            className="w-full py-3.5 rounded-xl font-display font-bold text-base text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)))",
              boxShadow: "0 0 20px hsl(var(--neon-cyan) / 0.25)",
            }}
          >
            <Zap className="w-4 h-4" />
            {isExtension ? `Add ${customMinutes} min to timer` : `Start ${customMinutes} min timer`}
          </button>
        )}

        <button
          onClick={onCancel}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
