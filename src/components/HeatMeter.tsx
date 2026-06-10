import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";
import { springy } from "@/lib/easing";
import { getHeatLabel, getHeatMultiplier } from "@/lib/momentum";
import RadialGlow from "@/components/ui/RadialGlow";
import { LinearGradient } from "expo-linear-gradient";
import { Flame } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type HeatMeterProps = {
  heat: number;
  turboActive?: boolean;
};

function HeatMeter({ heat, turboActive = false }: HeatMeterProps) {
  const multiplier = getHeatMultiplier(heat);
  const label = getHeatLabel(heat);

  const isMaxFire = heat >= 80;
  const isOnFire = heat >= 60;
  const isWarm = heat >= 40;

  // Web flame color tiers (< 20 uses muted-foreground / 0.4)
  const flameColor = isMaxFire
    ? COLORS.heatFire
    : isOnFire
    ? COLORS.heatHot
    : isWarm
    ? COLORS.heatWarm
    : heat >= 20
    ? COLORS.heatCold
    : COLORS.mutedForeground + "66";
  // Web label color = getHeatColor (heat-cold even below 20)
  const labelColor = isMaxFire ? COLORS.heatFire : isOnFire ? COLORS.heatHot : isWarm ? COLORS.heatWarm : COLORS.heatCold;
  const flameSize = isMaxFire ? 32 : isOnFire ? 28 : isWarm ? 26 : 24;

  const pulse = useSharedValue(1);
  const width = useSharedValue(heat);

  useEffect(() => {
    // Web: width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)
    width.value = withTiming(heat, { duration: 700, easing: springy });
  }, [heat, width]);

  useEffect(() => {
    // Web ember-breathe (scale 1 → 1.15, 2.5s) at max heat, ember-pulse (1 → 1.06, 3s) when hot
    if (isMaxFire) {
      pulse.value = withRepeat(withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true);
      return;
    }
    if (isOnFire) {
      pulse.value = withRepeat(withTiming(1.06, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);
      return;
    }
    pulse.value = withTiming(1, { duration: 250 });
  }, [isMaxFire, isOnFire, pulse]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  const barGradient = isMaxFire ? GRADIENTS.hotFire : isOnFire ? [COLORS.heatWarm, COLORS.heatHot] as const : null;
  const barSolid = isWarm ? COLORS.heatWarm : COLORS.heatCold;

  return (
    <View className="items-center gap-2">
      <View className="items-center gap-[6px]">
        <View className="items-center justify-center" style={{ width: 52, height: 52 }}>
          {/* Web outer aura ring (heat ≥ 40): radial color/0.15, breathing */}
          {isWarm ? (
            <RadialGlow
              color={flameColor}
              size={flameSize + 20}
              opacity={0.15}
              pulse
              pulseDuration={isMaxFire ? 3000 : 4000}
              style={{ position: "absolute" }}
            />
          ) : null}
          <Animated.View
            style={[
              flameStyle,
              {
                shadowColor: turboActive ? COLORS.heatFire : flameColor,
                shadowOpacity: turboActive ? 0.6 : isMaxFire ? 0.5 : isOnFire ? 0.4 : isWarm ? 0.3 : 0,
                shadowRadius: turboActive ? 12 : isMaxFire ? 10 : isOnFire ? 8 : 5,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            <Flame
              size={flameSize}
              color={flameColor}
              fill={isWarm ? flameColor : "transparent"}
              strokeWidth={isWarm ? 1.2 : 2}
            />
          </Animated.View>
        </View>
        <Text
          className="uppercase"
          style={{ fontFamily: FONTS.display, fontSize: 12, letterSpacing: 1.8, color: labelColor }}
        >
          {label}
        </Text>
      </View>

      {multiplier > 1 ? (
        <Text style={{ fontFamily: FONTS.display, fontSize: 10, letterSpacing: 0.5, color: COLORS.mutedForeground }}>
          ×{multiplier} XP
        </Text>
      ) : null}

      {/* Web: w-36 h-1.5 rounded-full bg-muted, tiered gradient fills */}
      <View className="rounded-full overflow-hidden bg-muted" style={{ width: 144, height: 6 }}>
        <Animated.View
          className="h-full rounded-full overflow-hidden"
          style={[
            fillStyle,
            isMaxFire && {
              shadowColor: COLORS.heatFire,
              shadowOpacity: 0.35,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          {barGradient ? (
            <LinearGradient
              colors={barGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: barSolid }} />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

export default HeatMeter;
