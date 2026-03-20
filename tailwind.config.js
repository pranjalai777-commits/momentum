/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-bold": ["Inter_700Bold"],
        display: ["SpaceGrotesk_700Bold"],
        "display-medium": ["SpaceGrotesk_600SemiBold"],
      },
      colors: {
        // Base surfaces
        background: "#060a16",
        foreground: "#f7f7f7",
        card: "#0d1120",
        "card-elevated": "#111827",
        muted: "#0d1020",
        "muted-foreground": "#6b7a9e",
        border: "#1e2a45",
        "border-subtle": "#141b2e",
        // Neon accents
        "neon-cyan": "#00d9f5",
        "neon-purple": "#8833ff",
        "neon-pink": "#ff1ab3",
        // Heat meter
        "heat-cold": "#2e6fb3",
        "heat-warm": "#f0ad00",
        "heat-hot": "#f07000",
        "heat-fire": "#f03000",
        // States
        success: "#22c97e",
        "success-dark": "#0d2318",
        "daily-bonus": "#f0ad00",
        // Turbo
        "turbo-bg": "#09071a",
        "turbo-cyan": "#00f5e8",
        "turbo-purple": "#9933ff",
        "turbo-pink": "#ff1a80",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "28px",
        full: "9999px",
      },
      spacing: {
        // Aligns with SPACING constants
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        xxl: "32px",
      },
    },
  },
  plugins: [],
};
