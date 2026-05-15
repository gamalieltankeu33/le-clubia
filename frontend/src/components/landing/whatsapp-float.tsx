// Bouton flottant WhatsApp : entry-point conversation rapide pour les
// prospects de la landing. Cliquer ouvre wa.me dans un nouvel onglet
// avec un message d'accroche pré-rempli (le prospect peut éditer).
//
// Choix UI :
//   - Vert WhatsApp officiel (#25D366) — reconnaissance immédiate
//   - Position fixed bottom-right, taille FAB standard 56px (52 mobile)
//   - Anneau pulsant léger pour attirer le regard sans agresser
//   - Tooltip "Une question ?" sur hover (desktop uniquement, peer-hover)
//   - Z-index 50 : au-dessus du contenu, en dessous des modaux Sonner

const WHATSAPP_NUMBER = '33756859917' // +33 7 56 85 99 17, format wa.me (sans +)
const PREFILLED_MESSAGE = "Bonjour ! J'ai une question sur Le Club IA."

export function WhatsAppFloat() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nous contacter sur WhatsApp"
        className="peer relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-4px_rgba(37,211,102,0.4),0_4px_8px_-2px_rgba(37,211,102,0.3)] transition-all duration-200 hover:scale-110 hover:bg-[#1FAA50] active:scale-95 sm:h-14 sm:w-14"
      >
        {/* Anneau pulsant — n'interfère pas avec le clic (pointer-events-none) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[#25D366] opacity-60"
          style={{ animation: 'wa-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}
        />

        {/* Logo WhatsApp officiel (SVG inline, scalable, pas de fetch externe) */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className="relative h-6 w-6 sm:h-7 sm:w-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488" />
        </svg>
      </a>

      {/* Tooltip — desktop uniquement (≥lg). Apparaît quand le bouton (peer)
          est hoveré. Caché sur mobile/tablette pour ne pas masquer du
          contenu adjacent et parce que les utilisateurs mobiles tapent
          directement sans hover. */}
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-[#0A0A0A] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 peer-hover:opacity-100 lg:block">
        Une question ? Discute avec nous
      </span>

      {/* Keyframes scopés — anneau qui grossit + s'efface, plus doux que
          l'animate-ping de Tailwind (qui scale jusqu'à 2x et donne un
          effet "alarme" trop intense pour un widget passif). */}
      <style>{`
        @keyframes wa-ping {
          0% { transform: scale(1); opacity: 0.6; }
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
