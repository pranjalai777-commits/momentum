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
        // Base surfaces — exact web HSL values converted to hex (see src/constants/theme.ts)
        background: "#08090d",
        foreground: "#f7f7f7",
        card: "#101119",
        "card-elevated": "#14161f",
        secondary: "#181b25",
        muted: "#15161e",
        "muted-foreground": "#585c74",
        border: "#1b1d27",
        "border-subtle": "#15171f",
        // Neon accents
        primary: "#a64dff",
        "neon-cyan": "#00d5ff",
        "neon-purple": "#a64dff",
        "neon-pink": "#ff3399",
        // Heat meter
        "heat-cold": "#2e73b8",
        "heat-warm": "#ffc61a",
        "heat-hot": "#ff8229",
        "heat-fire": "#ff4529",
        // States
        success: "#17cf91",
        "success-dark": "#0a2014",
        "daily-bonus": "#ffc61a",
        // Turbo
        "turbo-bg": "#0b0811",
        "turbo-cyan": "#1affff",
        "turbo-purple": "#cc66ff",
        "turbo-pink": "#ff4d88",
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
