import { COLORS } from "@/constants/theme";
import { hapticCancel, hapticPickerSelect } from "@/lib/haptics";
import { playTick } from "@/lib/sounds";
import { Clock, Zap } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Dimensions, Pressable, Text, TextInput, View } from "react-native";
import { MotiView } from "moti";

const SCREEN_WIDTH = Dimensions.get("window").width;
const MODAL_HORIZONTAL_MARGIN = 40; // parent px-5 on both sides
const CARD_HORIZONTAL_PADDING = 40; // card paddingHorizontal: 20 on both sides
const CHIP_GAP = 8;
const COLS = 3;
const CARD_WIDTH = Math.min(400, SCREEN_WIDTH - MODAL_HORIZONTAL_MARGIN);
const GRID_WIDTH = CARD_WIDTH - CARD_HORIZONTAL_PADDING;
const CHIP_WIDTH = Math.floor((GRID_WIDTH - CHIP_GAP * (COLS - 1)) / COLS);

type TimerPickerProps = {
  taskText: string;
  onSetTimer: (minutes: number) => void;
  onCancel: () => void;
  isExtension?: boolean;
};

const QUICK_OPTIONS = [5, 10, 15, 25, 30, 45, 60];

function TimerPicker({ taskText, onSetTimer, onCancel, isExtension = false }: TimerPickerProps) {
  const [customMinutes, setCustomMinutes] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const customValue = useMemo(() => Number.parseInt(customMinutes, 10), [customMinutes]);
  const canSubmitCustom = Number.isInteger(customValue) && customValue > 0 && customValue <= 480;

  const pick = (min: number) => {
    playTick(1.15);
    hapticPickerSelect();
    setSelected(min);
    setTimeout(() => onSetTimer(min), 120);
  };

  return (
    <View className="absolute inset-0 z-[90] justify-center items-center bg-[rgba(6,10,22,0.96)] px-5">
      <MotiView
        from={{ opacity: 0, translateY: 28, scale: 0.97 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: "timing", duration: 280 }}
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 24,
          backgroundColor: COLORS.cardElevated,
          borderWidth: 1,
          borderColor: COLORS.border,
          paddingHorizontal: 20,
          paddingVertical: 24,
          gap: 20,
        }}
      >
        <View className="items-center gap-2">
          <View
            className="w-[60px] h-[60px] rounded-full justify-center items-center bg-[#081c2a]"
            style={{
              borderWidth: 1.5,
              borderColor: COLORS.neonCyan + "44",
              shadowColor: COLORS.neonCyan,
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Clock size={26} color={COLORS.neonCyan} />
          </View>
          <Text className="text-foreground font-display text-[22px]">
            {isExtension ? "How much extra time?" : "Set your timer"}
          </Text>
          <Text className="text-muted-foreground font-sans text-[13px] max-w-[85%] text-center" numberOfLines={1}>
            {taskText}
          </Text>
          {!isExtension ? (
            <View className="flex-row items-center gap-[5px]">
              <Zap size={12} color={COLORS.neonCyan} />
              <Text className="text-muted-foreground font-sans text-[12px]">
                Beat the clock for <Text className="text-neon-cyan font-sans-bold">bonus XP</Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Chip grid — flexWrap in style to avoid NativeWind className conflicts */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: CHIP_GAP }}>
          {QUICK_OPTIONS.map((min) => {
            const isSelected = selected === min;
            return (
              <Pressable
                key={min}
                onPress={() => pick(min)}
                style={[
                  {
                    width: CHIP_WIDTH,
                    height: 48,
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 1,
                    backgroundColor: isSelected ? "#081c2a" : COLORS.muted,
                    borderColor: isSelected ? COLORS.neonCyan : COLORS.border,
                    flexShrink: 0,
                  },
                  isSelected && {
                    shadowColor: COLORS.neonCyan,
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}
              >
                <Text
                  className={`font-display text-[14px] ${isSelected ? "text-neon-cyan" : "text-foreground"}`}
                >
                  {isExtension ? `+${min}m` : min < 60 ? `${min}m` : `${min / 60}h`}
                </Text>
              </Pressable>
            );
          })}
          <TextInput
            value={customMinutes}
            onChangeText={setCustomMinutes}
            keyboardType="number-pad"
            placeholder="?"
            placeholderTextColor={COLORS.mutedForeground}
            style={{
              width: CHIP_WIDTH,
              height: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.muted,
              color: COLORS.foreground,
              textAlign: "center",
              fontFamily: "SpaceGrotesk_700Bold",
              fontSize: 14,
              flexShrink: 0,
            }}
          />
        </View>

        {canSubmitCustom ? (
          <Pressable
            onPress={() => pick(customValue)}
            className="flex-row items-center justify-center gap-2 h-[50px] rounded-lg bg-neon-cyan"
            style={({ pressed }) => [
              {
                shadowColor: COLORS.neonCyan,
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
              },
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <Zap size={15} color="#07111e" />
            <Text className="text-[#07111e] font-display text-[15px]">
              {isExtension ? `Add ${customValue} min` : `Start ${customValue} min timer`}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => {
            hapticCancel();
            onCancel();
          }}
          className="items-center py-2"
        >
          <Text className="text-muted-foreground font-sans text-[15px]">Cancel</Text>
        </Pressable>
      </MotiView>
    </View>
  );
}

export default TimerPicker;
