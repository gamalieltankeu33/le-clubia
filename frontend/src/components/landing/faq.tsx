import { Eyebrow } from './eyebrow'
import { Reveal } from './reveal'

const FAQS = [
  {
    q: "À qui s'adresse Le Club IA ?",
    a: "Aux passionnés d'IA francophones, peu importe leur niveau ou leur métier : entrepreneurs, créateurs de contenu, développeurs, étudiants, freelances. Si tu veux maîtriser l'IA pour de vrai sans te noyer dans 10 newsletters, tu es au bon endroit.",
  },
  {
    q: 'Faut-il être technique pour rejoindre ?',
    a: "Pas du tout. Les formations sont étiquetées par niveau (Débutant / Intermédiaire / Avancé) et le Coach IA s'adapte à ton vocabulaire. Notre communauté compte autant de freelances et de marketeux que de devs.",
  },
  {
    q: 'Comment fonctionne le Coach IA ?',
    a: "Tu poses ta question dans un chat, et notre coach (propulsé par Claude Sonnet 4.5, le meilleur modèle conversationnel actuel) te répond en français de manière contextualisée. Tu as 30 messages offerts par jour, et tout l'historique de tes conversations est sauvegardé.",
  },
  {
    q: 'Comment je paie ?',
    a: "Tu peux payer par mobile money africain : Orange Money, Wave, MTN Money ou Moov Money. Le paiement est sécurisé et géré par notre partenaire de paiement. Ça prend 30 secondes.",
  },
  {
    q: 'Quels sont les plans disponibles ?',
    a: "Deux formules sans reconduction automatique : le Plan Master annuel à 99 000 FCFA (la plus avantageuse, ~8 250 FCFA/mois) et le Plan Progress semestriel à 69 000 FCFA (~11 500 FCFA/mois). Tu choisis au moment de t'inscrire.",
  },
  {
    q: "L'abonnement se reconduit-il automatiquement ?",
    a: "Non. Aucune des deux formules (annuelle ou semestrielle) ne se reconduit automatiquement. Tu ne seras jamais re-débité sans ton accord — tu choisis librement de reconduire au moment voulu.",
  },
  {
    q: 'Les formations sont-elles à jour ?',
    a: "L'IA évolue vite, on le sait. Les formations sont mises à jour régulièrement, et celles qui deviennent obsolètes sont retirées. On ajoute aussi de nouvelles formations chaque mois sur les outils et techniques émergents.",
  },
  {
    q: 'Y a-t-il un essai gratuit ?',
    a: "Pas de période d'essai gratuite. Tu choisis entre la formule semestrielle (69 000 FCFA pour 6 mois) ou annuelle (99 000 FCFA pour 12 mois), sans reconduction automatique. Tu testes le Club et tu décides librement de reconduire au terme.",
  },
  {
    q: 'Quelle différence avec une simple newsletter IA ?',
    a: "Une newsletter, c'est passif et impersonnel. Le Club IA, c'est actif (formations, ressources téléchargeables) + interactif (Coach IA + communauté) + contextualisé (le coach connaît ton profil, les actus sont commentables). Tu apprends et tu pratiques en parallèle.",
  },
  {
    q: "Comment se passe l'onboarding ?",
    a: "Tu crées ton compte, tu paies par mobile money, tu remplis 3 écrans rapides (prénom/nom, centres d'intérêt IA, bienvenue), et tu accèdes à toute la plateforme. Compte 2 minutes max.",
  },
]

export function FAQ() {
  return (
    <section className="overflow-hidden bg-white py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <div className="text-center">
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Tu te demandes{' '}
              <span className="serif-accent">peut-être ceci.</span>
            </h2>
          </Reveal>
        </div>

        <div className="mt-10 divide-y divide-[var(--border)]">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.03}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-lg font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]">
                  <span>{f.q}</span>
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--muted-foreground)] transition-transform duration-300 group-open:rotate-180"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>
                <div className="pb-6 pr-12 text-[var(--muted-foreground)]">
                  {f.a}
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
