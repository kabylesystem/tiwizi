"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, Dumbbell, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Apprendre", icon: Home },
  { href: "/tutor", label: "Idir", icon: Sparkles },
  { href: "/practice", label: "Pratique", icon: Dumbbell },
  { href: "/dictionary", label: "Dico", icon: BookOpen },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(200,150,62,0.2)] bg-[rgba(253,248,240,0.95)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition-colors",
                  active ? "text-brand" : "text-muted"
                )}
              >
                <Icon className="h-[1.35rem] w-[1.35rem]" strokeWidth={active ? 2.4 : 1.8} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
