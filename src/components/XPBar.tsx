import { COLORS } from "@/constants/theme";
import { getLevel, getLevelProgress, getLevelTitle } from "@/lib/momentum";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
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
      // e.g. level 1→3: fill100 → reset → fill100 → reset → fillNewProgress
      const perLevelMs = 400; // fixed per level — never divide by levelsGained
      const segments: number[] = [];
      for (let i = 0; i < levelsGained; i++) {
        segments.push(withTiming(100, { duration: perLevelMs, easing: Easing.out(Easing.cubic) }));
        segments.push(withTiming(0, { duration: 55 }));
      }
      segments.push(withTiming(progress, { duration: 600, easing: Easing.out(Easing.cubic) }));
      progressWidth.value = withSequence(...segments);
    } else {
      progressWidth.value = withTiming(progress, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [level, progress, progressWidth, xpGained]);

  useEffect(() => {
    if (!xpGained || xpGained <= 0) return;
    setShowPop(true);
    const timeout = setTimeout(() => setShowPop(false), 1400);
    return () => clearTimeout(timeout);
  }, [xp, xpGained]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View className="w-full gap-[7px]">
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-baseline">
          <Text className="text-neon-cyan font-display text-[14px]">LVL {level}</Text>
          <Text className="text-muted-foreground font-sans text-[11px]"> · {title}</Text>
        </View>
        <View className="relative items-end">
          <Text className="text-foreground font-display text-[12px]">
            {xp} <Text className="text-muted-foreground font-sans text-[11px]">/ {next} XP</Text>
          </Text>
          {showPop && xpGained ? (
            <MotiView
              from={{ opacity: 0, translateY: 16, scale: 0.7 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, translateY: -12, scale: 0.8 }}
              transition={{ type: "timing", duration: 450 }}
              style={{ position: "absolute", top: -26, right: 0 }}
            >
              <Text className="text-success font-display text-[20px]">+{xpGained}</Text>
            </MotiView>
          ) : null}
        </View>
      </View>

      <View className="h-2 rounded-full overflow-hidden bg-muted border border-border">
        <Animated.View
          className="h-full rounded-full bg-neon-cyan"
          style={[
            animatedFillStyle,
            {
              shadowColor: COLORS.neonCyan,
              shadowOpacity: 0.6,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      </View>
    </View>
  );
}

export default XPBar;
