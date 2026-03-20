import DailyBannerComponent from "@/components/DailyBanner";
import HeatMeterComponent from "@/components/HeatMeter";
import StatsBarComponent from "@/components/StatsBar";
import TaskInputComponent from "@/components/TaskInput";
import TaskListComponent from "@/components/TaskList";
import TaskTimerComponent from "@/components/TaskTimer";
import TurboButtonComponent from "@/components/TurboButton";
import XPBarComponent from "@/components/XPBar";
import XPCeremonyComponent from "@/components/XPCeremony";
import { COLORS, GRADIENTS } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useRemoteMutations } from "@/hooks/useRemoteData";
import { getMotivationalPrompt, getTreeHealthLabel, isTreeInDanger } from "@/lib/momentum";
import { useGameStore } from "@/store/useGameStore";
import { useTaskStore } from "@/store/useTaskStore";
import type { CeremonyState, CompletionType, Task } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AmbientParticle = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
};

function createTurboAmbientParticles(count: number): AmbientParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    left: 4 + Math.random() * 92,
    top: 10 + Math.random() * 72,
    size: 4 + Math.random() * 8,
    duration: 2600 + Math.random() * 2400,
    delay: i * 120,
    opacity: 0.35 + Math.random() * 0.5,
  }));
}

function getActionErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Could not save to server. Please try again.";
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAnonymous } = useAuth();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [prompt, setPrompt] = useState(getMotivationalPrompt());
  const [showSaveProgressPrompt, setShowSaveProgressPrompt] = useState(false);
  const [saveProgressDismissed, setSaveProgressDismissed] = useState(false);
  const [pendingSavePrompt, setPendingSavePrompt] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ceremony, setCeremony] = useState<CeremonyState>({
    active: false,
    prevXp: 0,
    newXp: 0,
    xpGained: 0,
    leveledUp: false,
    completionType: "early",
  });

  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const markCompleted = useTaskStore((s) => s.markCompleted);
  const setTasks = useTaskStore((s) => s.setTasks);

  const data = useGameStore((s) => s.data);
  const setData = useGameStore((s) => s.setData);
  const turboActive = useGameStore((s) => s.turboActive);
  const lastXpGained = useGameStore((s) => s.lastXpGained);
  const showDailyBonus = useGameStore((s) => s.showDailyBonus);
  const completeTask = useGameStore((s) => s.completeTask);
  const activateTurbo = useGameStore((s) => s.activateTurbo);
  const dismissDailyBonus = useGameStore((s) => s.dismissDailyBonus);
  const checkTurboExpiry = useGameStore((s) => s.checkTurboExpiry);
  const { addTaskRemote, completeTaskRemote, deleteTaskRemote, activateTurboRemote } = useRemoteMutations();

  useEffect(() => {
    const interval = setInterval(() => setPrompt(getMotivationalPrompt()), 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!turboActive) return;
    const interval = setInterval(checkTurboExpiry, 1000);
    return () => clearInterval(interval);
  }, [turboActive, checkTurboExpiry]);

  useEffect(() => {
    if (!showDailyBonus) return;
    const timeout = setTimeout(dismissDailyBonus, 2000);
    return () => clearTimeout(timeout);
  }, [dismissDailyBonus, showDailyBonus]);

  useEffect(() => {
    if (!isAnonymous) setShowSaveProgressPrompt(false);
  }, [isAnonymous]);

  const pendingCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);
  const treeInDanger = useMemo(() => isTreeInDanger(data), [data]);
  const treeHealthLabel = useMemo(() => getTreeHealthLabel(data.treeHealth), [data.treeHealth]);
  const turboAmbientParticles = useMemo(() => createTurboAmbientParticles(14), []);

  const handleAddTask = useCallback(
    async (text: string) => {
      setActionError(null);
      const task = addTask(text);
      try {
        await addTaskRemote(task);
      } catch (error) {
        deleteTask(task.id);
        setActionError(getActionErrorMessage(error));
      }
    },
    [addTask, addTaskRemote, deleteTask]
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      setActionError(null);
      const previousTasks = useTaskStore.getState().tasks;
      deleteTask(id);
      try {
        await deleteTaskRemote(id);
      } catch (error) {
        setTasks(previousTasks);
        setActionError(getActionErrorMessage(error));
      }
    },
    [deleteTask, deleteTaskRemote, setTasks]
  );

  const handleActivateTurbo = useCallback(async () => {
    setActionError(null);
    const previousData = useGameStore.getState().data;
    activateTurbo();
    try {
      await activateTurboRemote();
    } catch (error) {
      setData(previousData);
      setActionError(getActionErrorMessage(error));
    }
  }, [activateTurbo, activateTurboRemote, setData]);

  const handleTaskComplete = useCallback(
    async (type: CompletionType) => {
      console.log("[🔬CEREMONY] handleTaskComplete called — type:", type, "activeTask:", activeTask?.id ?? "NULL");
      if (!activeTask) {
        console.log("[🔬CEREMONY] BLOCKED — activeTask is null, returning early");
        return;
      }
      setActionError(null);
      const previousData = useGameStore.getState().data;
      const previousTasks = useTaskStore.getState().tasks;
      console.log("[🔬CEREMONY] prevXp snapshot:", previousData.xp);
      const result = completeTask(type);
      console.log("[🔬CEREMONY] completeTask result:", JSON.stringify(result));
      if (!result.isGiveUp) markCompleted(activeTask.id);
      console.log("[🔬CEREMONY] calling setActiveTask(null)");
      setActiveTask(null);

      try {
        console.log("[🔬CEREMONY] awaiting completeTaskRemote...");
        await completeTaskRemote({
          completionType: type,
          taskId: activeTask.id,
          completedAt: new Date().toISOString(),
        });
        console.log("[🔬CEREMONY] completeTaskRemote resolved, scheduling setCeremony in 300ms");
        const prevXp = previousData.xp;
        setTimeout(() => {
          console.log("[🔬CEREMONY] setTimeout fired — calling setCeremony active=true prevXp:", prevXp, "newXp:", prevXp + result.xpEarned);
          setCeremony((prev) => {
            console.log("[🔬CEREMONY] setCeremony updater — prev.active:", prev.active, "→ setting active: true");
            return {
              active: true,
              prevXp,
              newXp: prevXp + result.xpEarned,
              xpGained: result.xpEarned,
              leveledUp: result.leveledUp,
              completionType: type,
            };
          });
        }, 300);
        if (result.leveledUp && result.newLevel === 3 && isAnonymous && !saveProgressDismissed) {
          setPendingSavePrompt(true);
        }
      } catch (error) {
        console.log("[🔬CEREMONY] completeTaskRemote ERROR — resetting state:", getActionErrorMessage(error));
        setData(previousData);
        setTasks(previousTasks);
        setActiveTask(activeTask);
        setActionError(getActionErrorMessage(error));
      }
    },
    [
      activeTask,
      completeTask,
      completeTaskRemote,
      isAnonymous,
      markCompleted,
      saveProgressDismissed,
      setData,
      setTasks,
    ]
  );

  const handleCeremonyFinish = useCallback(() => {
    console.log("[🔬CEREMONY] onFinish called — setting active=false");
    setCeremony((prev) => ({ ...prev, active: false }));
    if (pendingSavePrompt) {
      setPendingSavePrompt(false);
      setShowSaveProgressPrompt(true);
    }
  }, [pendingSavePrompt]);

  const handleDismissSavePrompt = useCallback(() => {
    setSaveProgressDismissed(true);
    setShowSaveProgressPrompt(false);
  }, []);

  const handleLinkAccount = useCallback(() => {
    setShowSaveProgressPrompt(false);
    router.push("/(auth)/email?mode=signup&upgrade=1");
  }, [router]);

  return (
    <View
      className="flex-1 bg-background px-4 overflow-hidden"
      style={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 6 }}
    >
      <LinearGradient
        colors={
          turboActive
            ? ["rgba(255, 26, 128, 0.20)", "rgba(153, 51, 255, 0.10)", "rgba(6,10,22,0)"]
            : ["rgba(0, 217, 245, 0.14)", "rgba(136, 51, 255, 0.09)", "rgba(6,10,22,0)"]
        }
        className="absolute top-[-80px] left-1/2 w-[480px] h-[260px] rounded-[300px]"
        style={{ marginLeft: -240 }}
      />

      {turboActive ? (
        <View className="absolute inset-0 z-[1] pointer-events-none">
          <MotiView
            from={{ opacity: 0.35, scale: 0.9 }}
            animate={{ opacity: 0.68, scale: 1.08 }}
            transition={{ type: "timing", duration: 1800, loop: true, repeatReverse: true }}
            style={{
              position: "absolute",
              width: 560,
              height: 560,
              borderRadius: 9999,
              alignSelf: "center",
              top: -120,
              backgroundColor: "rgba(255, 26, 128, 0.14)",
            }}
          />

          <MotiView
            from={{ opacity: 0.2, scale: 0.95 }}
            animate={{ opacity: 0.48, scale: 1.12 }}
            transition={{ type: "timing", duration: 2200, loop: true, repeatReverse: true }}
            style={{
              position: "absolute",
              width: 700,
              height: 700,
              borderRadius: 9999,
              alignSelf: "center",
              top: -220,
              borderWidth: 1,
              borderColor: "rgba(153, 51, 255, 0.32)",
            }}
          />

          {turboAmbientParticles.map((particle, index) => (
            <MotiView
              key={`turbo-particle-${index}-${particle.left.toFixed(2)}`}
              from={{ opacity: 0, translateY: 14, scale: 0.8 }}
              animate={{ opacity: particle.opacity, translateY: -22, scale: 1.2 }}
              transition={{
                type: "timing",
                duration: particle.duration,
                delay: particle.delay,
                loop: true,
                repeatReverse: true,
              }}
              style={{
                position: "absolute",
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: particle.size,
                height: particle.size,
                borderRadius: 999,
                backgroundColor: index % 2 === 0 ? COLORS.turboPink : COLORS.turboPurple,
                shadowColor: index % 2 === 0 ? COLORS.turboPink : COLORS.turboPurple,
                shadowOpacity: 0.85,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          ))}
        </View>
      ) : null}

      {showDailyBonus ? (
        <Text className="absolute top-[30%] self-center z-50 text-daily-bonus font-display text-[20px]">
          🌟 DAILY BONUS +15 XP
        </Text>
      ) : null}

      {actionError ? (
        <View className="mb-[8px] rounded-[12px] border border-neon-pink bg-card px-[10px] py-[8px]">
          <Text className="text-neon-pink font-sans text-[12px]">{actionError}</Text>
        </View>
      ) : null}

      {/* ── Header ── */}
      <View className="items-center gap-[10px] pb-[14px] z-[2]">
        <Text
          className="text-foreground font-display text-[36px] tracking-[2px]"
          style={{
            shadowColor: COLORS.neonCyan,
            shadowOpacity: 0.22,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          MOMENTUM
        </Text>
        <Text className="text-muted-foreground font-sans text-[13px] -mt-1">{prompt}</Text>
        <DailyBannerComponent
          dailyStreak={data.dailyStreak}
          onOpenProfile={() => router.push("/(app)/profile")}
          onOpenStats={() => router.push("/(app)/stats")}
        />
        <Pressable
          onPress={() => router.push("/(app)/tree")}
          className="flex-row items-center gap-[8px] px-[10px] py-[6px] rounded-full border"
          style={{
            borderColor: treeInDanger ? "#f07000aa" : COLORS.border,
            backgroundColor: treeInDanger ? "rgba(240,112,0,0.10)" : COLORS.cardElevated,
          }}
        >
          <Text className="text-[13px]">{data.treeHealth === 0 ? "💀" : data.treeHealth <= 30 ? "🥀" : "🌳"}</Text>
          <Text
            className="font-display text-[11px] uppercase tracking-[1.3px]"
            style={{ color: treeInDanger ? "#f0ad00" : COLORS.mutedForeground }}
          >
            {treeInDanger ? "Tree needs care!" : `Your Tree · ${treeHealthLabel}`}
          </Text>
        </Pressable>
        <XPBarComponent xp={data.xp} xpGained={lastXpGained} />
        {data.todayActions === 0 ? (
          <View className="flex-row items-center gap-[5px] px-[10px] py-[4px] rounded-[14px] bg-[#1f1508] border" style={{ borderColor: COLORS.dailyBonus + "55" }}>
            <Sparkles size={12} color={COLORS.dailyBonus} />
            <Text className="text-daily-bonus font-display-medium text-[11px]">Bonus ready on your first task today</Text>
          </View>
        ) : null}
      </View>

      {/* ── Task area (grows to fill space) ── */}
      <View className="flex-1 gap-[10px] z-[2]">
        <TaskInputComponent onAdd={(text) => void handleAddTask(text)} />
        {pendingCount > 0 ? (
          <View className="flex-row items-center gap-2 px-[2px]">
            <View className="w-[5px] h-[5px] rounded-full bg-neon-cyan opacity-70" />
            <Text className="text-muted-foreground font-display text-[10px] tracking-[2.2px] uppercase">
              {pendingCount} TASK{pendingCount === 1 ? "" : "S"} TO CRUSH
            </Text>
          </View>
        ) : null}
        <TaskListComponent
          tasks={tasks}
          activeTaskId={activeTask?.id ?? null}
          onStart={(task) => {
            if (!task.completed) setActiveTask(task);
          }}
           onDelete={(id) => void handleDeleteTask(id)}
        />
      </View>

      {/* ── Footer panel ── */}
      <View className="z-[2] pb-1">
        <View className="h-px bg-border mb-3 opacity-50" />
        <View className="items-center gap-[10px]">
          <TurboButtonComponent data={data} onActivate={() => void handleActivateTurbo()} />
          <HeatMeterComponent heat={data.heat} turboActive={turboActive} />
          <StatsBarComponent
            totalActions={data.tasksCompleted}
            streak={data.streak}
            bestStreak={data.bestStreak}
          />
        </View>
      </View>

      {activeTask ? (
        <TaskTimerComponent
          task={activeTask}
           onComplete={(type) => void handleTaskComplete(type)}
          onCancel={() => setActiveTask(null)}
        />
      ) : null}

      {ceremony.active ? (
        <XPCeremonyComponent
          xp={ceremony.newXp}
          prevXp={ceremony.prevXp}
          xpGained={ceremony.xpGained}
          leveledUp={ceremony.leveledUp}
          completionType={ceremony.completionType}
          onFinish={handleCeremonyFinish}
        />
      ) : null}

      {showSaveProgressPrompt ? (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 260 }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 120,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(6,10,22,0.88)",
            paddingHorizontal: 28,
          }}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 220, delay: 80 }}
            style={{
              width: "100%",
              maxWidth: 340,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: "#111827",
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.5,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            {/* Icon badge */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#0a1f2e",
                borderWidth: 1.5,
                borderColor: COLORS.neonCyan + "60",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                shadowColor: COLORS.neonCyan,
                shadowOpacity: 0.2,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Text style={{ fontSize: 32 }}>🔐</Text>
            </View>

            {/* Title */}
            <Text
              style={{
                color: COLORS.foreground,
                fontFamily: "SpaceGrotesk_700Bold",
                fontSize: 21,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Save Your Progress
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                color: COLORS.mutedForeground,
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                lineHeight: 20,
                textAlign: "center",
                marginBottom: 28,
                paddingHorizontal: 8,
              }}
            >
              You hit Level 3! Link an account so your streak, XP, and momentum are never lost.
            </Text>

            {/* Buttons */}
            <View style={{ alignSelf: "stretch", gap: 10 }}>
              {/* Primary */}
              <Pressable
                onPress={handleLinkAccount}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  shadowColor: COLORS.neonCyan,
                  shadowOpacity: 0.38,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 0 },
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}
              >
                <View style={{ borderRadius: 14, overflow: "hidden" }}>
                  <LinearGradient
                    colors={GRADIENTS.cyanPurple}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: 52,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: "SpaceGrotesk_700Bold",
                        fontSize: 15,
                        letterSpacing: 0.4,
                      }}
                    >
                      Link Account
                    </Text>
                  </LinearGradient>
                </View>
              </Pressable>

              {/* Secondary */}
              <Pressable
                onPress={handleDismissSavePrompt}
                style={({ pressed }) => ({
                  height: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.muted,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: COLORS.mutedForeground,
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                  }}
                >
                  Maybe Later
                </Text>
              </Pressable>
            </View>
          </MotiView>
        </MotiView>
      ) : null}
    </View>
  );
}
