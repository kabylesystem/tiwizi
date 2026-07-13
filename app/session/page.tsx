"use client";

/**
 * La session quotidienne (docs/pedagogie.md §6) — un seul bouton, 15 minutes
 * minimum, composée en direct par le moteur depuis le modèle cognitif :
 * réactivation → induction/consolidation → génération, en boucle tant que le
 * chrono court. Pas de cœurs : l'erreur replanifie, elle ne punit pas.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Flame } from "lucide-react";
import type { PatternMeta, PatternMaterial } from "@/lib/patterns";
import { TRANSFORM_LABEL } from "@/lib/patterns";
import {
  loadCog, saveCog, recordEvent, recordExposure, skill,
  type CogStore, CHANNELS, CHANNEL_LABEL,
} from "@/lib/cognitive-model";
import {
  planNextBlock, buildReactBlock, buildGenerateBlock,
  SESSION_MINUTES, type Block, type ReactItem,
} from "@/lib/session-engine";
import { useGameStore } from "@/lib/store/game-store";
import { useSound } from "@/lib/sound-engine";
import { Induction, type InductionResult } from "@/components/formats/induction";
import { FreeProduce } from "@/components/formats/free-produce";
import { ListenMeaning } from "@/components/formats/listen-meaning";
import { SoundsRight } from "@/components/formats/sounds-right";
import { Anticipate } from "@/components/formats/anticipate";
import { Generate } from "@/components/formats/transform";
import { Panel, FmtTag, GoldButton, CREAM } from "@/components/formats/shared";
import { FennecMascot } from "@/components/fennec";

const BLOCK_LABEL: Record<Block["type"], string> = {
  react: "Réactivation",
  induction: "Pattern",
  generate: "Génération",
};

export default function SessionPage() {
  const router = useRouter();
  const gameStore = useGameStore();
  const { play } = useSound();

  const cogRef = useRef<CogStore | null>(null);
  const [metas, setMetas] = useState<PatternMeta[] | null>(null);
  const materialsRef = useRef<Record<string, PatternMaterial>>({});
  const ranRef = useRef({ react: 0, induction: 0, generate: 0 });

  const [phase, setPhase] = useState<"loading" | "intro" | "block" | "recap" | "error">("loading");
  const [block, setBlock] = useState<Block | null>(null);
  const [itemIdx, setItemIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0); // seconds, only while visible
  const [running, setRunning] = useState(false);
  const statsRef = useRef({ items: 0, ok: 0, patterns: new Set<string>() });

  const [, bump] = useState(0);

  // load graph + cognitive model
  useEffect(() => {
    cogRef.current = loadCog();
    fetch("/api/patterns")
      .then((r) => r.json())
      .then((d) => {
        setMetas(d.patterns);
        setPhase("intro");
      })
      .catch(() => setPhase("error"));
    // si la restauration depuis le disque (StateSync) arrive après nous
    const onPulled = () => {
      cogRef.current = loadCog();
      bump((x) => x + 1);
    };
    window.addEventListener("tiwizi:pulled", onPulled);
    return () => window.removeEventListener("tiwizi:pulled", onPulled);
  }, []);

  // 15-minute clock (pauses when the tab is hidden)
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const metasById = useMemo(
    () => Object.fromEntries((metas ?? []).map((m) => [m.id, m])),
    [metas]
  );

  const ensureMaterials = useCallback(async (ids: string[]) => {
    const seed = new Date().toISOString().slice(0, 10);
    await Promise.all(
      ids
        .filter((id) => !materialsRef.current[id])
        .map((id) =>
          fetch(`/api/pattern-material?p=${id}&seed=${seed}`)
            .then((r) => r.json())
            .then((m) => {
              materialsRef.current[id] = m;
            })
        )
    );
  }, []);

  const advance = useCallback(
    async (ignoreClock = false) => {
      const cog = cogRef.current!;
      const req = planNextBlock(cog, metas!, ranRef.current, ignoreClock ? 0 : elapsed / 60);
      if (!req || (!ignoreClock && elapsed >= SESSION_MINUTES * 60)) {
        finishSession();
        return;
      }
      try {
        await ensureMaterials(req.patternIds);
      } catch {
        finishSession();
        return;
      }
      const mats = Object.fromEntries(req.patternIds.map((id) => [id, materialsRef.current[id]]));
      let b: Block;
      if (req.type === "induction") {
        const meta = metasById[req.patternIds[0]];
        const mat = mats[meta.id];
        b = { type: "induction", meta, flood: mat.flood.slice(0, cog.floodLen ?? 5), probes: mat.probes.slice(0, 3) };
        ranRef.current.induction++;
      } else if (req.type === "generate") {
        b = buildGenerateBlock(cog, metasById, mats, 3);
        ranRef.current.generate++;
      } else {
        b = buildReactBlock(cog, metasById, mats, 8);
        ranRef.current.react++;
      }
      const empty = b.type !== "induction" && b.items.length === 0;
      if (empty) {
        finishSession();
        return;
      }
      setItemIdx(0);
      setBlock(b);
      setPhase("block");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metas, metasById, elapsed, ensureMaterials]
  );

  const finishSession = useCallback(() => {
    const cog = cogRef.current!;
    cog.sessionsDone += 1;
    cog.lastSession = new Date().toISOString().slice(0, 10);
    cog.minutesToday += Math.round(elapsed / 60);
    saveCog(cog);
    gameStore.incrementStreak();
    gameStore.addXP(statsRef.current.items * 10);
    play("complete");
    setRunning(false);
    setPhase("recap");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  const onItemDone = (item: ReactItem, grade: 0 | 1 | 2 | 3, ms: number) => {
    const cog = cogRef.current!;
    recordEvent(cog, { patternId: item.patternId, channel: item.channel, grade, ms });
    const ids = item.pair ? [item.pair.id] : item.corrupt ? [item.corrupt.id] : item.twin ? [item.twin.plain.id, item.twin.marked.id] : [];
    recordExposure(cog, item.patternId, ids);
    saveCog(cog);
    play(grade >= 2 ? "correct" : "wrong");
    statsRef.current.items++;
    if (grade >= 2) statsRef.current.ok++;
    statsRef.current.patterns.add(item.patternId);
    const items = (block as Extract<Block, { type: "react" | "generate" }>).items;
    if (itemIdx < items.length - 1) setItemIdx((i) => i + 1);
    else advance();
  };

  const onInductionDone = (meta: PatternMeta, r: InductionResult) => {
    const cog = cogRef.current!;
    recordExposure(cog, meta.id, r.exposedIds);
    // adaptation à la vitesse d'induction réelle : skip réussi → floods plus
    // courts ; échec des probes → plus d'exposition la prochaine fois
    if (r.skippedFlood && r.probeOk === r.probeTotal) cog.floodLen = Math.max(3, (cog.floodLen ?? 5) - 1);
    else if (r.probeOk < 2) cog.floodLen = Math.min(8, (cog.floodLen ?? 5) + 1);
    const sk = skill(cog, meta.id);
    if (r.abstracted && !sk.abstracted) {
      sk.abstracted = true;
      sk.noteShown = true;
      // enter the four channels into the review cycle (due ~tomorrow)
      for (const ch of CHANNELS) if (!sk.channels[ch]) recordEvent(cog, { patternId: meta.id, channel: ch, grade: 2 });
    }
    saveCog(cog);
    statsRef.current.items += r.probeTotal;
    statsRef.current.ok += r.probeOk;
    statsRef.current.patterns.add(meta.id);
    play(r.abstracted ? "complete" : "tap");
    advance();
  };

  // ---------- render ----------
  const remaining = Math.max(0, SESSION_MINUTES * 60 - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex min-h-screen flex-col" style={CREAM}>
      <header
        className="sticky top-0 z-30 px-4 py-4 sm:px-6"
        style={{ background: "rgba(253,248,240,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(200,150,62,0.2)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button onClick={() => router.push("/")} aria-label="Quitter" className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "rgba(200,150,62,0.15)" }}>
            <Home className="h-5 w-5 text-muted" />
          </button>
          <div className="flex-1">
            <span className="mb-1 block text-xs font-medium text-muted">
              {phase === "block" && block ? BLOCK_LABEL[block.type] : "Session du jour"}
            </span>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(200,150,62,0.15)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-1000"
                style={{ width: `${Math.min(100, (elapsed / (SESSION_MINUTES * 60)) * 100)}%`, background: "linear-gradient(90deg,#C8963E,#E8B85C)" }}
              />
            </div>
          </div>
          <span className="font-display text-lg font-bold tabular-nums" style={{ color: remaining === 0 ? "#5B9A6F" : "#A67B2E" }}>
            {remaining === 0 ? "✓" : `${mm}:${ss}`}
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center p-4 sm:items-center sm:p-6">
        <div className="w-full max-w-3xl">
          {phase === "loading" && <p className="text-center text-muted">Chargement…</p>}

          {phase === "error" && (
            <Panel className="text-center">
              <p className="text-muted">Impossible de charger les patterns. Relance l&apos;app.</p>
            </Panel>
          )}

          {phase === "intro" && metas && <IntroCard cog={cogRef.current!} metas={metas} onStart={() => { setRunning(true); advance(); }} />}

          {phase === "block" && block && block.type === "induction" && (
            <Induction
              key={block.meta.id + ranRef.current.induction}
              meta={block.meta}
              flood={block.flood}
              probes={block.probes}
              alreadyAbstracted={!!cogRef.current?.patterns[block.meta.id]?.abstracted}
              onDone={(r) => onInductionDone(block.meta, r)}
            />
          )}

          {phase === "block" && block && block.type !== "induction" && (
            <ItemRunner
              key={`${block.type}-${ranRef.current.react}-${ranRef.current.generate}-${itemIdx}`}
              item={block.items[itemIdx]}
              metasById={metasById}
              onDone={onItemDone}
            />
          )}

          {phase === "recap" && <RecapCard stats={statsRef.current} elapsed={elapsed} onMore={() => { setRunning(true); advance(true); }} onHome={() => router.push("/")} />}
        </div>
      </main>
    </div>
  );
}

function IntroCard({ cog, metas, onStart }: { cog: CogStore; metas: PatternMeta[]; onStart: () => void }) {
  const now = Date.now();
  let due = 0;
  for (const sk of Object.values(cog.patterns))
    for (const ch of CHANNELS) if (sk.channels[ch] && sk.channels[ch]!.due <= now) due++;
  const known = Object.values(cog.patterns).filter((s) => s.abstracted).length;
  const next = metas
    .filter((m) => !cog.patterns[m.id]?.abstracted)
    .sort((a, b) => a.order - b.order)[0];

  return (
    <Panel className="text-center">
      <FennecMascot mood="happy" size={88} />
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">La session du jour</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        15 minutes. Le moteur enchaîne tout seul : ce que ton cerveau doit retrouver aujourd&apos;hui,
        {next ? <> puis un pattern nouveau (<b>{next.name}</b>),</> : " puis de la consolidation,"} puis de la production.
      </p>
      <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl p-3" style={{ background: "rgba(200,150,62,0.1)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "#A67B2E" }}>{due}</p>
          <p className="text-xs text-muted">canaux à réactiver</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: "rgba(91,154,111,0.1)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "#5B9A6F" }}>{known}/{metas.length}</p>
          <p className="text-xs text-muted">patterns extraits</p>
        </div>
      </div>
      <GoldButton onClick={onStart}>Lancer — 15 min</GoldButton>
    </Panel>
  );
}

function ItemRunner({
  item,
  metasById,
  onDone,
}: {
  item: ReactItem;
  metasById: Record<string, PatternMeta>;
  onDone: (item: ReactItem, grade: 0 | 1 | 2 | 3, ms: number) => void;
}) {
  const meta = metasById[item.patternId];
  if (item.fmt === "free-produce")
    return <FreeProduce meta={meta} onDone={(g, ms) => onDone(item, g, ms)} />;
  if (item.fmt === "sounds-right" && item.corrupt)
    return <SoundsRight corrupt={item.corrupt} useBad={!!item.useBad} onDone={(g, ms) => onDone(item, g, ms)} />;
  if (item.fmt === "anticipate" && item.pair)
    return <Anticipate pair={item.pair} maskSrc={meta.mask} maskFlags={meta.maskFlags} onDone={(g, ms) => onDone(item, g, ms)} />;
  if ((item.fmt === "transform" || item.fmt === "produce") && (item.twin || item.pair))
    return <Generate twin={item.twin} pair={item.pair} instruction={TRANSFORM_LABEL[item.patternId]} onDone={(g, ms) => onDone(item, g, ms)} />;
  if (item.pair)
    return <ListenMeaning pair={item.pair} audioFirst={item.fmt === "listen-meaning"} onDone={(g, ms) => onDone(item, g, ms)} />;
  return null;
}

function RecapCard({
  stats,
  elapsed,
  onMore,
  onHome,
}: {
  stats: { items: number; ok: number; patterns: Set<string> };
  elapsed: number;
  onMore: () => void;
  onHome: () => void;
}) {
  const acc = stats.items ? Math.round((stats.ok / stats.items) * 100) : 0;
  return (
    <Panel className="text-center">
      <FennecMascot mood="excited" size={92} />
      <h2 className="mt-3 font-display text-3xl font-bold text-ink">Ifukk ! ☀</h2>
      <p className="mt-1 text-sm text-muted">
        {Math.round(elapsed / 60)} min · {stats.items} récupérations · {stats.patterns.size} patterns travaillés
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat n={`${stats.items}`} l="items" c="#C8963E" />
        <Stat n={`${acc}%`} l="réussite" c="#5B9A6F" />
        <Stat n={`${stats.patterns.size}`} l="patterns" c="#4A9ECF" />
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
        <Flame className="h-4 w-4" style={{ color: "#D4735E" }} />
        Ce qui a flanché aujourd&apos;hui reviendra plus tôt — c&apos;est le système qui bosse pour toi.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={onHome} className="flex-1 rounded-2xl py-3.5 font-semibold" style={{ background: "rgba(200,150,62,0.15)", color: "#8B7355" }}>
          Terminer
        </button>
        <button onClick={onMore} className="flex-1 rounded-2xl py-3.5 font-bold text-white" style={{ background: "linear-gradient(135deg,#C8963E,#A67B2E)" }}>
          Encore un bloc
        </button>
      </div>
    </Panel>
  );
}

function Stat({ n, l, c }: { n: string; l: string; c: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: `${c}1a`, border: `1px solid ${c}33` }}>
      <p className="font-display text-lg font-bold" style={{ color: c }}>{n}</p>
      <p className="text-xs text-muted">{l}</p>
    </div>
  );
}
