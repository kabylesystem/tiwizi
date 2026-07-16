"use client";

/**
 * Induction d'un pattern (docs/pedagogie.md §4.1-4.3) :
 *  1. FLOOD · instances authentiques à surface variable, aucune règle
 *     affichée : le cerveau détecte la structure stable. [statistical learning]
 *  2. PROBES · phrases à vocabulaire frais + question STRUCTURELLE (« l'action
 *     s'est faite ou pas ? ») : mémorisation d'exemples ou vraie abstraction ?
 *  3. RÉVÉLATION · la micro-note explicite n'apparaît QU'APRÈS l'abstraction.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Sparkles } from "lucide-react";
import type { Lite, PatternMeta, ProbeItem } from "@/lib/patterns";
import { AudioButton } from "@/components/audio-button";
import { KabTap } from "@/components/kab-tap";
import { Panel, FmtTag, GoldButton } from "./shared";

export type InductionResult = {
  exposedIds: number[];
  probeOk: number;
  probeTotal: number;
  abstracted: boolean;
  /** L'élève a sauté le reste du flood (« j'ai capté ») · signal de vitesse. */
  skippedFlood: boolean;
};

export function Induction({
  meta,
  flood,
  probes,
  alreadyAbstracted,
  onDone,
}: {
  meta: PatternMeta;
  flood: Lite[];
  probes: ProbeItem[];
  alreadyAbstracted: boolean;
  onDone: (r: InductionResult) => void;
}) {
  const [phase, setPhase] = useState<"tease" | "flood" | "probe" | "result">("tease");
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [probeIdx, setProbeIdx] = useState(0);
  const [probeOk, setProbeOk] = useState(0);
  const [probeAnswered, setProbeAnswered] = useState<number | null>(null);
  const [skippedFlood, setSkippedFlood] = useState(false);

  const NEED = 2; // ≥2/3 fresh-vocab probes → abstracted
  const abstracted = probeOk >= NEED;
  const exposedIds = [...flood.slice(0, idx + 1).map((f) => f.id), ...probes.slice(0, probeIdx + 1).map((p) => p.pair.id)];

  if (phase === "tease")
    return (
      <Panel className="text-center">
        <FmtTag label={alreadyAbstracted ? "Consolidation" : "Nouveau pattern"} />
        <Eye className="mx-auto h-10 w-10" style={{ color: "#A67B2E" }} />
        <h2 className="mt-3 font-display text-2xl font-bold text-ink">Observe.</h2>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: "#A67B2E" }}>famille : {meta.family}</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Dans les phrases qui suivent, la partie <mark className="rounded px-1" style={{ background: "rgba(200,150,62,0.28)", color: "#7a5a17" }}>surlignée</mark> est
          ce qui se répète. Écoute, regarde ce qui reste stable pendant que tout le reste change ·
          la règle, ton cerveau va la construire tout seul.
        </p>
        <GoldButton onClick={() => setPhase("flood")}>C&apos;est parti</GoldButton>
      </Panel>
    );

  if (phase === "flood") {
    const p = flood[idx];
    // la traduction n'est JAMAIS la tâche : optionnelle, sur demande ·
    // le but est d'écouter/lire et de laisser la structure se détacher
    return (
      <Panel>
        <FmtTag label={`Immersion · ${idx + 1}/${flood.length}`} />
        <div className="flex flex-col items-center gap-4">
          <AudioButton id={p.id} synthetic={!p.audio} size="lg" autoPlay key={p.id} />
          {/* pattern surligné (input enhancement) + chaque mot tappable → Dallet.
              Les probes restent SANS surlignage ni tap : le test se fait sans aide. */}
          <KabTap kab={p.kab} mask={meta.mask} maskFlags={meta.maskFlags} />
          {revealed ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-lg text-muted">
              {p.fr}
            </motion.p>
          ) : (
            <button onClick={() => setRevealed(true)} className="text-sm text-muted underline decoration-dotted underline-offset-4">
              voir le sens
            </button>
          )}
        </div>
        <GoldButton
          onClick={() => {
            setRevealed(false);
            if (idx < flood.length - 1) setIdx((i) => i + 1);
            else setPhase(probes.length ? "probe" : "result");
          }}
        >
          {idx < flood.length - 1 ? "Suivant" : "Voyons si ton cerveau l'a capté"}
        </GoldButton>
        {idx >= 2 && idx < flood.length - 1 && probes.length > 0 && (
          <button
            onClick={() => {
              setSkippedFlood(true);
              setPhase("probe");
            }}
            className="mt-3 w-full text-center text-sm font-semibold underline decoration-dotted underline-offset-4"
            style={{ color: "#A67B2E" }}
          >
            J&apos;ai capté · teste-moi
          </button>
        )}
      </Panel>
    );
  }

  if (phase === "probe") {
    const item = probes[probeIdx];
    const p = item.pair;
    const done = probeAnswered !== null;
    return (
      <Panel>
        <FmtTag label={`Le test · ${probeIdx + 1}/${probes.length}`} sub="Vocabulaire nouveau · seule la structure peut te guider." />
        <div className="flex flex-col items-center gap-3">
          <AudioButton id={p.id} synthetic={!p.audio} size="md" autoPlay key={p.id} />
          {/* la phrase devient tappable et traduite APRÈS la réponse
              (avant, la traduction française donnerait la réponse) */}
          {done ? (
            <KabTap kab={p.kab} className="kab text-balance text-center text-2xl font-bold leading-relaxed text-ink sm:text-3xl" />
          ) : (
            <p className="kab text-balance text-center text-2xl font-bold text-ink sm:text-3xl">{p.kab}</p>
          )}
          {done && <p className="text-base text-muted">{p.fr}</p>}
        </div>
        <p className="mt-6 text-center text-sm font-semibold text-ink">{meta.probe.q}</p>
        <div className={`mt-3 grid gap-2 ${meta.probe.options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
          {meta.probe.options.map((opt, i) => {
            const isAns = done && i === item.answer;
            const isWrong = done && probeAnswered === i && !isAns;
            return (
              <button
                key={i}
                disabled={done}
                onClick={() => {
                  setProbeAnswered(i);
                  if (i === item.answer) setProbeOk((n) => n + 1);
                }}
                className="rounded-xl border-2 px-3 py-3 text-sm font-semibold"
                style={{
                  borderColor: isAns ? "#5B9A6F" : isWrong ? "#D4735E" : "rgba(200,150,62,0.25)",
                  background: isAns ? "rgba(91,154,111,0.12)" : isWrong ? "rgba(212,115,94,0.12)" : "rgba(255,255,255,0.6)",
                  color: isAns ? "#5B9A6F" : isWrong ? "#D4735E" : "#2A1F14",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {done && (
          <GoldButton
            onClick={() => {
              setProbeAnswered(null);
              if (probeIdx < probes.length - 1) setProbeIdx((i) => i + 1);
              else setPhase("result");
            }}
          >
            {probeIdx < probes.length - 1 ? "Phrase suivante" : "Résultat"}
          </GoldButton>
        )}
      </Panel>
    );
  }

  // result · the explicit note is revealed ONLY here, after induction
  return (
    <Panel className="text-center">
      <Sparkles className="mx-auto h-10 w-10" style={{ color: abstracted ? "#5B9A6F" : "#C8963E" }} />
      <h2 className="mt-3 font-display text-2xl font-bold text-ink">
        {abstracted ? "Ton cerveau l'a extrait." : "Le pattern mûrit."}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {probeOk}/{probes.length} sur du vocabulaire jamais vu.
        {!abstracted && " On remettra une couche d'immersion · c'est comme ça que ça pousse."}
      </p>
      {abstracted && (
        <div className="mt-5 rounded-2xl p-4 text-left" style={{ background: "rgba(74,158,207,0.09)", border: "1px solid rgba(74,158,207,0.25)" }}>
          <p className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: "#1f63b0" }}>
            Maintenant que tu l&apos;as senti · {meta.schema}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{meta.note}</p>
        </div>
      )}
      <GoldButton onClick={() => onDone({ exposedIds, probeOk, probeTotal: probes.length, abstracted, skippedFlood })}>
        Continuer
      </GoldButton>
    </Panel>
  );
}
