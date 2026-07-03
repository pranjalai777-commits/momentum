import { COLORS } from "@/constants/theme";
import { hapticCancel } from "@/lib/haptics";
import { useStreakHistory } from "@/hooks/useStreakHistory";
import { Flame, X, Calendar, Trophy, Zap } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StreakModalProps = {
  visible: boolean;
  onClose: () => void;
  dailyStreak: number;
  bestDailyStreak: number;
  streak: number;
  bestStreak: number;
  lastActionAt?: string | null;
};

const MILESTONES = [3, 7, 14, 30, 60, 100];

const MILESTONE_LABELS: Record<number, string> = {
  3: "3 days",
  7: "1 week",
  14: "2 weeks",
  30: "1 month",
  60: "2 months",
  100: "100 days",
};

const MILESTONE_EMOJIS: Record<number, string> = {
  3: "🔥",
  7: "💫",
  14: "⚡",
  30: "💎",
  60: "👑",
  100: "🏆",
};

function getLastActiveDaysAgo(lastActionAt?: string | null): string {
  if (!lastActionAt) return "Never";
  const last = new Date(lastActionAt);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function ActivityCalendar({ history }: { history: { date: string; today_actions: number }[] }) {
  const cells = useMemo(() => {
    const activityMap: Record<string, number> = {};
    for (const row of history) {
      activityMap[row.date] = row.today_actions;
    }

    const today = new Date();
    const result: { date: string; actions: number; isToday: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, actions: activityMap[key] ?? 0, isToday: i === 0 });
    }
    return result;
  }, [history]);

  function getCellColor(actions: number): string {
    if (actions === 0) return COLORS.border;
    if (actions >= 5) return COLORS.heatFire;
    if (actions >= 3) return COLORS.heatHot;
    if (actions >= 2) return COLORS.heatWarm;
    return COLORS.neonCyan;
  }

  return (
    <View>
      <Text className="font-display text-[11px] uppercase tracking-[1.5px] mb-3" style={{ color: COLORS.mutedForeground }}>
        Last 30 Days
      </Text>
      <View className="flex-row flex-wrap gap-[5px]">
        {cells.map((cell) => (
          <View
            key={cell.date}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              backgroundColor: getCellColor(cell.actions),
              opacity: cell.isToday ? 1 : cell.actions > 0 ? 0.85 : 0.35,
              borderWidth: cell.isToday ? 1.5 : 0,
              borderColor: cell.isToday ? COLORS.neonCyan : "transparent",
            }}
          />
        ))}
      </View>
      <View className="flex-row items-center gap-3 mt-2">
        <View className="flex-row items-center gap-1">
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: COLORS.border, opacity: 0.6 }} />
          <Text style={{ color: COLORS.mutedForeground, fontSize: 10 }}>No activity</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: COLORS.neonCyan }} />
          <Text style={{ color: COLORS.mutedForeground, fontSize: 10 }}>1 task</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: COLORS.heatFire }} />
          <Text style={{ color: COLORS.mutedForeground, fontSize: 10 }}>5+ tasks</Text>
        </View>
      </View>
    </View>
  );
}

function StatCard({
  label,
  current,
  best,
  icon,
  accentColor,
}: {
  label: string;
  current: number;
  best: number;
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <View
      className="flex-1 rounded-[14px] p-[14px]"
      style={{ backgroundColor: COLORS.cardElevated, borderWidth: 1, borderColor: COLORS.border }}
    >
      <View className="flex-row items-center gap-[6px] mb-2">
        {icon}
        <Text className="font-sans text-[11px] uppercase tracking-[1.2px]" style={{ color: COLORS.mutedForeground }}>
          {label}
        </Text>
      </View>
      <Text className="font-display text-[28px]" style={{ color: accentColor }}>
        {current}
      </Text>
      <Text className="font-sans text-[11px] mt-[2px]" style={{ color: COLORS.mutedForeground }}>
        best: <Text style={{ color: COLORS.foreground }}>{best}</Text>
      </Text>
    </View>
  );
}

