import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";
import { springy } from "@/lib/easing";
import { hapticExtend, hapticGiveUp, hapticSuccess } from "@/lib/haptics";
import { playAlarm, playExtend, playSmallReward } from "@/lib/sounds";
import GradientText from "@/components/ui/GradientText";
import RadialGlow from "@/components/ui/RadialGlow";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, Clock, Plus, XCircle } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type TimeUpDialogProps = {
  taskText: string;
  onDone: () => void;
  onExtend: () => void;
  onGiveUp: () => void;
};

function TimeUpDialog({ taskText, onDone, onExtend, onGiveUp }: TimeUpDialogProps) {
  const [showReason, setShowReason] = useState(false);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    playAlarm();
    // Web `shake` keyframe: translateX 0 → -4 → 4 → -3 → 3 → 0, 0.4s
    shakeX.value = withSequence(
      withTiming(-4, { duration: 80 }),
      withTiming(4, { duration: 80 }),
      withTiming(-3, { duration: 80 }),
      withTiming(3, { duration: 80 }),
      withTiming(0, { duration: 80 })
    );
  }, [shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleGiveUp = () => {
    playSmallReward();
    hapticGiveUp();
    setShowReason(true);
    setTimeout(onGiveUp, 2500);
  };

  if (showReason) {
    return (
      <View
        className="absolute inset-0 z-[95] justify-center items-center"
        style={{ backgroundColor: "rgba(8,9,13,0.95)" }}
      >
        <MotiView
          from={{ opacity: 0, translateY: 60, scale: 0.8 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: "timing", duration: 700, easing: springy }}
          style={{ alignItems: "center", gap: 16, paddingHorizontal: 24, maxWidth: 384 }}
        >
          <View style={{ width: 80, height: 80, borderRadius: 9999, overflow: "hidden" }}>
            <LinearGradient
              colors={[COLORS.neonPurple + "33", COLORS.neonCyan + "26"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ fontSize: 30, lineHeight: 38 }}>💪</Text>
            </LinearGradient>
          </View>
          <Text style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.foreground }}>
            You Still Tried!
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              lineHeight: 22,
              color: COLORS.mutedForeground,
              textAlign: "center",
            }}
          >
            Every attempt builds your momentum. You showed up, and that&apos;s what matters.{"\n"}
            <Text style={{ color: COLORS.neonCyan }}>Small XP awarded for effort.</Text>
          </Text>
          <MotiView
            from={{ opacity: 0, scale: 0.5, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, easing: springy }}
          >
            <GradientText
              text="+5 XP 🌱"
              fontSize={18}
              fontFamily={FONTS.display}
              colors={[COLORS.neonPurple, COLORS.neonCyan]}
            />
          </MotiView>
        </MotiView>
      </View>
    );
  }

  return (
    <View
      className="absolute inset-0 z-[95] justify-center items-center"
      style={{ backgroundColor: "rgba(8,9,13,0.95)" }}
    >
      {/* Pulsing urgency background */}
      <RadialGlow
        color={COLORS.heatFire}
        size={500}
        opacity={0.08}
        pulse
        pulseDuration={2000}
        style={{ position: "absolute", alignSelf: "center" }}
      />

      <MotiView
        from={{ opacity: 0, translateY: 60, scale: 0.8 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: "timing", duration: 700, easing: springy }}
        style={{ width: "100%", maxWidth: 384, paddingHorizontal: 24, alignItems: "center", gap: 24 }}
      >
        {/* Alarm icon */}
        <Animated.View style={shakeStyle}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 9999,
              overflow: "hidden",
              shadowColor: COLORS.heatFire,
              shadowOpacity: 0.2,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <LinearGradient
              colors={[COLORS.heatFire + "40", COLORS.neonPink + "33"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Clock size={36} color={COLORS.heatFire} />
            </LinearGradient>
          </View>
        </Animated.View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={{ fontFamily: FONTS.display, fontSize: 24, color: COLORS.foreground }}>
            TIME&apos;S UP!
          </Text>
          <Text
            style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.mutedForeground, maxWidth: 250 }}
            numberOfLines={1}
          >
            {taskText}
          </Text>
          <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.mutedForeground + "b3", marginTop: 8 }}>
            Did you finish the task?
          </Text>
        </View>

        {/* Action buttons */}
        <View style={{ width: "100%", gap: 12 }}>
          <Pressable
            onPress={() => {
              playSmallReward();
              hapticSuccess();
              onDone();
            }}
            style={({ pressed }) => [
              {
                borderRadius: 12,
                overflow: "hidden",
                shadowColor: COLORS.success,
                shadowOpacity: 0.3,
                shadowRadius: 25,
                shadowOffset: { width: 0, height: 0 },
              },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={GRADIENTS.successCyan}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={20} color="#ffffff" />
              <Text style={{ fontFamily: FONTS.display, fontSize: 16, color: "#ffffff" }}>
                Yes, I Finished It!
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => {
              playExtend();
              hapticExtend();
              onExtend();
            }}
            style={({ pressed }) => [
              {
                paddingVertical: 16,
                borderRadius: 12,
                backgroundColor: COLORS.secondary,
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Plus size={20} color={COLORS.neonCyan} />
            <Text style={{ fontFamily: FONTS.display, fontSize: 16, color: COLORS.neonCyan }}>
              Need More Time
            </Text>
          </Pressable>

          <Pressable
            onPress={handleGiveUp}
            style={({ pressed }) => [
              {
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: COLORS.muted,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <XCircle size={16} color={COLORS.mutedForeground} />
            <Text style={{ fontFamily: FONTS.display, fontSize: 14, color: COLORS.mutedForeground }}>
              I Couldn&apos;t Finish
            </Text>
          </Pressable>
        </View>
      </MotiView>
    </View>
  );
}

export default TimeUpDialog;
