import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Gift, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

/**
 * Carte d'activation manuelle d'un Plan Découverte (essai 1 mois, 30 €).
 *
 * Le plan trial n'est PAS exposé sur la landing — c'est un canal privé
 * réservé aux invitations directes. L'admin entre l'email d'un compte
 * existant, clique, et l'edge function `admin-activate-trial` :
 *   - crée la subscription (status=active, +1 mois),
 *   - envoie immédiatement l'email de bienvenue trial,
 *   - le cron `trial-nurture-cron` enchaînera ensuite la séquence
 *     J+7 / J+21 / J+27 / J+30.
 */
export function TrialActivationCard() {
  const [email, setEmail] = useState('')

  const mutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      const { data, error } = await supabase.functions.invoke(
        'admin-activate-trial',
        { body: { email: targetEmail } },
      )
      if (error) {
        // L'edge function renvoie un JSON {error: '...'} avec un status 4xx/5xx.
        // supabase-js le wrappe — on essaie d'extraire le message lisible.
        type Ctx = { context?: { json?: () => Promise<{ error?: string }> } }
        let msg = error.message
        try {
          const ctx = error as unknown as Ctx
          const body = await ctx.context?.json?.()
          if (body?.error) msg = body.error
        } catch {
          /* ignore */
        }
        throw new Error(msg)
      }
      return data as {
        ok: boolean
        email: string
        period_end: string
        email_sent: boolean
      }
    },
    onSuccess: (data) => {
      toast.success(
        `Plan Découverte activé pour ${data.email}. ${
          data.email_sent
            ? "Email de bienvenue envoyé."
            : "(Envoi de l'email a échoué — log Supabase pour détails)"
        }`,
        { duration: 7000 },
      )
      setEmail('')
    },
    onError: (err: Error) => {
      toast.error(err.message || "Activation impossible.", { duration: 7000 })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Email invalide.')
      return
    }
    mutation.mutate(trimmed)
  }

  const disabled = mutation.isPending

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Plan Découverte (1 mois)
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Activation manuelle pour un compte existant — déclenche la séquence emails.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={disabled}
          required
        />
        <Button
          type="submit"
          disabled={disabled || !email.trim()}
          className="w-full"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Activation en cours…
            </>
          ) : (
            <>Activer le Plan Découverte</>
          )}
        </Button>
      </form>

      <p className="mt-4 text-xs text-[var(--muted-foreground)] leading-relaxed">
        Refusé si la personne a déjà un abonnement actif. Le compte doit
        exister (la personne doit s'être inscrite sur le site) avant
        l'activation. Période = 30 jours à partir de maintenant.
      </p>
    </div>
  )
}
