import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

// le PATH du service systemd peut perdre ~/.local/bin (reboot du 16/07) →
// chemin ABSOLU d'abord, jamais de spawn silencieusement mort
const CLAUDE_BIN = [
  `${homedir()}/.local/bin/claude`,
  "/usr/local/bin/claude",
  "/usr/bin/claude",
].find((p) => existsSync(p)) ?? "claude";

/**
 * Pool de processus `claude` PRÉ-CHAUFFÉS (crédits du plan, pas l'API).
 * Le boot du CLI coûte ~10-13 s : on le paie en avance, en fond. À la
 * requête suivante, il ne reste que la génération (~3-5 s mesurés).
 * Un processus = UNE réponse (session jetée ensuite : zéro pollution de
 * contexte), puis un nouveau spare se met à chauffer.
 */
const COMMON_SYSTEM =
  "Tu es Idir, tuteur de kabyle de naly. Le message utilisateur commence par TES CONSIGNES DE RÔLE puis contient la tâche : suis ces consignes strictement.";

type Spare = { child: ChildProcessWithoutNullStreams; killer: NodeJS.Timeout };
const POOL_SIZE = 2;
const spares: Record<string, Spare[]> = { sonnet: [], haiku: [] };

function spawnClaude(model: string): ChildProcessWithoutNullStreams {
  // systemd-run --scope : le process vit HORS du cgroup plafonné du service
  const child = spawn(
    "systemd-run",
    [
      "--user", "--scope", "--quiet", "--",
      CLAUDE_BIN,
      "--input-format", "stream-json",
      "--output-format", "stream-json",
      "--model", model,
      "--max-turns", "1",
      "--include-partial-messages",
      "--verbose",
      "--append-system-prompt", COMMON_SYSTEM,
    ],
    { stdio: ["pipe", "pipe", "pipe"] }
  );
  child.stderr.on("data", () => {});
  return child;
}

function warmNext(model: string) {
  const list = spares[model] ?? (spares[model] = []);
  if (list.length >= POOL_SIZE) return;
  const child = spawnClaude(model);
  const killer = setTimeout(() => {
    const i = list.findIndex((s) => s.child === child);
    if (i >= 0) {
      list.splice(i, 1);
      child.kill();
    }
  }, 15 * 60_000);
  list.push({ child, killer });
}

function takeChild(model: string): ChildProcessWithoutNullStreams {
  const list = spares[model] ?? (spares[model] = []);
  let child: ChildProcessWithoutNullStreams | null = null;
  while (list.length) {
    const s = list.shift()!;
    clearTimeout(s.killer);
    if (s.child.exitCode === null) {
      child = s.child;
      break;
    }
  }
  if (!child) child = spawnClaude(model); // départ à froid
  setTimeout(() => {
    warmNext(model);
    warmNext(model);
  }, 50);
  return child;
}

/** Comme askClaude, mais pousse le texte AU FIL DE L'EAU via onDelta. */
export function askClaudeStream(
  prompt: string,
  model: "sonnet" | "haiku",
  onDelta: (t: string) => void,
  timeoutMs = 110_000
): Promise<string> {
  const child = takeChild(model);
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(to);
      child.kill();
      fn();
    };
    const to = setTimeout(() => done(() => reject(new Error("tutor timeout"))), timeoutMs);
    let buf = "";
    child.stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString();
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        try {
          const d = JSON.parse(line);
          const delta = d?.event?.delta;
          if (d.type === "stream_event" && delta?.type === "text_delta" && typeof delta.text === "string")
            onDelta(delta.text);
          if (d.type === "result") {
            done(() =>
              d.is_error
                ? reject(new Error(String(d.result || "tutor_failed")))
                : resolve(String(d.result ?? "").trim())
            );
            return;
          }
        } catch {}
      }
    });
    child.on("error", (e) => done(() => reject(new Error("spawn claude: " + e.message))));
    child.on("exit", () => done(() => reject(new Error("claude exited early"))));
    child.stdin.write(
      JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: prompt }] } }) + "\n"
    );
  });
}

/** Pré-chauffe les deux pools (appelé quand l'app s'ouvre · idempotent). */
export function prewarm() {
  warmNext("sonnet");
  warmNext("haiku");
}

export function askClaude(prompt: string, model: "sonnet" | "haiku" = "sonnet", timeoutMs = 110_000): Promise<string> {
  const child = takeChild(model);
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(to);
      child.kill();
      fn();
    };
    const to = setTimeout(() => done(() => reject(new Error("tutor timeout"))), timeoutMs);
    let buf = "";
    child.stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString();
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        try {
          const d = JSON.parse(line);
          if (d.type === "result") {
            done(() =>
              d.is_error
                ? reject(new Error(String(d.result || "tutor_failed")))
                : resolve(String(d.result ?? "").trim())
            );
            return;
          }
        } catch {}
      }
    });
    child.on("error", (e) => done(() => reject(new Error("spawn claude: " + e.message))));
    child.on("exit", () => done(() => reject(new Error("claude exited early"))));
    child.stdin.write(
      JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: prompt }] } }) + "\n"
    );
  });
}
