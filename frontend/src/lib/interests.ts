export const INTERESTS = [
  'Automatisation',
  'Création de contenu IA',
  'Vidéo IA',
  'Développement IA',
  'Prompt engineering',
  'Outils IA',
  'Business IA',
  'Veille IA',
  'Replays & Masterclasses',
] as const

export type Interest = (typeof INTERESTS)[number]
