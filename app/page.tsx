import Link from "next/link";
import { stats } from "@/lib/data";
import { Yaz } from "@/components/logo";
import { TodayCard } from "@/components/today-card";

const nf = new Intl.NumberFormat("fr-FR");

export default function Home() {
  const s = stats();
  return (
    <div className="mx-auto w-full max-w-5xl px-5">
      {/* hero */}
      <section className="grid gap-10 py-14 md:grid-cols-[1.15fr_0.85fr] md:py-20">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-line-strong bg-card px-3 py-1 text-xs font-medium text-muted">
            <Yaz className="h-3.5 w-3.5 text-brand" />
            Taqbaylit · le kabyle pour de vrai
          </span>
          <h1 className="font-display text-[2.7rem] font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
            Apprends à <span className="text-brand">parler</span> kabyle,
            <br className="hidden md:block" /> pas juste à le réviser.
          </h1>
          <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-muted">
            Des phrases <strong className="font-semibold text-ink">réelles</strong>,
            dites par des <strong className="font-semibold text-ink">voix natives</strong>,
            mémorisées par répétition espacée. Du contenu humain vérifié — pas
            de kabyle approximatif inventé par une IA.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/learn"
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Commencer à apprendre
            </Link>
            <Link
              href="/browse"
              className="rounded-full border border-line-strong bg-card px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-paper-2"
            >
              Explorer les phrases
            </Link>
          </div>
          <dl className="mt-10 flex gap-8">
            <Stat n={nf.format(s.pairs)} l="phrases traduites" />
            <Stat n={nf.format(s.withAudio)} l="avec audio natif" />
            <Stat n={nf.format(s.dict)} l="mots au dico" />
          </dl>
        </div>

        <div className="flex items-center">
          <TodayCard />
        </div>
      </section>

      {/* method */}
      <section className="grid gap-4 pb-20 md:grid-cols-3">
        <Feature
          href="/learn"
          k="01"
          title="Répétition espacée"
          body="Tu vois chaque phrase juste avant de l'oublier. L'algorithme planifie tes révisions — il ne te reste qu'à venir chaque jour."
        />
        <Feature
          href="/browse"
          k="02"
          title="Input compréhensible"
          body="208 000 phrases kabyles avec leur traduction française. Écoute, lis, absorbe la langue comme elle se parle vraiment."
        />
        <Feature
          href="/dictionary"
          k="03"
          title="Dictionnaire Dallet"
          body="Le dictionnaire de référence du kabyle, numérisé : 12 500 entrées, sens, exemples, racines. La vérité lexicale, pas une hallucination."
        />
      </section>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <dt className="font-display text-2xl font-semibold text-ink">{n}</dt>
      <dd className="mt-0.5 text-xs text-muted">{l}</dd>
    </div>
  );
}

function Feature({
  href,
  k,
  title,
  body,
}: {
  href: string;
  k: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-card p-6 transition-all hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_12px_40px_-18px_rgba(34,28,20,0.25)]"
    >
      <span className="font-display text-sm font-semibold text-accent">{k}</span>
      <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
        Ouvrir
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}
