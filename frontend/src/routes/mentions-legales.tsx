import { createFileRoute, Link } from '@tanstack/react-router'
import { LegalLayout } from '@/components/legal/legal-layout'

export const Route = createFileRoute('/mentions-legales')({
  component: LegalNoticePage,
})

function LegalNoticePage() {
  return (
    <LegalLayout title="Mentions légales" lastUpdated="6 mai 2026">
      <p>
        Les présentes mentions légales s'appliquent au site et à la plateforme
        accessibles à l'adresse <strong>leclubia.com</strong>, ci-après « le
        Service » ou « Le Club IA ».
      </p>

      <h2>1. Éditeur du site</h2>
      <p>
        Le site et la plateforme Le Club IA sont édités et exploités par la
        société <strong>BetterZapp LLC</strong>.
      </p>
      <ul>
        <li>
          <strong>Forme juridique</strong> : Limited Liability Company (LLC),
          société de droit américain.
        </li>
        <li>
          <strong>Siège social</strong> : <em>à compléter</em> (États-Unis
          d'Amérique).
        </li>
        <li>
          <strong>Numéro d'enregistrement</strong> : <em>à compléter</em>.
        </li>
        <li>
          <strong>Marque exploitée</strong> : « Le Club IA ».
        </li>
        <li>
          <strong>Adresse de contact</strong> :{' '}
          <a href="mailto:betterzapp@gmail.com">betterzapp@gmail.com</a>.
        </li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>
        Le directeur de la publication est le représentant légal de BetterZapp
        LLC, dont le nom est <em>à compléter</em>. Toute demande relative au
        contenu éditorial peut lui être adressée par courriel à l'adresse
        ci-dessus.
      </p>

      <h2>3. Hébergement</h2>
      <p>
        Le site frontend est hébergé par{' '}
        <strong>Vercel Inc.</strong>, dont le siège est situé 340 S Lemon Ave
        #4133, Walnut, CA 91789, États-Unis (
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
          vercel.com
        </a>
        ).
      </p>
      <p>
        La base de données, l'authentification et le stockage de fichiers sont
        opérés par <strong>Supabase Inc.</strong>, dont les serveurs peuvent
        être situés en Union européenne ou aux États-Unis selon la
        configuration du projet (
        <a
          href="https://supabase.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          supabase.com
        </a>
        ).
      </p>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments composant le site et la plateforme — incluant
        sans s'y limiter la marque « Le Club IA », le logo, l'identité
        graphique, les textes éditoriaux, les formations, les images, les
        codes sources, les illustrations et l'interface utilisateur — est la
        propriété exclusive de BetterZapp LLC ou de ses ayants droit, et est
        protégé par les lois en vigueur relatives à la propriété
        intellectuelle.
      </p>
      <p>
        Toute reproduction, représentation, modification, publication ou
        adaptation, totale ou partielle, par quelque procédé que ce soit, est
        strictement interdite sans autorisation écrite préalable de
        l'éditeur. Toute exploitation non autorisée du site ou de l'un
        quelconque de ses éléments engage la responsabilité de son auteur et
        sera susceptible de poursuites judiciaires.
      </p>

      <h2>5. Crédits</h2>
      <p>
        Le Club IA utilise les ressources tierces suivantes, dont les
        conditions de licence respectives sont scrupuleusement respectées :
      </p>
      <ul>
        <li>
          <strong>Polices typographiques</strong> : Inter, Bricolage Grotesque
          et Instrument Serif, distribuées via Google Fonts (
          <a
            href="https://fonts.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            fonts.google.com
          </a>
          ) sous licence Open Font License (OFL).
        </li>
        <li>
          <strong>Icônes</strong> : Lucide React, distribuée sous licence ISC
          (
          <a
            href="https://lucide.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            lucide.dev
          </a>
          ).
        </li>
        <li>
          <strong>Frameworks et bibliothèques</strong> : React, TanStack
          Router, Tailwind CSS, shadcn/ui, Framer Motion, distribués sous
          leurs licences open source respectives.
        </li>
        <li>
          <strong>Modèles d'intelligence artificielle</strong> : Anthropic
          Claude, exploité dans le cadre des conditions commerciales
          Anthropic.
        </li>
      </ul>

      <h2>6. Photographies et illustrations</h2>
      <p>
        Les photographies et illustrations affichées sur Le Club IA sont, sauf
        mention contraire, soit la propriété de BetterZapp LLC, soit issues
        de bibliothèques d'images libres de droits, soit fournies par les
        membres dans le cadre de leur usage de la plateforme. Toute
        utilisation non autorisée est prohibée.
      </p>

      <h2>7. Conditions d'utilisation</h2>
      <p>
        L'utilisation de la plateforme est régie par nos{' '}
        <Link to="/cgu">Conditions générales d'utilisation</Link>, qui
        définissent les droits et obligations des membres et de l'éditeur.
      </p>

      <h2>8. Politique de confidentialité</h2>
      <p>
        Le traitement des données personnelles fait l'objet d'une politique
        dédiée, conforme au Règlement général sur la protection des données
        (RGPD) et accessible ici :{' '}
        <Link to="/confidentialite">Politique de confidentialité</Link>.
      </p>

      <h2>9. Contact</h2>
      <p>
        Pour toute question relative au site, à la plateforme, à un signalement
        ou à une demande d'information juridique, l'éditeur peut être contacté
        à l'adresse{' '}
        <a href="mailto:betterzapp@gmail.com">betterzapp@gmail.com</a>.
      </p>
    </LegalLayout>
  )
}
