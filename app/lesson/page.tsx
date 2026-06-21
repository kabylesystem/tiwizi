"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Heart, Check, X, ArrowRight, RotateCcw, Star, Volume2, Shuffle, Sparkles } from "lucide-react";
import { kabyleUnits, type Lesson, type Question, type Unit } from "@/lib/data/kabyle-content";
import { useGameStore } from "@/lib/store/game-store";
import { useSound } from "@/lib/sound-engine";
import { AudioButton } from "@/components/audio-button";
import { FennecMascot } from "@/components/fennec";
import { IdirHelp } from "@/components/idir-help";
import { cn } from "@/lib/utils";

function findLesson(id: string | null): { unit: Unit; lesson: Lesson } | null {
  if (!id) return null;
  for (const u of kabyleUnits) {
    const l = u.lessons.find((x) => x.id === id);
    if (l) return { unit: u, lesson: l };
  }
  return null;
}

const CREAM = { background: "linear-gradient(180deg,#FDF8F0 0%,#F5E6C8 100%)" };
const GOLD_BTN = { background: "linear-gradient(135deg,#C8963E,#A67B2E)", boxShadow: "0 8px 22px rgba(200,150,62,0.32)" };

function LessonInner() {
  const router = useRouter();
  const params = useSearchParams();
  const found = useMemo(() => findLesson(params.get("id")), [params]);
  const store = useGameStore();
  const { play } = useSound();

  const cards = found?.lesson.cards ?? [];
  const questions = found?.lesson.questions ?? [];

  const [phase, setPhase] = useState<"start" | "intro" | "quiz" | "done" | "over">("start");
  const [introIdx, setIntroIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [lives, setLives] = useState(5);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);

  if (!found) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={CREAM}>
        <div className="text-center">
          <FennecMascot mood="thinking" size={80} />
          <p className="mt-4 text-muted">Leçon introuvable.</p>
          <button onClick={() => router.push("/")} className="mt-4 rounded-xl px-6 py-3 font-semibold text-white" style={GOLD_BTN}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  const { unit, lesson } = found;

  return (
    <div className="flex min-h-screen flex-col" style={CREAM}>
      <Header
        onHome={() => router.push("/")}
        lives={lives}
        label={phase === "start" ? "Prêt ?" : phase === "intro" ? "Les mots" : `${qIdx + 1}/${questions.length}`}
        progress={
          phase === "start"
            ? 0
            : phase === "intro"
            ? (introIdx / Math.max(1, cards.length)) * 100
            : (qIdx / Math.max(1, questions.length)) * 100
        }
        color={unit.color}
      />

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-3xl">
          {phase === "start" && (
            <StartCard
              unit={unit}
              lesson={lesson}
              cardsCount={cards.length}
              questions={questions}
              onStart={() => setPhase(cards.length ? "intro" : "quiz")}
            />
          )}

          {phase === "intro" && (
            <IntroCard
              key={introIdx}
              explain={introIdx === 0 ? lesson.explain : undefined}
              card={cards[introIdx]}
              index={introIdx}
              total={cards.length}
              color={unit.color}
              onNext={() => {
                play("tap");
                if (introIdx < cards.length - 1) setIntroIdx((i) => i + 1);
                else setPhase("quiz");
              }}
            />
          )}

          {phase === "quiz" && (
            <QuizCard
              key={qIdx}
              q={questions[qIdx]}
              color={unit.color}
              onResult={(ok) => {
                if (ok) {
                  play("correct");
                  setScore((s) => s + 10);
                  setCorrect((c) => c + 1);
                } else {
                  play("wrong");
                  setLives((l) => {
                    const n = l - 1;
                    if (n <= 0) setTimeout(() => setPhase("over"), 600);
                    return n;
                  });
                }
              }}
              onNext={() => {
                if (qIdx < questions.length - 1) setQIdx((i) => i + 1);
                else {
                  play("complete");
                  store.completeLesson(lesson.id);
                  store.addXP(score + lesson.xpReward);
                  store.addGems(5);
                  store.incrementStreak();
                  store.refillHearts();
                  store.recordLessonOutcome({
                    lessonId: lesson.id,
                    unitId: unit.id,
                    accuracy: questions.length ? correct / questions.length : 1,
                    dominantErrorType: null,
                    averageResponseMs: 0,
                    lessonKeywords: [],
                  });
                  setPhase("done");
                }
              }}
            />
          )}

          {phase === "done" && (
            <CompleteCard score={score + lesson.xpReward} correct={correct} total={questions.length} onHome={() => router.push("/")} />
          )}

          {phase === "over" && (
            <GameOverCard
              onRetry={() => {
                setPhase(cards.length ? "intro" : "quiz");
                setIntroIdx(0);
                setQIdx(0);
                setLives(5);
                setScore(0);
                setCorrect(0);
              }}
              onHome={() => router.push("/")}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function Header({ onHome, lives, label, progress, color }: { onHome: () => void; lives: number; label: string; progress: number; color: string }) {
  return (
    <header className="sticky top-0 z-30 px-4 py-4 sm:px-6" style={{ background: "rgba(253,248,240,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(200,150,62,0.2)" }}>
      <div className="mx-auto flex max-w-3xl items-center gap-4">
        <button onClick={onHome} className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "rgba(200,150,62,0.15)" }}>
          <Home className="h-5 w-5 text-muted" />
        </button>
        <div className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(200,150,62,0.15)" }}>
            <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120 }} />
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart key={i} className="h-5 w-5" style={{ color: i < lives ? "#D4735E" : "rgba(139,115,85,0.2)", fill: i < lives ? "#D4735E" : "transparent" }} />
          ))}
        </div>
      </div>
    </header>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl p-6 sm:p-8", className)} style={{ background: "rgba(249,238,216,0.95)", border: "2px solid rgba(200,150,62,0.2)", boxShadow: "0 20px 60px rgba(200,150,62,0.15)" }}>
      {children}
    </div>
  );
}

