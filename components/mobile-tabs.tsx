"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/learn",
    label: "Apprendre",
    icon: (
      <path d="M4 7l8-3 8 3-8 3-8-3zm0 5l8 3 8-3m-16 5l8 3 8-3" />
    ),
  },
  {
    href: "/browse",
    label: "Phrases",
    icon: <path d="M4 6h16M4 12h12M4 18h8" />,
  },
  {
    href: "/dictionary",
    label: "Dico",
    icon: (
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4zm2 0v16M11 9h4" />
    ),
  },
];

export function MobileTabs() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const active = path === t.href || path.startsWith(t.href + "/");
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition-colors ${
                  active ? "text-brand" : "text-muted"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-[1.35rem] w-[1.35rem]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {t.icon}
                </svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
