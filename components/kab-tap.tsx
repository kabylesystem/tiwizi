"use client";

/**
 * Phrase kabyle dont CHAQUE MOT est tappable → mini-fiche Dallet inline.
 * Le corpus devient le cours de vocabulaire. Supporte le surlignage du
 * pattern (input enhancement) via mask/maskFlags.
 */
import { useEffect, useRef, useState } from "react";
import { maskSegments } from "@/lib/patterns";
import { recordLookup } from "@/lib/vocab";
import { addCard, addCardRaw, hasCard } from "@/lib/cards";
import { Gloss } from "@/components/gloss";

type DictEntry = { w: string; root: string; m: { fr: string[]; ex?: { kab: string; fr: string }[] }[] };
type GramHit = { kab: string; fr: string; source?: string };
type CorpusEx = { id: number; kab: string; fr: string };

function Word({ text, marked }: { text: string; marked: boolean }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DictEntry[] | null>(null);
  const [gram, setGram] = useState<GramHit | null>(null);
  const [examples, setExamples] = useState<CorpusEx[] | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const clean = text.replace(/[.,;:!?«»"()…]/gu, "");
  const isWord = /\p{L}/u.test(clean);

  const lookup = async () => {
    if (!isWord) return;
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    recordLookup(clean);
    if (entries || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/dict?q=${encodeURIComponent(clean)}`);
      const d = (await r.json()) as DictEntry[];
      setEntries(d.slice(0, 2));
      if (!d.length) {
        // fallback AUTOMATIQUE (demande naly) : grammaire → exemples corpus
        const g = (await fetch(`/api/card-lookup?w=${encodeURIComponent(clean)}`).then((x) => x.json())) as GramHit | null;
        if (g) setGram(g);
        else {
          const ex = (await fetch(`/api/sentences?q=${encodeURIComponent(clean)}`).then((x) => x.json())) as CorpusEx[];
          setExamples(ex.slice(0, 2));
        }
      }
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span ref={ref} className="relative inline-block">
      <span
        onClick={lookup}
        className={isWord ? "cursor-pointer rounded-md transition-colors hover:bg-[rgba(200,150,62,0.18)]" : ""}
        style={marked ? { background: "rgba(200,150,62,0.28)", color: "#7a5a17", borderRadius: 6, padding: "0 4px" } : undefined}
      >
        {text}
      </span>
      {open && (
        <span
          className="absolute left-1/2 top-full z-40 mt-2 block max-h-80 w-80 max-w-[88vw] -translate-x-1/2 overflow-y-auto rounded-2xl p-3 text-left shadow-xl sm:w-96"
          style={{ background: "#FFFCF5", border: "1.5px solid rgba(200,150,62,0.35)" }}
        >
          {loading && <span className="block text-xs text-muted">Dallet…</span>}
          {entries && !entries.length && !loading && gram && (
            <span className="block not-italic">
              <span className="kab text-base font-bold text-ink">{gram.kab}</span>
              <span className="ml-2 rounded-full bg-[rgba(31,99,176,0.1)] px-1.5 text-[0.6rem] font-bold uppercase text-[#1f63b0]">{gram.source}</span>
              <span className="mt-0.5 block text-sm text-muted">{gram.fr}</span>
              <GramCardButton hit={gram} />
            </span>
          )}
          {entries && !entries.length && !loading && !gram && examples && examples.length > 0 && (
            <span className="block text-xs">
              <span className="mb-1 block font-bold uppercase tracking-wider text-muted">Vu en contexte (corpus natif) :</span>
              {examples.map((x) => (
                <span key={x.id} className="mb-1 block">
                  <span className="kab font-semibold text-ink">{x.kab}</span>{" "}
                  <span className="text-muted">· {x.fr}</span>
                </span>
              ))}
            </span>
          )}
          {entries && !entries.length && !loading && !gram && (!examples || !examples.length) && (
            <span className="block text-xs text-muted">Introuvable dans nos sources.</span>
          )}
          {entries && !entries.length && !loading && (
            <a
              href={`https://fr.glosbe.com/kab/fr/${encodeURIComponent(clean)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 block text-[0.7rem] font-semibold underline decoration-dotted"
              style={{ color: "#1f63b0" }}
            >
              creuser sur Glosbe ↗
            </a>
          )}
          {entries?.map((e, i) => {
            const gloss = e.m
              .slice(0, 2)
              .map((m) => m.fr.filter(Boolean).slice(0, 3).join("<br />"))
              .filter(Boolean)
              .join("<br />");
            const exs = e.m.flatMap((m) => m.ex ?? []).slice(0, 2);
            return (
              <span key={i} className="block not-italic">
                <span className="kab text-base font-bold text-ink">{e.w}</span>
                {e.root && <span className="ml-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted">√{e.root}</span>}
                <Gloss text={gloss} className="mt-0.5 text-sm text-muted" />
                {exs.length > 0 && (
                  <span className="mt-1.5 block space-y-1 border-l-2 border-[rgba(200,150,62,0.25)] pl-2">
                    {exs.map((x, k) => (
                      <span key={k} className="block text-xs">
                        <span className="kab font-semibold text-ink">{x.kab}</span>{" "}
                        <span className="text-muted">· {x.fr}</span>
                      </span>
                    ))}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <CardButton entry={e} />
                  <a
                    href={`/dictionary?q=${encodeURIComponent(clean)}`}
                    className="mt-1.5 text-[0.7rem] font-semibold underline decoration-dotted"
                    style={{ color: "#A67B2E" }}
                  >
                    fiche complète ↗
                  </a>
                </span>
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}

/** « + ma carte » : la carte vient de la fiche DALLET (source vérifiée),
 *  jamais du texte environnant (qui peut être de la prose LLM). */
function CardButton({ entry }: { entry: DictEntry }) {
  const [added, setAdded] = useState(() => hasCard(entry.w));
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        addCard(entry);
        setAdded(true);
      }}
      disabled={added}
      className="mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.7rem] font-bold"
      style={{
        borderColor: added ? "rgba(91,154,111,0.4)" : "rgba(200,150,62,0.4)",
        color: added ? "#5B9A6F" : "#A67B2E",
        background: added ? "rgba(91,154,111,0.08)" : "rgba(200,150,62,0.08)",
      }}
    >
      {added ? "✓ dans tes cartes" : "+ ma carte"}
    </button>
  );
}

function GramCardButton({ hit }: { hit: GramHit }) {
  const [added, setAdded] = useState(() => hasCard(hit.kab));
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        addCardRaw(hit);
        setAdded(true);
      }}
      disabled={added}
      className="mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.7rem] font-bold"
      style={{
        borderColor: added ? "rgba(91,154,111,0.4)" : "rgba(200,150,62,0.4)",
        color: added ? "#5B9A6F" : "#A67B2E",
        background: added ? "rgba(91,154,111,0.08)" : "rgba(200,150,62,0.08)",
      }}
    >
      {added ? "✓ dans tes cartes" : "+ ma carte"}
    </button>
  );
}

/** Mots kabyles tappables en INLINE (bulles du chat d'Idir). */
export function KabTapInline({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  return (
    <span className="kab font-semibold text-ink">
      {parts.map((part, i) =>
        /^\s+$/.test(part) || !part ? <span key={i}>{part}</span> : <Word key={i} text={part} marked={false} />
      )}
    </span>
  );
}

export function KabTap({
  kab,
  mask,
  maskFlags,
  className = "kab text-balance text-center text-3xl font-bold leading-relaxed text-ink sm:text-4xl",
}: {
  kab: string;
  mask?: string;
  maskFlags?: string;
  className?: string;
}) {
  // segments surlignés (pattern) → puis découpage en mots tappables
  const segs = mask ? maskSegments(kab, mask, maskFlags || "giu") : [{ text: kab, hidden: false }];
  return (
    <p className={className}>
      {segs.map((seg, si) => {
        const parts = seg.text.split(/(\s+)/);
        return parts.map((part, pi) =>
          /^\s+$/.test(part) || !part ? (
            <span key={`${si}-${pi}`}>{part}</span>
          ) : (
            <Word key={`${si}-${pi}`} text={part} marked={seg.hidden} />
          )
        );
      })}
    </p>
  );
}
