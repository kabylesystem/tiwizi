"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Flame, Gem, Award, Volume2, Bell, Rabbit, TrendingUp } from "lucide-react";
import { useGameStore } from "@/lib/store/game-store";
import { kabyleUnits } from "@/lib/data/kabyle-content";
import { useSound } from "@/lib/sound-engine";
import { FennecMascot } from "@/components/fennec";

export default function ProfilePage() {
  const { user, completedLessons, updateUserSettings } = useGameStore();
  const { setMuted } = useSound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMuted(!user.settings.soundEnabled), [user.settings.soundEnabled, setMuted]);

  const totalLessons = kabyleUnits.reduce((a, u) => a + u.lessons.length, 0);
  const done = mounted ? completedLessons.length : 0;
  const streak = mounted ? user.streak : 0;

  const stats = [
    { label: "XP total", value: mounted ? user.xp + (user.level - 1) * 500 : 0, icon: Star, color: "#C8963E" },
    { label: "Série", value: mounted ? `${user.streak} j` : "0 j", icon: Flame, color: "#D4735E" },
    { label: "Gemmes", value: mounted ? user.gems : 0, icon: Gem, color: "#4A9ECF" },
    { label: "Niveau", value: mounted ? user.level : 1, icon: Award, color: "#A67B2E" },
  ];

  const achievements = [
    { name: "Pionnier", icon: "ⵣ", desc: "Terminer 1 leçon", color: "#C8963E", on: done >= 1 },
    { name: "En route", icon: "ⵜ", desc: "5 leçons", color: "#5B9A6F", on: done >= 5 },
    { name: "Bâtisseur", icon: "ⴰ", desc: "10 leçons", color: "#A67B2E", on: done >= 10 },
    { name: "Régulier", icon: "ⵎ", desc: "Série de 3 jours", color: "#D4735E", on: streak >= 3 },
    { name: "Assidu", icon: "ⵉ", desc: "Série de 7 jours", color: "#4A9ECF", on: streak >= 7 },
    { name: "Tamurt", icon: "ⵍ", desc: "Finir le parcours", color: "#C8963E", on: done >= totalLessons },
  ];

  const settings = [
    { key: "soundEnabled" as const, label: "Sons", hint: "Retour audio des exercices", icon: Volume2, active: user.settings.soundEnabled },
    { key: "remindersEnabled" as const, label: "Rappels quotidiens", hint: "Notifications de révision", icon: Bell, active: user.settings.remindersEnabled },
    { key: "reducedMotion" as const, label: "Animations réduites", hint: "Transitions plus douces", icon: Rabbit, active: user.settings.reducedMotion },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* hero */}
      <section className="mb-8 rounded-3xl p-6 text-white sm:p-8" style={{ background: "linear-gradient(135deg,#C8963E,#A67B2E 55%,#D4735E)", boxShadow: "0 8px 24px rgba(200,150,62,0.3)" }}>
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.3)" }}>
            <FennecMascot mood="happy" size={60} animated={false} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{mounted ? user.name : "…"}</h1>
            <p className="text-white/80">{done}/{totalLessons} leçons · {Math.round((done / totalLessons) * 100)}% du parcours</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.15)" }}>
                <div className="mb-1 flex items-center gap-2"><Icon className="h-4 w-4" /><span className="text-sm text-white/70">{s.label}</span></div>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* level progress */}
      <section className="mb-8 rounded-2xl border border-[rgba(200,150,62,0.2)] bg-[rgba(253,248,240,0.85)] p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink">Vers le niveau {mounted ? user.level + 1 : 2}</h3>
            <p className="text-sm text-muted">{mounted ? user.xp : 0} / {mounted ? user.xpToNextLevel : 500} XP</p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full" style={{ background: "linear-gradient(135deg,#C8963E,#D4A84E)" }}>
            <Award className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[rgba(200,150,62,0.15)]">
          <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#C8963E,#D4A84E)" }} animate={{ width: `${mounted ? (user.xp / user.xpToNextLevel) * 100 : 0}%` }} />
        </div>
      </section>

      {/* achievements */}
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink"><TrendingUp className="h-5 w-5 text-brand" /> Succès</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {achievements.map((b, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: b.on ? "rgba(253,248,240,0.9)" : "rgba(253,248,240,0.45)", border: `1.5px solid ${b.on ? `${b.color}30` : "rgba(200,150,62,0.1)"}`, opacity: b.on ? 1 : 0.6 }}>
            <div className="font-tifinagh pointer-events-none absolute -right-1 -top-2 select-none" style={{ fontSize: 64, color: b.color, opacity: b.on ? 0.15 : 0.06 }}>{b.icon}</div>
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl font-tifinagh text-2xl" style={{ background: b.on ? `linear-gradient(135deg,${b.color},${b.color}cc)` : "rgba(180,160,130,0.2)", color: b.on ? "#FDF8F0" : "#A09080" }}>{b.icon}</div>
            <p className="text-sm font-semibold" style={{ color: b.on ? "#2A1F14" : "#8B7355" }}>{b.name}</p>
            <p className="text-xs text-muted">{b.desc}</p>
            {b.on && <span className="mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${b.color}20`, color: b.color }}>Débloqué !</span>}
          </motion.div>
        ))}
      </div>

      {/* settings */}
      <h2 className="mb-4 font-display text-lg font-bold text-ink">Réglages</h2>
      <div className="space-y-3 rounded-2xl border border-[rgba(91,154,111,0.22)] bg-[rgba(253,248,240,0.85)] p-4 sm:p-5">
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => updateUserSettings({ [item.key]: !item.active })}
              className="flex w-full items-center justify-between rounded-xl p-3"
              style={{ background: item.active ? "rgba(91,154,111,0.1)" : "rgba(249,238,216,0.6)", border: `1px solid ${item.active ? "rgba(91,154,111,0.35)" : "rgba(200,150,62,0.16)"}` }}>
              <span className="flex items-center gap-3 text-left">
                <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: item.active ? "rgba(91,154,111,0.16)" : "rgba(200,150,62,0.1)" }}>
                  <Icon className="h-4 w-4" style={{ color: item.active ? "#5B9A6F" : "#8B7355" }} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{item.label}</span>
                  <span className="block text-xs text-muted">{item.hint}</span>
                </span>
              </span>
              <span className="relative h-6 w-11 rounded-full transition-all" style={{ background: item.active ? "#5B9A6F" : "rgba(139,115,85,0.3)" }}>
                <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: item.active ? 22 : 2 }} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
