import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export type DailyStateRow = {
  date: string;
  today_actions: number;
  heat: number;
};

async function fetchStreakHistory(): Promise<DailyStateRow[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_states")
    .select("date, today_actions, heat")
    .gte("date", fromDate)
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DailyStateRow[];
}

export function useStreakHistory(enabled = true) {
  return useQuery({
    queryKey: ["streak-history"],
    queryFn: fetchStreakHistory,
    enabled,
    staleTime: 60_000,
  });
}
