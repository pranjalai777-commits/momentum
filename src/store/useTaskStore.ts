import { createUuid } from "@/lib/ids";
import type { Task } from "@/types";
import { create } from "zustand";

type TaskStore = {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (text: string, options?: Partial<Pick<Task, "id" | "routineId" | "taskDate" | "createdAt">>) => Task;
  deleteTask: (id: string) => void;
  markCompleted: (id: string, completedAt?: number) => void;
  reset: () => void;
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  setTasks: (tasks) =>
    set({
      tasks: [...tasks].sort((a, b) => b.createdAt - a.createdAt),
    }),

  addTask: (text, options) => {
    const task: Task = {
      id: options?.id ?? createUuid(),
      text,
      completed: false,
      createdAt: options?.createdAt ?? Date.now(),
      routineId: options?.routineId,
      taskDate: options?.taskDate,
    };
    const next = [task, ...get().tasks];
    set({ tasks: next });
    return task;
  },

  deleteTask: (id) => {
    const next = get().tasks.filter((task) => task.id !== id);
    set({ tasks: next });
  },

  markCompleted: (id, completedAt = Date.now()) => {
    const next = get().tasks.map((task) =>
      task.id === id ? { ...task, completed: true, completedAt } : task
    );
    set({ tasks: next });
  },

  reset: () => {
    set({ tasks: [] });
  },
}));
