import { useState, useCallback, useEffect } from "react";
import TaskInput from "@/components/TaskInput";
import TaskList from "@/components/TaskList";
import TaskTimer from "@/components/TaskTimer";
import type { CompletionType } from "@/components/TaskTimer";
import XPBar from "@/components/XPBar";
import HeatMeter from "@/components/HeatMeter";
import StatsBar from "@/components/StatsBar";
import DailyBanner from "@/components/DailyBanner";
import XPCeremony from "@/components/XPCeremony";
import TurboButton from "@/components/TurboButton";
import {
  loadData, saveData, loadTasks, saveTasks, calculateXP, getLevel, isFirstActionToday,
  getMotivationalPrompt, isTurboActive, activateTurbo, deactivateTurbo,
  type MomentumData, type Task
} from "@/lib/momentum";

const HEAT_PER_ACTION = 12;

function getDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// XP multipliers by completion type
const XP_MULTIPLIERS: Record<CompletionType, number> = {
  early: 2.0,
  "on-time": 1.5,
  late: 1.6,      // 80% of early (2.0 × 0.8)
  "gave-up": 0.2,
};

interface CeremonyState {
  active: boolean;
  prevXp: number;
  newXp: number;
  xpGained: number;
  leveledUp: boolean;
  completionType: CompletionType;
}

