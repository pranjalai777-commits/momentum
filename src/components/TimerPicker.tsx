import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";
import ScalePressable from "@/components/ui/ScalePressable";
import { hapticCancel, hapticPickerSelect } from "@/lib/haptics";
import { playTick } from "@/lib/sounds";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Zap } from "lucide-react-native";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import { Dimensions, Pressable, Text, TextInput, View } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_MAX_WIDTH = 384; // web max-w-sm
const CONTENT_PADDING = 48; // px-6 both sides
const CHIP_GAP = 8;
const COLS = 4; // web grid-cols-4
const GRID_WIDTH = Math.min(CONTENT_MAX_WIDTH, SCREEN_WIDTH) - CONTENT_PADDING;
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
  const customValue = useMemo(() => Number.parseInt(customMinutes, 10), [customMinutes]);
  const showCustomSubmit = Number.isInteger(customValue) && customValue > 0;

  const pick = (min: number) => {
    if (min <= 0 || min > 480) return;
    playTick(1.2);
    hapticPickerSelect();
    onSetTimer(min);
  };

  const chipStyle = {
    width: CHIP_WIDTH,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.border,
  };

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 600 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 90,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(8,9,13,0.95)",
      }}
    >
      <View style={{ width: "100%", maxWidth: CONTENT_MAX_WIDTH, paddingHorizontal: 24, alignItems: "center", gap: 24 }}>
        {/* Header */}
        <View style={{ alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 9999,
              overflow: "hidden",
              shadowColor: COLORS.neonCyan,
              shadowOpacity: 0.15,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <LinearGradient
              colors={[COLORS.neonCyan + "33", COLORS.neonPurple + "33"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Clock size={28} color={COLORS.neonCyan} />
            </LinearGradient>
          </View>
          <Text style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.foreground, textAlign: "center" }}>
            {isExtension ? "How much extra time?" : "Set Your Timer"}
          </Text>
          <Text
            style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.mutedForeground, textAlign: "center", maxWidth: "85%" }}
            numberOfLines={1}
          >
            {taskText}
          </Text>
          {!isExtension ? (
            <Text style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.mutedForeground + "b3", textAlign: "center" }}>
              Beat the clock for <Text style={{ color: COLORS.neonCyan }}>bonus XP</Text> ⚡
            </Text>
          ) : null}
        </View>

        {/* Quick picks — web grid-cols-4 with custom "?" cell */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: CHIP_GAP, width: "100%" }}>
          {QUICK_OPTIONS.map((min) => (
            <ScalePressable
              key={min}
              onPress={() => pick(min)}
              style={chipStyle}
              pressedStyle={{ transform: [{ scale: 0.95 }] }}
            >
              <Text style={{ fontFamily: FONTS.display, fontSize: 14, color: COLORS.foreground }}>
                {isExtension ? `+ ${min}m` : min < 60 ? `${min}m` : `${min / 60}h`}
              </Text>
            </ScalePressable>
          ))}
          <TextInput
            value={customMinutes}
            onChangeText={setCustomMinutes}
            keyboardType="number-pad"
            placeholder="?"
            placeholderTextColor={COLORS.mutedForeground + "80"}
            style={[
              chipStyle,
              {
                paddingVertical: 0,
                height: 43, // match chip height (12 + 19 line + 12)
                color: COLORS.foreground,
                textAlign: "center",
                fontFamily: FONTS.display,
                fontSize: 14,
              },
            ]}
          />
        </View>

        {/* Custom submit */}
        {showCustomSubmit ? (
          <ScalePressable
            onPress={() => pick(customValue)}
            style={{
              width: "100%",
              borderRadius: 12,
              overflow: "hidden",
              shadowColor: COLORS.neonCyan,
              shadowOpacity: 0.25,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
            }}
            pressedStyle={{ transform: [{ scale: 0.98 }] }}
          >
            <LinearGradient
              colors={GRADIENTS.cyanPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Zap size={16} color="#ffffff" />
              <Text style={{ fontFamily: FONTS.display, fontSize: 16, color: "#ffffff" }}>
                {isExtension ? `Add ${customValue} min to timer` : `Start ${customValue} min timer`}
              </Text>
            </LinearGradient>
          </ScalePressable>
        ) : null}

        <Pressable
          onPress={() => {
            hapticCancel();
            onCancel();
          }}
        >
          <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.mutedForeground }}>Cancel</Text>
        </Pressable>
      </View>
    </MotiView>
  );
}

export default TimerPicker;
