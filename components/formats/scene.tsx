"use client";

/**
 * « La scène du jour » : la progression situationnelle du Kabyle de poche
 * (Assimil), habillée de phrases 100% NATIVES du corpus (audio réel).
 * Input narratif pur : on vit la situation, on tape les mots qui intriguent,
 * le sens est optionnel · aucune note, aucun test.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { Lite } from "@/lib/patterns";
import { AudioButton } from "@/components/audio-button";
import { KabTap } from "@/components/kab-tap";
import { Panel, FmtTag, GoldButton } from "./shared";

export function SceneBlock({
  title,
  lines,
  onDone,
}: {
  title: string;
  lines: Lite[];
  onDone: (seenIds: number[]) => void;
}) {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (!started)
    return (
      <Panel className="text-center">
        <FmtTag label="La scène du jour" />
        <BookOpen className="mx-auto h-10 w-10" style={{ color: "#A67B2E" }} />
        <h2 className="mt-3 font-display text-2xl font-bold text-ink">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          D&apos;après la progression du <i>Kabyle de poche</i> · des voix natives te font vivre la
          situation. Écoute, tape les mots qui t&apos;intriguent, laisse-toi porter.
        </p>
        <GoldButton onClick={() => setStarted(true)}>Entrer dans la scène</GoldButton>
      </Panel>
    );

  const l = lines[idx];
  return (
    <Panel>
      <FmtTag label={`${title} · ${idx + 1}/${lines.length}`} />
      <div className="flex flex-col items-center gap-4">
        <AudioButton id={l.id} synthetic={!l.audio} size="lg" autoPlay key={l.id} />
        <KabTap kab={l.kab} />
        {revealed ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-lg text-muted">
            {l.fr}
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
          if (idx < lines.length - 1) setIdx((i) => i + 1);
          else onDone(lines.map((x) => x.id));
        }}
      >
        {idx < lines.length - 1 ? "Réplique suivante" : "Fin de scène"}
      </GoldButton>
    </Panel>
  );
}
