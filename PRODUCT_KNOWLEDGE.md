# Momentum — Product Knowledge Bible

## 1. App Vision

Momentum is a **gamified productivity app** where every task you complete earns you XP, builds heat, and levels you up. The core loop is: add a task → start a countdown timer → finish before or on time → earn XP → see a ceremony animation → watch the bar fill → level up.

The thesis: productivity feels like grinding in an RPG. Streaks, heat multipliers, turbo modes, and level-up ceremonies make work feel rewarding in the same way a video game does.

---

## 2. Core Game Mechanics

### 2.1 XP System

**Formula:**
```
XP = round((base + streakBonus + dailyBonus) × heatMultiplier × completionMultiplier)

base          = 15
streakBonus   = streak × 3          (task-completion streak)
dailyBonus    = 15 if first task today, else 0
heatMultiplier = getHeatMultiplier(heat)      (see §2.2)
completionMultiplier = XP_MULTIPLIERS[type]  (see §2.4)
```

**Source of truth:** `Wireframe/ignite-5-go-main/src/lib/momentum.ts` → `calculateXP()` and `Index.tsx` → `XP_MULTIPLIERS`

---

### 2.2 Heat System

Heat is a 0–100 value that resets to 0 every day (on app open, if the calendar date changed).

**Heat increments:**
- `+12` per **early** task completion only (`HEAT_PER_ACTION = 12` from `Index.tsx`)
- Heat does NOT increment for on-time, late, or gave-up completions
- When Turbo is active, heat is clamped to 100 regardless

**Heat states (5 levels):**

| Range | Label | Multiplier |
|-------|-------|------------|
| 0–19  | COLD  | 1.0×       |
| 20–39 | COOL  | 1.0×       |
| 40–59 | WARM  | 1.3×       |
| 60–79 | HOT   | 1.8×       |
| 80–89 | ON FIRE | 2.5×     |
| 90–100| ON FIRE | 3.0×     |

**Heat color mapping:**
- COLD/COOL: `hsl(210 60% 45%)` — steel blue
- WARM: `hsl(45 100% 55%)` — amber/gold
- HOT: `hsl(25 100% 58%)` — orange
- ON FIRE: `hsl(8 100% 58%)` — red-orange

**HeatMeter animation classes:**
- `heat ≥ 80`: `ember-breathe` (2.5s ease-in-out infinite) — scale 1→1.15→1
- `heat ≥ 60`: `ember-pulse` (3s ease-in-out infinite) — scale 1→1.06→1
- `heat < 60`: no animation

**Aura ring:** visible when `heat ≥ 40`. Size = `flameSize + 20`. Color = `flameColor / 0.15` radial gradient.

---

### 2.3 Level System

11 levels with fixed XP thresholds:

```typescript
const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000];
```

| Level | Title | XP Threshold |
|-------|-------|-------------|
| 1 | Starter | 0 |
| 2 | Mover | 50 |
| 3 | Doer | 150 |
| 4 | Hustler | 300 |
| 5 | Driven | 500 |
| 6 | Relentless | 800 |
| 7 | Unstoppable | 1200 |
| 8 | Legendary | 1700 |
| 9 | Mythic | 2500 |
| 10 | Titan | 3500 |
| 11 | Immortal | 5000 |

`getLevelProgress()` returns `{ current, next, progress }` where `progress` is 0–100 (percentage to next level).

---

### 2.4 Completion Types & Multipliers

```typescript
const XP_MULTIPLIERS: Record<CompletionType, number> = {
  early:    2.0,   // finished before timer expired (and never extended)
  "on-time": 1.5,  // finished before timer expired (but extended at least once)
                   // OR: time-up dialog → "Done"
  late:     1.6,   // time-up dialog → "Done" (without any extension)
  "gave-up": 0.2,  // time-up dialog → "Give Up" OR cancel
};
```

**Critical rule:** `extensions > 0` overrides the completion type:
- If user hit "Done ✓" early but previously extended: `"early"` → `"on-time"`
- If user hit "Done" at time-up dialog but previously extended: `"late"` → `"on-time"`

This logic lives in `TaskTimer.tsx`:
```typescript
const handleDoneEarly = () => {
  const type: CompletionType = extensions > 0 ? "on-time" : "early";
  ...
};
const handleDoneLate = () => {
  onComplete(extensions > 0 ? "on-time" : "late", ...);
};
```

