import { supabase } from './supabase'
import type { PublicPricingPlan } from './database.types'

/**
 * Récupère les plans actifs via la RPC publique get_active_pricing_plans.
 * Annuel renvoyé en premier (le tri DESC duration_months côté SQL).
 *
 * Cache React Query côté caller : staleTime 5 min recommandé (les prix
 * ne changent pas souvent).
 */
export async function fetchActivePricingPlans(): Promise<
  PublicPricingPlan[]
> {
  // @ts-expect-error - get_active_pricing_plans est une RPC custom non typée dans Database['public']['Functions']
  const { data, error } = await supabase.rpc('get_active_pricing_plans')
  if (error) {
    console.warn('[pricing] get_active_pricing_plans error:', error)
    return []
  }
  return (data ?? []) as PublicPricingPlan[]
}

/**
 * Formatage prix → "100 €" (convention française : symbole après,
 * séparateur de milliers en espace insécable). Le nom historique
 * formatXof est conservé pour ne pas casser les call sites — la
 * colonne DB s'appelle toujours price_xof mais représente désormais
 * des EUR entiers (cf. migration prix FCFA→EUR).
 */
export function formatXof(amount: number): string {
  return `${amount.toLocaleString('fr-FR').replace(/ |\s/g, ' ')} €`
}
