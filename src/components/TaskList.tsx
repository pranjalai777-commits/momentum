import { COLORS } from "@/constants/theme";
import { hapticTaskDelete, hapticTaskStart } from "@/lib/haptics";
import type { Task } from "@/types";
import { CheckCircle2, ChevronRight, Trash2, Zap } from "lucide-react-native";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
// container has paddingHorizontal: 16 on each side → 32px total
const CARD_W = SCREEN_W - 32;

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
      <View className="flex-1 items-center justify-center gap-[10px]">
        <View
          className="w-[60px] h-[60px] rounded-full bg-[#0a1e2e] border items-center justify-center"
          style={{ borderColor: COLORS.neonCyan + "30" }}
        >
          <Zap size={24} color={COLORS.neonCyan} />
        </View>
        <Text className="text-foreground font-display text-[15px]">No tasks yet</Text>
        <Text className="text-muted-foreground font-sans text-[13px] text-center">
          Add one above and start crushing it ⚡
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="w-full flex-1"
      contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      showsVerticalScrollIndicator={false}
    >
      {pending.map((task) => {
        const active = activeTaskId === task.id;
        return (
          <Pressable
            key={task.id}
            onPress={() => {
              hapticTaskStart();
              onStart(task);
            }}
            className={`flex-row items-center px-[14px] py-[13px] rounded-lg border gap-[10px] ${
              active ? "bg-[#071b28]" : "bg-card"
            }`}
            style={({ pressed }) => [
              { width: CARD_W, borderColor: active ? COLORS.neonCyan + "55" : COLORS.border },
              active
                ? {
                    shadowColor: COLORS.neonCyan,
                    shadowOpacity: 0.12,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 },
                  }
                : null,
              pressed && { opacity: 0.82 },
            ]}
          >
            {/* Status dot */}
            <View
              className={`w-[10px] h-[10px] rounded-full border-2 shrink-0 ${
                active ? "bg-neon-cyan border-neon-cyan" : "border-muted-foreground"
              }`}
            />

            {/* Task label — flex:1 so it fills the gap */}
            <Text
              className={`flex-1 font-sans-medium text-[15px] shrink ${
                active ? "text-neon-cyan" : "text-foreground"
              }`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {task.text}
            </Text>

            {/* Right-side controls */}
            <View className="flex-row items-center gap-2 shrink-0">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  hapticTaskDelete();
                  onDelete(task.id);
                }}
                hitSlop={10}
                className="p-1"
              >
                <Trash2 size={14} color={COLORS.mutedForeground} />
              </Pressable>

              <View
                className={`flex-row items-center gap-[3px] px-[9px] py-2 rounded-full border ${
                  active ? "bg-[#061522]" : "bg-[#0d1829] border-border"
                }`}
                style={active ? { borderColor: COLORS.neonCyan + "50" } : undefined}
              >
                <ChevronRight
                  size={11}
                  color={active ? COLORS.neonCyan : COLORS.mutedForeground}
                />
                <Text
                  className={`font-display text-[10px] tracking-[1.1px] ${
                    active ? "text-neon-cyan" : "text-muted-foreground"
                  }`}
                >
                  {active ? "ACTIVE" : "START"}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      {done.length > 0 && (
        <View className="pt-1 gap-[6px]">
          <View className="flex-row items-center gap-[5px] px-[2px] pb-[2px]">
            <CheckCircle2 size={16} color={COLORS.success} />
            <Text className="text-success font-display text-[12px] tracking-[2px]">
              CRUSHED ({done.length})
            </Text>
          </View>
          {done.map((task) => (
            <View
              key={task.id}
              className="flex-row items-center gap-[10px] px-[14px] py-[11px] rounded-lg bg-[#0c2117] border"
              style={{ width: CARD_W, borderColor: COLORS.success + "28" }}
            >
              <CheckCircle2 size={20} color={COLORS.success} />
              <Text
                className="flex-1 text-muted-foreground font-sans text-[14px] line-through"
                numberOfLines={1}
              >
                {task.text}
              </Text>
              <Pressable
                onPress={() => {
                  hapticTaskDelete();
                  onDelete(task.id);
                }}
                hitSlop={10}
                className="p-1"
              >
                <Trash2 size={16} color={COLORS.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default TaskList;
