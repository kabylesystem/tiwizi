"use client";

/**
 * Phrase kabyle dont CHAQUE MOT est tappable → mini-fiche Dallet inline.
 * Le corpus devient le cours de vocabulaire. Supporte le surlignage du
 * pattern (input enhancement) via mask/maskFlags.
 */
import { useEffect, useRef, useState } from "react";
import { maskSegments } from "@/lib/patterns";
import { recordLookup } from "@/lib/vocab";

type DictEntry = { w: string; root: string; m: { fr: string[] }[] };

function Word({ text, marked }: { text: string; marked: boolean }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DictEntry[] | null>(null);
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
          className="absolute left-1/2 top-full z-40 mt-2 block w-64 -translate-x-1/2 rounded-2xl p-3 text-left shadow-xl"
          style={{ background: "#FFFCF5", border: "1.5px solid rgba(200,150,62,0.35)" }}
        >
          {loading && <span className="block text-xs text-muted">Dallet…</span>}
          {entries && !entries.length && !loading && (
            <span className="block text-xs text-muted">Pas de fiche exacte · sans doute une forme conjuguée. Cherche la racine au dico.</span>
          )}
          {entries?.map((e, i) => (
            <span key={i} className="block not-italic">
              <span className="kab text-base font-bold text-ink">{e.w}</span>
              {e.root && <span className="ml-2 text-[0.65rem] font-bold uppercase tracking-wider text-muted">√{e.root}</span>}
              <span className="block text-sm leading-snug text-muted">{e.m[0]?.fr.slice(0, 3).join(" · ")}</span>
            </span>
          ))}
        </span>
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
