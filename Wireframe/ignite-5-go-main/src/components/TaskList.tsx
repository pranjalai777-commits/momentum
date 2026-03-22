import { CheckCircle2, Circle, Zap, Trash2 } from "lucide-react";
import type { Task } from "@/lib/momentum";

interface Props {
  tasks: Task[];
  activeTaskId: string | null;
  onStart: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, activeTaskId, onStart, onDelete }: Props) {
  const pending = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 fade-slide-up">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <Zap className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm text-center">
          Add your first task above.<br />
          <span className="text-xs">Crush it. Earn XP. Repeat.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5 overflow-y-auto max-h-[45vh] pr-1" style={{ scrollbarWidth: "thin" }}>
      {pending.map((task) => (
        <div
          key={task.id}
          className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
            activeTaskId === task.id
              ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/10"
              : "bg-secondary/60 border border-border/50 hover:bg-secondary hover:border-border"
          }`}
          onClick={() => onStart(task)}
        >
          <Circle className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
          <span className="flex-1 text-sm text-foreground truncate">{task.text}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div
            className="px-2.5 py-1 rounded-lg text-[10px] font-display font-bold tracking-wider shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(var(--neon-cyan) / 0.15), hsl(var(--neon-purple) / 0.15))",
              color: "hsl(var(--neon-cyan))",
            }}
          >
            START
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <div className="pt-3 space-y-1.5">
          <p className="text-[10px] font-display font-bold tracking-[0.2em] uppercase text-muted-foreground/50 px-1">
            CRUSHED ({done.length})
          </p>
          {done.map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-success/5 border border-success/10"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-success shrink-0" />
              <span className="flex-1 text-sm text-muted-foreground line-through truncate">{task.text}</span>
              <button
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
