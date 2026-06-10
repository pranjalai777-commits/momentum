import { useMemo, useState } from "react";
import { Text as RNText, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { FONTS } from "@/constants/theme";

let gradientIdCounter = 0;

type GradientTextProps = {
  text: string;
  fontSize: number;
  /** Gradient stops, rendered 135deg (top-left → bottom-right) like the web's linear-gradient(135deg, …) */
  colors: readonly string[];
  /** Per-stop opacity, e.g. the web title's second stop is neon-cyan / 0.7 */
  stopOpacities?: readonly number[];
  fontFamily?: string;
  letterSpacing?: number;
  /** Fixed width skips async text measurement — use for per-second content like countdown digits */
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Gradient-filled text via react-native-svg (no MaskedView native dep).
 * Matches the web's `background-clip: text` gradient headings.
 */
function GradientText({
  text,
  fontSize,
  colors,
  stopOpacities,
  fontFamily = FONTS.display,
  letterSpacing = 0,
  width,
  height,
  style,
}: GradientTextProps) {
  const gradientId = useMemo(() => `gt-${++gradientIdCounter}`, []);
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(width ?? null);

  const boxWidth = width ?? measuredWidth;
  const boxHeight = height ?? Math.ceil(fontSize * 1.25);
  // Baseline placed so cap-height text sits visually centered in the box
  const baselineY = boxHeight / 2 + fontSize * 0.36;

  return (
    <View style={style}>
      {width == null ? (
        <RNText
          accessible={false}
          numberOfLines={1}
          onLayout={(e) => setMeasuredWidth(Math.ceil(e.nativeEvent.layout.width))}
          style={{
            fontFamily,
            fontSize,
            letterSpacing,
            position: "absolute",
            opacity: 0,
          }}
        >
          {text}
        </RNText>
      ) : null}
      {boxWidth != null ? (
        <Svg width={boxWidth} height={boxHeight}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {colors.map((color, i) => (
                <Stop
                  key={`${color}-${i}`}
                  offset={`${colors.length === 1 ? 0 : (i / (colors.length - 1)) * 100}%`}
                  stopColor={color}
                  stopOpacity={stopOpacities?.[i] ?? 1}
                />
              ))}
            </LinearGradient>
          </Defs>
          <SvgText
            x={boxWidth / 2}
            y={baselineY}
            textAnchor="middle"
            fontFamily={fontFamily}
            fontSize={fontSize}
            letterSpacing={letterSpacing}
            fill={`url(#${gradientId})`}
          >
            {text}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}

export default GradientText;
