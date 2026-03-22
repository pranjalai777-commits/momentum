CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS user_profiles (
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

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS daily_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  heat INTEGER NOT NULL DEFAULT 0,
  today_actions INTEGER NOT NULL DEFAULT 0,
  turbo_activated_at TIMESTAMPTZ,
  turbo_last_used_day DATE,
  heat_before_turbo INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

ALTER TABLE daily_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily state"
  ON daily_states
  FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  timer_minutes INTEGER,
  completion_type TEXT CHECK (completion_type IN ('early', 'on-time', 'late', 'gave-up')),
  xp_earned INTEGER
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON tasks
  FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS xp_events (
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

CREATE POLICY "Users can read own xp events"
  ON xp_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert xp events"
  ON xp_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  xp INTEGER NOT NULL,
  level INTEGER NOT NULL,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);
