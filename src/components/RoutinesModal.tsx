import { COLORS, FONTS } from "@/constants/theme";
import type { RoutineTask } from "@/types";
import { MotiView } from "moti";
import { PauseCircle, PlayCircle, Repeat2, Trash2, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RoutinesModalProps = {
  visible: boolean;
  routines: RoutineTask[];
  onClose: () => void;
  onToggle: (routine: RoutineTask) => void;
  onDelete: (routine: RoutineTask) => void;
};

function RoutinesModal({ visible, routines, onClose, onToggle, onDelete }: RoutinesModalProps) {
  const insets = useSafeAreaInsets();
  const activeCount = routines.filter((routine) => routine.active).length;
  const pausedCount = routines.length - activeCount;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(8,9,13,0.82)",
          justifyContent: "center",
          paddingHorizontal: 14,
          paddingTop: Math.max(insets.top + 20, 36),
          paddingBottom: Math.max(insets.bottom + 20, 36),
        }}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.94, translateY: 18 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          style={{
            minHeight: 400,
            maxHeight: "70%",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: COLORS.neonCyan + "1f",
            backgroundColor: COLORS.cardElevated,
            paddingHorizontal: 14,
            paddingTop: 14,
            paddingBottom: 14,
            gap: 12,
            shadowColor: "#000",
            shadowOpacity: 0.45,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: COLORS.neonCyan + "16",
                    borderWidth: 1,
                    borderColor: COLORS.neonCyan + "35",
                  }}
                >
                  <Repeat2 size={15} color={COLORS.neonCyan} />
                </View>
                <View>
                  <Text style={{ fontFamily: FONTS.display, fontSize: 19, color: COLORS.foreground }}>ROUTINES</Text>
                  <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.mutedForeground }}>
                    Auto-added to your task list each day
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    backgroundColor: COLORS.neonCyan + "14",
                    borderWidth: 1,
                    borderColor: COLORS.neonCyan + "2e",
                  }}
                >
                  <Text style={{ fontFamily: FONTS.display, fontSize: 10, color: COLORS.neonCyan, letterSpacing: 1 }}>
                    {activeCount} ACTIVE
                  </Text>
                </View>
                {pausedCount > 0 ? (
                  <View
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      backgroundColor: COLORS.secondary,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text
                      style={{ fontFamily: FONTS.display, fontSize: 10, color: COLORS.mutedForeground, letterSpacing: 1 }}
                    >
                      {pausedCount} PAUSED
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.secondary,
              }}
            >
              <X size={18} color={COLORS.mutedForeground} />
            </Pressable>
          </View>

          {routines.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 26 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: COLORS.neonCyan + "10",
                  borderWidth: 1,
                  borderColor: COLORS.neonCyan + "25",
                }}
              >
                <Repeat2 size={22} color={COLORS.neonCyan} />
              </View>
              <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.mutedForeground, textAlign: "center" }}>
                Use the repeat button beside the task input to create a daily routine.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 7, paddingBottom: 2 }}
              showsVerticalScrollIndicator={routines.length > 4}
            >
              {routines.map((routine) => (
                <View
                  key={routine.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                    minHeight: 48,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: routine.active ? COLORS.neonCyan + "55" : COLORS.border,
                    backgroundColor: routine.active ? COLORS.neonCyan + "10" : COLORS.secondary + "b3",
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: routine.active ? COLORS.neonCyan + "18" : COLORS.border,
                    }}
                  >
                    <Repeat2 size={14} color={routine.active ? COLORS.neonCyan : COLORS.mutedForeground} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: FONTS.bodyMedium,
                      fontSize: 14,
                      color: routine.active ? COLORS.foreground : COLORS.mutedForeground,
                    }}
                    numberOfLines={2}
                  >
                    {routine.text}
                  </Text>
                  <Pressable
                    onPress={() => onToggle(routine)}
                    hitSlop={10}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: COLORS.secondary,
                    }}
                  >
                    {routine.active ? (
                      <PauseCircle size={16} color={COLORS.mutedForeground} />
                    ) : (
                      <PlayCircle size={16} color={COLORS.success} />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => onDelete(routine)}
                    hitSlop={10}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: COLORS.secondary,
                    }}
                  >
                    <Trash2 size={15} color={COLORS.mutedForeground} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          {routines.length > 0 ? (
            <View
              style={{
                marginTop: "auto",
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
                paddingTop: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  lineHeight: 17,
                  color: COLORS.mutedForeground,
                  textAlign: "center",
                }}
              >
                Active routines create a fresh task each day.
              </Text>
            </View>
          ) : null}
        </MotiView>
      </View>
    </Modal>
  );
}

export default RoutinesModal;
