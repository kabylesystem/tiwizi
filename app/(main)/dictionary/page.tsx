"use client";

import { useEffect, useRef, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { tifinagh } from "@/lib/tifinagh";

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
    if (!q.trim()) { setRows([]); return; }
    setLoading(true);
    setTouched(true);
    t.current = setTimeout(() => {
      fetch(`/api/dict?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: Entry[]) => { setRows(d); setLoading(false); })
        .catch(() => setLoading(false));
    }, 200);
    return () => { if (t.current) clearTimeout(t.current); };
  }, [q]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "rgba(200,150,62,0.12)" }}>
          <BookOpen className="h-6 w-6 text-brand" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dictionnaire</h1>
          <p className="text-sm text-muted"><span className="font-tifinagh text-brand">ⴰⵎⴰⵡⴰⵍ</span> · le Dallet — 12 510 mots, sens & exemples</p>
        </div>
      </header>

      <div className="sticky top-16 z-20 mb-6 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="aman, manger, axxam, tilelli…"
            className="w-full rounded-full border border-line-strong bg-card py-3.5 pl-11 pr-4 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
          />
        </div>
      </div>

      {!touched ? (
        <Empty>Tape un mot en kabyle ou en français.</Empty>
      ) : loading && !rows.length ? (
        <Empty>Recherche…</Empty>
      ) : !rows.length ? (
        <Empty>Rien trouvé pour « {q} ».</Empty>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((e, i) => (
            <li key={e.w + i} className="rounded-2xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.85)] p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-tifinagh text-lg text-brand">{tifinagh(e.w)}</span>
                <h2 className="kab text-2xl font-bold text-ink">{e.w}</h2>
                {e.forms.filter((f) => f !== e.w).length > 0 && (
                  <span className="kab text-sm text-muted">{e.forms.filter((f) => f !== e.w).join(", ")}</span>
                )}
                <span className="ml-auto rounded-full bg-[rgba(200,150,62,0.12)] px-2.5 py-0.5 text-[0.7rem] font-medium text-muted">
                  racine <span className="kab">{e.root}</span>
                </span>
              </div>
              {e.note && <p className="mt-1.5 text-sm italic text-muted">{e.note}</p>}
              <ol className="mt-3 space-y-2.5">
                {e.m.map((m, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[0.7rem] font-bold text-brand">{j + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[0.95rem] text-ink">
                        {m.fr.join(" · ")}
                        {m.note && <span className="text-muted"> — {m.note}</span>}
                      </p>
                      {m.ex.length > 0 && (
                        <ul className="mt-1.5 space-y-1 border-l-2 border-[rgba(200,150,62,0.25)] pl-3">
                          {m.ex.slice(0, 3).map((x, k) => (
                            <li key={k} className="text-sm">
                              <span className="kab text-ink">{x.kab}</span> <span className="text-muted">— {x.fr}</span>
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

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-sm text-muted">{children}</p>;
}
