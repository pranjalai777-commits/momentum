# Momentum Auth + Persistence Report

Scope: Report-only investigation (no code changes). Phase 7 remains on hold.

## Executive Summary
- Auth is wired through Expo Router group layouts with `useAuth()` and Supabase session persistence.
- Tasks are stored locally in MMKV and optionally synced to Supabase. Task loss on refresh is most likely due to MMKV falling back to in-memory storage (cleared on restart) or tasks never being synced because IDs are not valid UUIDs.
- The Level 3 “Link Account” popup is tied to anonymous users and routes to the email upgrade flow. The upgrade path works, but there is no explicit resync or confirmation flow after upgrade.

## Auth Flow Integration
### Core wiring
- **Supabase client**: `src/lib/supabase.ts`
  - AsyncStorage-backed session persistence
  - `autoRefreshToken: true`, `persistSession: true`
- **Auth state**: `src/hooks/useAuth.ts`
  - Loads session on boot and subscribes to auth changes
  - Exposes `isAnonymous` via `user.is_anonymous` or `app_metadata.provider === "anonymous"`
- **Router guard**: `src/app/(app)/_layout.tsx`
  - Redirects to `/(auth)/welcome` when no session
  - Runs `useSync(Boolean(session))` when session is present

### Auth screens
- **Welcome**: `src/app/(auth)/welcome.tsx`
  - Anonymous: `supabase.auth.signInAnonymously()`
  - Apple: `supabase.auth.signInWithIdToken({ provider: "apple", token })`
  - Google: `supabase.auth.signInWithIdToken({ provider: "google", token })`
- **Email**: `src/app/(auth)/email.tsx`
  - Sign-in: `signInWithPassword`
  - Sign-up/upgrade: if anonymous, `updateUser({ email, password })`

## Task Persistence + Sync
### Local storage
- **Storage adapter**: `src/lib/storage.ts`
  - MMKV primary storage
  - In-memory fallback when MMKV is unavailable (e.g., remote debugging)
- **Tasks**: `src/lib/momentum.ts`
  - `loadTasks()` / `saveTasks()` read/write `STORAGE_KEYS.TASKS`
- **Task store**: `src/store/useTaskStore.ts`
  - Loads tasks on store creation
  - Saves after add/delete/complete

### Remote sync
- **Sync hook**: `src/hooks/useSync.ts`
  - Loads local tasks + remote tasks
  - `mergedTasks = localTasks.length > 0 ? localTasks : remoteTasks`
  - Upserts only tasks with IDs matching UUID regex

## Why Tasks Disappear After Refresh (Likely Causes)
1. **MMKV fallback is in-memory only**
   - If MMKV fails to initialize, storage becomes a `Map`, which is cleared on app restart or refresh.
   - Look for warning: `"[storage] MMKV unavailable, using in-memory fallback."`

2. **Non-UUID task IDs do not sync**
   - `createTaskId()` uses `crypto.randomUUID()` when available, otherwise a timestamp-based string.
   - Sync explicitly filters tasks by UUID regex before upserting to Supabase.
   - Result: fallback IDs never reach Supabase, so if local storage resets, tasks are gone.

3. **Merge strategy favors local or remote, not both**
   - `mergedTasks = localTasks.length > 0 ? localTasks : remoteTasks`
   - If local is empty (e.g., storage reset), only remote tasks survive.

## Level 3 “Link Account” Popup
### Trigger
File: `src/app/(app)/index.tsx`
- Shows after completion ceremony if:
  - `result.newLevel === 3`
  - `isAnonymous === true`
  - Dismiss flag not set

### Dismiss + Link behavior
- Dismiss flag stored in MMKV: `LEVEL3_SAVE_PROMPT_DISMISSED`
- Link button routes to email flow:
  - `/(auth)/email?mode=signup&upgrade=1`

### What’s missing or wrong
- **No explicit sync after upgrade**
  - Upgrade does not force a re-sync of tasks or game data.
- **No explicit confirmation of upgrade result**
  - UI immediately returns to app after `updateUser()` with no post-check.
- **Local-only tasks still not synced if IDs are non-UUID**
  - Linking an account won’t help if tasks were generated with fallback IDs.

## Testing Checklist (Suggested)
- Verify MMKV availability on device:
  - Run app with remote debugging OFF.
  - Confirm no `[storage] MMKV unavailable...` warning in logs.
- Task persistence:
  - Add tasks, hard-close app, relaunch → tasks should remain.
  - Toggle airplane mode and retry → tasks should remain locally.
- Sync behavior:
  - Confirm tasks with valid UUIDs appear in Supabase `tasks` table.
  - Confirm tasks created with fallback IDs do not sync.
- Level 3 prompt:
  - Reach Level 3 as anonymous → prompt shows once.
  - Tap “Link Account” → email upgrade succeeds and session persists.

## Key Files
- `src/lib/supabase.ts` — Supabase client + session persistence
- `src/hooks/useAuth.ts` — auth session management
- `src/app/(app)/_layout.tsx` — router guard + sync trigger
- `src/hooks/useSync.ts` — local/remote task sync
- `src/lib/storage.ts` — MMKV storage (fallbacks)
- `src/store/useTaskStore.ts` — task CRUD + persistence
- `src/app/(app)/index.tsx` — Level 3 link-account popup
- `src/app/(auth)/welcome.tsx`, `src/app/(auth)/email.tsx` — auth entry points
