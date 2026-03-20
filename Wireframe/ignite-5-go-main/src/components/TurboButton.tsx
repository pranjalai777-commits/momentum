import { Zap } from "lucide-react";
import { useState, useEffect } from "react";
import {
  isTurboActive,
  canActivateTurbo,
  getTurboRemainingMs,
  type MomentumData,
} from "@/lib/momentum";

interface Props {
  data: MomentumData;
  onActivate: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TurboButton({ data, onActivate }: Props) {
  const turboActive = isTurboActive(data);
  const canUse = canActivateTurbo(data);
  const [remaining, setRemaining] = useState(getTurboRemainingMs(data));

  useEffect(() => {
    if (!turboActive) return;
    const interval = setInterval(() => {
      const r = getTurboRemainingMs(data);
      setRemaining(r);
    }, 1000);
    return () => clearInterval(interval);
  }, [turboActive, data]);

  if (turboActive) {
    return (
      <button
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display font-bold text-xs tracking-wider uppercase turbo-button-active"
        disabled
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>TURBO {formatTime(remaining)}</span>
      </button>
    );
  }

  if (!canUse) {
    return (
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display font-bold text-xs tracking-wider uppercase bg-muted text-muted-foreground/40 cursor-not-allowed"
        disabled
      >
        <Zap className="w-3.5 h-3.5" />
        <span>TURBO USED</span>
      </button>
    );
  }

  return (
    <button
      onClick={onActivate}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full font-display font-bold text-xs tracking-wider uppercase turbo-button-ready group"
    >
      <Zap className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
      <span>TURBO</span>
    </button>
  );
}
