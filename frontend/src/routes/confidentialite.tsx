import { createFileRoute, Link } from '@tanstack/react-router'
import { LegalLayout } from '@/components/legal/legal-layout'

export const Route = createFileRoute('/confidentialite')({
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      lastUpdated="6 mai 2026"
    >
      <h2>Préambule</h2>
      <p>
        La protection des données personnelles est une priorité pour Le Club
        IA. La présente politique de confidentialité a pour objet d'informer
        les membres et visiteurs de la plateforme leclubia.com sur la nature
        des données collectées, les finalités de leur traitement, les bases
        légales mobilisées, les destinataires concernés et les droits dont
        ils disposent.
      </p>
      <p>
        Cette politique est rédigée en conformité avec le Règlement (UE)
        2016/679 du 27 avril 2016 dit « Règlement général sur la protection
        des données » (RGPD) et la loi française n° 78-17 du 6 janvier 1978
        modifiée, dite « Informatique et Libertés ». Elle est par ailleurs
        compatible avec les législations équivalentes en vigueur dans les
        pays d'Afrique francophone.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données collectées sur la plateforme
        Le Club IA est la société <strong>BetterZapp LLC</strong>, éditrice
        et exploitante du service. Toute demande relative au traitement des
        données personnelles peut être adressée à l'adresse :{' '}
        <a href="mailto:betterzapp@gmail.com">betterzapp@gmail.com</a>.
      </p>

      <h2>2. Données collectées</h2>
      <p>
        Dans le cadre de l'utilisation du Service, sont collectées les
        catégories de données suivantes :
      </p>
      <ul>
        <li>
          <strong>Données d'identification</strong> : adresse email,
          obligatoirement valide ; prénom et nom ; mot de passe (stocké sous
          forme hachée et jamais en clair).
        </li>
        <li>
          <strong>Données de profil public</strong> : photographie de profil
          (optionnelle), biographie courte (optionnelle), centres d'intérêt
          déclarés lors de l'onboarding.
        </li>
        <li>
          <strong>Données d'abonnement</strong> : statut de l'abonnement,
          date de souscription, identifiant transactionnel transmis par le
          partenaire de paiement (mobile money). Aucune donnée bancaire ou
          carte n'est stockée par l'éditeur.
        </li>
        <li>
          <strong>Données d'activité</strong> : publications, commentaires,
          réactions (likes), historique de conversations avec le coach IA,
          progression dans les formations.
        </li>
        <li>
          <strong>Données techniques</strong> : adresse IP, identifiant de
          session, type de navigateur (user-agent), date et heure de
          connexion. Ces données sont collectées pour des finalités de
          sécurité et de mesure d'audience.
        </li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <p>
        Les données collectées sont traitées pour les finalités suivantes :
      </p>
      <ul>
        <li>Création, gestion et sécurisation du compte du membre.</li>
        <li>
          Fourniture du Service souscrit (formations, communauté, coach IA,
          ressources, actualités).
        </li>
        <li>
          Personnalisation de l'expérience (recommandation de formations,
          notifications adaptées, suggestions communautaires).
        </li>
        <li>
          Communication transactionnelle : confirmations, notifications de
          sécurité, informations relatives au compte ou à l'abonnement.
        </li>
        <li>
          Communication d'amélioration produit ou éditoriale, sous réserve du
          consentement explicite du membre.
        </li>
        <li>
          Lutte contre la fraude, la manipulation des comptes et le respect
          des règles communautaires.
        </li>
        <li>
          Élaboration de statistiques anonymisées d'usage à des fins
          d'amélioration continue de la plateforme.
        </li>
      </ul>

      <h2>4. Bases légales</h2>
      <p>Le traitement des données est fondé sur les bases légales suivantes :</p>
      <ul>
        <li>
          <strong>Exécution du contrat</strong> (article 6.1.b du RGPD) : pour
          la gestion du compte, la fourniture du Service et le traitement des
          paiements, conformément aux Conditions générales d'utilisation
          acceptées par le membre.
        </li>
        <li>
          <strong>Intérêt légitime</strong> (article 6.1.f du RGPD) : pour la
          sécurisation du Service, la prévention de la fraude et l'élaboration
          de statistiques anonymisées.
        </li>
        <li>
          <strong>Consentement</strong> (article 6.1.a du RGPD) : pour les
          communications d'information non strictement nécessaires à
          l'exécution du contrat (newsletter, mises à jour produit). Ce
          consentement peut être retiré à tout moment.
        </li>
        <li>
          <strong>Obligation légale</strong> (article 6.1.c du RGPD) : pour la
          conservation des justificatifs comptables et la réponse aux
          réquisitions des autorités compétentes.
        </li>
      </ul>

      <h2>5. Durées de conservation</h2>
      <ul>
        <li>
          <strong>Données du compte actif</strong> : conservées pendant toute
          la durée d'existence du compte du membre.
        </li>
        <li>
          <strong>Après suppression du compte</strong> : les données du
          profil, les publications, les commentaires et l'historique de
          conversations sont effacés dans un délai de{' '}
          <strong>trente (30) jours</strong>, à l'exception des éléments dont
          la conservation est imposée par la loi (notamment les pièces
          comptables et factures, conservées jusqu'à dix (10) ans).
        </li>
        <li>
          <strong>Données techniques (logs)</strong> : conservées un an
          maximum à des fins de sécurité, conformément aux durées
          recommandées par les autorités de protection des données.
        </li>
      </ul>

      <h2>6. Destinataires des données</h2>
      <p>Les données collectées peuvent être partagées avec :</p>
      <ul>
        <li>
          <strong>L'équipe Le Club IA</strong> (BetterZapp LLC) : dans la
          stricte limite des besoins liés à l'exploitation du Service, à la
          modération et au support utilisateur.
        </li>
        <li>
          <strong>Les sous-traitants techniques</strong>, listés à
          l'article 7, agissant sur instruction de l'éditeur dans le respect
          du RGPD et liés par des accords de traitement de données (DPA).
        </li>
        <li>
          <strong>Les autorités compétentes</strong>, exclusivement sur
          réquisition légale et dans le respect des procédures applicables.
        </li>
      </ul>
      <p>
        Aucune donnée personnelle n'est cédée, vendue ou louée à des tiers à
        des fins commerciales.
      </p>

      <h2>7. Sous-traitants et transferts hors Union européenne</h2>
      <p>
        L'éditeur a recours aux sous-traitants suivants pour l'exécution
        technique du Service :
      </p>
      <ul>
        <li>
          <strong>Supabase Inc.</strong> — base de données, authentification,
          stockage de fichiers. Région d'hébergement configurable (Union
          européenne ou États-Unis selon la configuration retenue par
          l'éditeur). Encadré par les clauses contractuelles types de la
          Commission européenne pour les transferts hors UE.
        </li>
        <li>
          <strong>Anthropic, PBC</strong> (États-Unis) — fournisseur du modèle
          d'intelligence artificielle utilisé par le coach IA et l'agent
          éditorial. Les messages échangés avec le coach sont transmis aux
          serveurs d'Anthropic pour traitement, sans réutilisation
          d'entraînement, conformément aux engagements contractuels
          d'Anthropic. Encadré par les clauses contractuelles types.
        </li>
        <li>
          <strong>Vercel Inc.</strong> (États-Unis) — hébergement du frontend.
          Encadré par les clauses contractuelles types.
        </li>
        <li>
          <strong>BetterZapp LLC</strong> (États-Unis) — éditeur. Encadré par
          les clauses contractuelles types.
        </li>
        <li>
          <strong>Partenaires de paiement mobile money</strong> (Orange Money,
          Wave, MTN Money, Moov Money) — traitement des opérations de
          paiement, dans le cadre de leurs propres politiques de
          confidentialité.
        </li>
      </ul>
      <p>
        Pour tout transfert hors UE, l'éditeur s'assure de la mise en place
        de garanties appropriées (clauses contractuelles types, mesures de
        sécurité techniques et organisationnelles) afin de garantir un niveau
        de protection équivalent à celui du RGPD.
      </p>

      <h2>8. Droits des membres</h2>
      <p>
        Conformément au RGPD, chaque membre dispose des droits suivants sur
        ses données personnelles :
      </p>
      <ul>
        <li>
          <strong>Droit d'accès</strong> : obtenir la confirmation que des
          données le concernant sont traitées et accéder à ces données.
        </li>
        <li>
          <strong>Droit de rectification</strong> : demander la correction de
          données inexactes ou incomplètes.
        </li>
        <li>
          <strong>Droit à l'effacement</strong> (« droit à l'oubli ») :
          demander la suppression de ses données. La suppression du compte
          depuis le profil utilisateur déclenche automatiquement ce processus.
        </li>
        <li>
          <strong>Droit à la limitation du traitement</strong> : demander la
          suspension temporaire d'un traitement contesté.
        </li>
        <li>
          <strong>Droit à la portabilité</strong> : recevoir, dans un format
          structuré et lisible par machine, les données fournies à l'éditeur,
          et les transmettre à un autre responsable de traitement.
        </li>
        <li>
          <strong>Droit d'opposition</strong> : s'opposer, pour des raisons
          tenant à sa situation particulière, à un traitement fondé sur
          l'intérêt légitime.
        </li>
        <li>
          <strong>Droit de retirer son consentement</strong> à tout moment,
          pour les traitements fondés sur cette base légale, sans que ce
          retrait ne remette en cause la licéité des traitements antérieurs.
        </li>
        <li>
          <strong>Droit de définir des directives post-mortem</strong>{' '}
          relatives à la conservation, à l'effacement et à la communication
          de ses données après son décès.
        </li>
      </ul>

      <h2>9. Comment exercer ses droits</h2>
      <p>
        Pour exercer l'un de ces droits, le membre adresse une demande écrite
        à <a href="mailto:betterzapp@gmail.com">betterzapp@gmail.com</a>,
        accompagnée d'une copie d'une pièce d'identité en cours de validité
        afin de vérifier son identité (article 12 du RGPD). L'éditeur
        s'engage à répondre dans un délai d'<strong>un (1) mois</strong>{' '}
        maximum à compter de la réception de la demande, conformément à
        l'article 12.3 du RGPD.
      </p>

      <h2>10. Cookies et traceurs</h2>
      <p>
        La plateforme utilise les catégories de cookies suivantes :
      </p>
      <ul>
        <li>
          <strong>Cookies strictement nécessaires</strong> : indispensables au
          fonctionnement du Service (gestion de session, authentification,
          sécurité). Leur dépôt ne nécessite pas de consentement préalable,
          conformément à l'article 82 de la loi Informatique et Libertés.
        </li>
        <li>
          <strong>Cookies de mesure d'audience anonymisée</strong> : utilisés
          uniquement avec consentement, dans le respect des
          recommandations de la CNIL. Aucune donnée d'identification
          individuelle n'est collectée à ces fins.
        </li>
      </ul>
      <p>
        L'éditeur n'utilise <strong>aucun cookie publicitaire</strong> et ne
        revend aucune donnée à des régies tierces.
      </p>

      <h2>11. Sécurité des données</h2>
      <p>
        L'éditeur met en œuvre les mesures techniques et organisationnelles
        suivantes afin d'assurer un niveau de sécurité approprié au regard
        des risques :
      </p>
      <ul>
        <li>Chiffrement des communications via HTTPS (TLS).</li>
        <li>
          Hachage robuste des mots de passe (algorithmes bcrypt/argon2,
          opérés par Supabase Auth).
        </li>
        <li>
          Mise en place du Row Level Security (RLS) sur l'ensemble des tables
          de la base de données, garantissant l'isolation des données entre
          membres.
        </li>
        <li>
          Restriction stricte des accès administrateurs et journalisation des
          actions sensibles.
        </li>
        <li>
          Audit de sécurité régulier de l'application et des dépendances
          tierces.
        </li>
        <li>
          Sauvegardes régulières et chiffrées de la base de données.
        </li>
      </ul>

      <h2>12. Notification de violation de données</h2>
      <p>
        En cas de violation de données personnelles susceptible d'engendrer un
        risque pour les droits et libertés des membres, l'éditeur s'engage à
        notifier l'autorité de contrôle compétente dans un délai maximum de{' '}
        <strong>soixante-douze (72) heures</strong> après en avoir pris
        connaissance, conformément à l'article 33 du RGPD.
      </p>
      <p>
        Lorsque la violation est susceptible d'engendrer un risque élevé, les
        membres concernés en sont informés dans les meilleurs délais, par
        courrier électronique, conformément à l'article 34 du RGPD.
      </p>

      <h2>13. Réclamation auprès d'une autorité de contrôle</h2>
      <p>
        Tout membre estimant que le traitement de ses données personnelles
        n'est pas conforme à la réglementation peut introduire une
        réclamation auprès d'une autorité de contrôle, notamment :
      </p>
      <ul>
        <li>
          En France : la Commission nationale de l'informatique et des
          libertés (
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            cnil.fr
          </a>
          ), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
        </li>
        <li>
          Dans les autres pays d'Afrique francophone : l'autorité nationale
          de protection des données du pays de résidence (par exemple,
          l'ARTCI en Côte d'Ivoire, la CDP au Sénégal, la CDP-BJ au Bénin).
        </li>
      </ul>

      <h2>14. Modifications de la politique de confidentialité</h2>
      <p>
        L'éditeur se réserve le droit de modifier la présente politique pour
        tenir compte de l'évolution réglementaire, jurisprudentielle ou
        technique. Toute modification substantielle sera notifiée aux membres
        par courriel avec un préavis de trente (30) jours avant son entrée en
        vigueur. La date de dernière mise à jour figure en haut de la
        présente page.
      </p>

      <h2>15. Contact</h2>
      <p>
        Pour toute question relative à la présente politique ou à l'exercice
        de ses droits, le membre peut écrire à :{' '}
        <a href="mailto:betterzapp@gmail.com">betterzapp@gmail.com</a>.
      </p>
      <p>
        Cette adresse fait également office de point de contact pour toute
        demande adressée au délégué à la protection des données (DPO), dont
        la nomination formelle pourra intervenir ultérieurement en fonction
        de l'évolution du Service. Pour consulter les autres informations
        légales, voir nos <Link to="/mentions-legales">Mentions légales</Link>{' '}
        et nos <Link to="/cgu">Conditions générales d'utilisation</Link>.
      </p>
    </LegalLayout>
  )
}
