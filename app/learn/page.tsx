"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { SentenceBuilder } from "@/components/exercises/sentence-builder";
import { buildSession, type Card, type Step } from "@/lib/session";
import { load, save, schedule, touch, NEW_PER_DAY, type Grade, type Store } from "@/lib/srs";

export default function LearnPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [queue, setQueue] = useState<Step[]>([]);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = load();
    setStore(s);
    fetch("/api/deck?limit=2000")
      .then((r) => r.json())
      .then((cards: Card[]) => {
        const newLeft = Math.max(0, NEW_PER_DAY - s.newToday);
        const session = buildSession(cards, s, newLeft);
        setQueue(session);
        setTotal(session.length);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const step = queue[0];

  const handle = useCallback(
    (g: Grade) => {
      if (!store || !step) return;
      const isNew = !store.cards[step.card.id];
      const next = { ...store, cards: { ...store.cards } };
      next.cards[step.card.id] = schedule(store.cards[step.card.id], g);
      touch(next, isNew);
      save(next);
      setStore(next);

      setQueue((q) => {
        const [head, ...rest] = q;
        return g === 0 ? [...rest, head] : rest;
      });
      if (g !== 0) setDone((d) => d + 1);
    },
    [store, step]
  );

  const progress = total ? Math.round((done / total) * 100) : 0;

  if (loading) return <Centered>Préparation de ta session…</Centered>;

  if (!step) {
    return (
      <Centered>
        <div className="animate-pop text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-good-soft text-3xl">
            ✓
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Ifukk ! Session terminée.
          </h1>
          <p className="mt-3 text-muted">
            {done} {done > 1 ? "exercices bouclés" : "exercice bouclé"}. La
            régularité, c&apos;est tout — reviens demain.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper">
              Accueil
            </Link>
            <Link href="/browse" className="rounded-full border border-line-strong bg-card px-6 py-3 text-sm font-semibold text-ink hover:bg-paper-2">
              Lire des phrases
            </Link>
          </div>
        </div>
      </Centered>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5">
      <div className="flex items-center gap-4 pt-8">
        <StepBadge kind={step.kind} />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium tabular-nums text-muted">
          {done}/{total}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        {step.kind === "flash" ? (
          <FlashStep key={step.card.id} card={step.card} onGrade={handle} />
        ) : (
          <SentenceBuilder
            key={step.card.id + step.kind}
            card={step.card}
            mode={step.kind === "dictation" ? "audio" : "text"}
            onResult={handle}
          />
        )}
      </div>
    </div>
  );
}

const KIND_LABEL: Record<Step["kind"], string> = {
  flash: "Carte",
  reconstruct: "Reconstruire",
  dictation: "Dictée",
};

function StepBadge({ kind }: { kind: Step["kind"] }) {
  return (
    <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-[0.7rem] font-semibold text-accent">
      {KIND_LABEL[kind]}
    </span>
  );
}

const GRADES: { g: Grade; label: string; hint: string; cls: string }[] = [
  { g: 0, label: "Encore", hint: "< 1 min", cls: "border-bad/40 text-bad hover:bg-bad-soft" },
  { g: 1, label: "Difficile", hint: "1 j", cls: "border-line-strong text-ink hover:bg-paper-2" },
  { g: 2, label: "Bien", hint: "3 j", cls: "border-brand/40 text-brand hover:bg-brand-soft" },
  { g: 3, label: "Facile", hint: "+", cls: "border-good/40 text-good hover:bg-good-soft" },
];

function FlashStep({ card, onGrade }: { card: Card; onGrade: (g: Grade) => void }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        onGrade((Number(e.key) - 1) as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, onGrade]);

  return (
    <div className="w-full">
      <div className="animate-pop w-full rounded-3xl border border-line bg-card px-6 py-12 text-center shadow-[0_24px_70px_-40px_rgba(34,28,20,0.5)]">
        <p className="mb-6 text-xs font-medium uppercase tracking-widest text-muted">
          Kabyle → Français
        </p>
        <div className="flex flex-col items-center gap-5">
          <h1 className="kab text-balance text-4xl font-medium leading-snug text-ink md:text-[2.75rem]">
            {card.kab}
          </h1>
          {card.audio && <AudioButton id={card.id} size="lg" autoPlay />}
        </div>
        <div className="mt-9 min-h-[3.5rem]">
          {revealed ? (
            <p className="animate-pop text-balance text-xl text-brand-deep md:text-2xl">
              {card.fr}
            </p>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="rounded-full border border-line-strong bg-paper-2 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-line"
            >
              Afficher la traduction <kbd className="ml-1 text-xs text-muted">espace</kbd>
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        {revealed ? (
          <div className="grid grid-cols-4 gap-2.5">
            {GRADES.map((b, i) => (
              <button
                key={b.g}
                onClick={() => onGrade(b.g)}
                className={`flex flex-col items-center gap-0.5 rounded-2xl border bg-card py-3.5 text-sm font-semibold transition-colors ${b.cls}`}
              >
                {b.label}
                <span className="text-[0.65rem] font-normal opacity-60">{i + 1} · {b.hint}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-xs text-muted">
            Traduis dans ta tête, puis vérifie.
          </p>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-5 text-muted">
      {children}
    </div>
  );
}
