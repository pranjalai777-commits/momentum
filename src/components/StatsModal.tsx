import { COLORS } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { getLevel, getLevelTitle } from "@/lib/momentum";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/useGameStore";
import { BarChart3, X, Trophy, Zap, CheckCircle } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
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

type StatsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function StatsModal({ visible, onClose }: StatsModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const localData = useGameStore((s) => s.data);

  const profileQuery = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: Boolean(user?.id) && visible,
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
    enabled: Boolean(user?.id) && visible,
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

  useEffect(() => {
    if (visible) {
      profileQuery.refetch();
      xpEventsQuery.refetch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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

    const totalEarned = events.reduce((sum, e) => sum + e.xp_earned, 0);
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

  const isLoading = profileQuery.isLoading || xpEventsQuery.isLoading;
  const hasError = profileQuery.isError || xpEventsQuery.isError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(6,10,22,0.70)" }}
          onPress={onClose}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: COLORS.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: COLORS.border,
            maxHeight: "90%",
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator
            indicatorStyle="white"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(40, insets.bottom + 24) }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <BarChart3 size={18} color={COLORS.neonCyan} />
                <Text style={{ fontFamily: "SpaceGrotesk_700Bold", fontSize: 18, color: COLORS.foreground }}>
                  Stats
                </Text>
                {isLoading && (
                  <ActivityIndicator size="small" color={COLORS.neonCyan} style={{ marginLeft: 4 }} />
                )}
              </View>
              <Pressable
                onPress={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.cardElevated,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} color={COLORS.mutedForeground} />
              </Pressable>
            </View>

            {/* Overview */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardElevated,
                padding: 16,
                gap: 10,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                Overview
              </Text>
              <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 26 }}>
                {stats.xp} XP
              </Text>
              <Text style={{ color: COLORS.neonCyan, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                Level {stats.level} · {getLevelTitle(stats.level)}
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.muted }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <Zap size={10} color={COLORS.mutedForeground} />
                    <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11 }}>Best task streak</Text>
                  </View>
                  <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 18 }}>{stats.bestTaskStreak}×</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.muted }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <Trophy size={10} color={COLORS.mutedForeground} />
                    <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11 }}>Best daily streak</Text>
                  </View>
                  <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 18 }}>{stats.bestDailyStreak}d</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.muted }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <CheckCircle size={10} color={COLORS.mutedForeground} />
                    <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11 }}>Tasks completed</Text>
                  </View>
                  <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 18 }}>{stats.tasksCompleted}</Text>
                </View>
              </View>
            </View>

            {/* XP Chart */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardElevated,
                padding: 16,
                gap: 10,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                XP last 14 days
              </Text>
              <View style={{ height: 164, flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
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
                    <Text
                      style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 9, marginTop: 4 }}
                      numberOfLines={1}
                    >
                      {index % 3 === 0 || index === chartBars.length - 1 ? bar.label : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Level history */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardElevated,
                padding: 16,
                gap: 10,
              }}
            >
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                Level history
              </Text>
              {levelHistory.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {levelHistory.slice(0, 12).map((item) => (
                    <View
                      key={`${item.level}-${item.date}`}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.muted,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 14 }}>
                        Level {item.level}
                      </Text>
                      <Text style={{ color: COLORS.neonCyan, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                        {item.title}
                      </Text>
                      <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11 }}>
                        {item.date}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13 }}>
                  Complete tasks to unlock your level timeline.
                </Text>
              )}
            </View>

            {hasError && (
              <Text style={{ color: "#ff7a7a", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 12 }}>
                Couldn&apos;t load some remote stats. Showing available local data.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
