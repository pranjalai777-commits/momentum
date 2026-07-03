import { createUuid } from "@/lib/ids";
import type { RoutineTask } from "@/types";
import { create } from "zustand";

type RoutineStore = {
  routines: RoutineTask[];
  setRoutines: (routines: RoutineTask[]) => void;
  addRoutine: (text: string, options?: Pick<RoutineTask, "id" | "createdAt" | "updatedAt">) => RoutineTask;
  updateRoutine: (id: string, patch: Partial<Pick<RoutineTask, "text" | "active" | "updatedAt">>) => void;
  removeRoutine: (id: string) => void;
  reset: () => void;
};

export const useRoutineStore = create<RoutineStore>((set, get) => ({
  routines: [],

  setRoutines: (routines) =>
    set({
      routines: [...routines].sort((a, b) => b.createdAt - a.createdAt),
    }),

  addRoutine: (text, options) => {
    const now = Date.now();
    const routine: RoutineTask = {
      id: options?.id ?? createUuid(),
      text,
      active: true,
      createdAt: options?.createdAt ?? now,
      updatedAt: options?.updatedAt ?? now,
    };
    set({ routines: [routine, ...get().routines] });
    return routine;
  },

  updateRoutine: (id, patch) => {
    const now = Date.now();
    set({
      routines: get().routines.map((routine) =>
        routine.id === id ? { ...routine, ...patch, updatedAt: patch.updatedAt ?? now } : routine
      ),
    });
  },

  removeRoutine: (id) => {
    set({ routines: get().routines.filter((routine) => routine.id !== id) });
  },

  reset: () => {
    set({ routines: [] });
  },
}));
