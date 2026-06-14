import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'

interface Testimonial {
  name: string
  role: string
  city: string
  quote: string
  initials: string
  bg: string
}

// V1 : témoignages placeholders. À remplacer dès que tu auras des vrais.
const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Camille R.',
    role: 'Freelance content marketing',
    city: 'Lyon',
    quote:
      "En deux mois j'ai automatisé toute ma veille IA et doublé ma production. Le Coach IA est devenu ma routine du matin — je gagne au moins 6 heures par semaine.",
    initials: 'CR',
    bg: '#1E40AF',
  },
  {
    name: 'Yanis B.',
    role: 'Indie maker',
    city: 'Paris',
    quote:
      "La communauté est en or. Je trouve des réponses concrètes en quelques heures, pas du blabla. Les formations vont droit au but, exactement ce qu'il me faut.",
    initials: 'YB',
    bg: '#2563EB',
  },
  {
    name: 'Sofia M.',
    role: 'Product manager SaaS',
    city: 'Bordeaux',
    quote:
      "Enfin un endroit francophone sérieux pour suivre l'IA sans se noyer. Les ressources me font gagner des heures sur chaque sprint produit.",
    initials: 'SM',
    bg: '#0A0A0A',
  },
  {
    name: 'Théo G.',
    role: 'Développeur full-stack',
    city: 'Nantes',
    quote:
      "Les actus sont vraiment résumées en français de qualité, pas du bot bête. Et le Coach m'aide à debug ou prototyper en quelques échanges.",
    initials: 'TG',
    bg: '#3858d8',
  },
]

export function Testimonials() {
  return (
    <section className="overflow-hidden bg-[var(--background)] py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Ils racontent</Eyebrow>
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Ce que disent{' '}
              <span className="serif-accent">les membres.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--muted-foreground)]">
              Quelques retours de membres qui utilisent le Club au quotidien.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={(i % 2) * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
                <blockquote className="flex-1">
                  <p className="text-base leading-relaxed text-[var(--foreground)] sm:text-lg">
                    “{t.quote}”
                  </p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-5">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: t.bg }}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {t.role} · {t.city}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
