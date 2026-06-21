/**
 * Lightweight SM-2 spaced repetition, persisted in localStorage.
 * Grades: 0 = Encore, 1 = Difficile, 2 = Bien, 3 = Facile.
 */
export type Grade = 0 | 1 | 2 | 3;

export type CardState = {
  ease: number; // ease factor
  interval: number; // days
  due: number; // epoch ms
  reps: number;
  lapses: number;
};

export type Store = {
  cards: Record<number, CardState>;
  // per-day bookkeeping
  day: string; // YYYY-MM-DD
  newToday: number;
  reviewsToday: number;
  streak: number;
  lastActive: string;
};

const KEY = "awal.srs.v2";
const DAY = 86_400_000;
const MIN = 60_000;
export const NEW_PER_DAY = 12;

const todayStr = () => new Date().toISOString().slice(0, 10);

export function load(): Store {
  if (typeof window === "undefined")
    return {
      cards: {},
      day: todayStr(),
      newToday: 0,
      reviewsToday: 0,
      streak: 0,
      lastActive: "",
    };
  let s: Store;
  try {
    s = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    s = null as unknown as Store;
  }
  if (!s || !s.cards)
    s = {
      cards: {},
      day: todayStr(),
      newToday: 0,
      reviewsToday: 0,
      streak: 0,
      lastActive: "",
    };
  // roll the day over
  const t = todayStr();
  if (s.day !== t) {
    const yest = new Date(Date.now() - DAY).toISOString().slice(0, 10);
    if (s.lastActive === yest) s.streak = s.streak || 0;
    else if (s.lastActive && s.lastActive !== t) s.streak = 0;
    s.day = t;
    s.newToday = 0;
    s.reviewsToday = 0;
  }
  return s;
}

export function save(s: Store) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(s));
}

export function schedule(prev: CardState | undefined, grade: Grade): CardState {
  const now = Date.now();
  const c: CardState = prev
    ? { ...prev }
    : { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now };

  if (grade === 0) {
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.reps = 0;
    c.lapses += 1;
    c.interval = 0;
    c.due = now + MIN; // resurface within the session
    return c;
  }
  if (grade === 1) {
    c.ease = Math.max(1.3, c.ease - 0.15);
    c.interval = c.reps === 0 ? 1 : Math.max(1, Math.round(c.interval * 1.2));
  } else if (grade === 2) {
    c.interval =
      c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.interval * c.ease);
  } else {
    c.ease = c.ease + 0.15;
    c.interval =
      c.reps === 0 ? 2 : Math.round(c.interval * c.ease * 1.3);
  }
  c.reps += 1;
  c.due = now + c.interval * DAY;
  return c;
}

/** Mark study activity for streak + daily counters. */
export function touch(s: Store, isNew: boolean) {
  const t = todayStr();
  if (s.lastActive !== t) {
    const yest = new Date(Date.now() - DAY).toISOString().slice(0, 10);
    s.streak = s.lastActive === yest ? s.streak + 1 : 1;
    s.lastActive = t;
  }
  if (isNew) s.newToday += 1;
  s.reviewsToday += 1;
}

export function dueCount(s: Store, ids: number[]): number {
  const now = Date.now();
  return ids.filter((id) => s.cards[id] && s.cards[id].due <= now).length;
}
