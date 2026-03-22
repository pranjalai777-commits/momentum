# Momentum — Implementation Plan

Phased build plan for the Expo + Supabase mobile app. Work through phases sequentially. Each phase has a clear output that unblocks the next.

## Current repo status (2026-03-19)

- [x] Context docs are present (`EXPO_SETUP.md`, `PRODUCT_KNOWLEDGE.md`, `IMPLEMENTATION_PLAN.md`).
- [x] Expo project is initialized in this folder (`package.json`, `app.json`, `src/`, etc. are present).
- [x] Supabase env vars are set locally in `.env`.
- [x] Project dependency set aligned to Expo SDK 54 for current macOS/Xcode compatibility.
- [x] iOS dev-client build runs on simulator after clean prebuild + CocoaPods install.
- [x] `react-native-mmkv` pinned to `2.12.2` (old architecture), with safe in-memory fallback when JSI is unavailable (remote debugger mode).
- [x] `expo-audio` runtime compatibility fix applied (`setPlaybackRate(...)` instead of direct `playbackRate` assignment).
- [x] EAS iOS development build path validated with Apple account/team (`TL63P2K5XF`) and remote credentials.
- [x] Supabase Auth setting **Allow anonymous sign-ins** enabled in dashboard.
- [x] RLS policy hardening migration added and executed in Supabase SQL Editor (`20260318223000_rls_policy_fixes.sql`).

---

## Phase 0: Infrastructure (Day 1–2)

Goal: working Expo project with correct structure, fonts loading, and Supabase connected.

- [x] `npx create-expo-app@latest momentum --template default@sdk-55`
- [x] Install all packages from `EXPO_SETUP.md §2`
- [x] Align Expo dependencies to SDK 54 compatibility set for local Xcode/macOS toolchain
- [x] Configure `babel.config.js` (NativeWind, Reanimated last, React Compiler)
- [x] Configure `metro.config.js` (NativeWind v4 CSS transformer)
- [x] Create `global.css` + `nativewind-env.d.ts`
- [x] Configure `tailwind.config.js` with Momentum color tokens (from `EXPO_SETUP.md §5`)
- [x] Set up `src/constants/theme.ts` — exact hex values from wireframe CSS vars
- [x] Set up `src/constants/levels.ts` — XP thresholds, multipliers, prompts
- [x] Set up `src/types/index.ts` — Task, MomentumData, CompletionType, CeremonyState
- [x] Configure `app.json` (scheme, dark mode, splash, plugins — see `EXPO_SETUP.md §7`)
- [x] Create `src/app/_layout.tsx` (fonts, QueryClient, SafeArea, GestureHandler)
- [x] Verify `npx expo start` runs on iOS Simulator with correct dark background
- [x] Create Supabase project at supabase.com
- [x] Run full SQL schema (6 tables from `PRODUCT_KNOWLEDGE.md §10`)
  - prepared migration: `supabase/migrations/20260318181600_initial_schema.sql`
  - executed in linked Supabase project SQL Editor (confirmed by user)
