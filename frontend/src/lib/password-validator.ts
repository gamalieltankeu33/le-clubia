/**
 * Validation de mot de passe côté frontend pour Le Club IA.
 *
 * Règles dures (blockingError) — bloquent le submit :
 *  - Longueur < 8 caractères
 *  - Présent dans la liste COMMON_WEAK_PASSWORDS
 *
 * Règles douces (errors) — informatives, n'empêchent PAS l'inscription :
 *  - Au moins 1 chiffre
 *  - Au moins 1 majuscule
 *  - Au moins 1 caractère spécial
 *  - Longueur ≥ 12 (bonus)
 *
 * Cette double approche permet d'éduquer l'utilisateur sans le bloquer
 * sur des règles trop strictes (un mot de passe long sans symbole reste
 * acceptable).
 */

const COMMON_WEAK_PASSWORDS = [
  '123456',
  '12345678',
  '123456789',
  '1234567',
  '12345',
  'password',
  'password1',
  'password123',
  'azerty',
  'qwerty',
  'qwerty123',
  '111111',
  '000000',
  'admin',
  'admin123',
  'iloveyou',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'master',
  'shadow',
  'superman',
  'leclubia',
  'leclub',
  'francais',
  'bonjour',
  'salut',
]

export interface PasswordValidation {
  /**
   * True si le mot de passe passe les règles dures (longueur ≥ 8 ET non
   * commun). Les règles douces ne sont pas obligatoires.
   */
  isValid: boolean
  /** Score 0-5 pour la jauge visuelle. */
  score: 0 | 1 | 2 | 3 | 4 | 5
  /**
   * Toutes les règles non respectées (dures + douces). Pour l'affichage
   * visuel sous la jauge.
   */
  errors: string[]
  /**
   * L'erreur bloquante (longueur ou mot de passe trop commun) — null si OK.
   * À afficher en toast au submit.
   */
  blockingError: string | null
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0
  let blockingError: string | null = null

  // ---------- Règles ----------

  // Longueur min 8 (BLOQUANTE)
  if (password.length < 8) {
    const msg = 'Au moins 8 caractères'
    errors.push(msg)
    if (!blockingError) blockingError = msg
  } else {
    score++
    if (password.length >= 12) score++
  }

  // Au moins 1 chiffre
  if (!/\d/.test(password)) {
    errors.push('Au moins un chiffre')
  } else {
    score++
  }

  // Au moins 1 majuscule
  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une majuscule')
  } else {
    score++
  }

  // Au moins 1 caractère spécial
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\]/.test(password)) {
    errors.push('Au moins un caractère spécial (! @ # $ etc.)')
  } else {
    score++
  }

  // Mot de passe commun (BLOQUANTE)
  const lower = password.toLowerCase()
  if (
    password.length > 0 &&
    COMMON_WEAK_PASSWORDS.some((weak) => lower.includes(weak))
  ) {
    const msg = 'Mot de passe trop commun, évite "password", "123456", etc.'
    errors.push(msg)
    if (!blockingError) blockingError = msg
    score = Math.min(score, 1)
  }

  return {
    isValid: blockingError === null,
    score: Math.min(score, 5) as 0 | 1 | 2 | 3 | 4 | 5,
    errors,
    blockingError,
  }
}
