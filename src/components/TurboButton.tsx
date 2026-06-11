import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";
import ScalePressable from "@/components/ui/ScalePressable";
import { hapticTurboActivate } from "@/lib/haptics";
import { canActivateTurbo, getTurboRemainingMs, isTurboActive } from "@/lib/momentum";
import { playEpicSuccess } from "@/lib/sounds";
import type { MomentumData } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { Zap } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type TurboButtonProps = {
  data: MomentumData;
  onActivate: () => void;
};

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Web .turbo-button-ready / .turbo-button-active pill: px-3 py-1.5, text-xs,
// tracking-wider, uppercase, rounded-full
const PILL = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 6,
};
const LABEL = {
  fontFamily: FONTS.display,
  fontSize: 12,
  letterSpacing: 0.6,
  textTransform: "uppercase" as const,
};

function TurboButton({ data, onActivate }: TurboButtonProps) {
  const active = isTurboActive(data);
  const canUse = canActivateTurbo(data);
  const [remaining, setRemaining] = useState(() => getTurboRemainingMs(data));
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      shimmer.value = 0;
      return;
    }
    // Web turbo-button-shimmer: background-position sweep, 2s ease-in-out infinite —
    // approximated by cross-fading two halves of the 3-stop gradient
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    const timer = setInterval(() => setRemaining(getTurboRemainingMs(data)), 1000);
    return () => clearInterval(timer);
  }, [active, data, shimmer]);

  const shimmerLayerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.4 + shimmer.value * 0.15,
  }));

  if (active) {
    return (
      // Web: box-shadow 0 0 15px hsl(340 100% 60% / 0.4), 0 0 30px hsl(280 100% 65% / 0.2)
      <Animated.View
        style={[
          glowStyle,
          {
            borderRadius: 9999,
            shadowColor: "#ff3377",
            shadowRadius: 15,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <View style={{ overflow: "hidden", borderRadius: 9999 }}>
          {/* Layer 1 — gold → pink (first two stops) */}
          <LinearGradient
            colors={[GRADIENTS.turboActive[0], GRADIENTS.turboActive[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {/* Layer 2 — pink → purple (last two stops), cross-fades for shimmer */}
          <Animated.View
            style={[shimmerLayerStyle, { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }]}
          >
            <LinearGradient
              colors={[GRADIENTS.turboActive[1], GRADIENTS.turboActive[2]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
          <View style={PILL}>
            <Zap size={14} color="#ffffff" fill="#ffffff" />
            <Text style={[LABEL, { color: "#ffffff" }]}>TURBO {formatTime(remaining)}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  if (!canUse) {
    return (
      <View style={[PILL, { borderRadius: 9999, backgroundColor: COLORS.muted }]}>
        <Zap size={14} color={COLORS.mutedForeground + "66"} />
        <Text style={[LABEL, { color: COLORS.mutedForeground + "66" }]}>TURBO USED</Text>
      </View>
    );
  }

  return (
    <ScalePressable
      onPress={() => {
        playEpicSuccess();
        hapticTurboActivate();
        onActivate();
      }}
      style={{
        borderRadius: 9999,
        shadowColor: GRADIENTS.turboReady[0],
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      }}
      pressedStyle={{ transform: [{ scale: 0.95 }] }}
    >
      <LinearGradient
        colors={GRADIENTS.turboReady}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[PILL, { borderRadius: 9999 }]}
      >
        <Zap size={14} color="#0d0d0d" />
        <Text style={[LABEL, { color: "#0d0d0d" }]}>TURBO</Text>
      </LinearGradient>
    </ScalePressable>
  );
}

export default TurboButton;
