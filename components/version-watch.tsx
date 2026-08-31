"use client";

/**
 * Auto-update en direct (demande kabylesystem 2026-08-13) : quand un fix est
 * déployé, l'onglet ouvert se recharge tout seul dès que ça ne dérange pas
 * (jamais pendant qu'il tape) · la reprise de session restaure où il en était.
 */
import { useEffect } from "react";

export function VersionWatch() {
  useEffect(() => {
    let current: string | null = null;
    let stale = false;
    const typing = () => {
      const el = document.activeElement;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
    };
    const maybeReload = () => {
      if (stale && !typing()) location.reload();
    };
    const tick = async () => {
      try {
        const d = await fetch("/api/version").then((r) => r.json());
        if (!d.v) return;
        if (current === null) current = d.v;
        else if (d.v !== current) {
          stale = true;
          maybeReload();
        }
      } catch {}
    };
    const poll = setInterval(tick, 20_000);
    const retry = setInterval(maybeReload, 8_000);
    tick();
    return () => {
      clearInterval(poll);
      clearInterval(retry);
    };
  }, []);
  return null;
}
