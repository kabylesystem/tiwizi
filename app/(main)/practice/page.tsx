"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Shuffle, Target, BookOpen, ChevronRight, Star, Layers, PenLine } from "lucide-react";
import { kabyleUnits } from "@/lib/data/kabyle-content";
import { dueCards, allCards } from "@/lib/cards";
import { useGameStore } from "@/lib/store/game-store";
import { FennecMascot } from "@/components/fennec";

export default function PracticePage() {
  const store = useGameStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const completedLessons = mounted ? store.completedLessons : [];
  const allLessons = kabyleUnits.flatMap((u) => u.lessons);
  const next = allLessons.find((l) => !completedLessons.includes(l.id)) ?? allLessons[0];
  const doneLessons = allLessons.filter((l) => completedLessons.includes(l.id));
  const reviewId = mounted && doneLessons.length ? doneLessons[Math.floor(Math.random() * doneLessons.length)].id : next.id;
  const randomId = mounted ? allLessons[Math.floor(Math.random() * allLessons.length)].id : next.id;
  const firstPattern = kabyleUnits.find((u) => u.kind === "pattern")?.lessons[0]?.id ?? next.id;

  const nCards = mounted ? allCards().length : 0;
  const nDue = mounted ? dueCards().length : 0;
  const modes = [
    { id: "review", title: "Session du jour", desc: "Réactivation + patterns + production, composée pour toi", icon: RotateCcw, color: "#C8963E", href: "/session", dur: "15 min", xp: 100 },
    { id: "cards", title: "Mes cartes", desc: nCards ? `Ton deck personnel (Dallet) · ${nDue} à revoir` : "Tape un mot n'importe où → « + ma carte »", icon: Layers, color: "#1f63b0", href: "/cards", dur: `${Math.max(1, Math.ceil(nDue / 4))} min`, xp: nDue * 5 },
    { id: "write", title: "Rédaction", desc: "Écris tes phrases : tes patterns + tes cartes, corrigées par Idir", icon: PenLine, color: "#2f7d5b", href: "/write", dur: "libre", xp: 50 },
    { id: "continue", title: "Continuer", desc: "La prochaine leçon du parcours", icon: Target, color: "#5B9A6F", href: `/lesson?id=${next.id}`, dur: "8 min", xp: 30 },
    { id: "pattern", title: "Patterns", desc: "Entraîne les structures de phrase", icon: BookOpen, color: "#4A9ECF", href: `/lesson?id=${firstPattern}`, dur: "6 min", xp: 25 },
    { id: "random", title: "Aléatoire", desc: "Une leçon au hasard", icon: Shuffle, color: "#D4735E", href: `/lesson?id=${randomId}`, dur: "7 min", xp: 25 },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "rgba(200,150,62,0.12)" }}>
          <RotateCcw className="h-6 w-6 text-brand" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Pratiquer</h1>
          <p className="text-sm text-muted"><span className="font-tifinagh text-brand">ⵙⵙⴻⴷ</span> · Ssed · renforce tes acquis</p>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4 rounded-2xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.85)] p-5">
        <FennecMascot mood="encouraging" size={56} />
        <div>
          <p className="font-medium text-ink">Prêt à t&apos;entraîner ?</p>
          <p className="text-sm text-muted">Choisis un mode · chaque session te rapproche de la conversation.</p>
        </div>
      </motion.div>

      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
        <span className="h-6 w-1.5 rounded-full bg-brand" /> Modes
      </h2>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -3 }}>
              <Link href={m.href} className="block h-full rounded-2xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.85)] p-5 shadow-[0_2px_10px_rgba(200,150,62,0.08)]">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${m.color}1a` }}>
                  <Icon className="h-6 w-6" style={{ color: m.color }} />
                </div>
                <h3 className="font-semibold text-ink">{m.title}</h3>
                <p className="text-sm text-muted">{m.desc}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                  <span>{m.dur}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3" style={{ color: m.color }} />{m.xp} XP</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
        <span className="h-6 w-1.5 rounded-full bg-brand" /> Progression par unité
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {kabyleUnits.map((u) => {
          const done = u.lessons.filter((l) => completedLessons.includes(l.id)).length;
          const pct = Math.round((done / u.lessons.length) * 100);
          return (
            <Link key={u.id} href={`/lesson?id=${u.lessons[0].id}`} className="flex items-center gap-3 rounded-2xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.85)] p-4">
              <span className="font-tifinagh grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl" style={{ background: `${u.color}18`, color: u.color }}>{u.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{u.title}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(200,150,62,0.12)]">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: u.color }} />
                </div>
              </div>
              <span className="text-xs font-bold" style={{ color: u.color }}>{pct}%</span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
