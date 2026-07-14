"use client";

/**
 * Jugement de grammaticalité · « ça sonne juste ? » (intuition implicite).
 * La phrase est soit authentique (corpus), soit une corruption MÉCANIQUE
 * traçable (particule retirée/déplacée). Après réponse, on montre toujours
 * la forme authentique + ce qui a été altéré. [HYPOTHÈSE d'entraînement]
 */
import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Corrupt } from "@/lib/patterns";
import type { Grade } from "@/lib/srs";
import { AudioButton } from "@/components/audio-button";
import { IdirHelp } from "@/components/idir-help";
import { Panel, FmtTag, GoldButton } from "./shared";

const OP_LABEL: Record<string, string> = {
  "drop:ara": "le « ara » de la négation a été retiré",
  "displace:ara:end": "le « ara » a été déplacé",
  "displace:ad:end": "le « ad » a été déplacé en fin de phrase",
};

export function SoundsRight({
  corrupt,
  useBad,
  onDone,
}: {
  corrupt: Corrupt;
  useBad: boolean;
  onDone: (g: Grade, ms: number, ok: boolean) => void;
}) {
  const [answered, setAnswered] = useState<null | boolean>(null); // user said "sonne juste"
  const [t0] = useState(() => Date.now());
  const shownSentence = useBad ? corrupt.bad : corrupt.good;
  const ok = answered !== null && answered === !useBad;

  return (
    <Panel>
      <FmtTag label="Ça sonne juste ?" sub="Fie-toi à ton oreille interne · pas aux règles." />
      <p className="kab text-balance text-center text-3xl font-bold text-ink sm:text-4xl">{shownSentence}</p>

      {answered === null ? (
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            onClick={() => setAnswered(true)}
            className="rounded-2xl border-2 py-4 text-base font-bold"
            style={{ borderColor: "rgba(91,154,111,0.4)", background: "rgba(91,154,111,0.1)", color: "#5B9A6F" }}
          >
            Sonne juste
          </button>
          <button
            onClick={() => setAnswered(false)}
            className="rounded-2xl border-2 py-4 text-base font-bold"
            style={{ borderColor: "rgba(212,115,94,0.4)", background: "rgba(212,115,94,0.1)", color: "#D4735E" }}
          >
            Quelque chose cloche
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: ok ? "rgba(91,154,111,0.12)" : "rgba(212,115,94,0.12)",
              border: `2px solid ${ok ? "rgba(91,154,111,0.3)" : "rgba(212,115,94,0.3)"}`,
            }}
          >
            <p className="flex items-center justify-center gap-2 text-lg font-bold" style={{ color: ok ? "#5B9A6F" : "#D4735E" }}>
              {ok ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              {ok ? "Ton oreille a raison" : "Pas cette fois"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {useBad ? <>Phrase modifiée par Tiwizi · {OP_LABEL[corrupt.op] ?? "altérée"}. L&apos;authentique :</> : "Phrase authentique du corpus :"}
            </p>
            <p className="kab mt-1 text-xl font-semibold text-ink">{corrupt.good}</p>
            <p className="mt-1 text-sm text-muted">{corrupt.fr}</p>
            {(
              <div className="mt-3 flex justify-center">
                <AudioButton id={corrupt.id} synthetic={!corrupt.audio} size="sm" autoPlay />
              </div>
            )}
            {!ok && (
              <div className="mt-1 flex justify-center">
                <IdirHelp
                  label="Pourquoi ? Demande à Idir"
                  ask={`Dans l'exercice « ça sonne juste ? », la forme correcte était « ${corrupt.good} » (${corrupt.fr}) et la version altérée « ${corrupt.bad} ». Explique en 2 phrases simples ce qui clochait.`}
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
