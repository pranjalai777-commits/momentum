// Exact HSL values from the web wireframe, converted to hex for React Native
export const COLORS = {
  background: "#060a16", // hsl(230 25% 4%)
  foreground: "#f7f7f7", // hsl(0 0% 97%)
  card: "#0d1120", // hsl(230 22% 8%)
  cardElevated: "#111827", // slightly lighter card for inner panels
  muted: "#0d1020", // hsl(230 18% 10%)
  mutedForeground: "#6b7a9e", // brightened from #3d4466 for better readability
  border: "#1e2a45", // brightened from #141b2e for better visibility
  borderSubtle: "#141b2e",

  neonCyan: "#00d9f5", // hsl(190 100% 50%)
  neonPurple: "#8833ff", // hsl(270 100% 65%)
  neonPink: "#ff1ab3", // hsl(330 100% 60%)

  heatCold: "#2e6fb3", // hsl(210 60% 45%)
  heatWarm: "#f0ad00", // hsl(45 100% 55%)
  heatHot: "#f07000", // hsl(25 100% 58%)
  heatFire: "#f03000", // hsl(8 100% 58%)

  success: "#22c97e", // brightened green for better visibility
  successDark: "#0d2318", // dark tint for done-task background
  dailyBonus: "#f0ad00",

  turboBackground: "#09071a",
  turboCyan: "#00f5e8",
  turboPurple: "#9933ff",
  turboPink: "#ff1a80",

  // Glass / overlay surfaces
  glassOverlay: "rgba(6,10,22,0.96)",
  glassCard: "rgba(13,17,32,0.92)",
} as const;

// Gradient presets for LinearGradient
export const GRADIENTS = {
  cyanPurple: ["#00d9f5", "#8833ff"] as const,
  pinkFire: ["#ff1ab3", "#f03000"] as const,
  successGreen: ["#22c97e", "#0ea568"] as const,
  turboActive: ["#9933ff", "#ff1a80"] as const,
  turboReady: ["#00d9f5", "#0099bb"] as const,
  cardSubtle: ["#111827", "#0d1120"] as const,
  headerGlow: ["rgba(0,217,245,0.18)", "rgba(136,51,255,0.10)", "rgba(6,10,22,0)"] as const,
  headerGlowTurbo: ["rgba(255,26,128,0.22)", "rgba(153,51,255,0.13)", "rgba(6,10,22,0)"] as const,
} as const;

export const FONTS = {
  display: "SpaceGrotesk_700Bold",
  displayMedium: "SpaceGrotesk_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodyBold: "Inter_700Bold",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

