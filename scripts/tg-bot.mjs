// @KabyleSystemBot : la question kabyle du jour sur Telegram.
// `send` = compose + envoie une question · `poll` = daemon qui lit les
// réponses, corrige avec tolérance, et pousse le mot en carte Tiwizi.
// Sources 100% humaines (deck de kabylesystem, Dallet, corpus Tatoeba) · zéro LLM.
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
if (!TOKEN || !CHAT) {
  console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID manquants (EnvironmentFile)");
  process.exit(1);
}
const API = `https://api.telegram.org/bot${TOKEN}`;
const DATA = path.join(process.cwd(), "data");
const QUIZ = path.join(DATA, "tg-quiz.json");
const INBOX = path.join(DATA, "tg-inbox.json");
const OFFSET = path.join(DATA, "tg-offset.json");

const readJson = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v));

const FOLD = { ɣ: "g", ɛ: "a", ḥ: "h", ṣ: "s", ṭ: "t", ḍ: "d", ẓ: "z", ṛ: "r", č: "c", ǧ: "g", ž: "j" };
const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ɣɛḥṣṭḍẓṛčǧž]/g, (c) => FOLD[c] ?? c)
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .trim();
const toks = (s) => norm(s).split(/\s+/).filter((t) => t.length >= 3);

const FR_STOP = new Set("les des une aux ces mes tes ses nos vos leur leurs est sont etre avoir fait faire tres pour avec dans sur sous par qui que quoi pas plus tout tous toute toutes".split(" "));

async function tg(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}
const say = (text) => tg("sendMessage", { chat_id: CHAT, text, parse_mode: "Markdown" });

function myCards() {
  const state = readJson(path.join(DATA, "progress.json"), { state: {} }).state ?? {};
  try {
    return Object.values(JSON.parse(state["tiwizi.cards.v1"] || "{}").cards ?? {});
  } catch {
    return [];
  }
}

const shortGloss = (e) => {
  const g = (e.m?.[0]?.fr ?? [])[0] || "";
  return g.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").replace(/[.;]\s*$/, "").trim().slice(0, 50);
};

function pickQuestion() {
  const day = new Date().getDate();
  const cards = myCards();
  const dict = readJson(path.join(DATA, "dict.json"), []);
  const freq = readJson(path.join(DATA, "vocab-freq.json"), {});

  const glossOf = (kab, fallback) => {
    const e = dict.find((d) => norm(d.w) === norm(kab));
    return (e && shortGloss(e)) || fallback;
  };
  const decoys = (excludeKab) => {
    const cand = dict
      .filter((d) => d.w.length >= 3 && d.w.length <= 10 && norm(d.w) !== norm(excludeKab))
      .map((d) => shortGloss(d))
      .filter((g) => g && g.length >= 3 && g.length <= 40);
    const out = [];
    let i = (day * 37) % cand.length;
    while (out.length < 2 && cand.length) {
      const g = cand[i % cand.length];
      if (!out.includes(g)) out.push(g);
      i += 101;
    }
    return out;
  };

  // un jour sur deux : QCM de COMPRÉHENSION sur une vraie phrase du corpus
  // (pas de rédaction, jamais · demande kabylesystem 2026-08-13)
  if (day % 2 === 1) {
    const pairs = readJson(path.join(DATA, "pairs.json"), []).filter((p) => p.w >= 2 && p.w <= 6 && p.fr.length <= 60);
    if (pairs.length > 50) {
      const pick = (i) => pairs[(day * 997 + i * 7919) % pairs.length];
      const target = pick(0);
      const opts = [];
      let i = 1;
      while (opts.length < 2 && i < 50) {
        const d = pick(i++);
        if (d.id !== target.id && d.fr !== target.fr && Math.abs(d.fr.length - target.fr.length) < 25) opts.push(d.fr);
      }
      if (opts.length === 2) {
        const correct = (day * 7) % 3;
        opts.splice(correct, 0, target.fr);
        return {
          kind: "poll",
          question: `🦊 Que veut dire :\n« ${target.kab} »`,
          options: opts,
          correct,
          reveal: `${target.kab} = ${target.fr}`,
          inbox: null,
        };
      }
    }
  }

  let word = null;
  let inbox = null;
  if (day % 4 === 0 && cards.length >= 3) {
    const c = cards[day % cards.length];
    word = { kab: c.kab, fr: glossOf(c.kab, c.fr.split("·")[0].trim().slice(0, 50)) };
  } else {
    const have = new Set(cards.map((c) => norm(c.kab)));
    const list = Object.entries(freq)
      .filter(([w]) => w.length >= 3 && w.length <= 9 && /^\p{L}+$/u.test(w))
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w);
    for (let i = day % 25; i < list.length; i++) {
      const w = list[i];
      if (have.has(norm(w))) continue;
      const e = dict.find((d) => norm(d.w) === norm(w) || (d.forms ?? []).some((f) => norm(f) === norm(w)));
      if (!e) continue;
      const g = shortGloss(e);
      if (!g) continue;
      word = { kab: e.w, fr: g };
      inbox = { kab: e.w, fr: (e.m?.[0]?.fr ?? []).slice(0, 3).join(" · "), root: e.root || undefined, source: "Dallet · quiz Telegram" };
      break;
    }
  }
  if (!word) return null;

  const options = decoys(word.kab);
  const correct = (day * 7) % 3;
  options.splice(correct, 0, word.fr);
  return {
    kind: "poll",
    question: `🦊 Que veut dire « ${word.kab} » ?`,
    options,
    correct,
    reveal: `${word.kab} = ${word.fr}`,
    inbox,
  };
}