- [x] Create `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [x] Create `src/lib/supabase.ts` (client with AsyncStorage session)
- [x] Create `src/lib/storage.ts` (MMKV wrapper, `STORAGE_KEYS`)
- [x] Configure `tsconfig.json` with `@/*` path alias
- [x] Configure ESLint (`expo lint`) so `npm run lint` works
- [x] Configure `eas.json` (development + preview + production profiles)

**Exit criteria:** `npx expo start` opens app on dark navy background with fonts loaded.

---

## Phase 1: Game Logic Core (Day 2–3)

Goal: all game logic ported to TypeScript with MMKV persistence. No UI yet.

- [x] Port `src/lib/momentum.ts`:
  - Replace `localStorage.getItem/setItem` with MMKV `mmkv.getObject/setObject`
  - Keep ALL formulas identical: `calculateXP`, `getLevel`, `getLevelProgress`, `getLevelTitle`, `getHeatLabel`, `getHeatColor`, `getHeatMultiplier`, `isTurboActive`, `getTurboRemainingMs`, `canActivateTurbo`, `activateTurbo`, `deactivateTurbo`
  - Keep `getDateKey()` format: `"YYYY-M-D"` (no zero-padding, matches wireframe)
  - Port `loadData()` with daily reset logic (heat→0, todayActions→0 on new day)
  - Port `isFirstActionToday()`
  - Keep `DEFAULT_DATA` identical to wireframe
- [x] Port `src/lib/sounds.ts`:
  - Replace Web Audio API with `expo-audio` (`Audio.Sound`)
  - Create sound files: tick.mp3, urgent-tick.mp3, success.mp3, epic-success.mp3, launch.mp3, warning.mp3, level-up.mp3, timer-tick.mp3, extend.mp3
  - Export same function names: `playTick`, `playUrgentTick`, `playSuccess`, `playEpicSuccess`, `playLaunch`, `playWarning`, `playLevelUp`, `playTimerTick`, `playExtend`
  - Pre-load all sounds on app start
  - SDK54 runtime fix: use `player.setPlaybackRate(...)` (do not assign `player.playbackRate = ...`)
- [x] Create `src/store/useGameStore.ts` (Zustand):
  ```typescript
  // State: MomentumData fields
  // Actions: setData, completeTask, activateTurbo, deactivateTurbo, checkDailyReset
  // Persistence: sync to MMKV on every write (zustand-mmkv middleware or manual)
  ```
- [x] Create `src/store/useTaskStore.ts` (Zustand):
  ```typescript
  // State: Task[]
  // Actions: addTask, deleteTask, markCompleted, loadFromStorage
  // Persistence: sync to MMKV on every write
  ```
- [x] Create `src/hooks/useDailyReset.ts`:
  - On app foreground (`AppState` listener), call `loadData()` to apply daily reset
  - Update game store with loaded data
- [x] MMKV runtime safety:
  - Keep old-architecture-compatible MMKV (`react-native-mmkv@2.12.2`)
  - Handle JSI-unavailable debug mode by falling back to in-memory storage in `src/lib/storage.ts`
- [ ] Write unit tests for `calculateXP` with known inputs:
  - streak=0, heat=0, first=true → `round((15+0+15)*1.0)` = 30, × early(2.0) = 60
  - streak=5, heat=80, first=false → `round((15+15+0)*2.5)` = 75, × on-time(1.5) = 113
  - status: pending test runner setup in this repository (no existing `test` script/tooling yet)

**Exit criteria:** Unit tests pass. `loadData()` + `saveData()` round-trip works via MMKV.

---

## Phase 2: Core UI Components (Day 3–5)

Goal: all 13 components built and visually matching wireframe. No game logic wired yet.

Port each component from React web → React Native. Key translations:

| Web | React Native |
|-----|-------------|
| `div` | `View` |
| `span`, `p` | `Text` |
| CSS `transition` | Reanimated `withTiming` / `withSpring` |
| CSS `animation` | Reanimated `withRepeat` / Moti `<MotiView>` |
| `svg` | `react-native-svg` `<Svg>`, `<Circle>` |
| `style={{ color }}` | `style={{ color }}` (same) |
| `className="font-display"` | `fontFamily: FONTS.display` |
| `filter: drop-shadow(...)` | iOS `shadowColor/shadowOffset/shadowRadius`, Android `elevation` |
| `backdrop-blur` | `BlurView` from `expo-blur` |

### Components to build:

- [x] **`XPBar`**
  - Animated `View` width using `useSharedValue` + `useAnimatedStyle` + `withTiming`
  - Gradient fill: `neon-cyan` → `neon-purple` (use `expo-linear-gradient`)
  - XP gained pop overlay: absolute positioned `Animated.Text`, `withSequence(withTiming, withDelay, withTiming)` for float-up-and-fade
  - Level number badge (left side)

- [x] **`HeatMeter`**
  - `lucide-react-native` `<Flame>` icon with dynamic color
  - Moti `<MotiView>` for ember-breathe/ember-pulse animations (scale loop)
  - Heat bar: `View` with animated width
  - Multiplier label text
  - Aura ring: absolute `View` with radial gradient background (approximated with opacity)

- [x] **`StatsBar`**
  - Three stat pills: tasks completed, streak, best streak
  - Simple `View` + `Text` layout

- [x] **`DailyBanner`**
  - Daily streak number (large, neon-cyan)
  - "N done today" count
  - "First task bonus available" badge when `isFirstToday`

- [x] **`TaskInput`**
  - `TextInput` with dark styling, submit on return key
  - Submit button (+ icon or arrow)
  - Haptic on submit: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`

- [x] **`TaskList`**
  - `FlatList` of task items
  - Each item: task text + "▶ START" button + delete swipe
  - Swipe-to-delete via `react-native-gesture-handler` `Swipeable`
  - Completed tasks shown with strikethrough + reduced opacity
  - Active task item highlighted (neon-cyan border)

- [x] **`TurboButton`**
  - State 1 (available): gradient button `hsl(45 100% 55%)` → `hsl(25 100% 55%)`
  - State 2 (active): shimmer gradient animation, countdown timer display (HH:MM:SS)
  - State 3 (used today): disabled/grayed out
  - Haptic on activate: `Haptics.notificationAsync(NotificationFeedbackType.Success)`

- [x] **`TimerPicker`**
  - Scrollable minute picker (1–120 min)
  - Use `FlatList` or custom wheel picker
  - "START TIMER" button
  - Cancel button
  - Task name displayed at top

- [x] **`TimeUpDialog`**
  - Modal (`Modal` component or full-screen `View` at z-index)
  - Three buttons: "DONE ✓", "EXTEND ➕", "GIVE UP"
  - Task name at top
  - Background: semi-transparent dark

- [x] **`TaskTimer`** (most complex)
  - Phase state machine: `pick-time | countdown | working | time-up | extend-pick | add-time`
  - **pick-time**: renders `<TimerPicker>`
  - **countdown**: SVG ring (`<Svg><Circle>` with `strokeDashoffset`), animated via `useSharedValue`, large countdown number, `playLaunch()` + haptics
  - **working**: SVG circle progress, remaining time display, urgency colors (≤120s → orange, ≤60s → fire), "DONE ✓" + "+ NEED MORE TIME" buttons
  - **time-up**: renders `<TimeUpDialog>`
  - **extend-pick / add-time**: renders `<TimerPicker isExtension>`
  - Wall-clock timer using `Date.now()` + `endTimeRef` (immune to JS timer drift)
  - `extensions` counter tracks timer extensions

- [x] **`XPCeremony`** (second most complex)
  - Phase state machine: `enter | fill | levelup | exit`
  - Full-screen overlay at highest z-index
  - Particles: array of `<MotiView>` with staggered float-up animations
  - Completion message: emoji + title + subtitle (from `COMPLETION_MESSAGES`)
  - Level badge: circular `View` with gradient background, burst animation on `levelup` phase
  - XP bar: animated `width` with `cubic-bezier(0.22, 1, 0.36, 1)` equivalent in Reanimated (`Easing.bezierFn`)
  - XP counter: animated number tick-up via `useSharedValue` + `useDerivedValue`
  - "+N XP" label pops in during `fill` phase
  - "LEVEL UP!" text with scale bounce during `levelup` phase
  - `onFinish` callback: 3200ms (no level-up) or 4800ms (level-up)

- [x] **`CountdownButton`**
  - SVG circle with animated stroke (for turbo countdown visualization)
  - `react-native-svg` `<Circle>` with `strokeDashoffset` driven by `useSharedValue`

**Exit criteria:** All components render correctly in isolation (Storybook or simple test screen). Matches wireframe visually.

Implementation note (2026-03-18): polished RN component set is in place with animated overlays and neon-themed styling. Additional UX refinements like swipe gestures/wheel picker/haptics fine-tuning can be iterated in subsequent passes.

---

## Phase 3: Main Screen (Day 5–6)

Goal: fully interactive main screen matching wireframe `Index.tsx`.

- [x] Build `src/app/(app)/index.tsx`:
  - Wire all components together using Zustand stores
  - Replicate state machine from `Index.tsx` exactly:
    - `activeTask` state drives `<TaskTimer>` render
    - `ceremony` state drives `<XPCeremony>` render
    - `turboActive` drives ambient overlay
    - `prompt` state with 8s `setInterval`
    - Turbo expiry check (1s `setInterval`)
  - Replicate `completeTask()` logic exactly (including `isFirstActionToday`, streak calc, heat update, ceremony trigger at 300ms delay)
  - `doneToday` count calculation
  - `pendingCount` calculation

- [x] Handle safe area insets via `useSafeAreaInsets()`:
  - Add `paddingTop: insets.top` to header
  - Add `paddingBottom: insets.bottom` to bottom HUD

- [x] Turbo ambient glow overlay:
  - `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0`
  - `expo-linear-gradient` or `Animated.View` with radial-style opacity gradient
  - `turbo-ambient-pulse` animation: opacity 0.7→1→0.7 loop (3s)

- [x] Motivational prompt cycling:
  - `setInterval(8000)` switching `prompt` state
  - Entrance animation using Moti `<AnimatePresence>` + `<MotiText>`

- [x] XP gained pop animation:
  - Absolute positioned `Text` that floats up and fades when `xpGained` is set
  - Clear after animation with `setTimeout`

- [x] Daily bonus pop:
  - `showDailyBonus` state, 2s display, "🌟 DAILY BONUS +15 XP"
  - `fade-slide-up` equivalent in Moti

- [x] Background ambient gradient (top-center, non-interactive):
  - `expo-linear-gradient` or custom radial approximation
  - Changes colors when turbo active

**Exit criteria:** Complete task flow works: add task → start → countdown → complete → XPCeremony → XP awarded → heat incremented.

Implementation note (2026-03-19): main screen state wiring, safe-area handling, ambient overlays, and ceremony integration are in place in `src/app/(app)/index.tsx`. Remaining validation items are tracked in the verification checklist below.

---

## Phase 4: Supabase Integration (Day 6–8)

Goal: anonymous auth working, game data syncing to Supabase, offline queue functional.

- [x] Implement anonymous auth in `src/hooks/useAuth.ts`:
  - `supabase.auth.getSession()` on mount
  - Session state is resolved without auto-creating an anonymous user on mount (anonymous session is created from auth CTA flow)
  - Subscribe to `supabase.auth.onAuthStateChange()`
  - Expose `user`, `session`, `isAnonymous`, `isLoading`

- [x] Wire auth to app layout `src/app/(app)/_layout.tsx`:
  - Redirect to `/(auth)/welcome` if no session
  - Show loading state while auth resolves

- [x] Implement `src/hooks/useSync.ts`:
  - On mount + reconnect: sync `user_profiles`, `daily_states`, `tasks` FROM Supabase → local MMKV
  - Merge strategy: Supabase wins for XP/level (anti-cheat), local wins for task list
  - Drain `sync_queue` on reconnect (retry failed mutations)
  - Listen to network state via `@react-native-community/netinfo`

- [x] Replace local `completeTask` logic with Edge Function call:
  - TanStack Query `useMutation` calling `supabase.functions.invoke('complete-task', { body: {...} })`
  - Optimistic update: immediately update local Zustand store
  - On success: update store with server response (canonical XP/level values)
  - On failure: queue in `sync_queue`, keep optimistic values

- [x] Create Edge Function `complete-task` (Deno TypeScript):
  - Location: `supabase/functions/complete-task/index.ts`
  - Replicates `calculateXP()` + `XP_MULTIPLIERS` exactly from `momentum.ts`
  - Atomic: uses Supabase transaction to update `user_profiles`, `daily_states`, `tasks`, `xp_events`
  - Returns `{ xpEarned, newXp, newLevel, leveledUp, newHeat, newStreak }`

- [x] Create Edge Function `activate-turbo` (Deno):
  - Validates once-per-day constraint server-side
  - Updates `daily_states.heat = 100`, `turbo_activated_at`, `turbo_last_used_day`, `heat_before_turbo`
  - Returns `{ activated: boolean, expiresAt: string }`

- [x] Create Edge Function `sync-daily-state` (Deno):
  - Upserts `daily_states` row for current date
  - Handles daily reset: if date changed, resets heat/today_actions

- [x] Offline queue implementation:
  - `sync_queue` is MMKV array of `SyncQueueItem`
  - On each mutation failure: push to queue
  - `useSync` drains queue when network available
  - Queue items have `retries` counter, max 3 retries

- [x] TanStack Query setup for tasks:
  - `useQuery` for task list from Supabase
  - `useMutation` for add/delete/complete task
  - Optimistic updates for all mutations

**Exit criteria:** Complete task → XP updates in Supabase dashboard. App works offline → syncs when reconnected.

Implementation note (2026-03-19): Phase 4 client wiring is in place (`useAuth`, `useSync`, queue helpers, remote mutations, and three Edge Function handlers). Auth/runtime stabilization updates were applied: lazy NetInfo import fallback in sync hook, traced Supabase fetch logging, and RLS policy fixes for first-write insert paths (`user_profiles`, `daily_states`, `tasks`) to support anonymous/authenticated per-user access safely.

---

## Phase 5: Auth Screens (Day 8–9)

Goal: proper auth flow with anonymous-first strategy.

- [x] Build `src/app/(auth)/welcome.tsx`:
  - App title + tagline
  - "PLAY NOW (No Sign-Up)" CTA → triggers `signInAnonymously()` → navigates to `/(app)/`
  - "Sign In" + "Create Account" secondary options
  - Social: Apple Sign-In (`expo-apple-authentication`), Google (`expo-auth-session`)

- [x] Level 3 milestone prompt in main screen:
  - When `newLevel === 3` during ceremony, show bottom sheet: "Save Your Progress"
  - "Link Account" CTA → navigate to email sign-up
  - "Maybe Later" dismisses permanently (store in MMKV)

- [x] Email sign-up flow (modal stack):
  - Email + password form
  - `supabase.auth.updateUser({ email, password })` for anon→email upgrade
  - Error handling (email taken, weak password)

- [x] Apple Sign-In:
  ```typescript
  import * as AppleAuthentication from 'expo-apple-authentication';
  const credential = await AppleAuthentication.signInAsync({...});
  await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
  ```

- [x] Google Sign-In:
  ```typescript
  import * as AuthSession from 'expo-auth-session/providers/google';
  // Configure redirect URI for Expo Go + production
  ```

**Exit criteria:** Can play anonymously. Can upgrade to email account. Session persists after app restart.

Implementation note (2026-03-19): Phase 5 auth UX is wired with a full welcome/auth flow (anonymous CTA, email modal sign-in/sign-up, Apple + Google handlers), level-3 save-progress prompt with MMKV dismissal, and anon→email upgrade via `supabase.auth.updateUser`. Supabase dashboard prerequisites were applied (anonymous provider enabled). Apple/Google provider credentials still require final on-device validation.

---

## Phase 6: Stats Screen (Day 9–10)

Goal: stats screen showing XP history and achievement data.

- [x] Build `src/app/(app)/stats.tsx`:
  - Total XP, current level, level title
  - Best streaks (task + daily)
  - Total tasks completed
  - XP history chart: pull from `xp_events` table, group by day
  - Chart library: `victory-native` (Victory Native XL, works with Skia) or simple custom bar chart

- [x] XP by day chart:
  ```typescript
  const { data } = useQuery({
    queryKey: ['xp-history', userId],
    queryFn: () => supabase
      .from('xp_events')
      .select('xp_earned, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
  });
  ```

- [x] Level history display: show all levels achieved with dates (derived from `xp_events` running XP progression)

- [x] Navigation: add tab bar or back button from main screen to stats

**Exit criteria:** Stats screen shows accurate data pulled from Supabase.

Implementation note (2026-03-19): Phase 6 is now implemented with a full `stats.tsx` screen using Supabase-backed profile + XP events queries (with local fallback), a custom 14-day XP bar chart, derived level-history timeline, and in-app navigation between Home and Stats via header action + back button.

---

## Phase 7: Polish + Platform Features (Day 10–12)

Goal: production-ready polish, platform-specific features, performance.

- [ ] **Haptics** (`expo-haptics`):
  - Task complete: `Haptics.notificationAsync(NotificationFeedbackType.Success)`
  - Level up: `Haptics.notificationAsync(NotificationFeedbackType.Success)` × 2 with delay
  - Turbo activate: `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)`
  - Timer start: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
  - Countdown last 3s: `Haptics.impactAsync(ImpactFeedbackStyle.Light)` each tick
  - Button taps: `Haptics.selectionAsync()`

- [ ] **Push Notifications scaffold** (`expo-notifications`):
  - Request permission on first launch (after user plays first task)
  - Register push token with Supabase (store in `user_profiles.push_token`)
  - Local notification: daily streak reminder ("Your streak is waiting! ⚡") at 9am if user hasn't opened app
  - Not sending yet — scaffold only

- [ ] **Splash screen controlled hide** (`expo-splash-screen`):
  - `SplashScreen.preventAutoHideAsync()` in `_layout.tsx`
  - Hide only after: fonts loaded + Supabase session resolved + initial data synced
  - `SplashScreen.hideAsync()` in useEffect

- [ ] **App icon + splash image:**
  - Dark navy (`#060a16`) background
  - Neon cyan/purple gradient flame icon
  - "MOMENTUM" wordmark in Space Grotesk
  - Generate all required sizes via EAS or manually

- [ ] **iOS safe area polish:**
  - Verify home indicator padding on iPhone 14 Pro (Dynamic Island)
  - Verify notch on iPhone SE
  - All interactive elements within safe area

- [ ] **Android back button:**
  - Override hardware back in timer overlay: cancel timer with confirmation
  - `useEffect` with `BackHandler.addEventListener('hardwareBackPress', ...)`
  - Cleanup on unmount

- [ ] **Performance audit:**
  - Add `React.memo` to `TaskList` items
  - Add `useCallback` to `completeTask`, `addTask`, `deleteTask`, `startTask`
  - Profile with Expo DevTools / Flipper
  - Ensure XPCeremony particles don't cause frame drops (reduce count or use Lottie)

- [ ] **EAS Build:**
  - `eas build --platform ios --profile development`
  - `eas build --platform android --profile preview`
  - Verify both build and run correctly

---

## Supabase Edge Functions Deployment

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy complete-task
supabase functions deploy activate-turbo
supabase functions deploy sync-daily-state

# Set secrets (if needed)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Verification Checklist

### Core Flow
- [ ] `npx expo start` runs without errors on iOS Simulator + Android Emulator
- [ ] Fonts load correctly (Space Grotesk for headers/numbers, Inter for body)
- [ ] Dark navy background (#060a16) renders correctly on both platforms

### Task Flow
- [ ] Add task → appears in list
- [ ] Start task → TimerPicker opens
- [ ] Set timer → 5s countdown plays → working phase starts
- [ ] "DONE ✓" before timer → `early` completion type, 2× bonus
- [ ] Extend timer → increments `extensions` counter → early becomes on-time
- [ ] Timer expires → TimeUpDialog shows → "Done" → `late` completion
- [ ] "Give Up" → task not marked complete, streak resets, minimal XP
- [ ] XPCeremony shows → correct phase sequence (enter → fill → levelup → exit)
- [ ] XP bar fills with animation → level badge shows correct level
- [ ] "LEVEL UP!" burst appears when level changes

### Heat & Turbo
- [ ] Heat meter increments `+12` on early completion only
- [ ] Heat color changes through states (cold → cool → warm → hot → on fire)
- [ ] ember-breathe animation on ON FIRE state
- [ ] Turbo button visible when not used today
- [ ] Turbo activates → heat = 100 → ambient glow overlay appears
- [ ] Turbo countdown counts down correctly
- [ ] Turbo expires after 2h → heat restores to pre-turbo value

### Persistence
- [ ] Kill app and reopen → XP, heat, streak, tasks all preserved (MMKV)
- [ ] New calendar day → heat resets to 0, todayActions resets to 0
- [ ] Daily streak does NOT reset if app opened same day

### Supabase Sync
- [ ] Anonymous session created on first launch (check Supabase Auth dashboard)
- [ ] Complete task → `xp_events` row appears in Supabase (check Table Editor)
- [ ] `user_profiles.xp` updates after task completion
- [ ] Offline: complete task without network → queue saves to MMKV
- [ ] Reconnect → sync_queue drains → Supabase updated

### Auth
- [ ] "Play Anonymously" creates anon session and navigates to main screen
- [ ] Level 3 milestone prompt appears (if not dismissed)
- [ ] Email sign-up upgrades anon session (verify in Supabase Auth)
- [ ] Apple Sign-In works on iOS device (requires real device + provisioning profile)

### Platform
- [ ] iOS: tap haptics work (requires real device)
- [ ] Android: back button in timer shows confirmation
- [ ] iOS: safe area insets correct on notched devices
- [ ] Splash screen hides cleanly after fonts load

---

## Critical Implementation Notes

1. **`getDateKey()` format must match exactly:** `"YYYY-M-D"` with no zero-padding. The wireframe uses `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`. This is the session continuity key — any mismatch breaks daily reset logic.

2. **`extensions > 0` completion override:** When user completes early but has extended the timer, type MUST be `on-time` not `early`. This means no heat increment and 1.5× instead of 2.0× XP. Replicate exactly from `TaskTimer.tsx`.

3. **Heat only increments on `early` completion:** `Index.tsx` line 160: `heat: turboActive ? 100 : Math.min(100, prev.heat + (type === "early" ? HEAT_PER_ACTION : 0))`. On-time, late, gave-up do NOT add heat.

4. **XP formula order:** `calculateXP(newStreak, prev.heat, firstToday)` is called with the INCREMENTED streak (`newStreak = prev.streak + 1`), not the previous streak. Replicating this exactly in the Edge Function is critical.

5. **Ceremony trigger delay:** 300ms delay before triggering ceremony (`setTimeout(() => triggerCeremony(...), 300)`). This allows the task list to update first.

6. **Daily streak increment condition:** Only increments if `firstToday && !isGiveUp`. Uses `lastDayUsed` vs `today` comparison for day boundary detection.

7. **Turbo deactivation:** Checked every 1 second. When expired, `deactivateTurbo()` restores `heatBeforeTurbo` (not 0). The ambient glow and turbo button state should update simultaneously.

8. **Reanimated plugin order:** Must be the LAST plugin in `babel.config.js`. If placed before other plugins, Reanimated worklets may not compile correctly.

9. **MMKV thread safety:** MMKV reads are synchronous. Use only on JS thread. Never call from Reanimated worklets.

11. **MMKV + remote debugger behavior:** MMKV requires JSI. In remote JS debugging mode, JSI may be unavailable, so `src/lib/storage.ts` intentionally falls back to in-memory storage to avoid app crash. Persistent MMKV behavior should be validated with on-device/dev-client debugging.

10. **SVG timer rings:** Use `strokeDasharray = 2πr` (circumference) and animate `strokeDashoffset` from `circumference` (0%) to `0` (100%). For the 90px radius ring in wireframe: `circumference = 2 * Math.PI * 90 ≈ 565.5`.
