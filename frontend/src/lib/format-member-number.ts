/**
 * Format un numéro de membre pour l'affichage : padding 3 chiffres,
 * préfixe `#`. Tant qu'on est sous 1000 membres, format "#047". Au-delà,
 * pas de troncature : "#1042".
 *
 * Si le numéro est null/undefined (ex. : profil pré-migration 0039), on
 * renvoie null pour que l'appelant puisse choisir s'il affiche ou cache.
 */
export function formatMemberNumber(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null
  return `#${String(n).padStart(3, '0')}`
}
