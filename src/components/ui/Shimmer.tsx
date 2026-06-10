import { useState } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

/**
 * White shimmer sweep — web's `ceremony-shimmer` keyframe:
 * translateX(-100%) → translateX(200%), 1.5s ease-in-out infinite.
 * Place inside an overflow-hidden bar fill.
 */
function Shimmer({ duration = 1500 }: { duration?: number }) {
  const [containerWidth, setContainerWidth] = useState(0);

  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, overflow: "hidden" }}
    >
      {containerWidth > 0 ? (
        <MotiView
          from={{ translateX: -containerWidth }}
          animate={{ translateX: containerWidth * 2 }}
          transition={{ type: "timing", duration, loop: true, repeatReverse: false }}
          style={{ position: "absolute", top: 0, bottom: 0, width: containerWidth }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </MotiView>
      ) : null}
    </View>
  );
}

export default Shimmer;
