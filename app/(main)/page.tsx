"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Play, Star, ChevronRight } from "lucide-react";
import { kabyleUnits, type Unit } from "@/lib/data/kabyle-content";
import { useGameStore } from "@/lib/store/game-store";
import { FennecMascot } from "@/components/fennec";
import { AxxamPreview } from "@/components/axxam";
import { cn } from "@/lib/utils";

const KIND_BADGE: Record<Unit["kind"], string> = {
  vocab: "🧩 Pièces",
  pattern: "🔗 Pattern",
  theme: "🏗️ Construction",
};

const WORDS = [
  { tif: "ⴰⵣⵓⵍ", lat: "Azul", fr: "Bonjour" },
  { tif: "ⵜⴰⵎⵓⵔⵜ", lat: "Tamurt", fr: "Pays, terre natale" },
  { tif: "ⵜⵉⵍⴻⵍⵍⵉ", lat: "Tilelli", fr: "Liberté" },
  { tif: "ⴰⵅⵅⴰⵎ", lat: "Axxam", fr: "Maison, foyer" },
  { tif: "ⵜⴰⵢⵔⵉ", lat: "Tayri", fr: "Amour" },
  { tif: "ⵜⵉⴷⴻⵜ", lat: "Tidet", fr: "Vérité" },
  { tif: "ⴰⵎⴷⴰⵏ", lat: "Amdan", fr: "Être humain" },
];

