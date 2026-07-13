"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserSettings = {
  soundEnabled: boolean;
  remindersEnabled: boolean;
  reducedMotion: boolean;
};

export type User = {
  name: string;
  xp: number;
  level: number;
  xpToNextLevel: number;
  gems: number;
  streak: number;
  hearts: number;
  lastActiveDay: string;
  settings: UserSettings;
};

export type LessonOutcome = {
  lessonId: string;
  unitId: string;
  accuracy: number;
  dominantErrorType: string | null;
  averageResponseMs: number;
  lessonKeywords: string[];
};

type GameState = {
  user: User;
  completedLessons: string[];
  unlockedUnits: string[];
  outcomes: LessonOutcome[];
  hydrated: boolean;
  completeLesson: (id: string) => void;
  addXP: (n: number) => void;
  addGems: (n: number) => void;
  loseHeart: () => void;
  refillHearts: () => void;
  incrementStreak: () => void;
  recordLessonOutcome: (o: LessonOutcome) => void;
  updateUserSettings: (s: Partial<UserSettings>) => void;
};

const today = () => new Date().toISOString().slice(0, 10);
const XP_PER_LEVEL = 500;

// Migration one-shot : la progression vivait sous la clé "awal-game-v1"
if (typeof window !== "undefined" && !localStorage.getItem("tiwizi-game-v1")) {
  const legacy = localStorage.getItem("awal-game-v1");
  if (legacy) localStorage.setItem("tiwizi-game-v1", legacy);
}

const initialUser: User = {
  name: "naly",
  xp: 0,
  level: 1,
  xpToNextLevel: XP_PER_LEVEL,
  gems: 0,
  streak: 0,
  hearts: 5,
  lastActiveDay: "",
  settings: { soundEnabled: true, remindersEnabled: true, reducedMotion: false },
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      user: initialUser,
      completedLessons: [],
      unlockedUnits: [],
      outcomes: [],
      hydrated: false,

      completeLesson: (id) =>
        set((s) =>
          s.completedLessons.includes(id)
            ? s
            : { completedLessons: [...s.completedLessons, id] }
        ),

      addXP: (n) =>
        set((s) => {
          let xp = s.user.xp + n;
          let level = s.user.level;
          let toNext = s.user.xpToNextLevel;
          while (xp >= toNext) {
            xp -= toNext;
            level += 1;
            toNext = level * XP_PER_LEVEL;
          }
          return { user: { ...s.user, xp, level, xpToNextLevel: toNext } };
        }),

      addGems: (n) => set((s) => ({ user: { ...s.user, gems: s.user.gems + n } })),

      loseHeart: () =>
        set((s) => ({ user: { ...s.user, hearts: Math.max(0, s.user.hearts - 1) } })),

      refillHearts: () => set((s) => ({ user: { ...s.user, hearts: 5 } })),

      incrementStreak: () =>
        set((s) => {
          const t = today();
          if (s.user.lastActiveDay === t) return s;
          const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const streak = s.user.lastActiveDay === yest ? s.user.streak + 1 : 1;
          return { user: { ...s.user, streak, lastActiveDay: t } };
        }),

      recordLessonOutcome: (o) =>
        set((s) => ({ outcomes: [...s.outcomes.slice(-49), o] })),

      updateUserSettings: (st) =>
        set((s) => ({ user: { ...s.user, settings: { ...s.user.settings, ...st } } })),
    }),
    {
      name: "tiwizi-game-v1",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
