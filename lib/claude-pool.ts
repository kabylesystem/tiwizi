import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

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
let spare: Spare | null = null;

function spawnClaude(): ChildProcessWithoutNullStreams {
  const child = spawn(
    "claude",
    [
      "--input-format", "stream-json",
      "--output-format", "stream-json",
      "--model", "sonnet",
      "--max-turns", "1",
      "--verbose",
      "--append-system-prompt", COMMON_SYSTEM,
    ],
    { stdio: ["pipe", "pipe", "pipe"] }
  );
  child.on("error", () => {});
  child.stderr.on("data", () => {});
  return child;
}

function warmNext() {
  if (spare) return;
  const child = spawnClaude();
  // un spare inutilisé est recyclé au bout de 15 min (RAM)
  const killer = setTimeout(() => {
    if (spare?.child === child) {
      spare = null;
      child.kill();
    }
  }, 15 * 60_000);
  spare = { child, killer };
}

function takeChild(): ChildProcessWithoutNullStreams {
  let child: ChildProcessWithoutNullStreams;
  if (spare && spare.child.exitCode === null) {
    clearTimeout(spare.killer);
    child = spare.child;
    spare = null;
  } else {
    child = spawnClaude(); // départ à froid (premier appel / spare mort)
  }
  setTimeout(warmNext, 50);
  return child;
}

export function askClaude(prompt: string, timeoutMs = 110_000): Promise<string> {
  const child = takeChild();
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
    child.on("exit", () => done(() => reject(new Error("claude exited early"))));
    child.stdin.write(
      JSON.stringify({ type: "user", message: { role: "user", content: [{ type: "text", text: prompt }] } }) + "\n"
    );
  });
}