Task is **not** marked completed in the list for `gave-up`.

---

### 2.5 Streak System

**Task-completion streak (`streak`):** increments by 1 for every non-gave-up completion. Resets on gave-up. Used in XP formula.

**Daily streak (`dailyStreak`):** increments when user completes their first task of a new calendar day.
- `todayActions === 0` → this is the first task of today
- `lastDayUsed !== today && lastDayUsed !== yesterday` → daily streak resets to 0

**Best streaks:** `bestStreak` and `bestDailyStreak` track all-time maximums.

---

### 2.6 Turbo Boost

- **Effect:** sets `heat = 100` instantly and holds it there for the entire 2-hour duration
- **Duration:** `TURBO_DURATION_MS = 2 * 60 * 60 * 1000` (2 hours exactly)
- **Cooldown:** once per calendar day (`turboLastUsedDay` tracks this)
- **State preservation:** `heatBeforeTurbo` stores the heat value before activation, restored on deactivation
- **Deactivation:** checked every 1s via `setInterval`; when expired, `deactivateTurbo()` restores `heatBeforeTurbo`
- **Visual:** applies `.turbo-mode` class to root, overriding CSS variables, plus `.turbo-ambient` overlay (animated radial gradients), and `TurboButton` shows a countdown

---

### 2.7 Daily Reset Logic

On app open (or when returning from background to a new calendar day):
1. `heat` → 0
2. `todayActions` → 0
3. If `lastDayUsed !== yesterday`: `dailyStreak` → 0

`getDateKey()` format: `YYYY-M-D` (no zero-padding).

---

## 3. Task Timer Flow

Phases in order:

```
pick-time → countdown (5s) → working → time-up → [extend-pick|add-time]
```

### Phase: `pick-time`
- Renders `<TimerPicker>` full-screen
- User selects duration (minutes), triggers `startWorkTimer(minutes)`

### Phase: `countdown` (5 seconds)
- Animated SVG ring fills over 5 seconds via `requestAnimationFrame`
- Number ticks down: 5 → 4 → 3 → 2 → 1 → GO
- Sounds: `playLaunch()` on enter, `playTick(pitch)` for 5/4/3, `playUrgentTick()` for 2/1
- Haptics: `vibrate([30, 50, 60])` on transition to working
- Ring gradient: cyan→purple normally, fire→pink at count ≤ 2

### Phase: `working`
- Countdown from `totalSeconds` using `endTimeRef` wall-clock (immune to JS timer drift)
- 2-minute warning: `secsLeft ≤ 120 && secsLeft > 118` → `playWarning()` + haptics
- Last 10 seconds: `secsLeft ≤ 10 && secsLeft > 0` → `playTimerTick()` each second
- Timer urgency states:
  - `remaining ≤ 120`: `isUrgentTime = true` (ring color shifts to orange)
  - `remaining ≤ 60`: `isLastMinute = true` (ring color shifts to fire red, text turns fire)
- Buttons: "DONE ✓" (handleDoneEarly) and "+ NEED MORE TIME" (handleAddTime → add-time phase)

### Phase: `time-up`
- Renders `<TimeUpDialog>` with three choices:
  - "Done" → `handleDoneLate()` → completion type `late` (or `on-time` if extended)
  - "Extend" → `handleExtendTimer()` → enters `extend-pick` phase
  - "Give Up" → `handleGiveUp()` → completion type `gave-up`

### Phase: `extend-pick` / `add-time`
- Both render `<TimerPicker isExtension={true}>` full-screen
- Both increment `extensions` counter
- `extend-pick`: cancel goes back to `time-up`
- `add-time`: cancel goes back to `working`
- Both update `endTimeRef.current += secs * 1000` (not replacing, adding)

---

## 4. XP Ceremony

Triggered 300ms after task completion. Animation phases:

| Phase | Start | End | What happens |
|-------|-------|-----|-------------|
| `enter` | 0ms | 800ms | Screen fades in, content rises up |
| `fill` | 800ms | 2400ms | XP bar animates (1200ms, easeOutCubic), XP counter ticks up, "+N XP" pops in |
| `levelup` | 2400ms | 4400ms | Level badge bursts, ring expands, "LEVEL UP!" text appears (only if leveled up) |
| `exit` | 2400ms or 4400ms | — | Screen fades out |
| `onFinish` | 3200ms (no LU) or 4800ms (LU) | — | Overlay removed from DOM |

