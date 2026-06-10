import { Easing } from "react-native-reanimated";

// Web wireframe signature curves (Wireframe/ignite-5-go-main/src/index.css)
// cubic-bezier(0.34, 1.56, 0.64, 1) — bouncy overshoot used by bar fills, pops, presses
export const springy = Easing.bezier(0.34, 1.56, 0.64, 1);
// cubic-bezier(0.22, 1, 0.36, 1) — ceremony XP bar fill
export const fillCurve = Easing.bezier(0.22, 1, 0.36, 1);
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.ease);
