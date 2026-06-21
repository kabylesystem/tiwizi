"use client";

import { useEffect, useRef, useState } from "react";

type Meaning = { fr: string[]; note?: string; ex: { kab: string; fr: string }[] };
type Entry = { w: string; forms: string[]; root: string; note?: string; m: Meaning[] };

export default function DictionaryPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Entry[]>([]);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    if (!q.trim()) {
      setRows([]);
      return;
    }
    setLoading(true);
    setTouched(true);
    t.current = setTimeout(() => {
      fetch(`/api/dict?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: Entry[]) => {
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
        <h1 className="font-display text-3xl font-semibold text-ink">
          Dictionnaire
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Le Dallet numérisé — 12 500 entrées kabyle ↔ français, avec sens,
          racines et exemples.
        </p>
      </header>

      <div className="sticky top-16 z-20 -mx-1 mb-6 bg-paper/85 px-1 py-2 backdrop-blur">
        <div className="relative">
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
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="aman, manger, axxam, amour…"
            className="w-full rounded-full border border-line-strong bg-card py-3 pl-11 pr-4 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
          />
        </div>
      </div>

      {!touched ? (
        <p className="py-16 text-center text-sm text-muted">
          Tape un mot en kabyle ou en français pour commencer.
        </p>
      ) : loading && rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Recherche…</p>
      ) : rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          Rien trouvé pour « {q} ».
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((e, i) => (
            <li
              key={e.w + i}
              className="rounded-2xl border border-line bg-card p-5 transition-colors hover:border-line-strong"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="kab text-2xl font-semibold text-ink">{e.w}</h2>
                {e.forms.filter((f) => f !== e.w).length > 0 && (
                  <span className="kab text-sm text-muted">
                    {e.forms.filter((f) => f !== e.w).join(", ")}
                  </span>
                )}
                <span className="ml-auto rounded-full bg-paper-2 px-2.5 py-0.5 text-[0.7rem] font-medium text-muted">
                  racine&nbsp;<span className="kab">{e.root}</span>
                </span>
              </div>

              {e.note && (
                <p className="mt-1.5 text-sm italic text-muted">{e.note}</p>
              )}

              <ol className="mt-3 space-y-2.5">
                {e.m.map((m, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[0.7rem] font-semibold text-brand">
                      {j + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.95rem] text-ink">
                        {m.fr.join(" · ")}
                        {m.note && (
                          <span className="text-muted"> — {m.note}</span>
                        )}
                      </p>
                      {m.ex.length > 0 && (
                        <ul className="mt-1.5 space-y-1 border-l-2 border-line pl-3">
                          {m.ex.slice(0, 4).map((x, k) => (
                            <li key={k} className="text-sm">
                              <span className="kab text-ink">{x.kab}</span>
                              <span className="text-muted"> — {x.fr}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
