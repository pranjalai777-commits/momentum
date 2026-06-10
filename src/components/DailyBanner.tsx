import { COLORS, FONTS } from "@/constants/theme";
import { hapticChipTap } from "@/lib/haptics";
import { BarChart3, Calendar, User } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type DailyBannerProps = {
  dailyStreak: number;
  onOpenProfile: () => void;
  onOpenStats: () => void;
  onOpenStreak: () => void;
};

// Web DailyBanner is a flat text row (icons + muted text, "·" separators) —
// mobile keeps Profile/Stats entries for navigation but uses the same flat style.
function DailyBanner({ dailyStreak, onOpenProfile, onOpenStats, onOpenStreak }: DailyBannerProps) {
  const streakActive = dailyStreak >= 3;

  return (
    <View className="flex-row items-center justify-center gap-4">
      <Pressable
        onPress={() => { hapticChipTap(); onOpenStreak(); }}
        className="flex-row items-center gap-[6px]"
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <Calendar size={14} color={COLORS.primary} />
        <Text
          style={[
            { fontFamily: FONTS.display, fontSize: 12, color: streakActive ? COLORS.primary : COLORS.mutedForeground },
            streakActive && {
              textShadowColor: COLORS.neonPurple + "99",
              textShadowRadius: 12,
              textShadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          {dailyStreak}d streak
        </Text>
      </Pressable>

      <Text style={{ color: COLORS.border }}>·</Text>

      <Pressable
        onPress={() => { hapticChipTap(); onOpenProfile(); }}
        className="flex-row items-center gap-[6px]"
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <User size={14} color={COLORS.mutedForeground} />
        <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.mutedForeground }}>Profile</Text>
      </Pressable>

      <Text style={{ color: COLORS.border }}>·</Text>

      <Pressable
        onPress={() => { hapticChipTap(); onOpenStats(); }}
        className="flex-row items-center gap-[6px]"
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <BarChart3 size={14} color={COLORS.mutedForeground} />
        <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.mutedForeground }}>Stats</Text>
      </Pressable>
    </View>
  );
}

export default DailyBanner;
