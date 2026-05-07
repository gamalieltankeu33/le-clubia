export const INTERESTS = [
  'Automatisation',
  'Création de contenu IA',
  'Vidéo IA',
  'Développement IA',
  'Prompt engineering',
  'Outils IA',
  'Business IA',
  'Veille IA',
] as const

export type Interest = (typeof INTERESTS)[number]
