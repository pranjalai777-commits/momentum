import { COLORS } from "@/constants/theme";
import { getHeatLabel, getHeatMultiplier } from "@/lib/momentum";
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

function getFlameColor(heat: number): string {
  if (heat >= 80) return COLORS.heatFire;
  if (heat >= 60) return COLORS.heatHot;
  if (heat >= 40) return COLORS.heatWarm;
  if (heat >= 20) return COLORS.heatCold;
  return COLORS.mutedForeground;
}

function HeatMeter({ heat, turboActive = false }: HeatMeterProps) {
  const multiplier = getHeatMultiplier(heat);
  const label = getHeatLabel(heat);
  const flameColor = getFlameColor(heat);
  const pulse = useSharedValue(1);
  const glowOpacity = useSharedValue(heat >= 40 ? 0.35 : 0);
  const width = useSharedValue(heat);

  useEffect(() => {
    width.value = withTiming(heat, { duration: 700 });
    glowOpacity.value = withTiming(heat >= 40 ? 0.35 : 0, { duration: 500 });
  }, [heat, width, glowOpacity]);

  useEffect(() => {
    if (heat >= 80) {
      pulse.value = withRepeat(
        withTiming(1.18, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      return;
    }
    if (heat >= 60) {
      pulse.value = withRepeat(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      return;
    }
    pulse.value = withTiming(1, { duration: 250 });
  }, [heat, pulse]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View className="items-center gap-[6px]">
      <View className="items-center justify-center w-11 h-11">
        <Animated.View
          className="absolute w-9 h-9 rounded-full"
          style={[
            glowStyle,
            {
              backgroundColor: flameColor,
              shadowColor: flameColor,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
            },
          ]}
        />
        <Animated.View className="items-center justify-center" style={flameStyle}>
          <Flame size={28} color={flameColor} fill={heat >= 40 ? flameColor : "transparent"} />
        </Animated.View>
      </View>

      <View className="flex-row items-center gap-[6px]">
        <Text className="font-display tracking-[1.6px] text-[11px]" style={{ color: flameColor }}>
          {label}
        </Text>
        {multiplier > 1 ? (
          <Text
            className="font-display text-[10px] tracking-[1.1px]"
            style={{ color: flameColor, opacity: 0.85 }}
          >
            ×{multiplier} XP
          </Text>
        ) : null}
      </View>

      <View className="w-[180px] h-[6px] rounded-full overflow-hidden bg-muted border border-border">
        <Animated.View
          className="h-full rounded-full"
          style={[
            fillStyle,
            {
              backgroundColor: flameColor,
              shadowColor: flameColor,
              shadowOpacity: turboActive ? 0.8 : 0.5,
              shadowRadius: turboActive ? 16 : 8,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      </View>
    </View>
  );
}

export default HeatMeter;
