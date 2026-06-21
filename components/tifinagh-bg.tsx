"use client";

const TIF = ["ⴰ","ⵣ","ⵓ","ⵍ","ⵎ","ⵏ","ⵜ","ⵉ","ⴻ","ⵖ","ⴳ","ⴱ","ⵔ","ⵡ","ⴼ","ⵙ","ⴷ","ⴽ","ⵀ","ⵃ"];

// deterministic pseudo-random so server and client render identically
function rnd(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const ITEMS = Array.from({ length: 26 }, (_, i) => ({
  ch: TIF[i % TIF.length],
  left: rnd(i * 7 + 1) * 94 + 2,
  top: rnd(i * 7 + 2) * 92 + 2,
  size: 16 + rnd(i * 7 + 3) * 46,
  dur: 16 + rnd(i * 7 + 4) * 16,
  delay: rnd(i * 7 + 5) * 12,
  rot: rnd(i * 7 + 6) * 24 - 12,
  op: 0.04 + rnd(i * 7 + 7) * 0.05,
}));

export function TifinaghBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {ITEMS.map((d, i) => (
        <span
          key={i}
          className="font-tifinagh absolute select-none animate-drift"
          style={{
            left: `${d.left.toFixed(2)}%`,
            top: `${d.top.toFixed(2)}%`,
            fontSize: `${d.size.toFixed(1)}px`,
            color: "#c8963e",
            opacity: Number(d.op.toFixed(3)),
            ["--dur"]: `${d.dur.toFixed(2)}s`,
            ["--r"]: `${d.rot.toFixed(2)}deg`,
            animationDelay: `${d.delay.toFixed(2)}s`,
            transform: `rotate(${d.rot.toFixed(2)}deg)`,
          } as React.CSSProperties}
        >
          {d.ch}
        </span>
      ))}
    </div>
  );
}
