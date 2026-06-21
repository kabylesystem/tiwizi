import type { Metadata } from "next";
import { Nunito, Noto_Sans, Noto_Sans_Tifinagh } from "next/font/google";
import "./globals.css";
import { TifinaghBackground } from "@/components/tifinagh-bg";

// Friendly, rounded, warm — fits a language app (no more serifs).
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin", "latin-ext"], display: "swap" });
// Full glyph coverage for Kabyle special letters (ɣ ɛ ḥ ṣ ṭ ḍ ẓ), clean sans.
const notoSans = Noto_Sans({ variable: "--font-noto-sans", subsets: ["latin", "latin-ext"], display: "swap" });
const tifinagh = Noto_Sans_Tifinagh({
  variable: "--font-tifinagh",
  subsets: ["tifinagh"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tiwizi — apprends le kabyle pour de vrai",
  description:
    "Apprends le kabyle (taqbaylit) comme des legos : les pièces (vocabulaire fréquent), les patterns (grammaire), puis la construction. Contenu humain vérifié (Tatoeba + Dallet), audio natif, tifinagh.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${nunito.variable} ${notoSans.variable} ${tifinagh.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TifinaghBackground />
        {children}
      </body>
    </html>
  );
}
