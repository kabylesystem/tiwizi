"use client";

/**
 * Génération · deux visages :
 *  · Transform : appliquer une transformation de structure à une phrase
 *    authentique (jumeaux minés du corpus : « Ččiɣ ṛṛuẓ » → « Ur ččiɣ ara
 *    rruẓ »). Manipulation active de la structure. [SOLIDE · generation]
 *  · Produce : reconstruire la phrase kabyle qui porte une intention donnée.
 * La banque de mots vient de la CIBLE authentique · on produit du corpus,
 * jamais du kabyle inventé.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Lite, Twin } from "@/lib/patterns";
import type { Grade } from "@/lib/srs";
import { fold } from "@/lib/normalize";
import { AudioButton } from "@/components/audio-button";
import { IdirHelp } from "@/components/idir-help";
import { Panel, FmtTag, GoldButton } from "./shared";

type Tok = { tok: string; i: number };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

export function Generate({
  twin,
  pair,
  instruction,
  onDone,
}: {
  twin?: Twin;
  pair?: Lite;
  instruction?: string;
  onDone: (g: Grade, ms: number, ok: boolean) => void;
}) {
  const target = (twin?.marked ?? pair)!;
  const targetToks = useMemo<Tok[]>(
    () => target.kab.replace(/[.!?…]+$/u, "").trim().split(/\s+/).map((tok, i) => ({ tok, i })),
    [target.kab]
  );
  const [bank, setBank] = useState<Tok[]>(() => {
    let a = shuffle(targetToks);
    for (let t = 0; t < 8 && a.map((x) => x.tok).join(" ") === targetToks.map((x) => x.tok).join(" ") && a.length > 1; t++)
      a = shuffle(targetToks);
    return a;
  });
  const [built, setBuilt] = useState<Tok[]>([]);
  const [shown, setShown] = useState(false);
  const [ok, setOk] = useState(false);
  const [t0] = useState(() => Date.now());

  const check = () => {
    const good = fold(built.map((b) => b.tok).join(" ")) === fold(targetToks.map((b) => b.tok).join(" "));
    setOk(good);
    setShown(true);
  };

  return (
    <Panel>
      <FmtTag label={twin ? "Transformation" : "Production"} />

      {twin ? (
        <div className="mb-5 rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.55)" }}>
          <div className="flex items-center justify-center gap-3">
            <AudioButton id={twin.plain.id} synthetic={!twin.plain.audio} size="sm" />
            <p className="kab text-2xl font-semibold text-ink">{twin.plain.kab}</p>
          </div>
          <p className="mt-1 text-sm text-muted">{twin.plain.fr}</p>
          <p className="mt-3 text-sm font-bold" style={{ color: "#A67B2E" }}>
            {instruction ?? "Transforme la structure"} · sens visé : « {twin.marked.fr} »
          </p>
        </div>
      ) : (
        <p className="mb-5 text-center text-lg font-semibold text-ink">
          Dis-le en kabyle : <span className="text-muted">« {target.fr} »</span>
        </p>
      )}

      <div className="mb-4 min-h-[3.5rem] rounded-2xl border-2 border-dashed p-3" style={{ borderColor: "rgba(200,150,62,0.25)", background: "rgba(255,255,255,0.5)" }}>
        <div className="flex flex-wrap gap-2">
          {built.map((it) => (
            <button
              key={it.i}
              disabled={shown}
              onClick={() => {
                setBuilt((b) => b.filter((x) => x.i !== it.i));
                setBank((b) => [...b, it]);
              }}
              className="kab rounded-xl border-2 px-3 py-1.5 text-lg"
              style={{ borderColor: shown ? (ok ? "#5B9A6F" : "#D4735E") : "rgba(200,150,62,0.3)", background: "rgba(255,255,255,0.8)", color: "#2A1F14" }}
            >
              {it.tok}
            </button>
          ))}
          {!built.length && <span className="px-1 py-1.5 text-sm text-muted">Construis la phrase…</span>}
        </div>
      </div>

      {!shown && (
        <div className="mb-2 flex flex-wrap justify-center gap-2">
          {bank.map((it) => (
            <motion.button
              key={it.i}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                setBuilt((b) => [...b, it]);
                setBank((b) => b.filter((x) => x.i !== it.i));
              }}
              className="kab rounded-xl border-2 px-3 py-1.5 text-lg"
              style={{ borderColor: "rgba(200,150,62,0.2)", background: "rgba(255,255,255,0.75)", color: "#2A1F14" }}
            >
              {it.tok}
            </motion.button>
          ))}
        </div>
      )}

      {!shown ? (
        <GoldButton onClick={check} disabled={built.length !== targetToks.length}>
          Vérifier
        </GoldButton>
      ) : (
        <div className="mt-4">
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: ok ? "rgba(91,154,111,0.12)" : "rgba(212,115,94,0.12)",
              border: `2px solid ${ok ? "rgba(91,154,111,0.3)" : "rgba(212,115,94,0.3)"}`,
            }}
          >
            <p className="text-lg font-bold" style={{ color: ok ? "#5B9A6F" : "#D4735E" }}>
              {ok ? "Yelha !" : "Presque · la forme authentique :"}
            </p>
            <p className="kab mt-1 text-xl font-semibold text-ink">{target.kab}</p>
            {(
              <div className="mt-3 flex justify-center">
                <AudioButton id={target.id} synthetic={!target.audio} size="sm" autoPlay />
              </div>
            )}
            {!ok && (
              <div className="mt-1 flex justify-center">
                <IdirHelp
                  label="Pourquoi ? Demande à Idir"
                  ask={`L'élève devait produire « ${target.kab} » (« ${target.fr} »)${twin ? ` à partir de « ${twin.plain.kab} »` : ""} et s'est trompé. Explique la structure en 2 phrases simples.`}
                />
              </div>
            )}
          </div>
          <GoldButton onClick={() => onDone(ok ? 2 : 0, Date.now() - t0, ok)}>Continuer</GoldButton>
        </div>
      )}
    </Panel>
  );
}
