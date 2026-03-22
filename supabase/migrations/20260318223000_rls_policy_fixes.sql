ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own daily state" ON daily_states;

CREATE POLICY "Users can read own daily state"
  ON daily_states
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily state"
  ON daily_states
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily state"
  ON daily_states
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily state"
  ON daily_states
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;

CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own xp events" ON xp_events;
DROP POLICY IF EXISTS "Service role can insert xp events" ON xp_events;

CREATE POLICY "Users can read own xp events"
  ON xp_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert xp events"
  ON xp_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
