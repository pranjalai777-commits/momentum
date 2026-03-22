import { Flame } from "lucide-react";
import { getHeatLabel, getHeatColor, getHeatMultiplier } from "@/lib/momentum";

interface Props {
  heat: number;
  turboActive?: boolean;
}

export default function HeatMeter({ heat, turboActive }: Props) {
  const label = getHeatLabel(heat);
  const color = getHeatColor(heat);
  const isOnFire = heat >= 60;
  const isMaxFire = heat >= 80;
  const multiplier = getHeatMultiplier(heat);

  const flameColor = isMaxFire
    ? "hsl(var(--heat-fire))"
    : isOnFire
    ? "hsl(var(--heat-hot))"
    : heat >= 40
    ? "hsl(var(--heat-warm))"
    : heat >= 20
    ? "hsl(var(--heat-cold))"
    : "hsl(var(--muted-foreground) / 0.4)";

  const flameSize = isMaxFire ? 32 : isOnFire ? 28 : heat >= 40 ? 26 : 24;

  const animClass = isMaxFire
    ? "animate-[ember-breathe_2.5s_ease-in-out_infinite]"
    : isOnFire
    ? "animate-[ember-pulse_3s_ease-in-out_infinite]"
    : "";

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Fire icon with slow aura glow */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={`relative flex items-center justify-center ${animClass}`}
          style={{ transition: "all 0.8s ease-out" }}
        >
          {/* Outer aura ring */}
          {heat >= 40 && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                width: flameSize + 20,
                height: flameSize + 20,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${flameColor.replace(")", " / 0.15)")} 0%, transparent 70%)`,
                animation: isMaxFire
                  ? "ember-breathe 3s ease-in-out infinite"
                  : "ember-pulse 4s ease-in-out infinite",
                transition: "all 1s ease-out",
              }}
            />
          )}
          <Flame
            size={flameSize}
            className={turboActive ? "turbo-heat-glow" : ""}
            style={{
              color: flameColor,
              filter: turboActive
                ? undefined
                : isMaxFire
                ? "drop-shadow(0 0 10px hsl(var(--heat-fire) / 0.5)) drop-shadow(0 0 20px hsl(var(--heat-fire) / 0.25))"
                : isOnFire
                ? "drop-shadow(0 0 8px hsl(var(--heat-hot) / 0.4)) drop-shadow(0 0 16px hsl(var(--heat-hot) / 0.15))"
                : heat >= 40
                ? "drop-shadow(0 0 5px hsl(var(--heat-warm) / 0.3))"
                : "none",
              transition: "all 0.8s ease-out",
            }}
            fill={heat >= 40 ? flameColor : "none"}
            strokeWidth={heat >= 40 ? 1.2 : 2}
          />
        </div>
        <span className={`text-xs font-display font-bold tracking-[0.15em] uppercase ${color}`}>
          {label}
        </span>
      </div>

      {/* Multiplier */}
      {multiplier > 1 && (
        <span className="text-[10px] font-display font-bold tracking-wider text-muted-foreground">
          ×{multiplier} XP
        </span>
      )}

      {/* Heat bar */}
      <div className="w-36 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${heat}%`,
            background: isMaxFire
              ? "linear-gradient(90deg, hsl(var(--heat-hot)), hsl(var(--heat-fire)))"
              : isOnFire
              ? "linear-gradient(90deg, hsl(var(--heat-warm)), hsl(var(--heat-hot)))"
              : heat >= 40
              ? "hsl(var(--heat-warm))"
              : "hsl(var(--heat-cold))",
            boxShadow: isMaxFire
              ? "0 0 6px hsl(var(--heat-fire) / 0.35)"
              : "none",
            transition: "width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </div>
    </div>
  );
}