**Particle system:**
- `early`: 16 particles, multi-color (cyan/purple/pink/success)
- `gave-up`: 4 particles, muted
- `on-time` / `late`: 8 particles, cyan/purple

**Completion messages:**
| Type | Title | Subtitle | Emoji |
|------|-------|---------|-------|
| early | CRUSHED IT! | Finished before the timer — you're on fire! | 🔥 |
| on-time | NICE SAVE! | Extended and delivered — respect! | 💪 |
| late | TASK DONE! | You got it done — that's what counts! | ✅ |
| gave-up | GOOD TRY! | You showed up — next time you'll crush it! | 🌱 |

**XP bar animation:** `width` transitions with `cubic-bezier(0.22, 1, 0.36, 1)` over 1200ms. `displayXp` ticks up with `easeOutCubic` via rAF.

**Background gradient:**
- `early`: radial-gradient cyan 0.15 opacity
- `leveledUp` (fill/levelup/exit phase): radial-gradient purple 0.25
- Otherwise: `hsl(var(--background) / 0.95)` flat

---

## 5. Motivational Prompts

14 prompts cycling every **8 seconds** via `setInterval`:

```
"Crush the next task."
"One more. You can do it."
"Your streak is calling."
"Finish it. Feel the rush."
"Tasks don't complete themselves."
"Momentum doesn't wait."
"You didn't come this far to stop."
"Every task makes you stronger."
"The list won't beat you."
"Discipline beats motivation."
"Clear the board. Own the day."
"Action kills doubt."
"How many can you finish today?"
"Your future self is watching."
```

Selected randomly on each interval tick. Appear with `fade-slide-up` animation class.

---

## 6. Design System

### Color Palette

| Token | HSL | Usage |
|-------|-----|-------|
| `--background` | `230 25% 4%` ≈ `#060a16` | Dark navy background |
| `--foreground` | `0 0% 97%` ≈ `#f7f7f7` | Near-white text |
| `--card` | `230 22% 8%` | Card backgrounds |
| `--muted` | `230 18% 10%` | Muted surfaces |
| `--muted-foreground` | `230 14% 40%` | Secondary text |
| `--neon-cyan` | `190 100% 50%` ≈ `#00d9f5` | Primary accent, XP bar fill, timers |
| `--neon-purple` | `270 100% 65%` ≈ `#8833ff` | Secondary accent, level badges |
| `--neon-pink` | `330 100% 60%` ≈ `#ff1ab3` | Urgency, turbo |
| `--heat-cold` | `210 60% 45%` | Cold state flame |
| `--heat-warm` | `45 100% 55%` | Warm state flame |
| `--heat-hot` | `25 100% 58%` | Hot state flame |
| `--heat-fire` | `8 100% 58%` | On fire state flame |
| `--success` | `160 80% 45%` | Task complete success |
| `--daily-bonus` | `45 100% 55%` | Daily bonus overlay |
| `--border` | `230 18% 13%` | Subtle borders |

**Turbo mode** overrides via `.turbo-mode` class on root:
- `--background`: `260 35% 5%` (deeper purple-navy)
- `--neon-purple`: `280 100% 70%`
- `--neon-cyan`: `180 100% 55%`
- `--neon-pink`: `340 100% 65%`

### Typography

| Font | Use case | Weights |
|------|---------|---------|
| Space Grotesk | `font-display` — headings, labels, numbers, badges | 500, 600, 700 |
| Inter | `font-sans` — body text, descriptions | 400, 500, 600, 700, 800, 900 |

### Animation Library (keyframes defined in `index.css`)

| Class | Animation | Duration |
|-------|-----------|---------|
| `.ember-breathe` | scale 1→1.15→1 | 2.5s infinite |
| `.ember-pulse` | scale 1→1.06→1 | 3s infinite |
| `.ceremony-enter` | fade in | 0.6s |
| `.ceremony-exit` | fade out | 0.6s |
| `.ceremony-particle` | float up and fade | 3s |
| `.ceremony-bar-shimmer` | shimmer sweep | 1.5s infinite |
| `.countdown-tick` | scale 1.2→1 | 0.3s |
| `.fade-slide-up` | opacity 0→1, translateY 8→0 | 0.5s |
| `.daily-bonus-pop` | scale+fade float up | 1.5s |
| `.turbo-ambient` | opacity pulse | 3s infinite |

---

## 7. UI Screens

