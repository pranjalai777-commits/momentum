import { COLORS } from "@/constants/theme";
import { getLevel, getLevelProgress, getLevelTitle, getTreeHealthColor, getTreeHealthLabel } from "@/lib/momentum";
import { useGameStore } from "@/store/useGameStore";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TreeStage = {
  name: string;
  icon: string;
  minLevel: number;
};

const TREE_STAGES: TreeStage[] = [
  { name: "Seed", icon: "🌰", minLevel: 1 },
  { name: "Sprout", icon: "🌱", minLevel: 2 },
  { name: "Seedling", icon: "🌿", minLevel: 3 },
  { name: "Sapling", icon: "🪴", minLevel: 4 },
  { name: "Young Tree", icon: "🌳", minLevel: 5 },
  { name: "Growing Tree", icon: "🌳", minLevel: 6 },
  { name: "Mature Tree", icon: "🌳", minLevel: 7 },
  { name: "Grand Tree", icon: "🌲", minLevel: 8 },
  { name: "Ancient Tree", icon: "🌲", minLevel: 9 },
  { name: "World Tree", icon: "✨", minLevel: 10 },
  { name: "Eternal Tree", icon: "🌟", minLevel: 11 },
];

function getTreeStage(level: number): TreeStage {
  for (let i = TREE_STAGES.length - 1; i >= 0; i--) {
    if (level >= TREE_STAGES[i].minLevel) return TREE_STAGES[i];
  }
  return TREE_STAGES[0];
}

export default function TreeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = useGameStore((s) => s.data);
  const level = useMemo(() => getLevel(data.xp), [data.xp]);
  const progress = useMemo(() => getLevelProgress(data.xp).progress, [data.xp]);
  const health = data.treeHealth;

  const levelTitle = useMemo(() => getLevelTitle(level), [level]);
  const stage = useMemo(() => getTreeStage(level), [level]);
  const healthLabel = useMemo(() => getTreeHealthLabel(health), [health]);
  const healthColor = useMemo(() => getTreeHealthColor(health), [health]);
  const isDead = health <= 0;
  const isCritical = health > 0 && health <= 30;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 16,
        gap: 12,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="px-3 py-[6px] rounded-full border border-border bg-card">
          <Text className="text-muted-foreground font-sans text-[12px]">Back</Text>
        </Pressable>
        <Text className="text-neon-cyan font-display text-[22px]">YOUR TREE</Text>
        <View style={{ width: 58 }} />
      </View>

      {isCritical ? (
        <View className="rounded-[12px] border px-3 py-2" style={{ borderColor: "#f07000aa", backgroundColor: "rgba(240,112,0,0.10)" }}>
          <Text className="text-[12px] font-display" style={{ color: "#f0ad00" }}>
            Your tree is wilting. Complete tasks to heal it.
          </Text>
        </View>
      ) : null}

      {isDead ? (
        <View className="rounded-[12px] border px-3 py-2" style={{ borderColor: "#8b2d2daa", backgroundColor: "rgba(139,45,45,0.12)" }}>
          <Text className="text-[12px] font-display" style={{ color: "#ff8f8f" }}>
            Your tree is dead. Complete tasks now to revive it.
          </Text>
        </View>
      ) : null}

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 items-center gap-1">
        <Text className="text-[28px]">{isDead ? "💀" : stage.icon}</Text>
        <Text className="text-foreground font-display text-[20px]">{isDead ? "Dead Tree" : stage.name}</Text>
        <Text className="text-muted-foreground font-sans text-[12px]">LVL {level} · {levelTitle} · {data.xp} XP</Text>
      </View>

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground font-sans text-[12px]">Tree Health</Text>
          <Text className="font-display text-[13px]" style={{ color: healthColor }}>
            {healthLabel} · {Math.round(health)}%
          </Text>
        </View>
        <View className="h-2 rounded-full bg-muted overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${health}%`,
              backgroundColor: healthColor,
            }}
          />
        </View>
        <Text className="text-muted-foreground font-sans text-[11px] text-center">
          {health >= 80
            ? "Your tree is thriving! Keep it up."
            : health >= 50
              ? "Complete tasks to keep your tree healthy."
              : health > 0
                ? "Your tree needs care. Complete tasks to heal it."
                : "Complete any task to begin reviving your tree."}
        </Text>
      </View>

      <View className="rounded-[18px] border border-border bg-card-elevated px-4 py-4 gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground font-sans text-[12px]">Growth Progress</Text>
          <Text className="text-foreground font-display text-[13px]">{Math.round(progress)}%</Text>
        </View>
        <View className="h-2 rounded-full bg-muted overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: COLORS.success,
            }}
          />
        </View>
        <Text className="text-muted-foreground font-sans text-[11px] text-center">
          {data.tasksCompleted} tasks completed
        </Text>
      </View>
    </ScrollView>
  );
}
