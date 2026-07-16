"use client";

/**
 * « À toi » · production LIBRE : une situation (choisie parmi les patterns
 * connus/dus), l'élève écrit SA phrase, Idir (ancré corpus + profil cognitif)
 * corrige avec prudence. C'est la génération active en contexte · le sommet
 * de la pyramide (docs/pedagogie.md §5). L'auto-évaluation après correction
 * nourrit le canal production.
 */
import { useState } from "react";
import { PenLine } from "lucide-react";
import type { PatternMeta } from "@/lib/patterns";
import type { Grade } from "@/lib/srs";
import { cogSnapshot, loadCog } from "@/lib/cognitive-model";
import { allCards, gradeCard, type MyCard } from "@/lib/cards";
import { autoCardsFromReply } from "@/lib/auto-cards";
import { FennecMascot } from "@/components/fennec";
import { Panel, FmtTag, GoldButton, SelfGrade } from "./shared";

/** La consigne-situation par pattern · une intention, pas une traduction. */
export const SITUATION: Record<string, string> = {
  "neg-ur-ara": "Dis que tu n'as PAS fait quelque chose (n'importe quoi · ta phrase à toi).",
  "fut-ad": "Dis une chose que tu feras demain.",
  "have-ghur": "Dis ce que tu as (ou ce que quelqu'un a).",
  "exist-yella": "Dis qu'il y a quelque chose, quelque part.",
  "exist-ulac": "Dis qu'il n'y a pas de… (ce que tu veux).",
  "cop-d": "Présente quelque chose ou quelqu'un : « c'est… ».",
  "q-acu": "Pose une question avec « quoi ? ».",
  "q-anda": "Demande où se trouve quelque chose ou quelqu'un.",
  "q-amek": "Demande « comment… ? ».",
  "want-bgh": "Dis ce que tu veux (ou veux faire).",
  "p1sg-gh": "Dis quelque chose que TOI tu fais (« je… »).",
  "prep-gher": "Dis que tu vas quelque part.",
  "prep-deg": "Dis où quelque chose se trouve (« dans… »).",
};

export function FreeProduce({
  meta,
  onDone,
}: {
  meta: PatternMeta;
  onDone: (g: Grade, ms: number) => void;
}) {
  const [text, setText] = useState("");
  const [myCards] = useState<MyCard[]>(() => (typeof window !== "undefined" ? allCards().slice(0, 2) : []));
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [t0] = useState(() => Date.now());

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "correct",
          ask: `Situation donnée à l'élève : « ${SITUATION[meta.id] ?? meta.name} » (structure attendue : ${meta.schema}).${myCards.length ? ` Mots à placer si possible (fiches Dallet) : ${myCards.map((c) => `${c.kab} (${c.fr})`).join(", ")}.` : ""} Sa phrase kabyle : « ${text.trim()} »`,
          cogState: cogSnapshot(loadCog()),
        }),
      });
      const d = await r.json();
      setReply(d.reply || "Idir n'a pas pu répondre · réessaie.");
      if (d.reply) autoCardsFromReply(d.reply);
    } catch {
      setReply("Idir n'a pas pu répondre · réessaie.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel>
      <FmtTag label="À toi" sub="Ta phrase, tes mots · Idir te corrige." />
      <p className="text-center text-lg font-semibold text-ink">{SITUATION[meta.id] ?? meta.name}</p>
      <p className="mt-1 text-center text-xs text-muted">
        Utilise ce que tu connais · une phrase courte et vraie vaut mieux qu'une phrase ambitieuse et fausse.
      </p>
      {myCards.length > 0 && (
        <p className="mt-2 text-center text-sm text-muted">
          Si tu peux, place :{" "}
          {myCards.map((c, i) => (
            <span key={c.k}>
              <b className="kab text-ink">{c.kab}</b> <span className="text-xs">({c.fr})</span>
              {i < myCards.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!!reply || busy}
        rows={2}
        placeholder="Écris ta phrase en kabyle…"
        className="kab mt-4 w-full resize-none rounded-2xl border-2 p-4 text-xl text-ink outline-none"
        style={{ borderColor: "rgba(200,150,62,0.3)", background: "rgba(255,255,255,0.7)" }}
      />

      {!reply && (
        <GoldButton onClick={submit} disabled={!text.trim() || busy}>
          {busy ? "Idir lit ta phrase…" : (<><PenLine className="h-5 w-5" /> Montrer à Idir</>)}
        </GoldButton>
      )}

      {reply && (
        <>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border p-3" style={{ borderColor: "rgba(74,158,207,0.25)", background: "rgba(74,158,207,0.06)" }}>
            <FennecMascot mood="happy" size={34} animated={false} />
            <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{reply}</p>
          </div>
          <SelfGrade
            prompt="Honnêtement, ta phrase était…"
            onGrade={(g) => {
              for (const c of myCards) if (text.toLowerCase().includes(c.kab.toLowerCase())) gradeCard(c.k, g);
              onDone(g, Date.now() - t0);
            }}
          />
        </>
      )}
    </Panel>
  );
}
