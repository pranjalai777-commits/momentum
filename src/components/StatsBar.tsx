import { COLORS, FONTS } from "@/constants/theme";
import { Flame, Trophy, Zap } from "lucide-react-native";
import { Text, View } from "react-native";

type StatsBarProps = {
  totalActions: number;
  streak: number;
  bestStreak: number;
};

function StatsBar({ totalActions, streak, bestStreak }: StatsBarProps) {
  // Web tiers: ≥5 heat-fire (+glow), ≥3 heat-hot, else primary purple
  const streakColor = streak >= 5 ? COLORS.heatFire : streak >= 3 ? COLORS.heatHot : COLORS.primary;

  return (
    <View className="flex-row items-center justify-center gap-4">
      <View className="flex-row items-center gap-[6px]">
        <Zap size={14} color={COLORS.primary} />
        <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.mutedForeground }}>
          {totalActions} task{totalActions === 1 ? "" : "s"} crushed
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

      {bestStreak >= 3 ? (
        <View className="flex-row items-center gap-[6px]">
          <Trophy size={14} color={COLORS.primary + "80"} />
          <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.mutedForeground + "99" }}>
            best {bestStreak}×
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default StatsBar;