const FMT_LABEL: Record<string, string> = {
  match: "associations",
  "multiple-choice": "QCM",
  "mc-kab": "QCM inversé",
  listening: "écoute",
  fill: "texte à trou",
  "order-words": "reconstruction",
};

function StartCard({
  unit,
  lesson,
  cardsCount,
  questions,
  onStart,
}: {
  unit: Unit;
  lesson: Lesson;
  cardsCount: number;
  questions: Question[];
  onStart: () => void;
}) {
  const fmts = [...new Set(questions.map((q) => q.type))].map((t) => FMT_LABEL[t]).filter(Boolean);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Panel className="text-center">
        <FennecMascot mood="happy" size={92} />
        {unit.tifinagh && <p className="font-tifinagh mt-2 text-lg" style={{ color: unit.color }}>{unit.tifinagh}</p>}
        <h2 className="mt-1 font-display text-3xl text-ink">Azul a naly !</h2>
        <p className="mt-2 text-muted">
          Idir : <span className="kab">Ad nelmed iḍ-a.</span> (On apprend aujourd&apos;hui.)
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: unit.color }}>
          {unit.title} · {lesson.title}
        </p>

        <div className="mt-6 space-y-3 rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.55)" }}>
          <p className="text-sm font-semibold text-ink">Dans cette leçon, tu vas :</p>
          <Row icon={<Volume2 className="h-4 w-4" style={{ color: unit.color }} />}>
            découvrir <b>{cardsCount} mots</b> {cardsCount ? "(avec audio de voix natives)" : "directement en exercice"}
          </Row>
          <Row icon={<Shuffle className="h-4 w-4" style={{ color: unit.color }} />}>
            t&apos;entraîner avec <b>{fmts.length} types d&apos;exercices</b> : {fmts.join(", ")}
          </Row>
          <Row icon={<Sparkles className="h-4 w-4" style={{ color: unit.color }} />}>
            <b>Idir</b> t&apos;explique chaque mot et t&apos;aide quand tu bloques
          </Row>
        </div>

        <button onClick={onStart} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white" style={GOLD_BTN}>
          C&apos;est parti ! <ArrowRight className="h-5 w-5" />
        </button>
      </Panel>
    </motion.div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-ink">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: "rgba(200,150,62,0.12)" }}>{icon}</span>
      <span className="flex-1 leading-relaxed">{children}</span>
    </div>
  );
}

