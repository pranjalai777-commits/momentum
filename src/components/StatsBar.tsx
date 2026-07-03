import { COLORS, FONTS } from "@/constants/theme";
import { Flame, Repeat2, Zap } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type StatsBarProps = {
  totalActions: number;
  streak: number;
  bestStreak: number;
  activeRoutines?: number;
  onOpenRoutines?: () => void;
};

function StatsBar({ totalActions, streak, bestStreak, activeRoutines = 0, onOpenRoutines }: StatsBarProps) {
  // Web tiers: ≥5 heat-fire (+glow), ≥3 heat-hot, else primary purple
  const streakColor = streak >= 5 ? COLORS.heatFire : streak >= 3 ? COLORS.heatHot : COLORS.primary;
  void bestStreak;

  return (
    <View className="flex-row items-center justify-center gap-3">
      <View className="flex-row items-center gap-[6px]">
        <Zap size={14} color={COLORS.primary} />
        <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.mutedForeground }}>
          {totalActions} done
        </Text>
      </View>

      {streak > 0 ? (
        <View className="flex-row items-center gap-[6px]">
          <Flame size={14} color={streakColor} />
          <Text
            style={[
              { fontFamily: FONTS.display, fontSize: 14, color: streakColor },
              streak >= 5 && {
                textShadowColor: COLORS.neonPurple + "99",
                textShadowRadius: 12,
                textShadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            {streak}×
          </Text>
        </View>
      ) : null}

      {onOpenRoutines ? (
        <Pressable onPress={onOpenRoutines} className="flex-row items-center gap-[6px]" hitSlop={8}>
          <Repeat2 size={14} color={activeRoutines > 0 ? COLORS.neonCyan : COLORS.mutedForeground + "99"} />
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: activeRoutines > 0 ? COLORS.neonCyan : COLORS.mutedForeground + "99",
            }}
          >
            {activeRoutines}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default StatsBar;
