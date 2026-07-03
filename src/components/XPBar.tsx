import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";
import { springy } from "@/lib/easing";
import { getLevel, getLevelProgress, getLevelTitle } from "@/lib/momentum";
import GradientText from "@/components/ui/GradientText";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type XPBarProps = {
  xp: number;
  xpGained: number | null;
};

function XPBar({ xp, xpGained }: XPBarProps) {
  const level = getLevel(xp);
  const title = getLevelTitle(level);
  const { next, progress } = useMemo(() => getLevelProgress(xp), [xp]);
  const [showPop, setShowPop] = useState(false);
  const progressWidth = useSharedValue(progress);
  const popProgress = useSharedValue(0);
  const prevLevelRef = useRef(level);

  useEffect(() => {
    const levelsGained = level - prevLevelRef.current;
    prevLevelRef.current = level;

    // xpGained is null on app open / store hydration — snap instantly, no animation
    if (!xpGained) {
      progressWidth.value = progress;
      return;
    }

    if (levelsGained > 0) {
      // For each level crossed: fill to 100%, flash reset. Then fill final progress.
      const perLevelMs = 400;
      const segments: number[] = [];
      for (let i = 0; i < levelsGained; i++) {
        segments.push(withTiming(100, { duration: perLevelMs, easing: Easing.out(Easing.cubic) }));
        segments.push(withTiming(0, { duration: 55 }));
      }
      segments.push(withTiming(progress, { duration: 700, easing: springy }));
      progressWidth.value = withSequence(...segments);
    } else {
      // Web: width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)
      progressWidth.value = withTiming(progress, { duration: 700, easing: springy });
    }
  }, [level, progress, progressWidth, xpGained]);

  useEffect(() => {
    if (!xpGained || xpGained <= 0) return;
    setShowPop(true);
    popProgress.value = 0;
    popProgress.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
    const timeout = setTimeout(() => setShowPop(false), 1500);
    return () => clearTimeout(timeout);
  }, [popProgress, xp, xpGained]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Web xp-pop keyframes: rise + overshoot scale + fade, 1.2s ease-out
  const popStyle = useAnimatedStyle(() => ({
    opacity: interpolate(popProgress.value, [0, 0.25, 0.5, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: interpolate(popProgress.value, [0, 0.25, 0.5, 1], [0, -14, -20, -36]) },
      { scale: interpolate(popProgress.value, [0, 0.25, 0.5, 1], [0.3, 1.4, 1.1, 0.7]) },
    ],
  }));

  return (
    <View className="w-full gap-[6px]">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-baseline">
          <Text style={{ fontFamily: FONTS.display, fontSize: 14, color: COLORS.primary }}>LVL {level}</Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.mutedForeground }}> · {title}</Text>
        </View>
        <View className="relative items-end">
          <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.mutedForeground }}>
            {xp} / {next} XP
          </Text>
          {showPop && xpGained ? (
            <Animated.View
              style={[
                popStyle,
                {
                  position: "absolute",
                  top: -40,
                  right: 0,
                  shadowColor: COLORS.neonCyan,
                  shadowOpacity: 0.5,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}
            >
              <GradientText
                text={`+${xpGained}`}
                fontSize={24}
                fontFamily={FONTS.display}
                colors={[COLORS.success, COLORS.neonCyan]}
              />
            </Animated.View>
          ) : null}
        </View>
      </View>

      <View className="h-2 rounded-full overflow-hidden bg-muted">
        <Animated.View
          className="h-full rounded-full overflow-hidden"
          style={[
            animatedFillStyle,
            progress > 30 && {
              shadowColor: COLORS.neonCyan,
              shadowOpacity: 0.4,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <LinearGradient
            colors={GRADIENTS.cyanPurple}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default XPBar;
