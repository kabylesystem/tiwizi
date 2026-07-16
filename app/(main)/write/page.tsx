"use client";

/**
 * Rédaction : LA salle de production écrite (demande de naly, 2026-07-16).
 * La consigne est construite depuis SON état réel : un pattern dû (structure)
 * + jusqu'à 2 de SES cartes (vocabulaire Dallet). Il écrit, Idir corrige
 * (mode correct, ancré corpus + profil cognitif), l'auto-évaluation nourrit
 * le canal production du pattern et le SRS des cartes utilisées.
 */
import { useEffect, useState } from "react";
import { PenLine, RefreshCw } from "lucide-react";
import type { PatternMeta } from "@/lib/patterns";
import { cogSnapshot, loadCog, recordEvent, saveCog, dues } from "@/lib/cognitive-model";
import { allCards, gradeCard, type MyCard } from "@/lib/cards";
import { autoCardsFromReply } from "@/lib/auto-cards";
import type { Grade } from "@/lib/srs";
import { FennecMascot } from "@/components/fennec";
import { IdirText } from "@/components/idir-text";
import { Panel, FmtTag, GoldButton, SelfGrade } from "@/components/formats/shared";
import { SITUATION } from "@/components/formats/free-produce";

type Exercise = { meta: PatternMeta; cards: MyCard[] };

function pickExercise(metas: PatternMeta[]): Exercise | null {
  const cog = loadCog();
  const due = dues(cog).filter((d) => d.channel === "produce");
  const known = metas.filter((m) => cog.patterns[m.id]?.abstracted);
  const meta =
    metas.find((m) => m.id === due[0]?.patternId) ??
    (known.length ? known[Math.floor(Math.random() * known.length)] : null);
  if (!meta) return null;
  const cards = [...allCards()].sort((a, b) => a.state.due - b.state.due).slice(0, 2);
  return { meta, cards };
}

export default function WritePage() {
  const [metas, setMetas] = useState<PatternMeta[]>([]);
  const [ex, setEx] = useState<Exercise | null>(null);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<Grade | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    fetch("/api/patterns")
      .then((r) => r.json())
      .then((d) => {
        setMetas(d.patterns);
        setEx(pickExercise(d.patterns));
      })
      .catch(() => {});
  }, []);

  const next = () => {
    setText("");
    setReply(null);
    setSuggested(undefined);
    setEx(pickExercise(metas));
  };

  const submit = async () => {
    if (!text.trim() || busy || !ex) return;
    setBusy(true);
    try {
      const withCards = ex.cards.length
        ? ` L'élève était invité à utiliser si possible ces mots (fiches Dallet vérifiées) : ${ex.cards.map((c) => `${c.kab} (${c.fr})`).join(", ")}.`
        : "";
      const r = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "correct",
          ask: `Exercice de rédaction. Consigne : « ${SITUATION[ex.meta.id] ?? ex.meta.name} » (structure attendue : ${ex.meta.schema}).${withCards} Sa phrase kabyle : « ${text.trim()} »`,
          cogState: cogSnapshot(loadCog()),
        }),
      });
      const d = await r.json();
      let rep = d.reply || "Idir n'a pas pu répondre · réessaie.";
      const lvl = rep.match(/^\s*NIVEAU\s*:\s*([0-3])\s*\n?/i);
      if (lvl) {
        setSuggested(Number(lvl[1]) as Grade);
        rep = rep.replace(lvl[0], "").trim();
      }
      setReply(rep);
      if (d.reply) autoCardsFromReply(d.reply);
    } catch {
      setReply("Idir n'a pas pu répondre · réessaie.");
    } finally {
      setBusy(false);
    }
  };

  const grade = (g: Grade) => {
    if (!ex) return;
    const cog = loadCog();
    recordEvent(cog, { patternId: ex.meta.id, channel: "produce", grade: g });
    saveCog(cog);
    for (const c of ex.cards) if (text.toLowerCase().includes(c.kab.toLowerCase())) gradeCard(c.k, g);
    setDone((n) => n + 1);
    next();
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center gap-2">
        <PenLine className="h-5 w-5" style={{ color: "#A67B2E" }} />
        <h1 className="font-display text-xl font-bold text-ink">Rédaction</h1>
        <span className="text-sm text-muted">tes structures + tes mots → tes phrases</span>
        {done > 0 && <span className="ml-auto text-sm font-bold" style={{ color: "#5B9A6F" }}>{done} écrite{done > 1 ? "s" : ""} ✍️</span>}
      </div>

      {!ex ? (
        <Panel className="text-center">
          <FennecMascot mood="thinking" size={72} />
          <p className="mt-3 text-sm text-muted">
            Extrais d&apos;abord au moins un pattern (Session du jour) : la rédaction s&apos;appuie sur ce que tu maîtrises.
          </p>
        </Panel>
      ) : (
        <Panel>
          <FmtTag label="Consigne" />
          <p className="text-center text-lg font-semibold text-ink">{SITUATION[ex.meta.id] ?? ex.meta.name}</p>
          <p className="mt-1 text-center text-xs text-muted">Structure : {ex.meta.schema}</p>
          {ex.cards.length > 0 && (
            <p className="mt-2 text-center text-sm text-muted">
              Si tu peux, place :{" "}
              {ex.cards.map((c, i) => (
                <span key={c.k}>
                  <b className="kab text-ink">{c.kab}</b> <span className="text-xs">({c.fr})</span>
                  {i < ex.cards.length - 1 ? " · " : ""}
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
            <>
              <GoldButton onClick={submit} disabled={!text.trim() || busy}>
                {busy ? "Idir lit ta phrase…" : "Corriger"}
              </GoldButton>
              <button onClick={next} className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-muted underline decoration-dotted underline-offset-4">
                <RefreshCw className="h-3.5 w-3.5" /> autre consigne
              </button>
            </>
          )}

          {reply && (
            <>
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border p-3" style={{ borderColor: "rgba(74,158,207,0.25)", background: "rgba(74,158,207,0.06)" }}>
                <FennecMascot mood="happy" size={34} animated={false} />
                <p className="flex-1 text-sm leading-relaxed text-ink"><IdirText text={reply} /></p>
              </div>
              <SelfGrade prompt="Honnêtement, ta phrase était…" suggested={suggested} onGrade={grade} />
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
