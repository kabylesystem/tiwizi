"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { FennecMascot } from "@/components/fennec";
import { cogSnapshot, loadCog } from "@/lib/cognitive-model";
import { autoCardsFromReply } from "@/lib/auto-cards";
import { IdirText } from "@/components/idir-text";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Azul a naly! 🦊 D nekk Idir, ad k-ɛiwneɣ. (Salut naly ! C'est moi Idir, je vais t'aider.) De quoi veux-tu parler aujourd'hui ?";

const TOPICS = [
  "Me présenter",
  "Dire bonjour & politesses",
  "Ma famille",
  "Au café / commander",
  "Au village",
  "Donner mon avis",
  "Parler politique",
];


const CHAT_KEY = "tiwizi.chat.v1";

function loadChat(): Msg[] {
  if (typeof window === "undefined") return [{ role: "assistant", content: GREETING }];
  try {
    const m = JSON.parse(localStorage.getItem(CHAT_KEY) || "null") as Msg[] | null;
    if (Array.isArray(m) && m.length) return m;
  } catch {}
  return [{ role: "assistant", content: GREETING }];
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  // la conv persistée se charge APRÈS montage (sinon hydration mismatch SSR)
  useEffect(() => {
    const m = loadChat();
    if (m.length > 1) setMessages(m);
  }, []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [autoCards, setAutoCards] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // la conversation SURVIT aux rechargements (+ réplication disque)
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-60)));
      window.dispatchEvent(new Event("tiwizi:dirty"));
    }
  }, [messages]);

  const resetChat = () => {
    localStorage.removeItem(CHAT_KEY);
    setMessages([{ role: "assistant", content: GREETING }]);
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const next = [...messages, { role: "user" as const, content: t }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, cogState: cogSnapshot(loadCog()) }),
      });
      const d = await r.json();
      setMessages((m) => [...m, { role: "assistant", content: d.reply || "…" }]);
      if (d.reply) autoCardsFromReply(d.reply).then((n) => n && setAutoCards((t) => t + n));
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Ulac aqeddic (problème de connexion). Réessaie." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[300px_1fr]">
      {/* rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-3xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.85)] p-6">
          <FennecMascot mood="happy" size={72} />
          <h2 className="mt-3 font-display text-xl font-bold text-ink">Idir</h2>
          <p className="text-sm text-muted">Ton tuteur kabyle. Il te parle, te corrige, te fait produire · sur tes crédits du plan.</p>
          <button onClick={resetChat} className="mt-3 text-xs text-muted underline decoration-dotted underline-offset-4">
            nouvelle conversation
          </button>
          <p className="mt-4 text-[0.7rem] font-bold uppercase tracking-wider text-muted">Sujets</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {autoCards > 0 && (
              <span className="rounded-full border border-[rgba(31,99,176,0.35)] bg-[rgba(31,99,176,0.07)] px-3 py-1.5 text-xs font-bold text-[#1f63b0]">
                🃏 +{autoCards} carte{autoCards > 1 ? "s" : ""} (Dallet)
              </span>
            )}
            {TOPICS.map((t) => (
              <button key={t} onClick={() => send(`Apprends-moi : ${t.toLowerCase()}`)} disabled={busy}
                className="rounded-full border border-line-strong bg-card px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand hover:bg-brand-soft disabled:opacity-50">
                {t}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* chat */}
      <div className="flex min-h-[70vh] flex-col rounded-3xl border border-[rgba(200,150,62,0.18)] bg-[rgba(253,248,240,0.7)]">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "assistant" && <FennecMascot mood="happy" size={36} animated={false} className="mb-1" />}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "rounded-br-sm bg-brand text-white"
                    : "rounded-bl-sm border border-[rgba(200,150,62,0.18)] bg-card text-ink"
                }`}
              >
                <IdirText text={m.content} />
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-end gap-2.5">
              <FennecMascot mood="thinking" size={36} />
              <div className="rounded-2xl rounded-bl-sm border border-[rgba(200,150,62,0.18)] bg-card px-4 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* topic chips (mobile) */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide lg:hidden">
          {TOPICS.slice(0, 5).map((t) => (
            <button key={t} onClick={() => send(`Apprends-moi : ${t.toLowerCase()}`)} disabled={busy}
              className="shrink-0 rounded-full border border-line-strong bg-card px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50">
              {t}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 border-t border-[rgba(200,150,62,0.18)] p-3 sm:p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écris en kabyle ou en français…"
            disabled={busy}
            className="flex-1 rounded-full border border-line-strong bg-card px-4 py-3 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-brand disabled:opacity-60"
          />
          <button type="submit" disabled={busy || !input.trim()}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#C8963E,#A67B2E)" }}>
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
