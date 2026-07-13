"use client";

/**
 * Récupération en compréhension · audio d'abord (canal oreille) ou texte
 * (canal lecture). Le sens n'est PAS proposé en QCM : le cerveau doit le
 * reconstruire, puis s'auto-évaluer honnêtement (retrieval, pas devinette).
 */
import { useState } from "react";
import type { Lite } from "@/lib/patterns";
import type { Grade } from "@/lib/srs";
import { AudioButton } from "@/components/audio-button";
import { KabTap } from "@/components/kab-tap";
import { Panel, FmtTag, GoldButton, SelfGrade } from "./shared";

export function ListenMeaning({
  pair,
  audioFirst,
  onDone,
}: {
  pair: Lite;
  audioFirst: boolean;
  onDone: (g: Grade, ms: number) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [t0] = useState(() => Date.now());

  return (
    <Panel>
      <FmtTag
        label={audioFirst ? "Oreille" : "Lecture"}
        sub={audioFirst ? "Écoute. Reconstruis le sens dans ta tête." : "Lis. Reconstruis le sens dans ta tête."}
      />

      <div className="flex flex-col items-center gap-4">
        {audioFirst && pair.audio && <AudioButton id={pair.id} size="lg" autoPlay />}
        {(!audioFirst || revealed) && <KabTap kab={pair.kab} />}
        {!audioFirst && pair.audio && revealed && <AudioButton id={pair.id} size="md" />}
        {revealed && <p className="text-center text-lg text-muted">{pair.fr}</p>}
      </div>

      {!revealed ? (
        <GoldButton onClick={() => setRevealed(true)}>Révéler</GoldButton>
      ) : (
        <SelfGrade prompt="Tu avais le sens ?" onGrade={(g) => onDone(g, Date.now() - t0)} />
      )}
    </Panel>
  );
}