function IntroCard({ explain, card, index, total, color, onNext }: { explain?: string; card: { kab: string; tifinagh: string; fr: string; ex: { kab: string; fr: string; audioId: number | null } | null }; index: number; total: number; color: string; onNext: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Panel>
        {explain && (
          <div className="mb-6 rounded-2xl p-4 text-sm leading-relaxed" style={{ background: "rgba(74,158,207,0.1)", border: "1px solid rgba(74,158,207,0.25)", color: "#2A1F14" }}>
            {explain}
          </div>
        )}
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-muted">
          Nouvelle pièce · {index + 1}/{total}
        </p>
        <div className="grid items-center gap-6 sm:grid-cols-[1.1fr_1fr]">
          <div className="text-center sm:text-left">
            {card.tifinagh && <p className="font-tifinagh text-2xl" style={{ color }}>{card.tifinagh}</p>}
            <h2 className="kab mt-1 text-4xl font-bold text-ink sm:text-5xl">{card.kab}</h2>
            <p className="mt-2 text-lg text-muted">{card.fr}</p>
            {card.ex?.audioId && (
              <div className="mt-4 flex justify-center sm:justify-start">
                <AudioButton id={card.ex.audioId} size="lg" autoPlay />
              </div>
            )}
            <IdirHelp ask={`Explique en 2 phrases simples le mot ou la phrase kabyle "${card.kab}" (${card.fr}) et donne une petite astuce pour le retenir.`} />
          </div>
          {card.ex && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.6)" }}>
              <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted">Exemple</p>
              <p className="kab text-lg text-ink">{card.ex.kab}</p>
              <p className="mt-1 text-sm text-muted">{card.ex.fr}</p>
            </div>
          )}
        </div>
        <button onClick={onNext} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white" style={GOLD_BTN}>
          {index < total - 1 ? "Pièce suivante" : "Passer aux exercices"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </Panel>
    </motion.div>
  );
}

function QuizCard({ q, color, onResult, onNext }: { q: Question; color: string; onResult: (ok: boolean) => void; onNext: () => void }) {
  if (q.type === "order-words") return <OrderWords q={q} color={color} onResult={onResult} onNext={onNext} />;
  if (q.type === "match") return <MatchPairs q={q} color={color} onResult={onResult} onNext={onNext} />;
  return <ChoiceQuestion q={q} color={color} onResult={onResult} onNext={onNext} />;
}

const HEADERS: Record<string, string> = {
  "multiple-choice": "Choisis la traduction",
  "mc-kab": "Choisis le mot kabyle",
  listening: "Écoute",
  fill: "Complète la phrase",
};

