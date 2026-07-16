"use client";

/**
 * « Mes cartes » : le deck personnel né de la curiosité de naly (mots tapés
 * dans les phrases et le chat d'Idir). Chaque carte = une fiche Dallet, avec
 * son propre SRS. Révision : kab → reconstruire le sens → révéler → s'auto-
 * évaluer honnêtement.
 */
import { useEffect, useState } from "react";
import { Layers, Trash2 } from "lucide-react";
import { allCards, dueCards, gradeCard, removeCard, type MyCard } from "@/lib/cards";
import { Panel, FmtTag, GoldButton, SelfGrade } from "@/components/formats/shared";

export default function CardsPage() {
  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState<MyCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [, bump] = useState(0);

  useEffect(() => {
    setMounted(true);
    const onPulled = () => bump((x) => x + 1);
    window.addEventListener("tiwizi:pulled", onPulled);
    return () => window.removeEventListener("tiwizi:pulled", onPulled);
  }, []);

  if (!mounted) return null;
  const due = dueCards();
  const cards = allCards();
  const current = queue[idx];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center gap-2">
        <Layers className="h-5 w-5" style={{ color: "#A67B2E" }} />
        <h1 className="font-display text-xl font-bold text-ink">Mes cartes</h1>
        <span className="text-sm text-muted">{cards.length} au total · {due.length} à revoir</span>
      </div>

      {reviewing && current ? (
        <Panel>
          <FmtTag label={`Carte ${idx + 1}/${queue.length}`} sub="Reconstruis le sens, puis sois honnête." />
          <p className="kab text-balance text-center text-4xl font-bold text-ink">{current.kab}</p>
          {current.root && revealed && (
            <p className="mt-1 text-center text-xs font-bold uppercase tracking-wider text-muted">√{current.root}</p>
          )}
          {revealed && <p className="mt-3 text-center text-lg text-muted">{current.fr}</p>}
          {!revealed ? (
            <GoldButton onClick={() => setRevealed(true)}>Révéler</GoldButton>
          ) : (
            <SelfGrade
              prompt="Tu l'avais ?"
              onGrade={(g) => {
                gradeCard(current.k, g);
                setRevealed(false);
                if (idx < queue.length - 1) setIdx((i) => i + 1);
                else {
                  setReviewing(false);
                  bump((x) => x + 1);
                }
              }}
            />
          )}
        </Panel>
      ) : (
        <Panel className="text-center">
          {cards.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              Aucune carte pour l&apos;instant. Tape un mot kabyle n&apos;importe où (une phrase de session,
              une bulle d&apos;Idir) → fiche Dallet → <b>« + ma carte »</b>. Ta curiosité construit ton deck.
            </p>
          ) : due.length ? (
            <>
              <p className="text-sm text-muted">{due.length} carte{due.length > 1 ? "s" : ""} au bord de l&apos;oubli.</p>
              <GoldButton
                onClick={() => {
                  setQueue(due);
                  setIdx(0);
                  setRevealed(false);
                  setReviewing(true);
                }}
              >
                Réviser · {due.length}
              </GoldButton>
            </>
          ) : (
            <p className="text-sm text-muted">Rien à revoir : tes cartes reviendront pile avant que tu les oublies.</p>
          )}
        </Panel>
      )}

      {cards.length > 0 && !reviewing && (
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.k} className="flex items-center gap-3 rounded-2xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.85)] p-3">
              <div className="min-w-0 flex-1">
                <p className="kab truncate font-bold text-ink">{c.kab}</p>
                <p className="truncate text-xs text-muted">{c.fr}</p>
              </div>
              <span className="shrink-0 text-[0.65rem] text-muted">
                {c.state.due <= Date.now() ? "à revoir" : `J+${Math.max(0, Math.round((c.state.due - Date.now()) / 86400000))}`}
              </span>
              <button onClick={() => { removeCard(c.k); bump((x) => x + 1); }} aria-label="Supprimer" className="shrink-0 text-muted hover:text-ink">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
