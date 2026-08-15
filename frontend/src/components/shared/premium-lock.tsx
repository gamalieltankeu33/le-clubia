import { Link } from '@tanstack/react-router'
import { ArrowLeft, Crown, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

/**
 * Helper unique : true ssi l'utilisateur courant est sur Plan Découverte
 * (sub active avec plan_id='trial'). Tout le reste du code passe par ce
 * hook pour éviter de répéter la condition à 4 endroits.
 */
export function useIsTrialUser(): boolean {
  return useAuthStore((s) => s.subscription?.plan_id === 'trial')
}

/**
 * Helper unique : true ssi l'utilisateur courant est sur l'offre IA Business Challenge
 * (sub active avec plan_id='challenge_ia_business').
 */
export function useIsChallengeUser(): boolean {
  return useAuthStore((s) => s.subscription?.plan_id === 'challenge_ia_business')
}

/**
 * Petit badge "Premium" affiché sur les cartes (formations/ressources)
 * pour les utilisateurs en trial. Volontairement discret mais lisible :
 * un cadenas suffit à signaler que le clic ne donnera pas accès au contenu.
 */
export function PremiumLockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800',
        className,
      )}
    >
      <Lock className="h-3 w-3" />
      Premium
    </span>
  )
}

/**
 * Badge "Club IA" affiché pour signaler aux utilisateurs du Challenge que la formation/ressource est réservée aux membres du Club.
 */
export function ChallengeLockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-800',
        className,
      )}
    >
      <Lock className="h-3 w-3" />
      Club IA
    </span>
  )
}

/**
 * Écran "upgrade requis" affiché à la place du contenu quand un utilisateur
 * trial accède au détail d'une formation/ressource verrouillée.
 *
 * @param backTo — chemin où le bouton "retour" doit ramener.
 * @param itemKind — "formation" ou "ressource" pour le wording.
 */
export function PremiumLockedScreen({
  backTo,
  itemKind,
}: {
  backTo: string
  itemKind: 'formation' | 'ressource'
}) {
  const article = itemKind === 'formation' ? 'cette formation' : 'cette ressource'

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Button asChild variant="outline" size="sm">
        <Link to={backTo}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </Button>

      <div className="mt-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Crown className="h-8 w-8" />
        </div>

        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
          Contenu réservé aux plans supérieurs
        </h1>

        <p className="mx-auto mt-3 max-w-md text-[var(--muted-foreground)]">
          {article === 'cette formation' ? 'Cette formation fait' : 'Cette ressource fait'}{' '}
          partie du programme avancé du Club, accessible uniquement avec un
          <strong className="text-[var(--foreground)]"> plan trimestriel ou semestriel</strong>.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <PlanTeaser
            title="3 mois"
            price="100 €"
            sub="~33 €/mois"
            recommended={false}
          />
          <PlanTeaser
            title="6 mois"
            price="150 €"
            sub="~25 €/mois — meilleure offre"
            recommended
          />
        </div>

        <Button asChild className="mt-7 w-full sm:w-auto">
          <Link to="/abonnement">
            <Sparkles className="h-4 w-4" />
            Passer au plan supérieur
          </Link>
        </Button>

        <p className="mt-4 text-xs text-[var(--muted-foreground)]">
          Tu gardes ton compte, ta progression et toute la communauté.
          Seuls les contenus avancés s'ajoutent.
        </p>
      </div>
    </div>
  )
}

function PlanTeaser({
  title,
  price,
  sub,
  recommended,
}: {
  title: string
  price: string
  sub: string
  recommended: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-4 text-left',
        recommended
          ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/15'
          : 'border-[var(--border)]',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          {title}
        </p>
        {recommended && (
          <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--primary)]">
            Recommandé
          </span>
        )}
      </div>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
        {price}
      </p>
      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{sub}</p>
    </div>
  )
}

/**
 * Écran affiché à un utilisateur du IA Business Challenge lorsqu'il tente d'accéder
 * à une formation ou ressource réservée aux membres complets du Club IA.
 */
export function ChallengeLockedScreen({
  backTo,
  itemKind,
}: {
  backTo: string
  itemKind: 'formation' | 'ressource'
}) {
  const article = itemKind === 'formation' ? 'Cette formation est réservée' : 'Cette ressource est réservée'

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Button asChild variant="outline" size="sm">
        <Link to={backTo}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </Button>

      <div className="mt-8 overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
          <Crown className="h-8 w-8" />
        </div>

        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
          Réservé aux membres du Club IA
        </h1>

        <p className="mx-auto mt-3 max-w-md text-[var(--muted-foreground)]">
          {article} aux membres complets du Club IA.{' '}
          Votre accès actuel <strong className="text-[var(--foreground)]">AI Business Sprint</strong> vous donne accès exclusivement à la formation AI Business Sprint, aux ressources prompts associées et à la communauté d'entraide.
        </p>

        <div className="mt-8 rounded-2xl border border-purple-100 bg-white p-6 text-left shadow-sm">
          <h3 className="font-display font-semibold text-purple-900">
            Envie de débloquer tout le Club IA ?
          </h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Accédez à l'ensemble du catalogue de formations IA, à tous nos outils avancés, aux ateliers en direct et à toute la communauté d'entrepreneurs.
          </p>
        </div>

        <Button asChild className="mt-7 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
          <Link to="/abonnement">
            <Sparkles className="h-4 w-4" />
            Rejoindre le Club IA complet
          </Link>
        </Button>
      </div>
    </div>
  )
}
