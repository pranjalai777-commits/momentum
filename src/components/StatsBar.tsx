import { COLORS } from "@/constants/theme";
import { Flame, Trophy, Zap } from "lucide-react-native";
import { Text, View } from "react-native";

type StatsBarProps = {
  totalActions: number;
  streak: number;
  bestStreak: number;
};

function StatsBar({ totalActions, streak, bestStreak }: StatsBarProps) {
  const streakColor =
    streak >= 5 ? COLORS.heatFire : streak >= 3 ? COLORS.heatHot : COLORS.neonCyan;

  return (
    <View className="flex-row items-center gap-2 flex-wrap justify-center">
      <View className="flex-row items-center gap-[5px] px-[10px] py-[5px] rounded-[20px] bg-card border border-border">
        <Zap size={13} color={COLORS.neonCyan} />
        <Text className="text-muted-foreground font-sans text-[12px]">
          {totalActions} task{totalActions === 1 ? "" : "s"} crushed
        </Text>
      </View>

      {streak > 0 ? (
        <View
          className="flex-row items-center gap-[5px] px-[10px] py-[5px] rounded-[20px] bg-card border"
          style={{ borderColor: streakColor + "44" }}
        >
          <Flame size={13} color={streakColor} />
          <Text className="font-display text-[12px]" style={{ color: streakColor }}>
            {streak}×
          </Text>
        </View>
      ) : null}

      {bestStreak >= 3 ? (
        <View className="flex-row items-center gap-[5px] px-[10px] py-[5px] rounded-[20px] bg-card border border-border">
          <Trophy size={13} color={COLORS.mutedForeground} />
          <Text className="text-muted-foreground font-sans text-[12px]">best {bestStreak}×</Text>
        </View>
      ) : null}
    </View>
  );
}

export default StatsBar;
