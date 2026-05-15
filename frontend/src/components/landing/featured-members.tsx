import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'
import { ImageWithFallback } from './previews/image-with-fallback'
import { cn } from '@/lib/utils'

interface Member {
  name: string
  expertise: string
  initials: string
  image: string
  /** Couleur du gradient fallback (paire from→to). */
  bgFrom: string
  bgTo: string
}

// Les 6 membres mis en avant. Les images sont en /public/landing/members/
// au format {slug}.jpg, ratio 3:4 portrait, cadrage tête + buste.
// Pour mettre à jour un membre : remplace l'image au même chemin, édite
// l'entrée correspondante ici.
const MEMBERS: Member[] = [
  {
    name: 'Patricia Njie',
    expertise: 'Marketing & vente par webinaires',
    initials: 'PN',
    image: '/landing/members/patricia-njie.jpg',
    bgFrom: '#7c2d12',
    bgTo: '#f97316',
  },
  {
    name: 'Fanel Nguimfack',
    expertise: 'CEO Branddeo · stratégie YouTube',
    initials: 'FN',
    image: '/landing/members/fanel-nguimfack.jpg',
    bgFrom: '#1E40AF',
    bgTo: '#3858d8',
  },
  {
    name: 'Dorian Motia',
    expertise: 'Créateur tech & entrepreneur IA',
    initials: 'DM',
    image: '/landing/members/dorian-motia.jpg',
    bgFrom: '#0F1E4D',
    bgTo: '#60A5FA',
  },
  {
    name: 'Warren Steeve',
    expertise: 'Créateur digital · expert IA',
    initials: 'WS',
    image: '/landing/members/warren-steeve.jpg',
    bgFrom: '#7c3aed',
    bgTo: '#a855f7',
  },
  {
    name: 'Dilane Nofolé',
    expertise: 'Expert IA & créateur de contenu',
    initials: 'DN',
    image: '/landing/members/dilane-nofole.jpg',
    bgFrom: '#1E3A8A',
    bgTo: '#93C5FD',
  },
  {
    name: 'Kevin Chris',
    expertise: 'Tech, IA & automatisation',
    initials: 'KC',
    image: '/landing/members/kevin-chris.jpg',
    bgFrom: '#0ea5e9',
    bgTo: '#1E40AF',
  },
]

const EASE = [0.22, 1, 0.36, 1] as const

export function FeaturedMembers() {
  return (
    <section className="overflow-hidden bg-white py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Ils sont déjà membres</Eyebrow>
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Des experts inspirants{' '}
              <span className="serif-accent">au cœur du Club.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--muted-foreground)]">
              Créateurs, formateurs, développeurs. Ils partagent leur savoir
              avec la communauté.
            </p>
          </Reveal>
        </div>

        {/* Desktop / tablette : grille statique */}
        <div className="mt-10 hidden grid-cols-2 gap-6 md:grid lg:grid-cols-3">
          {MEMBERS.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.05 }}
            >
              <FeaturedMemberCard member={m} interactive />
            </motion.div>
          ))}
        </div>

        {/* Mobile : carrousel scroll-snap */}
        <MobileCarousel members={MEMBERS} />
      </div>
    </section>
  )
}

function FeaturedMemberCard({
  member,
  interactive = false,
}: {
  member: Member
  /** Active hover effects (à éviter dans le carrousel mobile pour ne pas clipper). */
  interactive?: boolean
}) {
  return (
    <article
      className={cn(
        'group relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#FAFAF9] shadow-sm',
        interactive &&
          'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10',
      )}
    >
      {/* Photo ou fallback gradient + initiales */}
      <ImageWithFallback
        src={member.image}
        alt={member.name}
        fallback={
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center"
            style={{
              backgroundImage: `linear-gradient(135deg, ${member.bgFrom}, ${member.bgTo})`,
            }}
          >
            <span className="font-display text-7xl font-bold text-white/95 sm:text-8xl">
              {member.initials}
            </span>
          </div>
        }
      />

      {/* Overlay gradient permanent en bas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
      />

      {/* Texte par-dessus */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="font-display text-lg font-semibold leading-tight text-white">
          {member.name}
        </p>
        <p className="mt-1 text-sm text-white/80">{member.expertise}</p>
      </div>
    </article>
  )
}

function MobileCarousel({ members }: { members: Member[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const cards = Array.from(el.children) as HTMLElement[]
    if (cards.length === 0) return
    // Trouve la carte dont le bord gauche est le plus proche du scroll position
    const left = el.scrollLeft + el.offsetLeft
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < cards.length; i++) {
      const dist = Math.abs(cards[i].offsetLeft - left)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    setActiveIdx(bestIdx)
  }

  function goTo(idx: number) {
    const el = scrollRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(members.length - 1, idx))
    const target = el.children[clamped] as HTMLElement | undefined
    if (!target) return
    el.scrollTo({
      left: target.offsetLeft - el.offsetLeft,
      behavior: 'smooth',
    })
  }

  // Initial sync au montage
  useEffect(() => {
    handleScroll()
  }, [])

  const canPrev = activeIdx > 0
  const canNext = activeIdx < members.length - 1

  return (
    <div className="mt-12 md:hidden">
      {/* Hide scrollbar (mobile only, scoped) */}
      <style>{`
        .featured-scroll::-webkit-scrollbar { display: none; }
        .featured-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="featured-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 -mx-6 pb-1"
      >
        {members.map((m) => (
          <div
            key={m.name}
            className="snap-start shrink-0 w-[80vw] max-w-[300px]"
          >
            <FeaturedMemberCard member={m} />
          </div>
        ))}
      </div>

      {/* Dots + flèches */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goTo(activeIdx - 1)}
          disabled={!canPrev}
          aria-label="Précédent"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E5E5] bg-white transition-all',
            canPrev
              ? 'text-[#0A0A0A] hover:border-[#0A0A0A]/30 hover:shadow-sm'
              : 'cursor-not-allowed text-[#737373] opacity-50',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5">
          {members.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Aller à la carte ${i + 1}`}
              className={cn(
                'rounded-full transition-all',
                i === activeIdx
                  ? 'h-1.5 w-6 bg-[#1E40AF]'
                  : 'h-1.5 w-1.5 bg-[#E5E5E5] hover:bg-[#737373]',
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIdx + 1)}
          disabled={!canNext}
          aria-label="Suivant"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E5E5] bg-white transition-all',
            canNext
              ? 'text-[#0A0A0A] hover:border-[#0A0A0A]/30 hover:shadow-sm'
              : 'cursor-not-allowed text-[#737373] opacity-50',
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