### Main Screen (`app/(app)/index.tsx`)

Layout (top to bottom):
1. **Header**
   - App title "MOMENTUM" (gradient text: foreground→neon-cyan 0.7)
   - Motivational prompt (cycling, `fade-slide-up` on change)
   - `<DailyBanner>` — daily streak + today's done count
   - `<XPBar>` — XP progress + level number

2. **Task Area**
   - `<TaskInput>` — text input + submit
   - "N TASKS TO CRUSH" label (if pendingCount > 0)
   - `<TaskList>` — list of pending tasks with start/delete actions

3. **Bottom HUD**
   - `<TurboButton>` — shows countdown when active, "TURBO BOOST" when available
   - `<HeatMeter>` — flame icon + heat bar + multiplier label
   - `<StatsBar>` — tasks completed, task streak, best streak

4. **Ambient glow overlay** — top-center radial gradient (cyan/purple normally, fire/pink in turbo)
5. **Turbo ambient** — full-screen radial gradient when turbo active
6. **Daily bonus pop** — "🌟 DAILY BONUS +15 XP" text overlay at screen top-third

### Timer Overlay (`<TaskTimer>`)

Full-screen overlay at `z-[90]`:
- Renders `<TimerPicker>`, `<TimeUpDialog>`, countdown phase, or working phase
- Working phase: SVG circle timer + "DONE ✓" button + "+ NEED MORE TIME" button
- Cancel button (X) exits the timer

### Ceremony Overlay (`<XPCeremony>`)

Full-screen overlay at `z-[100]` (above timer):
- Particles, completion message, level badge, XP bar
- Auto-dismisses via setTimeout

---

## 8. Persistence Model

### localStorage Keys (wireframe) → Supabase (mobile app)

| localStorage Key | Field | Supabase Location |
|-----------------|-------|-------------------|
| `momentum_data` → `.xp` | Total XP | `user_profiles.xp` |
| `momentum_data` → `.heat` | Current heat (0–100) | `daily_states.heat` |
| `momentum_data` → `.totalActions` | All-time actions | `user_profiles.total_actions` |
| `momentum_data` → `.lastActionTime` | Timestamp of last action | `user_profiles.last_action_at` |
| `momentum_data` → `.streak` | Task completion streak | `user_profiles.streak` |
| `momentum_data` → `.dailyStreak` | Daily login streak | `user_profiles.daily_streak` |
| `momentum_data` → `.lastDayUsed` | Last active date key | `daily_states.date` |
| `momentum_data` → `.todayActions` | Tasks done today | `daily_states.today_actions` |
| `momentum_data` → `.bestStreak` | Best task streak | `user_profiles.best_streak` |
| `momentum_data` → `.bestDailyStreak` | Best daily streak | `user_profiles.best_daily_streak` |
| `momentum_data` → `.tasksCompleted` | All-time tasks completed | `user_profiles.tasks_completed` |
| `momentum_data` → `.turboActivatedAt` | Turbo start timestamp | `daily_states.turbo_activated_at` |
| `momentum_data` → `.turboLastUsedDay` | Day turbo was used | `daily_states.turbo_last_used_day` |
| `momentum_data` → `.heatBeforeTurbo` | Heat value before turbo | `daily_states.heat_before_turbo` |
| `momentum_tasks` | Task list array | `tasks` table |

### MMKV Keys (mobile, replaces localStorage)

```typescript
// src/lib/storage.ts
export const STORAGE_KEYS = {
  GAME_DATA: 'momentum_data',
  TASKS: 'momentum_tasks',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync_at',
} as const;
```

---

## 9. MomentumData Interface (exact)

```typescript
interface MomentumData {
  xp: number;
  heat: number;
  totalActions: number;
  lastActionTime: number | null;
  streak: number;
  dailyStreak: number;
  lastDayUsed: string | null;   // format: "YYYY-M-D" (no zero padding)
  todayActions: number;
  bestStreak: number;
  bestDailyStreak: number;
  tasksCompleted: number;
  turboActivatedAt: number | null;  // Date.now() timestamp
  turboLastUsedDay: string | null;  // same format as lastDayUsed
  heatBeforeTurbo: number;
}
```

```typescript
interface Task {
  id: string;          // UUID
  text: string;
  completed: boolean;
  completedAt?: number;  // Date.now() timestamp
  createdAt: number;
}
```

---

## 10. Supabase Schema

