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
    <View className="w-full h-[54px] relative">
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

      {/* Text input */}
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Add a task to crush..."
        placeholderTextColor={COLORS.mutedForeground}
        className="absolute inset-0 rounded-lg border border-border bg-card text-foreground pl-4 pr-[58px] font-sans text-[15px] z-[1]"
        returnKeyType="done"
      />

      {/* Add button — inside the input, absolutely positioned */}
      <Pressable
        onPress={submit}
        disabled={!hasText}
        className={`absolute right-2 top-2 w-[38px] h-[38px] rounded-md items-center justify-center z-[2] ${
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
  );
}

export default TaskInput;