function ChoiceQuestion({ q, color, onResult, onNext }: { q: Question; color: string; onResult: (ok: boolean) => void; onNext: () => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const correctIdx = q.correctAnswer as number;
  const optionsAreKab = q.type === "mc-kab" || q.type === "fill";

  const answer = (i: number) => {
    if (shown) return;
    setSel(i);
    setShown(true);
    onResult(i === correctIdx);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}>
      <Panel>
        <div className="mb-7 text-center">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
            {HEADERS[q.type] || "Choisis"}
          </span>
          {q.type === "listening" ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              {q.audioId && <AudioButton id={q.audioId} size="lg" autoPlay />}
              <p className="text-sm text-muted">Qu&apos;entends-tu ?</p>
            </div>
          ) : q.type === "mc-kab" ? (
            <h2 className="mt-3 text-balance text-3xl font-bold text-brand-deep sm:text-4xl">{q.prompt}</h2>
          ) : q.type === "fill" ? (
            <div className="mt-3 flex flex-col items-center gap-3">
              <h2 className="kab text-balance text-2xl font-bold text-ink sm:text-3xl">{q.prompt}</h2>
              {q.fr && <p className="text-sm text-muted">({q.fr})</p>}
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center gap-3">
              <h2 className="kab text-balance text-3xl font-bold text-ink sm:text-4xl">{q.latin}</h2>
              {q.audioId && <AudioButton id={q.audioId} size="md" />}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {q.options?.map((opt, i) => {
            const isRight = shown && i === correctIdx;
            const isWrong = shown && sel === i && i !== correctIdx;
            return (
              <motion.button
                key={i}
                whileHover={!shown ? { scale: 1.02 } : {}}
                whileTap={!shown ? { scale: 0.98 } : {}}
                onClick={() => answer(i)}
                disabled={shown}
                className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left text-base font-semibold transition-colors ${optionsAreKab ? "kab text-lg" : ""}`}
                style={{
                  borderColor: isRight ? "#5B9A6F" : isWrong ? "#D4735E" : "rgba(200,150,62,0.2)",
                  background: isRight ? "rgba(91,154,111,0.12)" : isWrong ? "rgba(212,115,94,0.12)" : "rgba(255,255,255,0.6)",
                  color: isRight ? "#5B9A6F" : isWrong ? "#D4735E" : "#2A1F14",
                }}
              >
                {opt}
                {isRight && <Check className="h-5 w-5 shrink-0" />}
                {isWrong && <X className="h-5 w-5 shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        <Feedback
          shown={shown}
          ok={sel === correctIdx}
          answer={q.options?.[correctIdx]}
          helpAsk={`Explique simplement, en 1-2 phrases, le mot/la phrase kabyle "${q.latin || q.options?.[correctIdx]}".`}
          onNext={onNext}
        />
      </Panel>
    </motion.div>
  );
}

function MatchPairs({ q, color, onResult, onNext }: { q: Question; color: string; onResult: (ok: boolean) => void; onNext: () => void }) {
  const pairs = q.pairs || [];
  const leftCol = useMemo(() => pairs.map((p, i) => ({ ...p, i })), [pairs]);
  const rightCol = useMemo(() => [...pairs.map((p, i) => ({ ...p, i }))].sort(() => Math.random() - 0.5), [pairs]);
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [selRight, setSelRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const tryMatch = (l: number | null, r: number | null) => {
    if (l == null || r == null) return;
    if (l === r) {
      const m = new Set(matched);
      m.add(l);
      setMatched(m);
      setSelLeft(null);
      setSelRight(null);
      if (m.size === pairs.length) {
        onResult(mistakes === 0);
      }
    } else {
      setWrong(r);
      setMistakes((x) => x + 1);
      setTimeout(() => { setWrong(null); setSelLeft(null); setSelRight(null); }, 600);
    }
  };

  const done = matched.size === pairs.length;

  return (
    <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}>
      <Panel>
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-wider" style={{ color }}>{q.prompt}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2.5">
            {leftCol.map((p) => {
              const on = selLeft === p.i;
              const ok = matched.has(p.i);
              return (
                <button key={p.i} disabled={ok}
                  onClick={() => { setSelLeft(p.i); tryMatch(p.i, selRight); }}
                  className="kab w-full rounded-2xl border-2 p-3 text-center text-lg font-semibold transition-all"
                  style={{ borderColor: ok ? "#5B9A6F" : on ? color : "rgba(200,150,62,0.2)", background: ok ? "rgba(91,154,111,0.12)" : on ? `${color}1a` : "rgba(255,255,255,0.6)", color: ok ? "#5B9A6F" : "#2A1F14", opacity: ok ? 0.6 : 1 }}>
                  {p.kab}
                </button>
              );
            })}
          </div>
          <div className="space-y-2.5">
            {rightCol.map((p) => {
              const on = selRight === p.i;
              const ok = matched.has(p.i);
              const bad = wrong === p.i;
              return (
                <button key={p.i} disabled={ok}
                  onClick={() => { setSelRight(p.i); tryMatch(selLeft, p.i); }}
                  className="w-full rounded-2xl border-2 p-3 text-center text-sm font-semibold transition-all"
                  style={{ borderColor: ok ? "#5B9A6F" : bad ? "#D4735E" : on ? color : "rgba(200,150,62,0.2)", background: ok ? "rgba(91,154,111,0.12)" : bad ? "rgba(212,115,94,0.12)" : on ? `${color}1a` : "rgba(255,255,255,0.6)", color: ok ? "#5B9A6F" : bad ? "#D4735E" : "#2A1F14", opacity: ok ? 0.6 : 1 }}>
                  {p.fr}
                </button>
              );
            })}
          </div>
        </div>
        {done && (
          <button onClick={onNext} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white" style={GOLD_BTN}>
            Continuer <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </Panel>
    </motion.div>
  );
}

function OrderWords({ q, color, onResult, onNext }: { q: Question; color: string; onResult: (ok: boolean) => void; onNext: () => void }) {
  const target = (q.latin || (q.correctAnswer as string)).trim();
  const toks = useMemo(() => target.split(/\s+/).map((tok, i) => ({ tok, i })), [target]);
  const bankInit = useMemo(() => [...toks].sort(() => Math.random() - 0.5), [toks]);
  const [bank, setBank] = useState(bankInit);
  const [built, setBuilt] = useState<{ tok: string; i: number }[]>([]);
  const [shown, setShown] = useState(false);
  const [ok, setOk] = useState(false);

  const check = () => {
    const good = built.map((b) => b.tok).join(" ") === target;
    setOk(good);
    setShown(true);
    onResult(good);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}>
      <Panel>
        <div className="mb-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Reconstitue la phrase</span>
          <p className="mt-3 text-balance text-xl font-semibold text-brand-deep sm:text-2xl">{q.prompt}</p>
        </div>

        <div className="mb-4 min-h-[3.5rem] rounded-2xl border-2 border-dashed p-3" style={{ borderColor: "rgba(200,150,62,0.25)", background: "rgba(255,255,255,0.5)" }}>
          <div className="flex flex-wrap gap-2">
            {built.map((it) => (
              <button key={it.i} disabled={shown} onClick={() => { setBuilt((b) => b.filter((x) => x.i !== it.i)); setBank((b) => [...b, it]); }}
                className="kab rounded-xl border-2 px-3 py-1.5 text-lg"
                style={{ borderColor: shown ? (ok ? "#5B9A6F" : "#D4735E") : "rgba(200,150,62,0.3)", background: "rgba(255,255,255,0.8)", color: "#2A1F14" }}>
                {it.tok}
              </button>
            ))}
            {!built.length && <span className="px-1 py-1.5 text-sm text-muted">Touche les mots dans le bon ordre…</span>}
          </div>
        </div>

        {!shown && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {bank.map((it) => (
              <motion.button key={it.i} whileTap={{ scale: 0.94 }} onClick={() => { setBuilt((b) => [...b, it]); setBank((b) => b.filter((x) => x.i !== it.i)); }}
                className="kab rounded-xl border-2 px-3 py-1.5 text-lg" style={{ borderColor: "rgba(200,150,62,0.2)", background: "rgba(255,255,255,0.75)", color: "#2A1F14" }}>
                {it.tok}
              </motion.button>
            ))}
          </div>
        )}

        {!shown ? (
          <button onClick={check} disabled={built.length !== toks.length} className="w-full rounded-2xl py-4 text-lg font-bold text-white disabled:opacity-40" style={GOLD_BTN}>
            Vérifier
          </button>
        ) : (
          <Feedback shown ok={ok} answer={target} helpAsk={`Explique brièvement la structure de la phrase kabyle "${target}" qui veut dire "${q.prompt}".`} onNext={onNext} />
        )}
      </Panel>
    </motion.div>
  );
}

function Feedback({ shown, ok, answer, onNext, helpAsk }: { shown: boolean; ok: boolean; answer?: string; onNext: () => void; helpAsk?: string }) {
  if (!shown) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mt-6 rounded-2xl p-4 text-center" style={{ background: ok ? "rgba(91,154,111,0.12)" : "rgba(212,115,94,0.12)", border: `2px solid ${ok ? "rgba(91,154,111,0.3)" : "rgba(212,115,94,0.3)"}` }}>
          <p className="text-lg font-bold" style={{ color: ok ? "#5B9A6F" : "#D4735E" }}>
            {ok ? "Yelha! (Excellent !)" : "Ur yelhi ara (pas exact)"}
          </p>
          {!ok && answer && <p className="kab mt-1 text-ink">{answer}</p>}
          {!ok && helpAsk && (
            <div className="mt-2 flex justify-center">
              <IdirHelp ask={helpAsk} label="Pourquoi ? Demande à Idir" />
            </div>
          )}
        </div>
        <button onClick={onNext} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white" style={GOLD_BTN}>
          Continuer <ArrowRight className="h-5 w-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function CompleteCard({ score, correct, total, onHome }: { score: number; correct: number; total: number; onHome: () => void }) {
  return (
    <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
      <Panel className="text-center">
        <FennecMascot mood="excited" size={96} />
        <h2 className="mt-3 font-display text-3xl font-bold text-ink">Ifukk! ☀</h2>
        <p className="font-tifinagh mt-1 text-xl text-brand">ⵉⴼⵓⴽⴽ</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat n={`+${score}`} l="XP" c="#C8963E" />
          <Stat n={`${correct}/${total}`} l="Bonnes" c="#5B9A6F" />
          <Stat n="+5" l="Gemmes" c="#4A9ECF" />
        </div>
        <button onClick={onHome} className="mt-7 w-full rounded-2xl py-4 text-lg font-bold text-white" style={GOLD_BTN}>
          Continuer le parcours
        </button>
      </Panel>
    </motion.div>
  );
}

function Stat({ n, l, c }: { n: string; l: string; c: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: `${c}1a`, border: `1px solid ${c}33` }}>
      <Star className="mx-auto mb-1 h-5 w-5" style={{ color: c }} />
      <p className="font-display text-lg font-bold" style={{ color: c }}>{n}</p>
      <p className="text-xs text-muted">{l}</p>
    </div>
  );
}

function GameOverCard({ onRetry, onHome }: { onRetry: () => void; onHome: () => void }) {
  return (
    <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <Panel className="text-center">
        <FennecMascot mood="sad" size={88} />
        <h2 className="mt-3 font-display text-2xl font-bold" style={{ color: "#D4735E" }}>Plus de cœurs !</h2>
        <p className="mt-2 text-sm text-muted">Pas grave — recommence, c&apos;est comme ça qu&apos;on apprend.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onHome} className="flex-1 rounded-2xl py-3 font-semibold" style={{ background: "rgba(200,150,62,0.15)", color: "#8B7355" }}>
            Retour
          </button>
          <button onClick={onRetry} className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white" style={GOLD_BTN}>
            <RotateCcw className="h-4 w-4" /> Réessayer
          </button>
        </div>
      </Panel>
    </motion.div>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={CREAM} />}>
      <LessonInner />
    </Suspense>
  );
}
