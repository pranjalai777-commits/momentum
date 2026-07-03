import { createUuid } from "@/lib/ids";
import { createInitialMomentumData, getDateKey, getLocalDateIso } from "@/lib/momentum";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/useGameStore";
import { useRoutineStore } from "@/store/useRoutineStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useCallback, useEffect, useRef } from "react";

type ConnectivityState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

type DbProfile = {
  xp: number;
  level: number;
  streak: number;
  daily_streak: number;
  best_streak: number;
  best_daily_streak: number;
  tasks_completed: number;
  total_actions: number;
  last_action_at: string | null;
  tree_health: number;
  last_health_decay_day: string | null;
};

type DbDailyState = {
  date: string;
  heat: number;
  today_actions: number;
  turbo_activated_at: string | null;
  turbo_last_used_day: string | null;
  heat_before_turbo: number;
};

type DbTask = {
  id: string;
  text: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  routine_id: string | null;
  task_date: string | null;
};

function toDbDate(): string {
  return getLocalDateIso();
}

type DbRoutineTask = {
  id: string;
  text: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export function useSync(enabled: boolean): void {
  const isRunningRef = useRef(false);

  const runSync = useCallback(async () => {
    if (!enabled || isRunningRef.current) return;
    isRunningRef.current = true;
    try {
      const sessionResult = await supabase.auth.getSession();
      if (sessionResult.error) throw sessionResult.error;
      const user = sessionResult.data.session?.user;
      if (!user) return;

      const localData = useGameStore.getState().data ?? createInitialMomentumData();
      const todayDb = toDbDate();

      const profileResult = await supabase
        .from("user_profiles")
        .select(
          "xp,level,streak,daily_streak,best_streak,best_daily_streak,tasks_completed,total_actions,last_action_at,tree_health,last_health_decay_day"
        )
        .eq("id", user.id)
        .maybeSingle();
      if (profileResult.error) throw profileResult.error;

      let profile = profileResult.data as DbProfile | null;
      if (!profile) {
        const upsertResult = await supabase.from("user_profiles").upsert(
          {
            id: user.id,
            xp: localData.xp,
            level: 1,
            streak: localData.streak,
            daily_streak: localData.dailyStreak,
            best_streak: localData.bestStreak,
            best_daily_streak: localData.bestDailyStreak,
            tasks_completed: localData.tasksCompleted,
            total_actions: localData.totalActions,
            last_action_at: localData.lastActionTime ? new Date(localData.lastActionTime).toISOString() : null,
            tree_health: localData.treeHealth,
            last_health_decay_day: localData.lastHealthDecayDay ? new Date(localData.lastHealthDecayDay).toISOString().slice(0, 10) : null,
          },
          { onConflict: "id" }
        );
        if (upsertResult.error) throw upsertResult.error;
        profile = {
          xp: localData.xp,
          level: 1,
          streak: localData.streak,
          daily_streak: localData.dailyStreak,
          best_streak: localData.bestStreak,
          best_daily_streak: localData.bestDailyStreak,
          tasks_completed: localData.tasksCompleted,
          total_actions: localData.totalActions,
          last_action_at: localData.lastActionTime ? new Date(localData.lastActionTime).toISOString() : null,
          tree_health: localData.treeHealth,
          last_health_decay_day: localData.lastHealthDecayDay ? new Date(localData.lastHealthDecayDay).toISOString().slice(0, 10) : null,
        };
      }

      const dailyResult = await supabase
        .from("daily_states")
        .select("date,heat,today_actions,turbo_activated_at,turbo_last_used_day,heat_before_turbo")
        .eq("user_id", user.id)
        .eq("date", todayDb)
        .maybeSingle();
      if (dailyResult.error) throw dailyResult.error;

      let dailyState = dailyResult.data as DbDailyState | null;
      if (!dailyState) {
        const dailyInsert = await supabase.from("daily_states").upsert(
          {
            user_id: user.id,
            date: todayDb,
            heat: localData.heat,
            today_actions: localData.todayActions,
            turbo_activated_at: localData.turboActivatedAt ? new Date(localData.turboActivatedAt).toISOString() : null,
            turbo_last_used_day: localData.turboLastUsedDay ? todayDb : null,
            heat_before_turbo: localData.heatBeforeTurbo,
          },
          { onConflict: "user_id,date" }
        );
        if (dailyInsert.error) throw dailyInsert.error;
        dailyState = {
          date: todayDb,
          heat: localData.heat,
          today_actions: localData.todayActions,
          turbo_activated_at: localData.turboActivatedAt ? new Date(localData.turboActivatedAt).toISOString() : null,
          turbo_last_used_day: localData.turboLastUsedDay ? todayDb : null,
          heat_before_turbo: localData.heatBeforeTurbo,
        };
      }

      const syncedData = {
        ...localData,
        xp: profile.xp,
        streak: profile.streak,
        dailyStreak: profile.daily_streak,
        bestStreak: profile.best_streak,
        bestDailyStreak: profile.best_daily_streak,
        tasksCompleted: profile.tasks_completed,
        totalActions: profile.total_actions,
        lastActionTime: profile.last_action_at ? Date.parse(profile.last_action_at) : null,
        treeHealth: profile.tree_health,
        lastHealthDecayDay: profile.last_health_decay_day
          ? getDateKey(Date.parse(profile.last_health_decay_day))
          : localData.lastHealthDecayDay,
        heat: dailyState.heat,
        todayActions: dailyState.today_actions,
        turboActivatedAt: dailyState.turbo_activated_at ? Date.parse(dailyState.turbo_activated_at) : null,
        turboLastUsedDay: dailyState.turbo_last_used_day
          ? getDateKey(Date.parse(dailyState.turbo_last_used_day))
          : null,
        heatBeforeTurbo: dailyState.heat_before_turbo,
        lastDayUsed: getDateKey(Date.parse(dailyState.date)),
      };
      useGameStore.getState().setData(syncedData);

      const routinesResult = await supabase
        .from("routine_tasks")
        .select("id,text,active,created_at,updated_at")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (routinesResult.error) throw routinesResult.error;

      const remoteRoutines = ((routinesResult.data ?? []) as DbRoutineTask[]).map((routine) => ({
        id: routine.id,
        text: routine.text,
        active: routine.active,
        createdAt: Date.parse(routine.created_at),
        updatedAt: Date.parse(routine.updated_at),
      }));
      useRoutineStore.getState().setRoutines(remoteRoutines);

      const tasksResult = await supabase
        .from("tasks")
        .select("id,text,completed,completed_at,created_at,routine_id,task_date")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (tasksResult.error) throw tasksResult.error;

      const remoteTasks = ((tasksResult.data ?? []) as DbTask[]).map((task) => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        completedAt: task.completed_at ? Date.parse(task.completed_at) : undefined,
        createdAt: Date.parse(task.created_at),
        routineId: task.routine_id ?? undefined,
        taskDate: task.task_date ?? undefined,
      }));

      const existingRoutineTasksToday = new Set(
        remoteTasks.filter((task) => task.taskDate === todayDb && task.routineId).map((task) => task.routineId)
      );
      const routinesToGenerate = remoteRoutines.filter(
        (routine) => routine.active && !existingRoutineTasksToday.has(routine.id)
      );

      if (routinesToGenerate.length > 0) {
        const now = new Date();
        const generatedTasks = routinesToGenerate.map((routine) => ({
          id: createUuid(),
          user_id: user.id,
          text: routine.text,
          completed: false,
          completed_at: null,
          created_at: now.toISOString(),
          deleted_at: null,
          routine_id: routine.id,
          task_date: todayDb,
        }));

        const generatedResult = await supabase.from("tasks").upsert(generatedTasks, {
          onConflict: "user_id,routine_id,task_date",
          ignoreDuplicates: false,
        });
        if (generatedResult.error) throw generatedResult.error;

        remoteTasks.unshift(
          ...generatedTasks.map((task) => ({
            id: task.id,
            text: task.text,
            completed: task.completed,
            completedAt: undefined,
            createdAt: Date.parse(task.created_at),
            routineId: task.routine_id,
            taskDate: task.task_date,
          }))
        );
      }

      useTaskStore.getState().setTasks(remoteTasks);
    } finally {
      isRunningRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let unsubscribe: (() => void) | undefined;
    let authUnsubscribe: (() => void) | undefined;

    const run = async () => {
      await runSync();
    };
    void run().catch((error: unknown) => {
      console.warn("[sync] Initial sync failed", error);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void run().catch((error: unknown) => {
          console.warn("[sync] Auth-change sync failed", error);
        });
      }
    });
    authUnsubscribe = () => authListener.subscription.unsubscribe();

    const bindConnectivityListener = async () => {
      try {
        const netInfoModule = await import("@react-native-community/netinfo");
        unsubscribe = netInfoModule.default.addEventListener((state: ConnectivityState) => {
          if (!state.isConnected || !state.isInternetReachable) return;
          void run().catch((error: unknown) => {
            console.warn("[sync] Reconnect sync failed", error);
          });
        });
      } catch (error) {
        console.warn("[sync] NetInfo unavailable; reconnect listener disabled.", error);
      }
    };

    void bindConnectivityListener();
    return () => {
      if (unsubscribe) unsubscribe();
      if (authUnsubscribe) authUnsubscribe();
    };
  }, [enabled, runSync]);
}
