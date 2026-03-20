# Momentum — Expo Project Setup Guide

## 1. Tech Stack Decisions

| Concern | Choice | Version | Reason |
|---------|--------|---------|--------|
| Framework | Expo | SDK 55 | Latest (Feb 2026), New Architecture default (Fabric + JSI) |
| React Native | RN | 0.83.1 | Bundled with SDK 55 |
| React | React | 19.2.0 | Bundled with SDK 55 |
| Language | TypeScript | ~5.3 | Throughout, strict mode |
| Navigation | expo-router | v4 | File-based routing, typed routes, deep links auto-configured |
| State (local) | zustand | ^5 | 1–3KB, minimal API, perfect for single-user gamified app |
| State (server) | @tanstack/react-query | v5 | Offline caching, mutations with optimistic updates, retry |
| Local storage | react-native-mmkv | ^3 | 30× faster than AsyncStorage, synchronous reads |
| Backend | @supabase/supabase-js | v2 | Auth + DB + Edge Functions + RLS in one |
| Animations | react-native-reanimated | 3 | Runs on native thread, industry standard |
| Animations (declarative) | moti | ^0.30 | Built on Reanimated 3, concise API for simple animations |
| Lottie | lottie-react-native | ^7 | For Lottie JSON animations (XP ceremony, level up) |
| Audio | expo-audio | latest | Official Expo SDK, cross-platform, replaces Web Audio API |
| Haptics | expo-haptics | latest | Taptic engine on iOS, vibration on Android |
| Gestures | react-native-gesture-handler | ~2.20 | Required by Reanimated, enables swipe-to-delete |
| Safe area | react-native-safe-area-context | 4.12.0 | Required by Expo Router |
| Icons | @expo/vector-icons | ^14 | Ionicons/MaterialIcons; Lucide via lucide-react-native |
| Styling | NativeWind | v4 | Tailwind CSS for React Native, matches wireframe patterns |
| Push notifs | expo-notifications | latest | Future feature, scaffolded now |
| Splash | expo-splash-screen | ~0.29 | Controlled hide after fonts + data load |
| Fonts | expo-font + @expo-google-fonts/space-grotesk + @expo-google-fonts/inter | latest | Match wireframe fonts exactly |
| SVG | react-native-svg | 15.8.0 | SVG circle timers (CountdownButton, TaskTimer rings) |
| Compiler | React Compiler (babel plugin) | — | Auto-memo, enabled in babel config |

---

## 2. Project Initialization

```bash
# Create project with SDK 55 default template (New Architecture enabled)
npx create-expo-app@latest momentum --template default@sdk-55

cd momentum

# Install all production dependencies
npx expo install \
  expo-router \
  expo-font \
  @expo-google-fonts/space-grotesk \
  @expo-google-fonts/inter \
  expo-splash-screen \
  expo-haptics \
  expo-audio \
  expo-notifications \
  expo-apple-authentication \
  expo-auth-session \
  expo-web-browser \
  react-native-safe-area-context \
  react-native-screens \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-svg \
  react-native-mmkv \
  moti \
  lottie-react-native \
  @supabase/supabase-js \
  @tanstack/react-query \
  zustand \
  lucide-react-native \
  nativewind

# NativeWind v4 requires tailwindcss as peer
npm install --save-dev tailwindcss@^3
```

---

## 3. Project Structure

