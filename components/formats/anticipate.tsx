"use client";

/**
 * Prédiction avant révélation · la partie structurellement critique de la
 * phrase est masquée ; le cerveau anticipe la forme, puis la vraie forme est
 * révélée. L'écart prédiction/réalité nourrit la planification (predictive
 * processing / prediction error). [RAISONNABLE]
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { Lite } from "@/lib/patterns";
import { maskSegments } from "@/lib/patterns";
import type { Grade } from "@/lib/srs";
import { AudioButton } from "@/components/audio-button";
import { Panel, FmtTag, GoldButton, SelfGrade } from "./shared";

export function Anticipate({
  pair,
  maskSrc,
  maskFlags,
  onDone,
}: {
  pair: Lite;
  maskSrc: string;
  maskFlags: string;
  onDone: (g: Grade, ms: number) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [t0] = useState(() => Date.now());
  const segs = maskSegments(pair.kab, maskSrc, maskFlags);

  return (
    <Panel>
      <FmtTag label="Anticipation" sub="Quelle forme manque ? Prédis-la avant de révéler." />

      <p className="mb-3 text-center text-base text-muted">« {pair.fr} »</p>
      <p className="kab text-balance text-center text-3xl font-bold leading-relaxed text-ink sm:text-4xl">
        {segs.map((s, i) =>
          s.hidden && !revealed ? (
            <span
              key={i}
              className="mx-1 inline-block rounded-lg px-2 align-baseline"
              style={{ background: "rgba(200,150,62,0.22)", color: "transparent", border: "1.5px dashed rgba(200,150,62,0.5)" }}
            >
              {s.text}
            </span>
          ) : s.hidden ? (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-1 inline-block rounded-lg px-2"
              style={{ background: "rgba(91,154,111,0.16)", color: "#2f7d5b" }}
            >
              {s.text}
            </motion.span>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </p>

      {revealed && (
        <div className="mt-4 flex justify-center">
          <AudioButton id={pair.id} synthetic={!pair.audio} size="md" autoPlay />
        </div>
      )}

      {!revealed ? (
        <GoldButton onClick={() => setRevealed(true)}>Révéler</GoldButton>
      ) : (
        <SelfGrade prompt="Tu l'avais prédite ?" onGrade={(g) => onDone(g, Date.now() - t0)} />
      )}
    </Panel>
  );
}
