ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS tree_health INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS last_health_decay_day DATE;

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_tree_health_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_tree_health_check CHECK (tree_health BETWEEN 0 AND 100);

CREATE OR REPLACE FUNCTION public.sync_tree_health_rpc()
RETURNS TABLE (
  tree_health INTEGER,
  last_health_decay_day DATE,
  tree_in_danger BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'utc')::date;
  v_profile user_profiles%ROWTYPE;
  v_baseline DATE;
  v_diff_days INTEGER;
  v_decay_days INTEGER;
  v_new_health INTEGER;
  v_new_last_decay DATE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized user';
  END IF;

  INSERT INTO user_profiles (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;

  SELECT *
  INTO v_profile
  FROM user_profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_profile.last_health_decay_day = v_today THEN
    RETURN QUERY
    SELECT
      v_profile.tree_health,
      v_profile.last_health_decay_day,
      (v_profile.tree_health <= 60 AND v_profile.xp > 0);
    RETURN;
  END IF;

  v_baseline := COALESCE(v_profile.last_health_decay_day, v_profile.last_action_at::date, v_today);
  v_diff_days := GREATEST(0, v_today - v_baseline);
  v_decay_days := LEAST(5, v_diff_days);

  IF v_profile.xp > 0 AND v_decay_days > 0 THEN
    v_new_health := GREATEST(0, v_profile.tree_health - (v_decay_days * 18));
  ELSE
    v_new_health := v_profile.tree_health;
  END IF;

  v_new_last_decay := v_today;

  UPDATE user_profiles
  SET
    tree_health = v_new_health,
    last_health_decay_day = v_new_last_decay,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN QUERY
  SELECT
    v_new_health,
    v_new_last_decay,
    (v_new_health <= 60 AND v_profile.xp > 0);
END;
$$;

DROP FUNCTION IF EXISTS public.complete_task_rpc(TEXT, UUID, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.complete_task_rpc(
  p_completion_type TEXT,
  p_task_id UUID DEFAULT NULL,
  p_completed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  xp_earned INTEGER,
  new_xp INTEGER,
  new_level INTEGER,
  leveled_up BOOLEAN,
  new_heat INTEGER,
  new_streak INTEGER,
  new_daily_streak INTEGER,
  new_tasks_completed INTEGER,
  new_total_actions INTEGER,
  today_actions INTEGER,
  last_action_at TIMESTAMPTZ,
  new_tree_health INTEGER,
  tree_in_danger BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := (now() AT TIME ZONE 'utc')::date;
  v_is_give_up BOOLEAN := p_completion_type = 'gave-up';
  v_profile user_profiles%ROWTYPE;
  v_daily daily_states%ROWTYPE;
  v_first_today BOOLEAN;
  v_streak_for_xp INTEGER;
  v_base_xp NUMERIC;
  v_heat_multiplier NUMERIC;
  v_completion_multiplier NUMERIC;
  v_turbo_active BOOLEAN;
  v_last_action_at TIMESTAMPTZ := COALESCE(p_completed_at, now());
  v_last_action_day DATE;
  v_xp_earned INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN;
  v_new_heat INTEGER;
  v_new_streak INTEGER;
  v_new_daily_streak INTEGER;
  v_new_tasks_completed INTEGER;
  v_new_total_actions INTEGER;
  v_today_actions INTEGER;
  v_baseline DATE;
  v_diff_days INTEGER;
  v_decay_days INTEGER;
  v_decayed_health INTEGER;
  v_new_tree_health INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized user';
  END IF;

  IF p_completion_type NOT IN ('early', 'on-time', 'late', 'gave-up') THEN
    RAISE EXCEPTION 'Invalid completion type: %', p_completion_type;
  END IF;

  INSERT INTO user_profiles (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO daily_states (user_id, date, heat, today_actions, heat_before_turbo)
  VALUES (v_user_id, v_today, 0, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  SELECT *
  INTO v_profile
  FROM user_profiles
  WHERE id = v_user_id
  FOR UPDATE;

  SELECT *
  INTO v_daily
  FROM daily_states
  WHERE user_id = v_user_id AND date = v_today
  FOR UPDATE;

  v_baseline := COALESCE(v_profile.last_health_decay_day, v_profile.last_action_at::date, v_today);
  v_diff_days := GREATEST(0, v_today - v_baseline);
  v_decay_days := LEAST(5, v_diff_days);

  IF v_profile.xp > 0 AND v_decay_days > 0 THEN
    v_decayed_health := GREATEST(0, v_profile.tree_health - (v_decay_days * 18));
  ELSE
    v_decayed_health := v_profile.tree_health;
  END IF;

  v_first_today := v_daily.today_actions = 0;
  v_streak_for_xp := CASE WHEN v_is_give_up THEN v_profile.streak ELSE v_profile.streak + 1 END;

  v_heat_multiplier := CASE
    WHEN v_daily.heat >= 90 THEN 3.0
    WHEN v_daily.heat >= 80 THEN 2.5
    WHEN v_daily.heat >= 60 THEN 1.8
    WHEN v_daily.heat >= 40 THEN 1.3
    ELSE 1.0
  END;

  v_completion_multiplier := CASE p_completion_type
    WHEN 'early' THEN 2.0
    WHEN 'on-time' THEN 1.5
    WHEN 'late' THEN 1.6
    ELSE 0.2
  END;

  v_base_xp := (15 + (v_streak_for_xp * 3) + CASE WHEN v_first_today THEN 15 ELSE 0 END) * v_heat_multiplier;
  v_xp_earned := ROUND(v_base_xp * v_completion_multiplier);
  v_new_xp := v_profile.xp + v_xp_earned;

  v_new_level := CASE
    WHEN v_new_xp >= 5000 THEN 11
    WHEN v_new_xp >= 3500 THEN 10
    WHEN v_new_xp >= 2500 THEN 9
    WHEN v_new_xp >= 1700 THEN 8
    WHEN v_new_xp >= 1200 THEN 7
    WHEN v_new_xp >= 800 THEN 6
    WHEN v_new_xp >= 500 THEN 5
    WHEN v_new_xp >= 300 THEN 4
    WHEN v_new_xp >= 150 THEN 3
    WHEN v_new_xp >= 50 THEN 2
    ELSE 1
  END;
  v_leveled_up := v_new_level > v_profile.level;

  v_turbo_active := v_daily.turbo_activated_at IS NOT NULL
    AND now() - v_daily.turbo_activated_at < interval '2 hours';

  v_new_heat := CASE
    WHEN v_turbo_active THEN 100
    WHEN p_completion_type = 'early' THEN LEAST(100, v_daily.heat + 12)
    ELSE v_daily.heat
  END;

  v_new_streak := CASE WHEN v_is_give_up THEN 0 ELSE v_profile.streak + 1 END;
  v_last_action_day := v_profile.last_action_at::date;

  v_new_daily_streak := CASE
    WHEN v_first_today AND NOT v_is_give_up THEN
      CASE WHEN v_last_action_day = v_today THEN v_profile.daily_streak ELSE v_profile.daily_streak + 1 END
    ELSE v_profile.daily_streak
  END;

  v_new_total_actions := v_profile.total_actions + 1;
  v_new_tasks_completed := v_profile.tasks_completed + CASE WHEN v_is_give_up THEN 0 ELSE 1 END;
  v_today_actions := v_daily.today_actions + CASE WHEN v_is_give_up THEN 0 ELSE 1 END;
  v_new_tree_health := CASE
    WHEN v_is_give_up THEN v_decayed_health
    ELSE LEAST(100, v_decayed_health + 6)
  END;

  UPDATE user_profiles
  SET
    xp = v_new_xp,
    level = v_new_level,
    streak = v_new_streak,
    daily_streak = v_new_daily_streak,
    best_streak = GREATEST(best_streak, v_new_streak),
    best_daily_streak = GREATEST(best_daily_streak, v_new_daily_streak),
    tasks_completed = v_new_tasks_completed,
    total_actions = v_new_total_actions,
    last_action_at = v_last_action_at,
    tree_health = v_new_tree_health,
    last_health_decay_day = v_today,
    updated_at = now()
  WHERE id = v_user_id;

  UPDATE daily_states
  SET
    heat = v_new_heat,
    today_actions = v_today_actions
  WHERE id = v_daily.id;

  IF p_task_id IS NOT NULL THEN
    UPDATE tasks
    SET
      completed = NOT v_is_give_up,
      completed_at = CASE WHEN v_is_give_up THEN NULL ELSE v_last_action_at END,
      completion_type = p_completion_type,
      xp_earned = v_xp_earned
    WHERE id = p_task_id AND user_id = v_user_id;
  END IF;

  INSERT INTO xp_events (
    user_id,
    task_id,
    xp_earned,
    completion_type,
    heat_at_time,
    streak_at_time,
    heat_multiplier,
    completion_multiplier,
    was_first_today,
    was_turbo_active
  )
  VALUES (
    v_user_id,
    p_task_id,
    v_xp_earned,
    p_completion_type,
    v_daily.heat,
    v_profile.streak,
    v_heat_multiplier,
    v_completion_multiplier,
    v_first_today,
    v_turbo_active
  );

  RETURN QUERY
  SELECT
    v_xp_earned,
    v_new_xp,
    v_new_level,
    v_leveled_up,
    v_new_heat,
    v_new_streak,
    v_new_daily_streak,
    v_new_tasks_completed,
    v_new_total_actions,
    v_today_actions,
    v_last_action_at,
    v_new_tree_health,
    (v_new_tree_health <= 60 AND v_new_xp > 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_tree_health_rpc() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_task_rpc(TEXT, UUID, TIMESTAMPTZ) TO anon, authenticated;
