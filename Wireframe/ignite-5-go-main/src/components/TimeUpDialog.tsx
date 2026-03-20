import { useState } from "react";
import { Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import { playAlarm, playSmallReward, playExtend } from "@/lib/sounds";
import { useEffect } from "react";

interface Props {
  taskText: string;
  onDone: () => void;
  onExtend: () => void;
  onGiveUp: () => void;
}

export default function TimeUpDialog({ taskText, onDone, onExtend, onGiveUp }: Props) {
  const [showReason, setShowReason] = useState(false);

  useEffect(() => {
    playAlarm();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
  }, []);

  const handleGiveUp = () => {
    playSmallReward();
    setShowReason(true);
    setTimeout(onGiveUp, 2500);
  };

  if (showReason) {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm ceremony-enter">
        <div className="flex flex-col items-center gap-4 px-6 max-w-sm text-center ceremony-content-enter">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(var(--neon-purple) / 0.2), hsl(var(--neon-cyan) / 0.15))",
            }}
          >
            <span className="text-3xl">💪</span>
          </div>
          <h2 className="font-display font-bold text-xl text-foreground">
            You Still Tried!
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every attempt builds your momentum. You showed up, and that's what matters.
            <br />
            <span style={{ color: "hsl(var(--neon-cyan))" }}>Small XP awarded for effort.</span>
          </p>
          <span className="font-display font-bold text-lg ceremony-xp-pop" style={{
            background: "linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-cyan)))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            +5 XP 🌱
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm ceremony-enter">
      {/* Pulsing urgency background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, hsl(var(--heat-fire) / 0.08) 0%, transparent 70%)",
          animation: "countdown-pulse 2s ease-in-out infinite",
        }}
      />

      <div className="flex flex-col items-center gap-6 px-6 max-w-sm w-full relative z-10 ceremony-content-enter">
        {/* Alarm icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shake-it"
          style={{
            background: "linear-gradient(135deg, hsl(var(--heat-fire) / 0.25), hsl(var(--neon-pink) / 0.2))",
            boxShadow: "0 0 40px hsl(var(--heat-fire) / 0.2)",
          }}
        >
          <Clock className="w-9 h-9" style={{ color: "hsl(var(--heat-fire))" }} />
        </div>

        <div className="text-center space-y-1">
          <h2 className="font-display font-black text-2xl text-foreground">
            TIME'S UP!
          </h2>
          <p className="text-sm text-muted-foreground truncate max-w-[250px]">
            {taskText}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Did you finish the task?
          </p>
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          {/* Done button */}
          <button
            onClick={() => { playSmallReward(); onDone(); }}
            className="w-full py-4 rounded-xl font-display font-bold text-base text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, hsl(var(--success)), hsl(var(--neon-cyan)))",
              boxShadow: "0 0 25px hsl(var(--success) / 0.3)",
            }}
          >
            <CheckCircle2 className="w-5 h-5" />
            Yes, I Finished It!
          </button>

          {/* Extend button */}
          <button
            onClick={() => { playExtend(); onExtend(); }}
            className="w-full py-4 rounded-xl font-display font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            style={{
              background: "hsl(var(--secondary))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--neon-cyan))",
            }}
          >
            <Plus className="w-5 h-5" />
            Need More Time
          </button>

          {/* Give up */}
          <button
            onClick={handleGiveUp}
            className="w-full py-3 rounded-xl font-display font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            style={{
              background: "hsl(var(--muted))",
            }}
          >
            <XCircle className="w-4 h-4" />
            I Couldn't Finish
          </button>
        </div>
      </div>
    </div>
  );
}
