import { getDateKey } from "@/lib/momentum";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/useGameStore";
import type { CompletionType, Task } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";

type CompleteTaskBody = {
  completionType: CompletionType;
  taskId: string;
  completedAt: string;
};

type CompleteTaskResponse = {
  xpEarned: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  newHeat: number;
  newStreak: number;
  newDailyStreak: number;
  newTasksCompleted: number;
  newTotalActions: number;
  todayActions: number;
  lastActionAt: string;
  newTreeHealth: number;
  treeInDanger: boolean;
};

type ActivateTurboResponse = {
  activated: boolean;
  expiresAt: string;
};

const TURBO_DURATION_MS = 2 * 60 * 60 * 1000;

async function requireAccessToken(): Promise<string> {
  const { data: authData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = authData.session?.access_token;
  if (!token) throw new Error("No active auth session. Please sign in again.");
  return token;
}

type CompleteTaskRpcRow = {
  xp_earned: number;
  new_xp: number;
  new_level: number;
  leveled_up: boolean;
  new_heat: number;
  new_streak: number;
  new_daily_streak: number;
  new_tasks_completed: number;
  new_total_actions: number;
  today_actions: number;
  last_action_at: string;
  new_tree_health: number;
  tree_in_danger: boolean;
};

type ActivateTurboRpcRow = {
  activated: boolean;
  expires_at: string;
};

type SyncTreeHealthRpcRow = {
  tree_health: number;
  last_health_decay_day: string | null;
  tree_in_danger: boolean;
};

export function useTasksQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["supabase-tasks"],
    enabled,
    queryFn: async () => {
      const { data: authData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const userId = authData.session?.user.id;
      if (!userId) return [] as Task[];

      const { data, error } = await supabase
        .from("tasks")
        .select("id,text,completed,completed_at,created_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((task) => ({
        id: task.id,
        text: task.text,
        completed: task.completed,
        completedAt: task.completed_at ? Date.parse(task.completed_at) : undefined,
        createdAt: Date.parse(task.created_at),
      }));
    },
  });
}

export function useRemoteMutations() {
  const setData = useGameStore((s) => s.setData);

  const completeTaskMutation = useMutation({
    mutationFn: async (body: CompleteTaskBody) => {
      const { data, error } = await supabase.rpc("complete_task_rpc", {
        p_completion_type: body.completionType,
        p_task_id: body.taskId,
        p_completed_at: body.completedAt,
      });
      if (error) throw error;
      const row = (data as CompleteTaskRpcRow[] | null)?.[0];
      if (!row) throw new Error("Missing response payload from complete_task_rpc");
      const response: CompleteTaskResponse = {
        xpEarned: row.xp_earned,
        newXp: row.new_xp,
        newLevel: row.new_level,
        leveledUp: row.leveled_up,
        newHeat: row.new_heat,
        newStreak: row.new_streak,
        newDailyStreak: row.new_daily_streak,
        newTasksCompleted: row.new_tasks_completed,
        newTotalActions: row.new_total_actions,
        todayActions: row.today_actions,
        lastActionAt: row.last_action_at,
        newTreeHealth: row.new_tree_health,
        treeInDanger: row.tree_in_danger,
      };
      return response;
    },
    onSuccess: (response) => {
      const prev = useGameStore.getState().data;
      setData({
        ...prev,
        xp: response.newXp,
        heat: response.newHeat,
        streak: response.newStreak,
        dailyStreak: response.newDailyStreak,
        tasksCompleted: response.newTasksCompleted,
        totalActions: response.newTotalActions,
        todayActions: response.todayActions,
        lastActionTime: Date.parse(response.lastActionAt),
        treeHealth: response.newTreeHealth,
        lastHealthDecayDay: getDateKey(),
      });
    },
    onError: (error) => {
      console.warn("[remote] complete-task failed", error);
    },
  });

  const activateTurboMutation = useMutation({
    mutationFn: async () => {
      await requireAccessToken();
      const { data, error } = await supabase.rpc("activate_turbo_rpc");
      if (error) throw error;
      const row = (data as ActivateTurboRpcRow[] | null)?.[0];
      if (!row) throw new Error("Missing response payload from activate_turbo_rpc");
      const response: ActivateTurboResponse = {
        activated: row.activated,
        expiresAt: row.expires_at,
      };
      return response;
    },
    onSuccess: (response) => {
      if (!response.activated) return;
      const prev = useGameStore.getState().data;
      setData({
        ...prev,
        heat: 100,
        heatBeforeTurbo: prev.heat,
        turboActivatedAt: Date.parse(response.expiresAt) - TURBO_DURATION_MS,
        turboLastUsedDay: getDateKey(),
      });
    },
    onError: (error) => {
      console.warn("[remote] activate-turbo failed", error);
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { data: authData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const userId = authData.session?.user.id;
      if (!userId) throw new Error("No user session for addTask");

      const { error } = await supabase.from("tasks").upsert(
        {
          id: task.id,
          user_id: userId,
          text: task.text,
          completed: task.completed,
          completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
          created_at: new Date(task.createdAt).toISOString(),
          deleted_at: null,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", taskId);
      if (error) throw error;
    },
  });

  const syncTreeHealthMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("sync_tree_health_rpc");
      if (error) throw error;
      const row = (data as SyncTreeHealthRpcRow[] | null)?.[0];
      if (!row) throw new Error("Missing response payload from sync_tree_health_rpc");
      return row;
    },
    onSuccess: (row) => {
      const prev = useGameStore.getState().data;
      setData({
        ...prev,
        treeHealth: row.tree_health,
        lastHealthDecayDay: row.last_health_decay_day
          ? getDateKey(Date.parse(row.last_health_decay_day))
          : prev.lastHealthDecayDay,
      });
    },
    onError: (error) => {
      console.warn("[remote] sync-tree-health failed", error);
    },
  });

  return {
    completeTaskRemote: completeTaskMutation.mutateAsync,
    activateTurboRemote: activateTurboMutation.mutateAsync,
    addTaskRemote: addTaskMutation.mutateAsync,
    deleteTaskRemote: deleteTaskMutation.mutateAsync,
    syncTreeHealthRemote: syncTreeHealthMutation.mutateAsync,
  };
}
