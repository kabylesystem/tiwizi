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

function pickQuestion() {
  const day = new Date().getDate();
  const cards = myCards();
  const dict = readJson(path.join(DATA, "dict.json"), []);
  const patterns = readJson(path.join(DATA, "patterns.json"), { patterns: [] }).patterns;

  if (day % 3 === 0 && cards.length >= 4) {
    const c = cards[day % cards.length];
    return {
      type: "card",
      q: `🦊 *Question du jour*\n\nQue veut dire « *${c.kab}* » en français ?`,
      answers: toks(c.fr).filter((t) => !FR_STOP.has(t)),
      reveal: `${c.kab} = ${c.fr}`,
      inbox: null,
    };
  }

  if (day % 3 === 1 && patterns.length) {
    const p = patterns[day % patterns.length];
    const line = (p.flood ?? []).filter((l) => l && l.w <= 7)[day % Math.max(1, (p.flood ?? []).filter((l) => l && l.w <= 7).length)];
    if (line) {
      const mask = new RegExp(p.mask, p.maskFlags);
      const m = line.kab.match(mask);
      if (m) {
        const gap = line.kab.replace(mask, "____");
        return {
          type: "cloze",
          q: `🦊 *Question du jour · pattern « ${p.name} »*\n\nComplète :\n« ${gap} »\n_(${line.fr})_`,
          answers: [norm(m[0])],
          reveal: `${line.kab} = ${line.fr}`,
          inbox: null,
        };
      }
    }
  }

  const freq = readJson(path.join(DATA, "vocab-freq.json"), {});
  const have = new Set(cards.map((c) => norm(c.kab)));
  const list = Object.entries(freq)
    .filter(([w]) => w.length >= 3 && /^\p{L}+$/u.test(w))
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);
  for (let i = day % 40; i < list.length; i++) {
    const w = list[i];
    if (have.has(norm(w))) continue;
    const e = dict.find((d) => norm(d.w) === norm(w) || (d.forms ?? []).some((f) => norm(f) === norm(w)));
    if (!e) continue;
    const fr = (e.m?.[0]?.fr ?? []).slice(0, 3).join(" · ");
    if (!fr) continue;
    return {
      type: "word",
      q: `🦊 *Question du jour · nouveau mot*\n\nDevine (ou apprends) : que veut dire « *${e.w}* » ?`,
      answers: toks(fr).filter((t) => !FR_STOP.has(t)),
      reveal: `${e.w} = ${fr} (Dallet)`,
      inbox: { kab: e.w, fr, root: e.root || undefined, source: "Dallet · quiz Telegram" },
    };
  }
  return null;
}

async function sendDaily() {
  const q = pickQuestion();
  if (!q) {
    console.error("aucune question composable");
    process.exit(1);
  }
  await say(q.q + "\n\nRéponds ici, je corrige. ✍️");
  writeJson(QUIZ, { pending: q, askedAt: Date.now() });
  console.log("question envoyée:", q.type);
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
  const state = readJson(QUIZ, null);
  if (!state?.pending) {
    await say("Pas de question en attente · envoie /quiz pour en avoir une. 🦊");
    return;
  }
  const q = state.pending;
  const ok = grade(t, q);
  let msg = ok ? `✅ *Yerbeḥ !* ${q.reveal}` : `❌ Pas tout à fait.\n${q.reveal}`;
  if (q.inbox) {
    const inbox = readJson(INBOX, []);
    if (!inbox.some((c) => norm(c.kab) === norm(q.inbox.kab))) {
      inbox.push(q.inbox);
      writeJson(INBOX, inbox);
    }
    msg += "\n\n🃏 Ajouté dans tes cartes Tiwizi.";
  }
  msg += "\n\nEncore une ? /quiz";
  writeJson(QUIZ, { pending: null, askedAt: state.askedAt, lastGrade: ok });
  await say(msg);
}

async function poll() {
  let offset = readJson(OFFSET, { offset: 0 }).offset;
  for (;;) {
    try {
      const r = await tg("getUpdates", { offset, timeout: 50, allowed_updates: ["message"] });
      for (const u of r.result ?? []) {
        offset = u.update_id + 1;
        writeJson(OFFSET, { offset });
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
