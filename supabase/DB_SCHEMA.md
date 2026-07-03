# Momentum Supabase Database Schema (Canonical Reference)

This document is the human-readable snapshot of the **current live database design**.

Execution source of truth remains SQL migrations in `supabase/migrations/`.


## 1) Migration history and purpose

Applied migration order:

1. `20260318181600_initial_schema.sql`
   - Base tables and initial RLS.
2. `20260318223000_rls_policy_fixes.sql`
   - RLS policy corrections (explicit SELECT/INSERT/UPDATE/DELETE policies).
3. `20260319181000_rpc_gameplay.sql`
   - Introduced gameplay RPCs:
     - `activate_turbo_rpc()`
     - `complete_task_rpc(...)`
4. `20260319181800_fix_complete_task_rpc_xpevent.sql`
   - Fix for `complete_task_rpc` insert into `xp_events` (`xp_earned` column mapping).
5. `20260319193000_delete_my_account_rpc.sql`
   - Added authenticated self-serve account deletion RPC:
     - `delete_my_account()`
6. `20260319204500_tree_health_system.sql`
   - Added Tree health profile fields and tree-health RPC support:
     - `sync_tree_health_rpc()`
     - extended `complete_task_rpc(...)` return payload with tree fields
7. `20260703090000_daily_routines.sql`
   - Added daily routine templates and generated-task linkage:
     - `routine_tasks`
     - `tasks.routine_id`
     - `tasks.task_date`
     - unique generated task per routine/day


## 2) Tables

### `user_profiles`
- `id uuid` PK, FK → `auth.users(id)` (cascade delete)
- `display_name text`
- `xp integer` default `0`
- `level integer` default `1`
- `streak integer` default `0`
- `daily_streak integer` default `0`
- `best_streak integer` default `0`
- `best_daily_streak integer` default `0`
- `tasks_completed integer` default `0`
- `total_actions integer` default `0`
- `last_action_at timestamptz`
- `tree_health integer` default `100` (check `0..100`)
- `last_health_decay_day date`
- `leaderboard_opt_in boolean` default `false`
- `created_at timestamptz` default `now()`
- `updated_at timestamptz` default `now()`

### `daily_states`
- `id uuid` PK default `gen_random_uuid()`
- `user_id uuid` FK → `auth.users(id)` (cascade delete)
- `date date` default `current_date`
- `heat integer` default `0`
- `today_actions integer` default `0`
- `turbo_activated_at timestamptz`
- `turbo_last_used_day date`
- `heat_before_turbo integer` default `0`
- unique `(user_id, date)`

### `tasks`
- `id uuid` PK default `gen_random_uuid()`
- `user_id uuid` FK → `auth.users(id)` (cascade delete)
- `text text` (required)
- `completed boolean` default `false`
- `completed_at timestamptz`
- `created_at timestamptz` default `now()`
- `deleted_at timestamptz`
- `timer_minutes integer`
- `completion_type text` check in `('early','on-time','late','gave-up')`
- `xp_earned integer`
- `routine_id uuid` FK → `routine_tasks(id)` (nullable, set null on delete)
- `task_date date` (used for routine-generated daily instances)

Unique index:
- `(user_id, routine_id, task_date)` prevents duplicate generated tasks for the same routine/day. Regular one-off tasks keep `routine_id = null`, so they are unaffected.

### `routine_tasks`
- `id uuid` PK default `gen_random_uuid()`
- `user_id uuid` FK → `auth.users(id)` (cascade delete)
- `text text` (required)
- `active boolean` default `true`
- `created_at timestamptz` default `now()`
- `updated_at timestamptz` default `now()`
- `deleted_at timestamptz`

### `xp_events`
- `id uuid` PK default `gen_random_uuid()`
- `user_id uuid` FK → `auth.users(id)` (cascade delete)
- `task_id uuid` FK → `tasks(id)` (nullable)
- `xp_earned integer` (required)
- `completion_type text`
- `heat_at_time integer`
- `streak_at_time integer`
- `heat_multiplier decimal(3,1)`
- `completion_multiplier decimal(3,1)`
- `was_first_today boolean`
- `was_turbo_active boolean`
- `created_at timestamptz` default `now()`

### `leaderboard_snapshots`
- `id uuid` PK default `gen_random_uuid()`
- `user_id uuid` FK → `auth.users(id)` (cascade delete)
- `snapshot_date date`
- `xp integer`
- `level integer`
- `rank integer`
- `created_at timestamptz` default `now()`
- unique `(user_id, snapshot_date)`

### `user_follows`
- `follower_id uuid` FK → `auth.users(id)` (cascade delete)
- `following_id uuid` FK → `auth.users(id)` (cascade delete)
- `created_at timestamptz` default `now()`
- composite PK `(follower_id, following_id)`


## 3) RLS policies (current)

