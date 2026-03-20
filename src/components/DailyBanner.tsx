import { COLORS } from "@/constants/theme";
import { BarChart3, Calendar, User } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type DailyBannerProps = {
  dailyStreak: number;
  onOpenProfile: () => void;
  onOpenStats: () => void;
};

function DailyBanner({ dailyStreak, onOpenProfile, onOpenStats }: DailyBannerProps) {
  const streakActive = dailyStreak >= 3;

  return (
    <View className="flex-row items-center justify-center gap-2 flex-wrap">
      <View
        className={`flex-row items-center gap-[5px] px-[10px] py-[5px] rounded-[20px] border ${streakActive ? "bg-[#081c2a]" : "bg-card border-border"}`}
        style={streakActive ? { borderColor: COLORS.neonCyan + "55" } : undefined}
      >
        <Calendar size={13} color={streakActive ? COLORS.neonCyan : COLORS.mutedForeground} />
        <Text
          className={`text-[12px] ${streakActive ? "text-neon-cyan font-display-medium" : "text-muted-foreground font-sans"}`}
        >
          {dailyStreak}d streak
        </Text>
      </View>

      <Pressable
        onPress={onOpenProfile}
        className="flex-row items-center gap-[5px] px-[10px] py-[5px] rounded-[20px] bg-card border border-border"
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <User size={13} color={COLORS.mutedForeground} />
        <Text className="text-muted-foreground font-sans text-[12px]">Profile</Text>
      </Pressable>

      <Pressable
        onPress={onOpenStats}
        className="flex-row items-center gap-[5px] px-[10px] py-[5px] rounded-[20px] bg-card border border-border"
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <BarChart3 size={13} color={COLORS.mutedForeground} />
        <Text className="text-muted-foreground font-sans text-[12px]">Stats</Text>
      </Pressable>
    </View>
  );
}

export default DailyBanner;
