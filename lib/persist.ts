"use client";

/**
 * Sync localStorage ⇄ disque (/api/state). Le navigateur reste la source de
 * travail ; le disque est la sauvegarde de vérité (survit à un nettoyage du
 * navigateur, partagée entre navigateurs de la machine).
 */
const KEYS = ["tiwizi.cog.v1", "tiwizi-game-v1", "tiwizi.srs.v1", "tiwizi.vocab.v1"];
const SYNC_AT = "tiwizi.syncedAt";

/** Au démarrage : si le disque est plus récent que notre dernière sync, on restaure. */
export async function pullState(): Promise<boolean> {
  try {
    const r = await fetch("/api/state");
    if (!r.ok) return false;
    const d = (await r.json()) as { savedAt: number; state: Record<string, string> };
    const localAt = Number(localStorage.getItem(SYNC_AT) || 0);
    if (d.savedAt > localAt && d.state && Object.keys(d.state).length) {
      for (const k of KEYS) if (d.state[k] != null) localStorage.setItem(k, d.state[k]);
      localStorage.setItem(SYNC_AT, String(d.savedAt));
      return true;
    }
  } catch {
    /* offline/api down: on reste sur le localStorage */
  }
  return false;
}

export async function pushState(): Promise<void> {
  try {
    const state: Record<string, string> = {};
    for (const k of KEYS) {
      const v = localStorage.getItem(k);
      if (v != null) state[k] = v;
    }
    if (!Object.keys(state).length) return;
    const savedAt = Date.now();
    await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedAt, state }),
    });
    localStorage.setItem(SYNC_AT, String(savedAt));
  } catch {
    /* réessaiera au prochain événement */
  }
}