async function sendDaily() {
  const q = pickQuestion();
  if (!q) {
    console.error("aucune question composable");
    process.exit(1);
  }
  const r = await tg("sendPoll", {
    chat_id: CHAT,
    question: q.question,
    options: q.options,
    type: "quiz",
    correct_option_id: q.correct,
    is_anonymous: false,
  });
  const pollId = r.result?.poll?.id;
  writeJson(QUIZ, { pending: { ...q, pollId }, askedAt: Date.now() });
  console.log("QCM envoyé:", q.reveal);
}

function grade(reply, q) {
  const r = norm(reply);
  if (!r) return false;
  const rtoks = new Set(toks(reply));
  return q.answers.some((a) => r.includes(a) || rtoks.has(a));
}

async function handleText(text) {
  const t = text.trim();
  if (t === "/quiz" || t === "/start") {
    await sendDaily();
    return;
  }
  await say("Tape sur une réponse du QCM au-dessus, ou /quiz pour une nouvelle question. 🦊");
}

async function handlePollAnswer(pa) {
  const state = readJson(QUIZ, null);
  const q = state?.pending;
  if (!q || pa.poll_id !== q.pollId) return;
  const ok = (pa.option_ids ?? [])[0] === q.correct;
  let msg = ok ? `✅ *Yerbeḥ !* ${q.reveal}` : `Ulac aɣilif · ${q.reveal} · elle reviendra.`;
  if (q.inbox) {
    const inbox = readJson(INBOX, []);
    if (!inbox.some((c) => norm(c.kab) === norm(q.inbox.kab))) {
      inbox.push(q.inbox);
      writeJson(INBOX, inbox);
    }
    msg += "\n🃏 Ajoutée dans tes cartes Tiwizi.";
  }
  msg += "\nEncore une ? /quiz";
  writeJson(QUIZ, { pending: null, askedAt: state.askedAt, lastGrade: ok });
  await say(msg);
}

async function poll() {
  let offset = readJson(OFFSET, { offset: 0 }).offset;
  for (;;) {
    try {
      const r = await tg("getUpdates", { offset, timeout: 50, allowed_updates: ["message", "poll_answer"] });
      for (const u of r.result ?? []) {
        offset = u.update_id + 1;
        writeJson(OFFSET, { offset });
        if (u.poll_answer && String(u.poll_answer.user?.id) === String(CHAT)) {
          await handlePollAnswer(u.poll_answer);
          continue;
        }
        const m = u.message;
        if (!m?.text || String(m.chat?.id) !== String(CHAT)) continue;
        await handleText(m.text);
      }
    } catch (e) {
      console.error("poll:", e.message);
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
}

const mode = process.argv[2];
if (mode === "send") await sendDaily();
else if (mode === "poll") await poll();
else {
  console.error("usage: tg-bot.mjs send|poll");
  process.exit(1);
}
