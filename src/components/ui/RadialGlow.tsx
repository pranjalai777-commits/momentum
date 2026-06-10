import { useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { MotiView } from "moti";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

let glowIdCounter = 0;

type RadialGlowProps = {
  color: string;
  /** Diameter in px */
  size: number;
  /** Peak opacity at the center (web radial-gradient first stop alpha) */
  opacity?: number;
  /** Web `countdown-pulse`: scale 1 → 1.08, ease-in-out, infinite */
  pulse?: boolean;
  pulseDuration?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Soft radial glow — Android-safe replacement for the web's CSS
 * `radial-gradient(circle, color/alpha, transparent 70%)` box glows.
 */
function RadialGlow({
  color,
  size,
  opacity = 0.15,
  pulse = false,
  pulseDuration = 1500,
  style,
}: RadialGlowProps) {
  const gradientId = useMemo(() => `rg-${++glowIdCounter}`, []);

  return (
    <MotiView
      from={pulse ? { scale: 1 } : undefined}
      animate={pulse ? { scale: 1.08 } : undefined}
      transition={
        pulse
          ? { type: "timing", duration: pulseDuration, loop: true, repeatReverse: true }
          : undefined
      }
      pointerEvents="none"
      style={[{ width: size, height: size }, style]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="70%" stopColor={color} stopOpacity={0} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradientId})`} />
      </Svg>
    </MotiView>
  );
}

export default RadialGlow;