### Table: `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  daily_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  best_daily_streak INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_actions INTEGER NOT NULL DEFAULT 0,
  last_action_at TIMESTAMPTZ,
  leaderboard_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Table: `daily_states`
```sql
CREATE TABLE daily_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heat INTEGER NOT NULL DEFAULT 0,
  today_actions INTEGER NOT NULL DEFAULT 0,
  turbo_activated_at TIMESTAMPTZ,
  turbo_last_used_day DATE,
  heat_before_turbo INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE daily_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own daily state" ON daily_states
  FOR ALL USING (auth.uid() = user_id);
```

### Table: `tasks`
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,  -- soft delete
  timer_minutes INTEGER,
  completion_type TEXT CHECK (completion_type IN ('early', 'on-time', 'late', 'gave-up')),
  xp_earned INTEGER
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);
```

### Table: `xp_events`
```sql
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id),
  xp_earned INTEGER NOT NULL,
  completion_type TEXT,
  heat_at_time INTEGER,
  streak_at_time INTEGER,
  heat_multiplier DECIMAL(3,1),
  completion_multiplier DECIMAL(3,1),
  was_first_today BOOLEAN,
  was_turbo_active BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own xp events" ON xp_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert xp events" ON xp_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Table: `leaderboard_snapshots` (future)
```sql
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  xp INTEGER NOT NULL,
  level INTEGER NOT NULL,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);
```

### Table: `user_follows` (future)
```sql
CREATE TABLE user_follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);
```

---

## 11. Edge Functions

### `complete-task`
Server-side task completion with atomic XP calculation (anti-cheat). Replicates `calculateXP()` + `XP_MULTIPLIERS` exactly.

```typescript
// Input
{ taskId: string, completionType: 'early'|'on-time'|'late'|'gave-up', timerMinutes: number }

// Logic (Deno)
1. Fetch user_profiles + daily_states for current user
2. Validate task belongs to user and is not yet completed
3. Apply same formula as momentum.ts:calculateXP()
4. Apply XP_MULTIPLIERS[completionType]
5. Update user_profiles (xp, level, streak, bestStreak, tasksCompleted, etc.)
6. Update daily_states (heat, todayActions, lastDayUsed)
7. Insert xp_events row
8. Update tasks row (completed=true, completedAt, completionType, xpEarned)
9. Return { xpEarned, newXp, newLevel, leveledUp, newHeat, newStreak }
```

### `activate-turbo`
```typescript
// Input: none (uses auth.uid())
// Logic:
1. Fetch daily_states for today
2. Validate turbo_last_used_day !== today (once-per-day check)
3. Set heat=100, turbo_activated_at=now(), turbo_last_used_day=today, heat_before_turbo=current_heat
4. Return { activated: true, expiresAt: now()+2h }
```

### `sync-daily-state`
```typescript
// Upserts daily_states for today (used on app foreground)
// Handles daily reset: if date changed, heat=0, today_actions=0
```

### `leaderboard-snapshot` (nightly cron)
```typescript
// Pre-computes rankings from user_profiles where leaderboard_opt_in=true
// Inserts into leaderboard_snapshots
```

---

## 12. Auth Strategy

**Anonymous-first:**
1. On first launch → `supabase.auth.signInAnonymously()`
2. Session persisted in MMKV (via AsyncStorage adapter)
3. User plays, earns XP, reaches Level 3
4. "Save Your Progress" prompt appears → link anonymous account to email/Apple/Google
5. `supabase.auth.updateUser({ email })` or OAuth flow upgrades the anon session

---

## 13. Offline-First Sync Strategy

1. All game actions write to MMKV immediately (optimistic)
2. TanStack Query mutations fire Supabase API calls
3. On failure: action queued in `sync_queue` (MMKV key)
4. On reconnect or next app open: `useSync` hook drains queue
5. Supabase is the source of truth for cross-device and leaderboards

---

## 14. Future Features (Designed For)

- **Leaderboards** — daily XP rankings, opt-in, pre-computed nightly
- **Friends/Follows** — social graph via `user_follows` table
- **Social Activity Feed** — "Friend just leveled up to Titan!"
- **Push Notifications** — daily streak reminders, friend activity
- **Stats Screen** — XP history chart (from `xp_events`), level timeline, best days
- **Achievements/Badges** — milestone rewards (first 100 tasks, 30-day streak, etc.)
