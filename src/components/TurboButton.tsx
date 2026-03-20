import { COLORS } from "@/constants/theme";
import { hapticTurboActivate } from "@/lib/haptics";
import { canActivateTurbo, getTurboRemainingMs, isTurboActive } from "@/lib/momentum";
import { playEpicSuccess } from "@/lib/sounds";
import type { MomentumData } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { Zap } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type TurboButtonProps = {
  data: MomentumData;
  onActivate: () => void;
};

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TurboButton({ data, onActivate }: TurboButtonProps) {
  const active = isTurboActive(data);
  const canUse = canActivateTurbo(data);
  const [remaining, setRemaining] = useState(() => getTurboRemainingMs(data));
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (!active) {
      glowOpacity.value = 0.5;
      return;
    }
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    const timer = setInterval(() => setRemaining(getTurboRemainingMs(data)), 1000);
    return () => clearInterval(timer);
  }, [active, data, glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  // LinearGradient from expo-linear-gradient is NOT an RN primitive and does not
  // support NativeWind className. All styles must be passed via the style prop.
  const pillStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  };

  if (active) {
    return (
      <Animated.View
        style={[
          glowStyle,
          {
            borderRadius: 9999,
            shadowColor: "#7c3aed",
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <LinearGradient
          colors={["#22d3ee", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={pillStyle}
        >
          <Zap size={14} color="#ffffff" />
          <Text className="text-white font-display text-[13px] tracking-[1.2px]">
            TURBO {formatTime(remaining)}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (!canUse) {
    return (
      <View className="flex-row items-center gap-[6px] rounded-full px-4 py-[9px] border bg-[#131929] border-[#1e2a45]">
        <Zap size={14} color={COLORS.mutedForeground} />
        <Text className="text-muted-foreground font-display text-[12px] tracking-[1.1px]">TURBO USED</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => {
        playEpicSuccess();
        hapticTurboActivate();
        onActivate();
      }}
      style={({ pressed }) => [
        {
          borderRadius: 9999,
          shadowColor: "#00d9f5",
          shadowOpacity: 0.55,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 0 },
        },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <LinearGradient
        colors={["#00d9f5", "#0099bb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={pillStyle}
      >
        <Zap size={15} color="#071018" />
        <Text className="text-[#071018] font-display text-[14px] tracking-[1.3px]">TURBO</Text>
      </LinearGradient>
    </Pressable>
  );
}

export default TurboButton;
