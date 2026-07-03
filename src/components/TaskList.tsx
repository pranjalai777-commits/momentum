import { COLORS, FONTS } from "@/constants/theme";
import ScalePressable from "@/components/ui/ScalePressable";
import { hapticTaskDelete, hapticTaskStart } from "@/lib/haptics";
import type { Task } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, Circle, Repeat2, Trash2, Zap } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

type TaskListProps = {
  tasks: Task[];
  activeTaskId: string | null;
  onStart: (task: Task) => void;
  onDelete: (id: string) => void;
};

function TaskList({ tasks, activeTaskId, onStart, onDelete }: TaskListProps) {
  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  if (tasks.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 py-10">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: COLORS.secondary }}
        >
          <Zap size={28} color={COLORS.mutedForeground} />
        </View>
        <Text className="text-muted-foreground font-sans text-[14px] text-center">
          Add your first task above.{"\n"}
          <Text className="text-[12px]">Crush it. Earn XP. Repeat.</Text>
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="w-full flex-1"
      contentContainerStyle={{ gap: 6, paddingBottom: 4 }}
      showsVerticalScrollIndicator={false}
    >
      {pending.map((task) => {
        const active = activeTaskId === task.id;
        return (
          <ScalePressable
            key={task.id}
            onPress={() => {
              hapticTaskStart();
              onStart(task);
            }}
            className="flex-row items-center rounded-[12px] border"
            style={{
              gap: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor: active ? COLORS.primary + "1a" : COLORS.secondary + "99",
              borderColor: active ? COLORS.primary + "4d" : COLORS.border + "80",
            }}
            pressedStyle={{ transform: [{ scale: 0.99 }] }}
          >
            <Circle size={18} color={COLORS.mutedForeground} />
            <Text className="flex-1 text-foreground font-sans text-[14px]" numberOfLines={1} ellipsizeMode="tail">
              {task.text}
            </Text>
            {task.routineId ? <Repeat2 size={13} color={COLORS.neonCyan} /> : null}
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                hapticTaskDelete();
                onDelete(task.id);
              }}
              hitSlop={10}
              className="p-1 opacity-60"
            >
              <Trash2 size={14} color={COLORS.mutedForeground} />
            </Pressable>
            {/* Web START badge: gradient cyan/15 → purple/15, cyan text */}
            <View style={{ borderRadius: 8, overflow: "hidden" }}>
              <LinearGradient
                colors={[COLORS.neonCyan + "26", COLORS.neonPurple + "26"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 10, paddingVertical: 4 }}
              >
                <Text style={{ fontFamily: FONTS.display, fontSize: 10, letterSpacing: 0.5, color: COLORS.neonCyan }}>
                  START
                </Text>
              </LinearGradient>
            </View>
          </ScalePressable>
        );
      })}

      {done.length > 0 && (
        <View className="pt-3 gap-[6px]">
          <Text
            className="uppercase px-1"
            style={{ fontFamily: FONTS.display, fontSize: 10, letterSpacing: 2, color: COLORS.mutedForeground + "80" }}
          >
            CRUSHED ({done.length})
          </Text>
          {done.map((task) => (
            <View
              key={task.id}
              className="flex-row items-center rounded-[12px] border"
              style={{
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: COLORS.success + "0d",
                borderColor: COLORS.success + "1a",
              }}
            >
              <CheckCircle2 size={18} color={COLORS.success} />
              <Text
                className="flex-1 text-muted-foreground font-sans text-[14px] line-through"
                numberOfLines={1}
              >
                {task.text}
              </Text>
              {task.routineId ? <Repeat2 size={13} color={COLORS.success} /> : null}
              <Pressable
                onPress={() => {
                  hapticTaskDelete();
                  onDelete(task.id);
                }}
                hitSlop={10}
                className="p-1 opacity-60"
              >
                <Trash2 size={14} color={COLORS.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default TaskList;