```
momentum/
├── src/
│   ├── app/                          # Expo Router file-based routes
│   │   ├── _layout.tsx               # Root layout: fonts, providers, splash screen
│   │   ├── (app)/
│   │   │   ├── _layout.tsx           # Auth-gated layout: tab bar (or stack)
│   │   │   ├── index.tsx             # Main screen: task list + HUD
│   │   │   └── stats.tsx             # Stats & history screen
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx           # Auth layout (unauthenticated only)
│   │   │   └── welcome.tsx           # Onboarding / sign-up / "Play Anonymously"
│   │   └── +not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                       # Primitive components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Text.tsx
│   │   ├── TaskInput.tsx             # TextInput + submit button
│   │   ├── TaskList.tsx              # FlatList with swipe-to-delete
│   │   ├── TaskTimer.tsx             # Full-screen timer overlay (all phases)
│   │   ├── TimerPicker.tsx           # Scrollable minute selector
│   │   ├── TimeUpDialog.tsx          # Modal: Done / Extend / Give Up
│   │   ├── XPBar.tsx                 # XP progress bar with animated fill
│   │   ├── XPCeremony.tsx            # Full-screen completion ceremony overlay
│   │   ├── HeatMeter.tsx             # Flame icon + heat bar + multiplier label
│   │   ├── StatsBar.tsx              # Tasks completed + streaks
│   │   ├── TurboButton.tsx           # Turbo boost button with countdown
│   │   ├── DailyBanner.tsx           # Daily streak + today done count
│   │   └── CountdownButton.tsx       # Circular SVG countdown ring button
│   │
│   ├── lib/
│   │   ├── momentum.ts               # Game logic (port from wireframe, MMKV instead of localStorage)
│   │   ├── sounds.ts                 # expo-audio sound effects (port from Web Audio API)
│   │   ├── supabase.ts               # Supabase client initialization
│   │   ├── storage.ts                # MMKV wrapper with typed keys
│   │   └── utils.ts                  # Shared utilities (getDateKey, formatTime, etc.)
│   │
│   ├── store/
│   │   ├── useGameStore.ts           # Zustand: XP, heat, streak, turbo, dailyStreak
│   │   └── useTaskStore.ts           # Zustand: task list
│   │
│   ├── hooks/
│   │   ├── useSync.ts                # Background sync to Supabase (drains offline queue)
│   │   ├── useAuth.ts                # Supabase auth state + anon→email upgrade
│   │   └── useDailyReset.ts          # Checks date on app foreground, resets heat/todayActions
│   │
│   ├── constants/
│   │   ├── theme.ts                  # Colors, spacing, gradients (matching wireframe CSS vars)
│   │   └── levels.ts                 # XP thresholds, level titles, heat states
│   │
│   └── types/
│       └── index.ts                  # Shared TypeScript interfaces
│
├── assets/
│   ├── fonts/                        # (optional, using expo-google-fonts instead)
│   ├── images/
│   │   ├── icon.png
│   │   └── splash.png
│   └── animations/
│       ├── level-up.json             # Lottie animation for level-up
│       └── confetti.json             # Lottie animation for completion
│
├── app.json                          # Expo config
├── babel.config.js                   # Babel config (Reanimated, NativeWind, React Compiler)
├── metro.config.js                   # Metro config (NativeWind v4 requires CSS transforms)
├── nativewind-env.d.ts               # NativeWind TypeScript declarations
├── tailwind.config.js                # Tailwind config with custom Momentum theme
├── tsconfig.json                     # TypeScript config
└── .env                              # Supabase keys (not committed)
```

---

## 4. Environment Setup

### `.env` file (root of project, gitignored)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Access in code:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

### `.gitignore` additions
```
.env
.env.local
.env.production
```

---

## 5. NativeWind v4 Setup

### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-bold": ["Inter_700Bold"],
        display: ["SpaceGrotesk_700Bold"],
        "display-medium": ["SpaceGrotesk_600SemiBold"],
        "display-black": ["SpaceGrotesk_700Bold"],
      },
      colors: {
        background: "#060a16",
        foreground: "#f7f7f7",
        card: "#0d1120",
        muted: "#0d1020",
        "muted-foreground": "#3d4466",
        border: "#141b2e",
        "neon-cyan": "#00d9f5",
        "neon-purple": "#8833ff",
        "neon-pink": "#ff1ab3",
        "heat-cold": "#2e6fb3",
        "heat-warm": "#f0ad00",
        "heat-hot": "#f07000",
        "heat-fire": "#f03000",
        success: "#1fad6e",
        "daily-bonus": "#f0ad00",
      },
    },
  },
  plugins: [],
};
```

### `nativewind-env.d.ts`
```typescript
/// <reference types="nativewind/types" />
```

### `metro.config.js`
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

### `global.css` (root)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 6. Babel Configuration

### `babel.config.js`
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // NativeWind v4
      "nativewind/babel",
      // React Compiler (auto-memoization)
      ["babel-plugin-react-compiler", {}],
      // Reanimated MUST be last
      "react-native-reanimated/plugin",
    ],
  };
};
```

---

## 7. app.json Configuration

```json
{
  "expo": {
    "name": "Momentum",
    "slug": "momentum",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "momentum",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#060a16"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.momentum",
      "usesAppleSignIn": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#060a16"
      },
      "package": "com.yourcompany.momentum"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#060a16",
          "image": "./assets/images/splash.png",
          "imageWidth": 200
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#8833ff"
        }
      ],
      "expo-apple-authentication"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 8. Root Layout (`src/app/_layout.tsx`)

```typescript
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 1000 * 60 * 5 },
    mutations: { retry: 1 },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

---

## 9. Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,       // Persists session across app restarts
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,   // Not a web app
  },
});
```

Note: `@react-native-async-storage/async-storage` is used only for Supabase session persistence. All game data uses MMKV.

---

## 10. MMKV Storage Wrapper (`src/lib/storage.ts`)

```typescript
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "momentum-storage" });

