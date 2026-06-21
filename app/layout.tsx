import type { Metadata } from "next";
import { Inter, Fraunces, Noto_Serif } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { MobileTabs } from "@/components/mobile-tabs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Noto Serif carries full coverage for Kabyle's special letters (ɣ ɛ ḥ ṣ ṭ ḍ ẓ).
const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Awal — apprends le kabyle pour de vrai",
  description:
    "La meilleure façon d'apprendre le kabyle (taqbaylit) : phrases réelles avec audio natif, répétition espacée et dictionnaire Dallet. Du vrai contenu humain, pas de l'IA approximative.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col grain">
        <Nav />
        <main className="flex-1 flex flex-col pb-16 sm:pb-0">{children}</main>
        <MobileTabs />
      </body>
    </html>
  );
}
