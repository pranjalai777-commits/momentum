import { COLORS } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { getLevel, getLevelTitle } from "@/lib/momentum";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/useGameStore";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProfileStats = {
  xp: number;
  level: number;
  best_streak: number;
  best_daily_streak: number;
  tasks_completed: number;
};

type XpEvent = {
  xp_earned: number;
  created_at: string;
};

type LevelHistoryItem = {
  level: number;
  title: string;
  date: string;
};

const CHART_DAYS = 14;

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function StatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const localData = useGameStore((s) => s.data);

  const profileQuery = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ProfileStats | null> => {
      const userId = user?.id;
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("xp,level,best_streak,best_daily_streak,tasks_completed")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const xpEventsQuery = useQuery({
    queryKey: ["xp-events", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<XpEvent[]> => {
      const userId = user?.id;
      if (!userId) return [];
      const { data, error } = await supabase
        .from("xp_events")
        .select("xp_earned,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const profile = profileQuery.data;
  const stats = {
    xp: profile?.xp ?? localData.xp,
    level: profile?.level ?? getLevel(localData.xp),
    bestTaskStreak: profile?.best_streak ?? localData.bestStreak,
    bestDailyStreak: profile?.best_daily_streak ?? localData.bestDailyStreak,
    tasksCompleted: profile?.tasks_completed ?? localData.tasksCompleted,
  };

  const chartBars = useMemo(() => {
    const events = xpEventsQuery.data ?? [];
    const now = new Date();
    const days: { key: string; label: string; xp: number }[] = [];

    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      days.push({ key, label: formatDayLabel(day), xp: 0 });
    }

    const dayIndex = new Map(days.map((d, idx) => [d.key, idx]));
    for (const event of events) {
      const key = event.created_at.slice(0, 10);
      const idx = dayIndex.get(key);
      if (idx !== undefined) {
        days[idx].xp += event.xp_earned;
      }
    }

    const maxXp = Math.max(1, ...days.map((d) => d.xp));
    return days.map((d) => ({ ...d, heightRatio: d.xp / maxXp }));
  }, [xpEventsQuery.data]);

  const levelHistory = useMemo<LevelHistoryItem[]>(() => {
    const events = xpEventsQuery.data ?? [];
    if (events.length === 0) return [];

    const totalEarned = events.reduce((sum, event) => sum + event.xp_earned, 0);
    let runningXp = Math.max(0, stats.xp - totalEarned);
    let currentLevel = getLevel(runningXp);
    const history: LevelHistoryItem[] = [];

    for (const event of events) {
      runningXp += event.xp_earned;
      const newLevel = getLevel(runningXp);
      if (newLevel > currentLevel) {
        const date = new Date(event.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        for (let level = currentLevel + 1; level <= newLevel; level++) {
          history.push({ level, title: getLevelTitle(level), date });
        }

        currentLevel = newLevel;
      }
    }

    return history.reverse();
  }, [stats.xp, xpEventsQuery.data]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 10,
        paddingBottom: insets.bottom + 18,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Pressable
          onPress={() => router.back()}
          className="px-3 py-[6px] rounded-full border border-border bg-card"
        >
          <Text className="text-muted-foreground font-sans text-[12px]">Back</Text>
        </Pressable>
        <Text className="text-neon-cyan font-display text-[22px]">STATS</Text>
        <View style={{ width: 58 }} />
      </View>

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 gap-3">
        <Text className="text-muted-foreground font-sans text-[12px] uppercase tracking-[1px]">Overview</Text>
        <Text className="text-foreground font-display text-[22px]">{stats.xp} XP</Text>
        <Text className="text-neon-cyan font-sans-medium text-[14px]">
          Level {stats.level} · {getLevelTitle(stats.level)}
        </Text>
        <View className="flex-row gap-2">
          <View className="px-[10px] py-[6px] rounded-[10px] border border-border bg-muted">
            <Text className="text-muted-foreground font-sans text-[11px]">Best task streak</Text>
            <Text className="text-foreground font-display text-[16px]">{stats.bestTaskStreak}×</Text>
          </View>
          <View className="px-[10px] py-[6px] rounded-[10px] border border-border bg-muted">
            <Text className="text-muted-foreground font-sans text-[11px]">Best daily streak</Text>
            <Text className="text-foreground font-display text-[16px]">{stats.bestDailyStreak}d</Text>
          </View>
          <View className="px-[10px] py-[6px] rounded-[10px] border border-border bg-muted">
            <Text className="text-muted-foreground font-sans text-[11px]">Tasks completed</Text>
            <Text className="text-foreground font-display text-[16px]">{stats.tasksCompleted}</Text>
          </View>
        </View>
      </View>

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 gap-3">
        <Text className="text-muted-foreground font-sans text-[12px] uppercase tracking-[1px]">XP last 14 days</Text>
        <View className="h-[164px] flex-row items-end gap-[6px]">
          {chartBars.map((bar, index) => (
            <View key={bar.key} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  width: "100%",
                  borderRadius: 8,
                  minHeight: 4,
                  height: Math.max(4, Math.round(bar.heightRatio * 120)),
                  backgroundColor: bar.xp > 0 ? COLORS.neonCyan : COLORS.border,
                  opacity: bar.xp > 0 ? 0.95 : 0.35,
                }}
              />
              <Text className="text-muted-foreground font-sans text-[9px] mt-1" numberOfLines={1}>
                {index % 3 === 0 || index === chartBars.length - 1 ? bar.label : ""}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 gap-3">
        <Text className="text-muted-foreground font-sans text-[12px] uppercase tracking-[1px]">Level history</Text>
        {levelHistory.length > 0 ? (
          <View className="gap-2">
            {levelHistory.slice(0, 12).map((item) => (
              <View
                key={`${item.level}-${item.date}`}
                className="flex-row items-center justify-between rounded-[12px] border border-border bg-muted px-3 py-2"
              >
                <Text className="text-foreground font-display text-[14px]">Level {item.level}</Text>
                <Text className="text-neon-cyan font-sans-medium text-[12px]">{item.title}</Text>
                <Text className="text-muted-foreground font-sans text-[11px]">{item.date}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-muted-foreground font-sans text-[13px]">
            Complete tasks to unlock your level timeline.
          </Text>
        )}
      </View>

      {(profileQuery.isLoading || xpEventsQuery.isLoading) && (
        <Text className="text-muted-foreground font-sans text-[12px]">Loading latest stats…</Text>
      )}

      {(profileQuery.error || xpEventsQuery.error) && (
        <Text className="text-[#ff7a7a] font-sans text-[12px]">
          Couldn&apos;t load some remote stats. Showing available local data.
        </Text>
      )}
    </ScrollView>
  );
}