export default function LearnPath() {
  const store = useGameStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const completedLessons = mounted ? store.completedLessons : [];
  const allLessons = kabyleUnits.flatMap((u) => u.lessons);
  const doneCount = allLessons.filter((l) => completedLessons.includes(l.id)).length;
  const overall = Math.round((doneCount / allLessons.length) * 100);
  const next = allLessons.find((l) => !completedLessons.includes(l.id)) ?? allLessons[0];
  const word = WORDS[new Date().getDay() % WORDS.length];

  // a unit is unlocked once the previous unit is fully complete
  const unitDone = (u: Unit) => u.lessons.every((l) => completedLessons.includes(l.id));
  let prevDone = true;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* HERO — full width */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between rounded-3xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.85)] p-6 shadow-[0_4px_24px_rgba(200,150,62,0.1)] sm:p-8"
        >
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-tifinagh text-brand">ⴰⵣⵓⵍ</span>
              <span className="text-xs font-medium text-muted">Azul, naly — bon retour</span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Construis ton kabyle,
              <br /> pièce par pièce.
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted">
              {doneCount === 0
                ? "Les briques d'abord, les patterns ensuite — la conversation suivra."
                : `${doneCount}/${allLessons.length} leçons · ${overall}% du parcours`}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/lesson?id=${next.id}`}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(200,150,62,0.3)]"
              style={{ background: "linear-gradient(135deg,#C8963E,#A67B2E)" }}
            >
              <Play className="h-4 w-4 fill-white" />
              {doneCount === 0 ? "Commencer" : "Continuer"}
            </Link>
            <span className="flex items-center gap-2 rounded-full bg-[rgba(200,150,62,0.1)] px-4 py-2 text-sm">
              <FennecMascot mood="encouraging" size={30} animated={false} />
              <span className="italic text-muted">
                {doneCount === 0 ? "Azul fellak! Bdu." : "Yelha, kemmel akka!"} — Idir
              </span>
            </span>
          </div>
        </motion.div>

        {/* Axxam progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center rounded-3xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.85)] p-6 shadow-[0_4px_24px_rgba(200,150,62,0.1)]"
        >
          <AxxamPreview progress={overall} className="h-32 w-32" />
          <p className="mt-2 font-display text-2xl font-bold text-brand">{overall}%</p>
          <p className="text-xs text-muted">Ta maison kabyle — axxam</p>
          <div className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-[rgba(200,150,62,0.08)] p-3">
            <Star className="h-5 w-5 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted">Mot du jour</p>
              <p className="truncate text-sm">
                <span className="font-tifinagh text-brand">{word.tif}</span>{" "}
                <span className="font-semibold text-ink">{word.lat}</span>{" "}
                <span className="text-muted">— {word.fr}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PATH — full-width unit grid */}
      <div className="mb-5 mt-10 flex items-center gap-2">
        <div className="h-6 w-1.5 rounded-full" style={{ background: "linear-gradient(180deg,#C8963E,#E8B85C)" }} />
        <h2 className="font-display text-lg font-bold text-ink">Parcours — pièces → patterns → construction</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kabyleUnits.map((unit, ui) => {
          const isUnlocked = ui === 0 || prevDone;
          const done = unit.lessons.filter((l) => completedLessons.includes(l.id)).length;
          const pct = Math.round((done / unit.lessons.length) * 100);
          prevDone = unitDone(unit);
          return (
            <UnitCard
              key={unit.id}
              unit={unit}
              unlocked={isUnlocked}
              completed={completedLessons}
              done={done}
              pct={pct}
              index={ui}
            />
          );
        })}
      </div>
    </div>
  );
}

function UnitCard({
  unit,
  unlocked,
  completed,
  done,
  pct,
  index,
}: {
  unit: Unit;
  unlocked: boolean;
  completed: string[];
  done: number;
  pct: number;
  index: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        "rounded-3xl border bg-[rgba(253,248,240,0.85)] p-5 shadow-[0_2px_14px_rgba(200,150,62,0.08)]",
        unlocked ? "border-[rgba(200,150,62,0.18)]" : "border-[rgba(200,150,62,0.1)] opacity-70"
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
          style={{ background: `${unit.color}18`, border: `1px solid ${unit.color}30` }}
        >
          {unit.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: unit.color }}>
              {unit.order}
            </span>
            <h3 className="truncate font-display text-base font-bold text-ink">{unit.title}</h3>
          </div>
          <p className="truncate text-xs text-muted">{unit.description}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold"
          style={{ background: `${unit.color}18`, color: unit.color }}
        >
          {done}/{unit.lessons.length}
        </span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[rgba(200,150,62,0.12)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: unit.color }} />
      </div>

      <div className="flex flex-wrap gap-2.5">
        {unit.lessons.map((lesson, li) => {
          const isDone = completed.includes(lesson.id);
          const prev = li > 0 ? unit.lessons[li - 1] : null;
          const prevDone = prev ? completed.includes(prev.id) : true;
          const isCurrent = unlocked && prevDone && !isDone;
          const isLocked = !unlocked || (!prevDone && li > 0);
          return (
            <LessonNode
              key={lesson.id}
              id={lesson.id}
              title={lesson.title}
              color={unit.color}
              done={isDone}
              current={isCurrent}
              locked={isLocked}
            />
          );
        })}
      </div>
    </motion.section>
  );
}

function LessonNode({
  id,
  title,
  color,
  done,
  current,
  locked,
}: {
  id: string;
  title: string;
  color: string;
  done: boolean;
  current: boolean;
  locked: boolean;
}) {
  const inner = (
    <motion.div
      whileHover={!locked ? { scale: 1.06 } : {}}
      whileTap={!locked ? { scale: 0.94 } : {}}
      className="relative grid h-12 w-12 place-items-center rounded-2xl"
      style={{
        background: done ? color : current ? "#FFFCF5" : "rgba(245,230,200,0.6)",
        border: current ? `2.5px solid ${color}` : done ? "none" : "1.5px solid rgba(200,150,62,0.15)",
        boxShadow: current ? `0 0 0 4px ${color}1f` : done ? `0 2px 8px ${color}33` : "none",
        opacity: locked ? 0.4 : 1,
      }}
    >
      {done ? (
        <Check className="h-5 w-5 text-white" strokeWidth={3} />
      ) : locked ? (
        <Lock className="h-4 w-4 text-muted" />
      ) : current ? (
        <Play className="h-4 w-4" style={{ color }} fill={`${color}40`} />
      ) : (
        <Star className="h-4 w-4" style={{ color: `${color}99` }} />
      )}
    </motion.div>
  );
  return (
    <div className="flex flex-col items-center gap-1" title={title}>
      {locked ? inner : <Link href={`/lesson?id=${id}`}>{inner}</Link>}
      <span className="max-w-[3.5rem] truncate text-[10px] text-muted">{title}</span>
    </div>
  );
}
