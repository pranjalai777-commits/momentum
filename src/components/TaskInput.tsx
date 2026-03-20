import { BORDER_RADIUS, COLORS } from "@/constants/theme";
import { hapticTaskAdd } from "@/lib/haptics";
import { Plus } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

type TaskInputProps = {
  onAdd: (text: string) => void;
};

function TaskInput({ onAdd }: TaskInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const borderOpacity = useSharedValue(0);

  const handleFocus = () => {
    borderOpacity.value = withTiming(1, { duration: 200 });
  };
  const handleBlur = () => {
    borderOpacity.value = withTiming(0, { duration: 200 });
  };

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    hapticTaskAdd();
    onAdd(value);
    setText("");
    inputRef.current?.focus();
  };

  const hasText = text.trim().length > 0;

  return (
    <View className="w-full relative" style={{ height: 54 }}>
      {/* Animated focus glow ring */}
      <Animated.View
        pointerEvents="none"
        className="absolute z-0"
        style={[
          animatedGlow,
          {
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: BORDER_RADIUS.lg + 2,
            borderWidth: 1.5,
            borderColor: COLORS.neonCyan,
            shadowColor: COLORS.neonCyan,
            shadowOpacity: 0.4,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />

      {/* Row: input + button, both centred via flexbox */}
      <View
        className="absolute inset-0 flex-row items-center rounded-lg border border-border bg-card px-3 z-[1]"
        style={{ gap: 8 }}
      >
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Add a task to crush..."
          placeholderTextColor={COLORS.mutedForeground}
          returnKeyType="done"
          className="flex-1 text-foreground font-sans text-[15px]"
          style={{
            height: 38,
            paddingVertical: 0,     // removes iOS default internal padding
            textAlignVertical: "center",
            includeFontPadding: false,
          }}
        />

        <Pressable
          onPress={submit}
          disabled={!hasText}
          className={`w-[38px] h-[38px] rounded-md items-center justify-center ${
            hasText ? "bg-neon-cyan" : "bg-card-elevated border border-border"
          }`}
          style={({ pressed }) => ({
            shadowColor: hasText ? COLORS.neonCyan : undefined,
            shadowOpacity: hasText ? 0.5 : 0,
            shadowRadius: hasText ? 8 : 0,
            shadowOffset: { width: 0, height: 0 },
            transform: pressed ? [{ scale: 0.9 }] : [],
          })}
        >
          <Plus
            color={hasText ? "#071018" : COLORS.mutedForeground}
            size={20}
            strokeWidth={2.8}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default TaskInput;