export const STORAGE_KEYS = {
  GAME_DATA: "momentum_data",
  TASKS: "momentum_tasks",
  SYNC_QUEUE: "sync_queue",
  LAST_SYNC: "last_sync_at",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const mmkv = {
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),
  getObject: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  setObject: (key: string, value: unknown) =>
    storage.set(key, JSON.stringify(value)),
  delete: (key: string) => storage.delete(key),
};
```

---

## 11. Theme Constants (`src/constants/theme.ts`)

```typescript
// Exact HSL values from wireframe index.css, converted to hex for React Native
export const COLORS = {
  background: "#060a16",         // hsl(230 25% 4%)
  foreground: "#f7f7f7",         // hsl(0 0% 97%)
  card: "#0d1120",               // hsl(230 22% 8%)
  muted: "#0d1020",              // hsl(230 18% 10%)
  mutedForeground: "#3d4466",    // hsl(230 14% 40%)
  border: "#141b2e",             // hsl(230 18% 13%)

  neonCyan: "#00d9f5",           // hsl(190 100% 50%)
  neonPurple: "#8833ff",         // hsl(270 100% 65%)
  neonPink: "#ff1ab3",           // hsl(330 100% 60%)

  heatCold: "#2e6fb3",           // hsl(210 60% 45%)
  heatWarm: "#f0ad00",           // hsl(45 100% 55%)
  heatHot: "#f07000",            // hsl(25 100% 58%)
  heatFire: "#f03000",           // hsl(8 100% 58%)

  success: "#1fad6e",            // hsl(160 80% 45%)
  dailyBonus: "#f0ad00",

  // Turbo mode overrides
  turboBackground: "#09071a",    // hsl(260 35% 5%)
  turboCyan: "#00f5e8",          // hsl(180 100% 55%)
  turboPurple: "#9933ff",        // hsl(280 100% 70%)
  turboPink: "#ff1a80",          // hsl(340 100% 65%)
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
```

---

## 12. Level Constants (`src/constants/levels.ts`)

```typescript
// MUST match wireframe momentum.ts exactly
export const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000] as const;

export const LEVEL_TITLES = [
  "Starter", "Mover", "Doer", "Hustler", "Driven",
  "Relentless", "Unstoppable", "Legendary", "Mythic", "Titan", "Immortal",
] as const;

export const HEAT_PER_ACTION = 12; // Only added for "early" completions

export const TURBO_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export const XP_MULTIPLIERS = {
  early: 2.0,
  "on-time": 1.5,
  late: 1.6,
  "gave-up": 0.2,
} as const;

export const DAILY_FIRST_BONUS = 15;

export const MOTIVATIONAL_PROMPTS = [
  "Crush the next task.",
  "One more. You can do it.",
  "Your streak is calling.",
  "Finish it. Feel the rush.",
  "Tasks don't complete themselves.",
  "Momentum doesn't wait.",
  "You didn't come this far to stop.",
  "Every task makes you stronger.",
  "The list won't beat you.",
  "Discipline beats motivation.",
  "Clear the board. Own the day.",
  "Action kills doubt.",
  "How many can you finish today?",
  "Your future self is watching.",
] as const;
```

---

## 13. TypeScript Types (`src/types/index.ts`)

```typescript
export type CompletionType = "early" | "on-time" | "late" | "gave-up";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
}

export interface MomentumData {
  xp: number;
  heat: number;
  totalActions: number;
  lastActionTime: number | null;
  streak: number;
  dailyStreak: number;
  lastDayUsed: string | null;       // Format: "YYYY-M-D"
  todayActions: number;
  bestStreak: number;
  bestDailyStreak: number;
  tasksCompleted: number;
  turboActivatedAt: number | null;
  turboLastUsedDay: string | null;
  heatBeforeTurbo: number;
}

export interface CeremonyState {
  active: boolean;
  prevXp: number;
  newXp: number;
  xpGained: number;
  leveledUp: boolean;
  completionType: CompletionType;
}

export interface SyncQueueItem {
  id: string;
  type: "complete_task" | "activate_turbo" | "sync_daily";
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
}
```

---

## 14. EAS Build Configuration (`eas.json`)

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "ios": { "simulator": false },
      "android": { "buildType": "aab" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 15. tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "nativewind-env.d.ts"]
}
```

---

## 16. Key Package Notes

### react-native-reanimated v3
- Already configured for New Architecture in SDK 55
- **Must be last plugin in babel.config.js**
- Use `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring` for all animations
- `withSequence` for ceremony phases

### moti
- Wraps Reanimated with `<MotiView>` declarative API
- Great for heat meter ember animations, simple entrance/exit animations
- `animate={{ scale }}` with `transition={{ type: 'timing' }}` mirrors CSS transitions

### NativeWind v4
- Uses a new metro transformer, NOT the old babel-only approach
- `global.css` is imported in `_layout.tsx` (not `index.ts`)
- `className` prop works on RN `View`, `Text`, `Pressable` etc.
- Theme tokens defined in `tailwind.config.js` are type-safe

### expo-audio
- Replaces `expo-av` for audio (deprecated in SDK 54+)
- No Web Audio API available in RN — use pre-generated audio or oscillator via custom native module
- Simplest approach: generate short audio files (tick.mp3, success.mp3, etc.) and use `Audio.Sound`
- Alternative: `react-native-sound-player` for lower latency

### react-native-mmkv
- Requires New Architecture (Fabric) — available by default in SDK 55
- Create storage instance once, export as singleton
- Use for all game state (not for Supabase session — use AsyncStorage for that)

### lucide-react-native
- Direct port of `lucide-react` for React Native
- Same icon names: `<Flame>`, `<X>`, `<Plus>`, `<Zap>`, etc.
- Pass `color`, `size`, `strokeWidth` props (not className)
