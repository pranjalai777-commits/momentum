// Exact HSL values from the web wireframe (Wireframe/ignite-5-go-main/src/index.css),
// converted to 6-digit hex for React Native. Keep 6-digit — code concatenates alpha
// suffixes like COLORS.neonCyan + "55".
export const COLORS = {
  background: "#08090d", // hsl(230 25% 4%)
  foreground: "#f7f7f7", // hsl(0 0% 97%)
  card: "#101119", // hsl(230 22% 8%)
  cardElevated: "#14161f", // mobile-only surfaces (between card and secondary)
  secondary: "#181b25", // hsl(230 20% 12%) — web inputs/buttons/picker cells
  muted: "#15161e", // hsl(230 18% 10%)
  mutedForeground: "#585c74", // hsl(230 14% 40%)
  border: "#1b1d27", // hsl(230 18% 13%)
  borderSubtle: "#15171f",

  primary: "#a64dff", // hsl(270 100% 65%) — same as neonPurple
  neonCyan: "#00d5ff", // hsl(190 100% 50%)
  neonPurple: "#a64dff", // hsl(270 100% 65%)
  neonPink: "#ff3399", // hsl(330 100% 60%)

  heatCold: "#2e73b8", // hsl(210 60% 45%)
  heatWarm: "#ffc61a", // hsl(45 100% 55%)
  heatHot: "#ff8229", // hsl(25 100% 58%)
  heatFire: "#ff4529", // hsl(8 100% 58%)

  success: "#17cf91", // hsl(160 80% 45%)
  successDark: "#0a2014", // dark tint for done-task background
  dailyBonus: "#ffc61a", // hsl(45 100% 55%)

  // Turbo mode token overrides (web .turbo-mode CSS class)
  turboBackground: "#0b0811", // hsl(260 35% 5%)
  turboCyan: "#1affff", // hsl(180 100% 55%)
  turboPurple: "#cc66ff", // hsl(280 100% 70%)
  turboPink: "#ff4d88", // hsl(340 100% 65%)

  // Glass / overlay surfaces
  glassOverlay: "rgba(8,9,13,0.96)",
  glassCard: "rgba(16,17,25,0.92)",
} as const;

// Gradient presets for LinearGradient — exact web gradient stops
export const GRADIENTS = {
  cyanPurple: ["#00d5ff", "#a64dff"] as const, // linear-gradient(135deg, neon-cyan, neon-purple)
  successCyan: ["#17cf91", "#00d5ff"] as const, // DONE button / +XP / ceremony epic
  firePink: ["#ff4529", "#ff3399"] as const, // urgent timer (heat-fire → neon-pink)
  hotFire: ["#ff8229", "#ff4529"] as const, // 2-min warning tier (heat-hot → heat-fire)
  turboReady: ["#ffc61a", "#ff791a"] as const, // hsl(45 100% 55%) → hsl(25 100% 55%)
  turboActive: ["#ffc61a", "#ff3377", "#c44dff"] as const, // gold → hsl(340 100% 60%) → hsl(280 100% 65%)
  cardSubtle: ["#14161f", "#101119"] as const,
  headerGlow: ["rgba(0,213,255,0.18)", "rgba(166,77,255,0.10)", "rgba(8,9,13,0)"] as const,
  headerGlowTurbo: ["rgba(255,77,136,0.22)", "rgba(204,102,255,0.13)", "rgba(8,9,13,0)"] as const,
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
