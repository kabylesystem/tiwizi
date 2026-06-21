"use client";

import { useEffect, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";

type Pair = { id: number; kab: string; fr: string; audio: boolean };

export default function BrowsePage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Pair[]>([]);
  const [hideFr, setHideFr] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    setLoading(true);
    t.current = setTimeout(() => {
      fetch(`/api/sentences?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: Pair[]) => {
          setRows(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 220);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [q]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Phrases</h1>
        <p className="mt-1.5 text-sm text-muted">
          Cherche en kabyle ou en français. Écoute les voix natives. Active le
          mode caché pour t&apos;entraîner.
        </p>
      </header>

      <div className="sticky top-16 z-20 -mx-1 mb-5 bg-paper/85 px-1 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="azul, thank you, je t'aime, tameṭṭut…"
              className="w-full rounded-full border border-line-strong bg-card py-3 pl-11 pr-4 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
            />
          </div>
          <button
            onClick={() => setHideFr((v) => !v)}
            className={`shrink-0 rounded-full border px-4 py-3 text-sm font-medium transition-colors ${
              hideFr
                ? "border-brand bg-brand-soft text-brand"
                : "border-line-strong bg-card text-muted hover:bg-paper-2"
            }`}
          >
            {hideFr ? "FR caché" : "FR visible"}
          </button>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Recherche…</p>
      ) : rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          Aucune phrase trouvée pour « {q} ».
        </p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-line-strong"
            >
              {r.audio ? (
                <AudioButton id={r.id} size="sm" />
              ) : (
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-2 text-[0.6rem] text-muted">
                  —
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="kab text-lg leading-snug text-ink">{r.kab}</p>
                <p
                  className={`mt-1 text-sm leading-snug text-muted transition-all ${
                    hideFr ? "select-none blur-sm hover:blur-0" : ""
                  }`}
                >
                  {r.fr}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
