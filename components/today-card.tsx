"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { load, dueCount, NEW_PER_DAY, type Store } from "@/lib/srs";

export function TodayCard() {
  const [store, setStore] = useState<Store | null>(null);
  const [due, setDue] = useState(0);
  const [learned, setLearned] = useState(0);

  useEffect(() => {
    const s = load();
    setStore(s);
    fetch("/api/deck?limit=500")
      .then((r) => r.json())
      .then((cards: { id: number }[]) => {
        const ids = cards.map((c) => c.id);
        setDue(dueCount(s, ids));
        setLearned(Object.keys(s.cards).length);
      })
      .catch(() => {});
  }, []);

  const newLeft = store ? Math.max(0, NEW_PER_DAY - store.newToday) : NEW_PER_DAY;
  const streak = store?.streak ?? 0;

  return (
    <div className="w-full rounded-3xl border border-line bg-card p-7 shadow-[0_20px_60px_-30px_rgba(34,28,20,0.4)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Aujourd&apos;hui
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
          🔥 {streak} {streak > 1 ? "jours" : "jour"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <Metric n={due} l="à réviser" tone="brand" />
        <Metric n={newLeft} l="nouvelles" tone="accent" />
        <Metric n={learned} l="apprises" tone="ink" />
      </div>

      <Link
        href="/learn"
        className="mt-6 block rounded-full bg-brand px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
      >
        {due + newLeft > 0 ? "Lancer la session" : "Réviser quand même"}
      </Link>
      <p className="mt-3 text-center text-xs text-muted">
        Ta progression est sauvegardée sur cet appareil.
      </p>
    </div>
  );
}

function Metric({
  n,
  l,
  tone,
}: {
  n: number;
  l: string;
  tone: "brand" | "accent" | "ink";
}) {
  const color =
    tone === "brand" ? "text-brand" : tone === "accent" ? "text-accent" : "text-ink";
  return (
    <div className="rounded-2xl bg-paper-2/70 py-4">
      <div className={`font-display text-3xl font-semibold ${color}`}>{n}</div>
      <div className="mt-1 text-[0.7rem] text-muted">{l}</div>
    </div>
  );
}
