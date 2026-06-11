import { useState } from "react";
import { Pressable } from "react-native";
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from "react-native";

// NativeWind's JSX interop drops function-form `style` props on Pressable, so
// any static styles (borderRadius, background, padding…) passed via
// `style={({ pressed }) => …}` never reach the native view. This wrapper keeps
// `style` as a plain value and reproduces pressed-state styling with
// onPressIn/onPressOut instead. Use it anywhere press feedback is needed.
type ScalePressableProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  className?: string;
};

function ScalePressable({ style, pressedStyle, onPressIn, onPressOut, ...rest }: ScalePressableProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[style, pressed ? pressedStyle : null]}
    />
  );
}

export default ScalePressable;
