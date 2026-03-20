import { COLORS } from "@/constants/theme";
import { hapticExtend, hapticGiveUp, hapticSuccess } from "@/lib/haptics";
import { playAlarm, playExtend, playSmallReward } from "@/lib/sounds";
import { CheckCircle2, Clock3, Plus, XCircle } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

type TimeUpDialogProps = {
  taskText: string;
  onDone: () => void;
  onExtend: () => void;
  onGiveUp: () => void;
};

function TimeUpDialog({ taskText, onDone, onExtend, onGiveUp }: TimeUpDialogProps) {
  const [showReason, setShowReason] = useState(false);

  useEffect(() => {
    playAlarm();
  }, []);

  const handleGiveUp = () => {
    playSmallReward();
    hapticGiveUp();
    setShowReason(true);
    setTimeout(onGiveUp, 2200);
  };

  if (showReason) {
    return (
      <View className="absolute inset-0 z-[95] justify-center items-center bg-[rgba(6,10,22,0.95)] px-5">
        <MotiView
          from={{ opacity: 0, scale: 0.92, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 300 }}
          style={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#2f4161",
            backgroundColor: COLORS.card,
            alignItems: "center",
            paddingHorizontal: 22,
            paddingVertical: 28,
            gap: 8,
          }}
        >
          <Text className="text-[34px]">💪</Text>
          <Text className="text-foreground font-display text-[24px]">You still tried!</Text>
          <Text className="text-muted-foreground font-sans text-[13px] text-center">
            Every attempt builds momentum. Small XP awarded for effort.
          </Text>
          <Text className="text-neon-cyan font-display text-[20px]">+5 XP 🌱</Text>
        </MotiView>
      </View>
    );
  }

  return (
    <View className="absolute inset-0 z-[95] justify-center items-center bg-[rgba(6,10,22,0.95)] px-5">
      <MotiView
        from={{ opacity: 0, scale: 0.94, translateY: 20 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 260 }}
        style={{
          width: "100%",
          maxWidth: 390,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: "#4a2020",
          backgroundColor: COLORS.cardElevated,
          padding: 20,
          gap: 22,
        }}
      >
        <View className="items-center gap-[6px]">
          <View
            className="w-[88px] h-[88px] rounded-full justify-center items-center bg-[#2a1518] border-2 border-[#8a1a28]"
            style={{
              shadowColor: COLORS.heatFire,
              shadowOpacity: 0.4,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Clock3 size={34} color={COLORS.heatFire} />
          </View>
          <Text className="text-foreground font-display text-[30px]">TIME&apos;S UP!</Text>
          <Text className="text-muted-foreground font-sans text-[13px] max-w-[90%] text-center" numberOfLines={1}>
            {taskText}
          </Text>
          <Text className="text-muted-foreground font-sans text-[13px]">Did you finish the task?</Text>
        </View>

        <View className="gap-[10px]">
          <Pressable
            onPress={() => {
              playSmallReward();
              hapticSuccess();
              onDone();
            }}
            className="h-14 rounded-lg bg-success items-center justify-center flex-row gap-[10px]"
            style={({ pressed }) => [
              {
                shadowColor: COLORS.success,
                shadowOpacity: 0.4,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 0 },
              },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <CheckCircle2 size={20} color="#061a10" />
            <Text className="text-[#061a10] font-display text-[17px]">Yes, I Finished It!</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              playExtend();
              hapticExtend();
              onExtend();
            }}
            className="h-[52px] rounded-lg bg-[#061824] items-center justify-center flex-row gap-2"
            style={({ pressed }) => [
              {
                borderWidth: 1.5,
                borderColor: COLORS.neonCyan + "55",
              },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Plus size={18} color={COLORS.neonCyan} />
            <Text className="text-neon-cyan font-display text-[15px]">Need More Time</Text>
          </Pressable>

          <Pressable
            onPress={handleGiveUp}
            className="h-[46px] rounded-lg bg-muted border border-border items-center justify-center flex-row gap-[6px]"
            style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }] }}
          >
            <XCircle size={16} color={COLORS.mutedForeground} />
            <Text className="text-muted-foreground font-sans-medium text-[13px]">I Couldn&apos;t Finish</Text>
          </Pressable>
        </View>
      </MotiView>
    </View>
  );
}

export default TimeUpDialog;
