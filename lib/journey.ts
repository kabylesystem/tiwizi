const DAYS_KEY = "tiwizi.days.v1";
const GOAL_KEY = "tiwizi.goal.v1";

const today = () => new Date().toISOString().slice(0, 10);

function loadDays(): string[] {
  try {
    const d = JSON.parse(localStorage.getItem(DAYS_KEY) || "[]") as string[];
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export function recordPracticeDay() {
  const days = loadDays();
  const t = today();
  if (!days.includes(t)) {
    days.push(t);
    localStorage.setItem(DAYS_KEY, JSON.stringify(days.slice(-400)));
    window.dispatchEvent(new Event("tiwizi:dirty"));
  }
}

export function streak(): number {
  const days = new Set(loadDays());
  let n = 0;
  const d = new Date();
  if (!days.has(today())) d.setDate(d.getDate() - 1);
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (!days.has(iso)) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function daysPracticed(): number {
  return loadDays().length;
}

export function villageDaysLeft(): number {
  let goal = localStorage.getItem(GOAL_KEY);
  if (!goal) {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    goal = d.toISOString().slice(0, 10);
    localStorage.setItem(GOAL_KEY, goal);
    window.dispatchEvent(new Event("tiwizi:dirty"));
  }
  return Math.max(0, Math.ceil((new Date(goal + "T12:00").getTime() - Date.now()) / 86_400_000));
}
