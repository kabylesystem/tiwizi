"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { FennecMascot } from "@/components/fennec";
import { cogSnapshot, loadCog } from "@/lib/cognitive-model";
import { autoCardsFromReply } from "@/lib/auto-cards";
import { IdirText } from "@/components/idir-text";

/** On-demand contextual help from Idir inside a lesson (coach mode, plan credits). */
export function IdirHelp({ ask, label = "Idir explique" }: { ask: string; label?: string }) {
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    if (loading) return;
    if (reply) { setOpen((o) => !o); return; }
    setFailed(false);
    setLoading(true);
    setOpen(true);
    try {
      const r = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "coach", ask, cogState: cogSnapshot(loadCog()) }),
      });
      const d = await r.json();
      if (d.reply) {
        setReply(d.reply);
        autoCardsFromReply(d.reply);
      }
      else setFailed(true); // reply reste null → le prochain clic RÉESSAIE
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={run}
        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(74,158,207,0.4)] bg-[rgba(74,158,207,0.08)] px-3.5 py-1.5 text-xs font-semibold text-[#3a7ca8] transition-colors hover:bg-[rgba(74,158,207,0.16)]"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "Idir réfléchit…" : reply && open ? "Masquer" : label}
      </button>

      {open && (loading || reply) && (
        <div className="mt-2 flex items-start gap-2.5 rounded-2xl border border-[rgba(74,158,207,0.25)] bg-[rgba(74,158,207,0.06)] p-3 text-left">
          <FennecMascot mood="happy" size={32} animated={false} />
          <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {loading ? (
              <span className="flex gap-1 pt-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#4A9ECF]" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            ) : failed ? (
              "Idir n'a pas réussi cette fois · reclique sur le bouton pour réessayer."
            ) : (
              reply && <IdirText text={reply} />
            )}
          </p>
        </div>
      )}
    </div>
  );
}
