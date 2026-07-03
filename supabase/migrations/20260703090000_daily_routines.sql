CREATE TABLE IF NOT EXISTS routine_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own routines"
  ON routine_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routines"
  ON routine_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON routine_tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON routine_tasks
  FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS routine_id UUID REFERENCES routine_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS tasks_unique_routine_day
  ON tasks (user_id, routine_id, task_date);