RLS enabled on:
- `user_profiles`
- `daily_states`
- `tasks`
- `routine_tasks`
- `xp_events`

### `user_profiles`
- SELECT own row: `auth.uid() = id`
- INSERT own row: `WITH CHECK (auth.uid() = id)`
- UPDATE own row: `USING/WITH CHECK (auth.uid() = id)`

### `daily_states`
- SELECT own rows: `auth.uid() = user_id`
- INSERT own rows: `WITH CHECK (auth.uid() = user_id)`
- UPDATE own rows: `USING/WITH CHECK (auth.uid() = user_id)`
- DELETE own rows: `auth.uid() = user_id`

### `tasks`
- SELECT own rows: `auth.uid() = user_id`
- INSERT own rows: `WITH CHECK (auth.uid() = user_id)`
- UPDATE own rows: `USING/WITH CHECK (auth.uid() = user_id)`
- DELETE own rows: `auth.uid() = user_id`

### `routine_tasks`
- SELECT own rows: `auth.uid() = user_id`
- INSERT own rows: `WITH CHECK (auth.uid() = user_id)`
- UPDATE own rows: `USING/WITH CHECK (auth.uid() = user_id)`
- DELETE own rows: `auth.uid() = user_id`

### `xp_events`
- SELECT own rows: `auth.uid() = user_id`
- INSERT allowed only for service role policy remains present, but app gameplay now writes via SECURITY DEFINER RPC.


## 4) RPC functions (active gameplay write path)

## `public.activate_turbo_rpc()`
- Input: none
- Auth: requires `auth.uid()`
- Behavior:
  - bootstraps `user_profiles` and today `daily_states` if missing
  - prevents multiple turbo activations per day
  - sets:
    - `heat_before_turbo`
    - `heat = 100`
    - `turbo_activated_at = now()`
    - `turbo_last_used_day = today`
- Returns table:
  - `activated boolean`
  - `expires_at timestamptz` (`now + 2 hours`)

## `public.complete_task_rpc(p_completion_type text, p_task_id uuid default null, p_completed_at timestamptz default null)`
- Auth: requires `auth.uid()`
- Valid types: `early`, `on-time`, `late`, `gave-up`
- Behavior:
  - bootstraps missing profile/daily state
  - calculates XP, level transitions, streak/daily streak, heat
  - updates `user_profiles` and `daily_states` atomically
  - updates task completion fields if `p_task_id` provided
  - inserts row into `xp_events`
- Returns table:
  - `xp_earned`
  - `new_xp`
  - `new_level`
  - `leveled_up`
  - `new_heat`
  - `new_streak`
  - `new_daily_streak`
  - `new_tasks_completed`
  - `new_total_actions`
  - `today_actions`
  - `last_action_at`
  - `new_tree_health`
  - `tree_in_danger`

## `public.sync_tree_health_rpc()`
- Input: none
- Auth: requires `auth.uid()`
- Behavior:
  - ensures profile exists
  - applies missed-day tree health decay once per day (capped)
  - updates `tree_health` and `last_health_decay_day`
- Returns table:
  - `tree_health`
  - `last_health_decay_day`
  - `tree_in_danger`

## `public.delete_my_account()`
- Input: none
- Auth: requires `auth.uid()` and `EXECUTE` permission for authenticated role
- Security: `SECURITY DEFINER`
- Behavior:
  - resolves current user from `auth.uid()`
  - deletes row from `auth.users` for current user id
  - raises explicit exception when unauthenticated or user row not found
- Return: `void`


## 5) Client-side usage status

Current app write path in `src/hooks/useRemoteData.ts`:
- Turbo activation → `supabase.rpc('activate_turbo_rpc')`
- Task completion/game progression → `supabase.rpc('complete_task_rpc', ...)`
- Tree decay sync on app active/reset → `supabase.rpc('sync_tree_health_rpc')`
- Task CRUD still uses direct table writes (`tasks`) with RLS.
- Routine CRUD uses direct table writes (`routine_tasks`) with RLS.
- Daily routine task generation runs during sync in `src/hooks/useSync.ts`, upserting missing task instances for active routines.

Current account-management RPC usage:
- Account deletion (Profile screen) → `supabase.rpc('delete_my_account')` from `src/app/(app)/profile.tsx`


## 6) Edge Functions status

Legacy gameplay Edge Functions were removed from the repository after RPC migration.

Current gameplay write path is RPC-only:
- `public.activate_turbo_rpc`
- `public.complete_task_rpc`
- `public.sync_tree_health_rpc`

Account lifecycle RPC path:
- `public.delete_my_account`


## 7) How to keep this file updated

When adding/changing any migration:
1. Update migration history section with new file and purpose.
2. Update affected table schema and constraints.
3. Update RLS section if any policy changed.
4. Update RPC section if function signature/logic changed.
5. Update client usage section if app call path changed.
