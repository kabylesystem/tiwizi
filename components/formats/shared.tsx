"use client";

import { motion } from "framer-motion";
import type { Grade } from "@/lib/srs";

export const CREAM = { background: "linear-gradient(180deg,#FDF8F0 0%,#F5E6C8 100%)" };
export const GOLD_BTN = {
  background: "linear-gradient(135deg,#C8963E,#A67B2E)",
  boxShadow: "0 8px 22px rgba(200,150,62,0.32)",
};

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className={`rounded-3xl p-6 sm:p-8 ${className}`}
        style={{
          background: "rgba(249,238,216,0.95)",
          border: "2px solid rgba(200,150,62,0.2)",
          boxShadow: "0 20px 60px rgba(200,150,62,0.15)",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

export function GoldButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white disabled:opacity-40"
      style={GOLD_BTN}
    >
      {children}
    </button>
  );
}

export function FmtTag({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-5 text-center">
      <span className="rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest" style={{ background: "rgba(200,150,62,0.14)", color: "#A67B2E" }}>
        {label}
      </span>
      {sub && <p className="mt-3 text-sm text-muted">{sub}</p>}
    </div>
  );
}

/** Anki-style honest self-assessment — feeds the channel's spacing. */
export function SelfGrade({ onGrade, prompt = "Tu l'avais ?" }: { onGrade: (g: Grade) => void; prompt?: string }) {
  const opts: { g: Grade; label: string; c: string }[] = [
    { g: 0, label: "Perdu", c: "#D4735E" },
    { g: 1, label: "Difficile", c: "#C8963E" },
    { g: 2, label: "Bien", c: "#5B9A6F" },
    { g: 3, label: "Facile", c: "#4A9ECF" },
  ];
  return (
    <div className="mt-6">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted">{prompt}</p>
      <div className="grid grid-cols-4 gap-2">
        {opts.map((o) => (
          <button
            key={o.g}
            onClick={() => onGrade(o.g)}
            className="rounded-xl border-2 py-3 text-sm font-bold transition-transform active:scale-95"
            style={{ borderColor: `${o.c}55`, background: `${o.c}14`, color: o.c }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
