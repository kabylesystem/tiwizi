"use client";

import type { RefObject } from "react";

const CHARS = ["ɣ", "č", "ḥ", "ɛ", "ḍ", "ṭ", "ẓ", "ṛ", "ṣ", "ǧ"];

export function KabKeys({
  inputRef,
  onChange,
}: {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onChange: (v: string) => void;
}) {
  const ins = (ch: string) => {
    const el = inputRef.current;
    if (!el) return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? s;
    onChange(el.value.slice(0, s) + ch + el.value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + ch.length, s + ch.length);
    });
  };
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {CHARS.map((c) => (
        <button
          key={c}
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => ins(c)}
          className="kab h-8 min-w-8 rounded-lg border border-line-strong bg-card px-2 text-sm font-bold text-ink transition-colors hover:border-brand hover:bg-brand-soft"
        >
          {c}
        </button>
      ))}
    </div>
  );
}
