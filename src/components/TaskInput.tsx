import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";
import ScalePressable from "@/components/ui/ScalePressable";
import { hapticTaskAdd } from "@/lib/haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, Repeat2 } from "lucide-react-native";
import { useRef, useState } from "react";
import { TextInput, View } from "react-native";

type TaskInputProps = {
  onAdd: (text: string, repeatDaily: boolean) => void;
};

function TaskInput({ onAdd }: TaskInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [repeatDaily, setRepeatDaily] = useState(false);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    hapticTaskAdd();
    onAdd(value, repeatDaily);
    setText("");
    inputRef.current?.focus();
  };

  const hasText = text.trim().length > 0;

  return (
    <View className="w-full flex-row" style={{ gap: 8 }}>
      {/* Web: h-11 px-4 rounded-xl bg-secondary border-border, focus:border-primary/50 */}
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Add a task to crush..."
        placeholderTextColor={COLORS.mutedForeground}
        returnKeyType="done"
        className="flex-1 text-foreground"
        style={{
          height: 44,
          paddingHorizontal: 16,
          paddingVertical: 0,
          borderRadius: 12,
          backgroundColor: COLORS.secondary,
          borderWidth: 1,
          borderColor: focused ? COLORS.primary + "80" : COLORS.border,
          fontFamily: FONTS.body,
          fontSize: 14,
          textAlignVertical: "center",
          includeFontPadding: false,
        }}
      />

      <ScalePressable
        onPress={() => setRepeatDaily((value) => !value)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: repeatDaily ? COLORS.neonCyan + "1f" : COLORS.secondary,
          borderWidth: 1,
          borderColor: repeatDaily ? COLORS.neonCyan + "80" : COLORS.border,
        }}
        pressedStyle={{ transform: [{ scale: 0.95 }] }}
      >
        <Repeat2 color={repeatDaily ? COLORS.neonCyan : COLORS.mutedForeground} size={19} />
      </ScalePressable>

      {/* Web: h-11 w-11 rounded-xl gradient cyan→purple, disabled opacity-30 */}
      <ScalePressable
        onPress={submit}
        disabled={!hasText}
        style={{ borderRadius: 12, overflow: "hidden", opacity: hasText ? 1 : 0.3 }}
        pressedStyle={{ transform: [{ scale: 0.95 }] }}
      >
        <LinearGradient
          colors={GRADIENTS.cyanPurple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
        >
          <Plus color="#ffffff" size={20} />
        </LinearGradient>
      </ScalePressable>
    </View>
  );
}

export default TaskInput;