const Index = () => {
  const [data, setData] = useState<MomentumData>(loadData);
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [prompt, setPrompt] = useState(getMotivationalPrompt);
  const [turboActive, setTurboActive] = useState(() => isTurboActive(loadData()));
  const [ceremony, setCeremony] = useState<CeremonyState>({
    active: false, prevXp: 0, newXp: 0, xpGained: 0, leveledUp: false, completionType: "early"
  });

  useEffect(() => {
    const interval = setInterval(() => setPrompt(getMotivationalPrompt()), 8000);
    return () => clearInterval(interval);
  }, []);

  // Check turbo expiry
  useEffect(() => {
    if (!turboActive) return;
    const interval = setInterval(() => {
      if (!isTurboActive(data)) {
        const next = deactivateTurbo(data);
        setData(next);
        saveData(next);
        setTurboActive(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [turboActive, data]);

  const handleActivateTurbo = useCallback(() => {
    setData(prev => {
      const next = activateTurbo(prev);
      saveData(next);
      setTurboActive(true);
      return next;
    });
  }, []);

  const triggerCeremony = useCallback((prevXp: number, newXp: number, earned: number, didLevelUp: boolean, type: CompletionType) => {
    setCeremony({ active: true, prevXp, newXp, xpGained: earned, leveledUp: didLevelUp, completionType: type });
  }, []);

  const handleCeremonyFinish = useCallback(() => {
    setCeremony(prev => ({ ...prev, active: false }));
  }, []);

  const addTask = useCallback((text: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks(prev => {
      const next = [newTask, ...prev];
      saveTasks(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveTasks(next);
      return next;
    });
  }, []);

  const startTask = useCallback((task: Task) => {
    if (task.completed) return;
    setActiveTask(task);
  }, []);

  const completeTask = useCallback((type: CompletionType) => {
    if (!activeTask) return;

    const isGiveUp = type === "gave-up";

    // Mark task as done (or not if gave up)
    if (!isGiveUp) {
      setTasks(prev => {
        const next = prev.map(t =>
          t.id === activeTask.id ? { ...t, completed: true, completedAt: Date.now() } : t
        );
        saveTasks(next);
        return next;
      });
    }

    // Award XP
    setData(prev => {
      const firstToday = isFirstActionToday(prev);
      const newStreak = isGiveUp ? prev.streak : prev.streak + 1;
      const baseEarned = calculateXP(newStreak, prev.heat, firstToday);
      const earned = Math.round(baseEarned * XP_MULTIPLIERS[type]);
      const prevLevel = getLevel(prev.xp);
      const newXp = prev.xp + earned;
      const newLevel = getLevel(newXp);
      const today = getDateKey();

      setXpGained(earned);

      if (firstToday && !isGiveUp) {
        setShowDailyBonus(true);
        setTimeout(() => setShowDailyBonus(false), 2000);
      }

      const didLevelUp = newLevel > prevLevel;
      setTimeout(() => triggerCeremony(prev.xp, newXp, earned, didLevelUp, type), 300);

      const newDailyStreak = firstToday && !isGiveUp
        ? (prev.lastDayUsed === today ? prev.dailyStreak : prev.dailyStreak + 1)
        : prev.dailyStreak;

      const next: MomentumData = {
        xp: newXp,
        heat: turboActive ? 100 : Math.min(100, prev.heat + (type === "early" ? HEAT_PER_ACTION : 0)),
        totalActions: prev.totalActions + 1,
        lastActionTime: Date.now(),
        streak: newStreak,
        dailyStreak: newDailyStreak,
        lastDayUsed: today,
        todayActions: prev.todayActions + (isGiveUp ? 0 : 1),
        bestStreak: Math.max(prev.bestStreak, newStreak),
        bestDailyStreak: Math.max(prev.bestDailyStreak, newDailyStreak),
        tasksCompleted: prev.tasksCompleted + (isGiveUp ? 0 : 1),
        turboActivatedAt: prev.turboActivatedAt,
        turboLastUsedDay: prev.turboLastUsedDay,
        heatBeforeTurbo: prev.heatBeforeTurbo,
      };
      saveData(next);
      return next;
    });

    setActiveTask(null);
  }, [activeTask, triggerCeremony, turboActive]);

  const cancelTimer = useCallback(() => {
    setActiveTask(null);
  }, []);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const doneToday = tasks.filter(t => t.completed && t.completedAt && 
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className={`flex flex-col items-center min-h-[100dvh] bg-background bg-noise px-4 pt-5 pb-[env(safe-area-inset-bottom,0.5rem)] select-none relative overflow-hidden transition-colors duration-700 ${turboActive ? "turbo-mode" : ""}`}>
      {/* Turbo ambient glow overlay */}
      {turboActive && <div className="turbo-ambient" />}

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full pointer-events-none blur-[100px]"
        style={{ background: turboActive
          ? "radial-gradient(ellipse, hsl(340 100% 60% / 0.2), hsl(280 100% 65% / 0.12), transparent 70%)"
          : "radial-gradient(ellipse, hsl(var(--neon-cyan) / 0.12), hsl(var(--neon-purple) / 0.06), transparent 70%)"
        }}
      />

      {showDailyBonus && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-50">
          <span className="text-lg font-display font-bold daily-bonus-pop" style={{ color: "hsl(var(--daily-bonus))" }}>🌟 DAILY BONUS +15 XP</span>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-sm flex flex-col items-center gap-2 pb-2 relative z-10">
        <div className="text-center space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight" style={{
            background: "linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--neon-cyan) / 0.7))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>MOMENTUM</h1>
          <p key={prompt} className="text-xs text-muted-foreground fade-slide-up">{prompt}</p>
        </div>
        <DailyBanner dailyStreak={data.dailyStreak} todayActions={doneToday} isFirstToday={isFirstActionToday(data)} />
        <XPBar xp={data.xp} xpGained={xpGained} />
      </div>

      {/* Task area */}
      <div className="w-full max-w-sm flex-1 flex flex-col gap-3 pt-3 relative z-10">
        <TaskInput onAdd={addTask} />
        {pendingCount > 0 && (
          <p className="text-[10px] font-display font-bold tracking-[0.2em] uppercase text-muted-foreground/60 px-1">
            {pendingCount} TASK{pendingCount !== 1 ? "S" : ""} TO CRUSH
          </p>
        )}
        <TaskList tasks={tasks} activeTaskId={activeTask?.id ?? null} onStart={startTask} onDelete={deleteTask} />
      </div>

      {/* Bottom: Turbo + Heat + Stats */}
      <div className="w-full max-w-sm flex flex-col items-center gap-1.5 pt-2 pb-1 relative z-10">
        <TurboButton data={data} onActivate={handleActivateTurbo} />
        <HeatMeter heat={data.heat} turboActive={turboActive} />
        <StatsBar totalActions={data.tasksCompleted} streak={data.streak} bestStreak={data.bestStreak} />
      </div>

      {/* Active timer overlay */}
      {activeTask && (
        <TaskTimer
          task={activeTask}
          onComplete={(type) => completeTask(type)}
          onCancel={cancelTimer}
        />
      )}

      {/* XP Ceremony overlay */}
      {ceremony.active && (
        <XPCeremony
          xp={ceremony.newXp}
          prevXp={ceremony.prevXp}
          xpGained={ceremony.xpGained}
          leveledUp={ceremony.leveledUp}
          completionType={ceremony.completionType}
          onFinish={handleCeremonyFinish}
        />
      )}
    </div>
  );
};

export default Index;