export default function StreakModal({
  visible,
  onClose,
  dailyStreak,
  bestDailyStreak,
  streak,
  bestStreak,
  lastActionAt,
}: StreakModalProps) {
  const insets = useSafeAreaInsets();

  const handleClose = () => { hapticCancel(); onClose(); };
  const { data: history, isLoading, refetch } = useStreakHistory(visible);

  useEffect(() => {
    if (visible) refetch();
  }, [visible, refetch]);

  const dailyStreakActive = dailyStreak >= 3;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(8,9,13,0.70)" }}
          onPress={handleClose}
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
            maxHeight: "85%",
          }}
        >
          {/* Handle bar */}
          <View className="items-center pt-3 pb-1">
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator
            indicatorStyle="white"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(40, insets.bottom + 24) }}
          >
            {/* Header row */}
            <View className="flex-row items-center justify-between mt-3 mb-5">
              <View className="flex-row items-center gap-2">
                <Flame size={18} color={dailyStreakActive ? COLORS.heatFire : COLORS.mutedForeground} />
                <Text className="font-display text-[18px]" style={{ color: COLORS.foreground }}>
                  Your Streak
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
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

            {/* Hero number */}
            <View
              className="items-center rounded-[20px] py-6 mb-4"
              style={{
                backgroundColor: dailyStreakActive ? COLORS.neonCyan + "1a" : COLORS.cardElevated,
                borderWidth: 1,
                borderColor: dailyStreakActive ? COLORS.neonCyan + "44" : COLORS.border,
              }}
            >
              <Text
                className="font-display"
                style={{ fontSize: 64, lineHeight: 70, color: dailyStreakActive ? COLORS.neonCyan : COLORS.foreground }}
              >
                {dailyStreak}
              </Text>
              <Text className="font-display text-[14px] uppercase tracking-[2px]" style={{ color: COLORS.mutedForeground }}>
                days in a row
              </Text>
              {lastActionAt ? (
                <Text className="font-sans text-[12px] mt-2" style={{ color: COLORS.mutedForeground }}>
                  Last active: <Text style={{ color: COLORS.foreground }}>{getLastActiveDaysAgo(lastActionAt)}</Text>
                </Text>
              ) : null}
            </View>

            {/* Stat cards */}
            <View className="flex-row gap-3 mb-5">
              <StatCard
                label="Daily"
                current={dailyStreak}
                best={bestDailyStreak}
                accentColor={dailyStreakActive ? COLORS.neonCyan : COLORS.foreground}
                icon={<Calendar size={12} color={COLORS.mutedForeground} />}
              />
              <StatCard
                label="Task streak"
                current={streak}
                best={bestStreak}
                accentColor={streak >= 5 ? COLORS.heatFire : streak >= 3 ? COLORS.heatHot : COLORS.foreground}
                icon={<Zap size={12} color={COLORS.mutedForeground} />}
              />
            </View>

            {/* Milestones */}
            <View className="mb-5">
              <Text
                className="font-display text-[11px] uppercase tracking-[1.5px] mb-3"
                style={{ color: COLORS.mutedForeground }}
              >
                Milestones
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {MILESTONES.map((m) => {
                  const unlocked = dailyStreak >= m;
                  return (
                    <View
                      key={m}
                      className="flex-row items-center gap-[6px] px-3 py-2 rounded-[20px]"
                      style={{
                        backgroundColor: unlocked ? COLORS.neonCyan + "1a" : COLORS.cardElevated,
                        borderWidth: 1,
                        borderColor: unlocked ? COLORS.neonCyan + "55" : COLORS.border,
                        opacity: unlocked ? 1 : 0.45,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{MILESTONE_EMOJIS[m]}</Text>
                      <Text
                        className="font-display text-[12px]"
                        style={{ color: unlocked ? COLORS.neonCyan : COLORS.mutedForeground }}
                      >
                        {MILESTONE_LABELS[m]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Activity Calendar */}
            <View
              className="rounded-[16px] p-4"
              style={{ backgroundColor: COLORS.cardElevated, borderWidth: 1, borderColor: COLORS.border }}
            >
              {isLoading ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color={COLORS.neonCyan} />
                </View>
              ) : (
                <ActivityCalendar history={history ?? []} />
              )}
            </View>

            {/* Motivational footer */}
            {dailyStreak === 0 && (
              <Text className="font-sans text-[13px] text-center mt-5" style={{ color: COLORS.mutedForeground }}>
                Complete a task today to start your streak 🔥
              </Text>
            )}
            {dailyStreak > 0 && dailyStreak < 3 && (
              <Text className="font-sans text-[13px] text-center mt-5" style={{ color: COLORS.mutedForeground }}>
                {3 - dailyStreak} more day{3 - dailyStreak !== 1 ? "s" : ""} to unlock streak highlight ✨
              </Text>
            )}
            {dailyStreak >= 3 && (
              <Text className="font-sans text-[13px] text-center mt-5" style={{ color: COLORS.neonCyan + "cc" }}>
                Keep the fire alive — don{"'"}t break the chain! 🔥
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
