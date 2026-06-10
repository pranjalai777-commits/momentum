import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";
import { hapticTaskAdd } from "@/lib/haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

type TaskInputProps = {
  onAdd: (text: string) => void;
};

function TaskInput({ onAdd }: TaskInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

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

      {/* Web: h-11 w-11 rounded-xl gradient cyan→purple, disabled opacity-30 */}
      <Pressable
        onPress={submit}
        disabled={!hasText}
        style={({ pressed }) => [
          { borderRadius: 12, overflow: "hidden", opacity: hasText ? 1 : 0.3 },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <LinearGradient
          colors={GRADIENTS.cyanPurple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
        >
          <Plus color="#ffffff" size={20} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default TaskInput;
