import type { Metadata } from "next";
import { Inter, Fraunces, Noto_Serif, Noto_Sans_Tifinagh } from "next/font/google";
import "./globals.css";
import { TifinaghBackground } from "@/components/tifinagh-bg";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap" });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });
const notoSerif = Noto_Serif({ variable: "--font-noto-serif", subsets: ["latin", "latin-ext"], display: "swap" });
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
      className={`${inter.variable} ${fraunces.variable} ${notoSerif.variable} ${tifinagh.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TifinaghBackground />
        {children}
      </body>
    </html>
  );
}
