import TreeModalComponent from "@/components/TreeModal";
import DailyBannerComponent from "@/components/DailyBanner";
import ProfileModalComponent from "@/components/ProfileModal";
import StatsModalComponent from "@/components/StatsModal";
import StreakModalComponent from "@/components/StreakModal";
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
import { hapticChipTap } from "@/lib/haptics";
import { useGameStore } from "@/store/useGameStore";
import { useTaskStore } from "@/store/useTaskStore";
import type { CeremonyState, CompletionType, Task } from "@/types";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import { useInterstitialAd } from "@/hooks/useInterstitialAd";
import { useNoAdsStore } from "@/store/useNoAdsStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";


function getActionErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Could not save to server. Please try again.";
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAnonymous } = useAuth();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [treeModalVisible, setTreeModalVisible] = useState(false);
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

  // --- Ad integration ---
  // Pattern: first 2 tasks of the day are ad-free, every completion from 3rd onwards shows an ad.
  // Resets at midnight each day. Skipped entirely if user has "Remove Ads" purchase.
  const { showAd } = useInterstitialAd();
  const noAds = useNoAdsStore((s) => s.noAds);
  const adDailyCountRef = useRef(0);
  const adDateRef = useRef("");
  const AD_FREE_TASKS = 2;
  const AD_DAILY_KEY = "momentum_ad_daily";

  useEffect(() => {
    AsyncStorage.getItem(AD_DAILY_KEY).then((val) => {
      if (val) {
        const stored = JSON.parse(val) as { date: string; count: number };
        const today = new Date().toISOString().split("T")[0];
        if (stored.date === today) {
          adDailyCountRef.current = stored.count;
          adDateRef.current = stored.date;
        }
      }
    });
  }, []);

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

      // Show ceremony immediately — all data is local, no network needed
      const prevXp = previousData.xp;
      console.log("[🔬CEREMONY] calling setCeremony active=true prevXp:", prevXp, "newXp:", prevXp + result.xpEarned);
      setCeremony({
        active: true,
        prevXp,
        newXp: prevXp + result.xpEarned,
        xpGained: result.xpEarned,
        leveledUp: result.leveledUp,
        completionType: type,
      });

      try {
        console.log("[🔬CEREMONY] awaiting completeTaskRemote...");
        await completeTaskRemote({
          completionType: type,
          taskId: activeTask.id,
          completedAt: new Date().toISOString(),
        });
        if (result.leveledUp && result.newLevel === 3 && isAnonymous && !saveProgressDismissed) {
          setPendingSavePrompt(true);
        }
      } catch (error) {
        console.log("[🔬CEREMONY] completeTaskRemote ERROR — resetting state:", getActionErrorMessage(error));
        setData(previousData);
        setTasks(previousTasks);
        setActiveTask(activeTask);
        setActionError(getActionErrorMessage(error));
        // Hide ceremony since data was rolled back
        setCeremony((prev) => ({ ...prev, active: false }));
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

    // Capture completionType before clearing ceremony state
    const completionType = ceremony.completionType;

    setCeremony((prev) => ({ ...prev, active: false }));

    if (pendingSavePrompt) {
      setPendingSavePrompt(false);
      setShowSaveProgressPrompt(true);
      return; // Skip ad when save-progress prompt is showing
    }

    // Only count real completions (not give-ups) toward the daily ad logic
    if (completionType !== "gave-up") {
      const today = new Date().toISOString().split("T")[0];
      // Reset counter if it's a new day
      if (adDateRef.current !== today) {
        adDailyCountRef.current = 0;
        adDateRef.current = today;
      }
      adDailyCountRef.current += 1;
      AsyncStorage.setItem(
        AD_DAILY_KEY,
        JSON.stringify({ date: today, count: adDailyCountRef.current })
      );
      // Show ad from the 3rd task onwards every completion (skipped if user purchased Remove Ads)
      if (!noAds && adDailyCountRef.current > AD_FREE_TASKS) {
        showAd();
      }
    }
  }, [pendingSavePrompt, ceremony.completionType, showAd]);

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
      style={{ paddingTop: insets.top + 4 }}
    >
      {/* ── Ambient background — always on ── */}
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 4000, loop: true, repeatReverse: true }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <Svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <Defs>
            {/* Cyan — top centre */}
            <RadialGradient id="n1" cx="50%" cy="0%" r="60%" fx="50%" fy="0%">
              <Stop offset="0%" stopColor="#00d9f5" stopOpacity={turboActive ? "0" : "0.14"} />
              <Stop offset="100%" stopColor="#00d9f5" stopOpacity="0" />
            </RadialGradient>
            {/* Purple — top centre (both modes) */}
            <RadialGradient id="n2" cx="50%" cy="2%" r="55%" fx="50%" fy="2%">
              <Stop offset="0%" stopColor="#8833ff" stopOpacity="0.10" />
              <Stop offset="100%" stopColor="#8833ff" stopOpacity="0" />
            </RadialGradient>
            {/* Cyan — bottom-right (normal only) */}
            <RadialGradient id="n3" cx="95%" cy="85%" r="40%" fx="95%" fy="85%">
              <Stop offset="0%" stopColor="#00d9f5" stopOpacity={turboActive ? "0" : "0.07"} />
              <Stop offset="100%" stopColor="#00d9f5" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#n1)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#n2)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#n3)" />
        </Svg>
      </MotiView>

      {/* Second layer — drifts out of phase for depth */}
      <MotiView
        from={{ opacity: 0.3 }}
        animate={{ opacity: 0.75 }}
        transition={{ type: "timing", duration: 5500, loop: true, repeatReverse: true }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <Svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <Defs>
            {/* Purple — mid-left */}
            <RadialGradient id="n4" cx="0%" cy="55%" r="45%" fx="0%" fy="55%">
              <Stop offset="0%" stopColor="#7c3aed" stopOpacity={turboActive ? "0" : "0.09"} />
              <Stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </RadialGradient>
            {/* Cyan — mid-right (normal only) */}
            <RadialGradient id="n5" cx="100%" cy="40%" r="40%" fx="100%" fy="40%">
              <Stop offset="0%" stopColor="#00d9f5" stopOpacity={turboActive ? "0" : "0.07"} />
              <Stop offset="100%" stopColor="#00d9f5" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#n4)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#n5)" />
        </Svg>
      </MotiView>

      {/* ── Turbo ambient — only when active ── */}
      {turboActive ? (
        <MotiView
          from={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 3000, loop: true, repeatReverse: true }}
          style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
        >
          <Svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <Defs>
              {/* Purple — top centre */}
              <RadialGradient id="rg1" cx="50%" cy="0%" r="55%" fx="50%" fy="0%">
                <Stop offset="0%" stopColor="#9933ff" stopOpacity="0.22" />
                <Stop offset="100%" stopColor="#9933ff" stopOpacity="0" />
              </RadialGradient>
              {/* Pink — bottom-left */}
              <RadialGradient id="rg2" cx="10%" cy="90%" r="50%" fx="10%" fy="90%">
                <Stop offset="0%" stopColor="#ff1a80" stopOpacity="0.16" />
                <Stop offset="100%" stopColor="#ff1a80" stopOpacity="0" />
              </RadialGradient>
              {/* Cyan — bottom-right */}
              <RadialGradient id="rg3" cx="90%" cy="75%" r="45%" fx="90%" fy="75%">
                <Stop offset="0%" stopColor="#00d9f5" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#00d9f5" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#rg1)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#rg2)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#rg3)" />
          </Svg>
        </MotiView>
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
          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={prompt}
              from={{ opacity: 0, translateY: 5 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -5 }}
              transition={{ type: "timing", duration: 380 }}
            >
              <Text className="text-muted-foreground font-sans text-[13px] -mt-2">{prompt}</Text>
            </MotiView>
          </AnimatePresence>
        <DailyBannerComponent
          dailyStreak={data.dailyStreak}
          onOpenProfile={() => {
            if (isAnonymous) {
              router.push("/(auth)/email?mode=signup&upgrade=1");
            } else {
              setProfileModalVisible(true);
            }
          }}
          onOpenStats={() => setStatsModalVisible(true)}
          onOpenStreak={() => setStreakModalVisible(true)}
        />
        <Pressable
          onPress={() => { hapticChipTap(); setTreeModalVisible(true); }}
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
      <View className="z-[2]" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
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

      <TreeModalComponent
        visible={treeModalVisible}
        onClose={() => setTreeModalVisible(false)}
      />

      <StreakModalComponent
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
        dailyStreak={data.dailyStreak}
        bestDailyStreak={data.bestDailyStreak}
        streak={data.streak}
        bestStreak={data.bestStreak}
        lastActionAt={data.lastActionTime ? new Date(data.lastActionTime).toISOString() : null}
      />

      <ProfileModalComponent
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        onUpgradeAccount={() => router.push("/(auth)/email?mode=signup&upgrade=1")}
      />

      <StatsModalComponent
        visible={statsModalVisible}
        onClose={() => setStatsModalVisible(false)}
      />
    </View>
  );
}
