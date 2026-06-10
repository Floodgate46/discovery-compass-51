import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NesreaState {
  department: string; // dept code
  answers: Record<string, string>; // questionId -> text
  lastSaved: string;
  setDepartment: (code: string) => void;
  setAnswer: (id: string, text: string) => void;
  appendAnswer: (id: string, text: string) => void;
  reset: () => void;
}

export const useNesrea = create<NesreaState>()(
  persist(
    (set) => ({
      department: "",
      answers: {},
      lastSaved: "",
      setDepartment: (code) => set({ department: code, lastSaved: new Date().toISOString() }),
      setAnswer: (id, text) => set((s) => ({ answers: { ...s.answers, [id]: text }, lastSaved: new Date().toISOString() })),
      appendAnswer: (id, text) => set((s) => ({
        answers: { ...s.answers, [id]: ((s.answers[id] ?? "") + (s.answers[id] ? " " : "") + text).trim() },
        lastSaved: new Date().toISOString(),
      })),
      reset: () => set({ department: "", answers: {}, lastSaved: "" }),
    }),
    { name: "nesrea-portal-v1" }
  )
);
