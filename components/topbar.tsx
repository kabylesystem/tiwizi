"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Gem, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store/game-store";
import { FennecLogo } from "@/components/fennec";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Apprendre" },
  { href: "/practice", label: "Pratiquer" },
  { href: "/dictionary", label: "Dictionnaire" },
  { href: "/profile", label: "Profil" },
];

export function TopBar() {
  const path = usePathname();
  const user = useGameStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(200,150,62,0.2)] bg-[rgba(253,248,240,0.85)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <FennecLogo size={34} />
          <span className="font-display text-xl font-bold tracking-tight text-ink">Awal</span>
          <span className="font-tifinagh hidden text-brand sm:inline">ⴰⵡⴰⵍ</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-ink text-paper" : "text-muted hover:bg-[rgba(200,150,62,0.1)] hover:text-ink"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm font-bold">
          <Stat icon={<Flame className="h-4 w-4" style={{ color: "#D4735E" }} />} value={mounted ? user.streak : 0} />
          <Stat icon={<Gem className="h-4 w-4" style={{ color: "#4A9ECF" }} />} value={mounted ? user.gems : 0} />
          <Stat icon={<Heart className="h-4 w-4 fill-[#D4735E]" style={{ color: "#D4735E" }} />} value={mounted ? user.hearts : 5} />
        </div>
      </div>
    </header>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-[rgba(200,150,62,0.1)] px-2.5 py-1 text-ink tabular-nums">
      {icon}
      {value}
    </span>
  );
}
