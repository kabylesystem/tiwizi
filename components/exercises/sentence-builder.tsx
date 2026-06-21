"use client";

import { useEffect, useMemo, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { tokens, outcomeGrade, type Card } from "@/lib/session";
import type { Grade } from "@/lib/srs";

type Status = "building" | "correct" | "wrong";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SentenceBuilder({
  card,
  mode,
  onResult,
}: {
  card: Card;
  mode: "text" | "audio";
  onResult: (g: Grade) => void;
}) {
  const toks = useMemo(() => tokens(card.kab), [card.id]);
  // bank items keyed by original index (handles duplicate words)
  const bankInit = useMemo(
    () => shuffle(toks.map((tok, i) => ({ tok, i }))),
    [card.id]
  );
  const [bank, setBank] = useState(bankInit);
  const [built, setBuilt] = useState<{ tok: string; i: number }[]>([]);
  const [status, setStatus] = useState<Status>("building");

  // reset when card changes
  useEffect(() => {
    setBank(bankInit);
    setBuilt([]);
    setStatus("building");
  }, [card.id, bankInit]);

  const pick = (item: { tok: string; i: number }) => {
    if (status !== "building") return;
    setBuilt((b) => [...b, item]);
    setBank((b) => b.filter((x) => x.i !== item.i));
  };
  const unpick = (item: { tok: string; i: number }) => {
    if (status !== "building") return;
    setBuilt((b) => b.filter((x) => x.i !== item.i));
    setBank((b) => [...b, item]);
  };

  const check = () => {
    const ok = built.map((x) => x.tok).join(" ") === card.kab.trim();
    setStatus(ok ? "correct" : "wrong");
  };
  const reveal = () => setStatus("wrong");

  const finish = () =>
    onResult(outcomeGrade(status === "correct", false) as Grade);

  // keyboard: Enter = verify / continue
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (status === "building" && built.length === toks.length) check();
      else if (status !== "building") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const done = status !== "building";

  return (
    <div className="animate-pop w-full rounded-3xl border border-line bg-card px-5 py-8 shadow-[0_24px_70px_-40px_rgba(34,28,20,0.5)] sm:px-7">
      <p className="mb-5 text-center text-xs font-medium uppercase tracking-widest text-muted">
        {mode === "audio" ? "Écoute → reconstitue" : "Reconstitue la phrase"}
      </p>

      {/* prompt */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        {mode === "audio" ? (
          <AudioButton id={card.id} size="lg" autoPlay />
        ) : (
          <p className="text-balance text-xl text-brand-deep md:text-2xl">
            {card.fr}
          </p>
        )}
      </div>

      {/* build area */}
      <div className="mb-4 min-h-[3.5rem] rounded-2xl border border-dashed border-line-strong bg-paper-2/40 p-3">
        <div className="flex flex-wrap gap-2">
          {built.map((item) => (
            <button
              key={item.i}
              onClick={() => unpick(item)}
              className={`kab rounded-xl border px-3 py-1.5 text-lg transition-colors ${
                done
                  ? status === "correct"
                    ? "border-good/40 bg-good-soft text-good"
                    : "border-bad/40 bg-bad-soft text-bad"
                  : "border-brand/40 bg-brand-soft text-ink hover:bg-card"
              }`}
            >
              {item.tok}
            </button>
          ))}
          {built.length === 0 && (
            <span className="px-1 py-1.5 text-sm text-muted">
              Touche les mots dans le bon ordre…
            </span>
          )}
        </div>
      </div>

      {/* bank */}
      {!done && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {bank.map((item) => (
            <button
              key={item.i}
              onClick={() => pick(item)}
              className="kab rounded-xl border border-line-strong bg-card px-3 py-1.5 text-lg text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand"
            >
              {item.tok}
            </button>
          ))}
        </div>
      )}

      {/* result reveal */}
      {done && (
        <div className="animate-pop mb-6 rounded-2xl bg-paper-2/60 p-4 text-center">
          {status === "wrong" && (
            <p className="mb-2 text-sm font-medium text-bad">
              Pas tout à fait. La bonne réponse :
            </p>
          )}
          <p className="kab text-2xl text-ink">{card.kab}</p>
          <p className="mt-1 text-sm text-muted">{card.fr}</p>
          {card.audio && (
            <div className="mt-3 flex justify-center">
              <AudioButton id={card.id} size="sm" />
            </div>
          )}
        </div>
      )}

      {/* actions */}
      {done ? (
        <button
          onClick={finish}
          className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5"
        >
          Continuer <kbd className="ml-1 text-xs opacity-60">↵</kbd>
        </button>
      ) : (
        <div className="flex gap-2.5">
          <button
            onClick={reveal}
            className="rounded-full border border-line-strong bg-card px-5 py-3.5 text-sm font-medium text-muted transition-colors hover:bg-paper-2"
          >
            Voir
          </button>
          <button
            onClick={check}
            disabled={built.length !== toks.length}
            className="flex-1 rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition-all enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Vérifier
          </button>
        </div>
      )}
    </div>
  );
}
