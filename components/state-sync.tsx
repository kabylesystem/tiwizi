"use client";

/**
 * Monté une fois dans le layout racine : restaure la progression depuis le
 * disque au démarrage, puis pousse chaque changement (debounce 1,5 s + à la
 * mise en arrière-plan de l'onglet).
 */
import { useEffect } from "react";
import { pullState, pushState } from "@/lib/persist";
import { useGameStore } from "@/lib/store/game-store";

export function StateSync() {
  useEffect(() => {
    let dirty = false;
    let t: ReturnType<typeof setTimeout> | undefined;

    pullState().then((applied) => {
      if (applied) {
        useGameStore.persist.rehydrate();
        window.dispatchEvent(new Event("tiwizi:pulled"));
      }
    });

    const mark = () => {
      dirty = true;
      clearTimeout(t);
      t = setTimeout(() => {
        if (dirty) {
          dirty = false;
          pushState();
        }
      }, 1500);
    };
    const unsub = useGameStore.subscribe(mark);
    window.addEventListener("tiwizi:dirty", mark);
    const onHide = () => {
      if (document.visibilityState === "hidden") pushState();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      unsub();
      window.removeEventListener("tiwizi:dirty", mark);
      document.removeEventListener("visibilitychange", onHide);
      clearTimeout(t);
    };
  }, []);

  return null;
}
