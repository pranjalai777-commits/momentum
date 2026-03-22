import { COLORS } from "@/constants/theme";
import {
  getLevel,
  getLevelProgress,
  getLevelTitle,
  getTreeHealthColor,
  getTreeHealthLabel,
} from "@/lib/momentum";
import { useGameStore } from "@/store/useGameStore";
import { X, TreePine } from "lucide-react-native";
import { useMemo } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
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

type TreeModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function TreeModal({ visible, onClose }: TreeModalProps) {
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

  const treeHeaderColor = isDead
    ? "#ff8f8f"
    : isCritical
      ? "#f0ad00"
      : COLORS.success;

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
            borderColor: isCritical || isDead ? "#f07000aa" : COLORS.border,
            maxHeight: "90%",
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: isCritical || isDead ? "#f07000" : COLORS.border,
                opacity: 0.7,
              }}
            />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator
            indicatorStyle="white"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(40, insets.bottom + 24) }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TreePine size={18} color={treeHeaderColor} />
                <Text style={{ fontFamily: "SpaceGrotesk_700Bold", fontSize: 18, color: COLORS.foreground }}>
                  Your Tree
                </Text>
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

            {/* Critical alert */}
            {isCritical ? (
              <View
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#f07000aa",
                  backgroundColor: "rgba(240,112,0,0.10)",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#f0ad00", fontFamily: "SpaceGrotesk_700Bold", fontSize: 12 }}>
                  ⚠️  Your tree is wilting. Complete tasks to heal it.
                </Text>
              </View>
            ) : null}

            {/* Dead alert */}
            {isDead ? (
              <View
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#8b2d2daa",
                  backgroundColor: "rgba(139,45,45,0.12)",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 12,
                }}
              >
                <Text style={{ color: "#ff8f8f", fontFamily: "SpaceGrotesk_700Bold", fontSize: 12 }}>
                  💀  Your tree is dead. Complete tasks now to revive it.
                </Text>
              </View>
            ) : null}

            {/* Stage card */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardElevated,
                paddingHorizontal: 16,
                paddingVertical: 24,
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 52 }}>{isDead ? "💀" : stage.icon}</Text>
              <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 22, marginTop: 4 }}>
                {isDead ? "Dead Tree" : stage.name}
              </Text>
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                LVL {level} · {levelTitle} · {data.xp} XP
              </Text>
            </View>

            {/* Health bar */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: isCritical || isDead ? "#f07000aa" : COLORS.border,
                backgroundColor: COLORS.cardElevated,
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 8,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  Tree Health
                </Text>
                <Text style={{ color: healthColor, fontFamily: "SpaceGrotesk_700Bold", fontSize: 13 }}>
                  {healthLabel} · {Math.round(health)}%
                </Text>
              </View>

              {/* Health bar track */}
              <View style={{ height: 8, borderRadius: 8, backgroundColor: COLORS.muted, overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    borderRadius: 8,
                    width: `${Math.max(0, Math.min(100, health))}%`,
                    backgroundColor: healthColor,
                  }}
                />
              </View>

              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" }}>
                {health >= 80
                  ? "Your tree is thriving! Keep it up."
                  : health >= 50
                    ? "Complete tasks to keep your tree healthy."
                    : health > 0
                      ? "Your tree needs care. Complete tasks to heal it."
                      : "Complete any task to begin reviving your tree."}
              </Text>
            </View>

            {/* Growth / level progress bar */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardElevated,
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                  Growth Progress
                </Text>
                <Text style={{ color: COLORS.foreground, fontFamily: "SpaceGrotesk_700Bold", fontSize: 13 }}>
                  {Math.round(progress)}%
                </Text>
              </View>

              <View style={{ height: 8, borderRadius: 8, backgroundColor: COLORS.muted, overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    borderRadius: 8,
                    width: `${Math.max(0, Math.min(100, progress))}%`,
                    backgroundColor: COLORS.success,
                  }}
                />
              </View>

              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" }}>
                {data.tasksCompleted} task{data.tasksCompleted !== 1 ? "s" : ""} completed
              </Text>
            </View>

            {/* Stage roadmap */}
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.cardElevated,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginTop: 12,
                gap: 8,
              }}
            >
              <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Tree Stages
              </Text>
              <View style={{ gap: 6 }}>
                {TREE_STAGES.map((s) => {
                  const unlocked = level >= s.minLevel;
                  const current = stage.name === s.name && !isDead;
                  return (
                    <View
                      key={s.name}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        backgroundColor: current ? COLORS.success + "18" : "transparent",
                        borderWidth: current ? 1 : 0,
                        borderColor: current ? COLORS.success + "55" : "transparent",
                        opacity: unlocked ? 1 : 0.35,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                        <Text style={{
                          color: current ? COLORS.success : COLORS.foreground,
                          fontFamily: current ? "SpaceGrotesk_600SemiBold" : "Inter_400Regular",
                          fontSize: 13,
                        }}>
                          {s.name}
                        </Text>
                      </View>
                      <Text style={{ color: COLORS.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11 }}>
                        Lvl {s.minLevel}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
