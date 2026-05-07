import { createFileRoute, Link } from '@tanstack/react-router'
import { LegalLayout } from '@/components/legal/legal-layout'

export const Route = createFileRoute('/cgu')({
  component: CGUPage,
})

function CGUPage() {
  return (
    <LegalLayout
      title="Conditions générales d'utilisation"
      lastUpdated="6 mai 2026"
    >
      <h2>Préambule</h2>
      <p>
        Le Club IA est une plateforme communautaire francophone dédiée à
        l'intelligence artificielle, exploitée par la société{' '}
        <strong>BetterZapp LLC</strong>. Elle propose à ses membres un
        catalogue de formations en ligne, un coach IA conversationnel, une
        veille d'actualité automatisée, une bibliothèque de ressources
        téléchargeables et un espace communautaire d'échange entre membres.
      </p>
      <p>
        Les présentes Conditions générales d'utilisation (ci-après les « CGU »)
        ont pour objet de définir les conditions dans lesquelles l'éditeur met
        le service à disposition des utilisateurs et les modalités selon
        lesquelles ces derniers y accèdent.
      </p>
      <p>
        L'éditeur s'engage à fournir un service de qualité, à informer
        régulièrement les membres des évolutions de la plateforme et à traiter
        leurs demandes avec diligence.
      </p>

      <h2>1. Définitions</h2>
      <ul>
        <li>
          <strong>« Plateforme »</strong> ou <strong>« Service »</strong> :
          désigne le site et l'application Le Club IA accessibles à l'adresse
          leclubia.com.
        </li>
        <li>
          <strong>« Éditeur »</strong> : désigne BetterZapp LLC, exploitant la
          plateforme.
        </li>
        <li>
          <strong>« Membre »</strong> ou <strong>« Utilisateur »</strong> :
          désigne toute personne physique ayant créé un compte et souscrit un
          abonnement actif à la plateforme.
        </li>
        <li>
          <strong>« Compte »</strong> : désigne l'espace personnel du membre,
          accessible après authentification.
        </li>
        <li>
          <strong>« Abonnement »</strong> : désigne le contrat par lequel le
          membre acquiert le droit d'accéder au Service pour une durée d'un an,
          contre paiement.
        </li>
        <li>
          <strong>« Contenu »</strong> : désigne tout élément publié sur la
          plateforme, qu'il soit produit par l'éditeur (formations, articles,
          ressources) ou par les membres (publications, commentaires).
        </li>
      </ul>

      <h2>2. Acceptation des CGU</h2>
      <p>
        En créant un compte, l'utilisateur reconnaît avoir lu, compris et
        accepté sans réserve l'intégralité des présentes CGU. L'inscription
        vaut signature électronique au sens de la loi.
      </p>
      <p>
        L'éditeur se réserve le droit de modifier les CGU à tout moment afin
        de les adapter à l'évolution du service, à la réglementation ou à la
        jurisprudence. Toute modification substantielle sera notifiée par
        courrier électronique à l'adresse associée au compte du membre, avec
        un préavis minimum de <strong>trente (30) jours</strong> avant son
        entrée en vigueur. À défaut d'opposition manifestée par la fermeture
        du compte avant cette date, les nouvelles CGU s'appliqueront de plein
        droit.
      </p>

      <h2>3. Inscription et création de compte</h2>
      <p>
        L'accès au Service est réservé aux personnes physiques majeures,
        c'est-à-dire âgées d'au moins <strong>dix-huit (18) ans</strong>. Les
        mineurs souhaitant accéder au Service doivent obtenir l'autorisation
        préalable et écrite de leur représentant légal, qui demeurera
        responsable de leur usage de la plateforme.
      </p>
      <p>
        Lors de l'inscription, l'utilisateur s'engage à fournir des
        informations exactes, sincères et à jour, notamment une adresse
        électronique valide. Il est seul responsable de la confidentialité de
        son mot de passe et des actions réalisées depuis son compte.
      </p>
      <p>
        Un compte est strictement personnel : <strong>le partage de compte
        entre plusieurs personnes est interdit</strong>. L'éditeur se réserve
        le droit de suspendre ou de supprimer tout compte présentant des
        signes d'usage frauduleux, multi-comptes ou collectifs, sans préavis
        ni remboursement.
      </p>

      <h2>4. Abonnement et paiement</h2>
      <p>
        L'accès au Service est subordonné à la souscription d'un abonnement
        annuel au tarif unique de{' '}
        <strong>79&nbsp;000 FCFA TTC par an</strong>, soit environ 120 €
        toutes taxes comprises selon le taux de change en vigueur.
      </p>
      <p>
        Le paiement s'effectue par mobile money via les opérateurs partenaires{' '}
        <strong>Orange Money</strong>, <strong>Wave</strong>,{' '}
        <strong>MTN Money</strong> et <strong>Moov Money</strong>, dans le
        cadre de leurs propres conditions générales. Le traitement du paiement
        est confié à un prestataire tiers agréé. L'éditeur ne stocke aucune
        donnée bancaire ou de paiement sur ses serveurs.
      </p>
      <p>
        L'accès au Service est activé immédiatement à la confirmation du
        paiement par le partenaire de paiement. Une facture électronique est
        adressée par courriel.
      </p>
      <p>
        L'abonnement <strong>ne se reconduit pas automatiquement</strong>. À
        l'échéance annuelle, le membre choisit librement de renouveler ou non
        son abonnement. Aucun débit ne sera effectué sans action explicite de
        sa part.
      </p>

      <h2>5. Droit de rétractation</h2>
      <p>
        Conformément aux articles L.221-18 et suivants du Code de la
        consommation et à la directive européenne 2011/83/UE, l'utilisateur
        ayant la qualité de consommateur dispose d'un délai de{' '}
        <strong>quatorze (14) jours</strong> à compter de la confirmation de
        son abonnement pour exercer son droit de rétractation, sans avoir à
        motiver sa décision.
      </p>
      <p>
        Toutefois, conformément à l'article L.221-28 du Code de la
        consommation, le droit de rétractation ne peut être exercé pour les
        contrats de fourniture de contenu numérique non fourni sur un support
        matériel dont l'exécution a commencé après accord préalable exprès du
        consommateur et renoncement exprès à son droit de rétractation. Le
        membre est informé qu'en accédant au Service avant la fin du délai de
        14 jours, il reconnaît expressément renoncer à son droit de
        rétractation.
      </p>
      <p>
        Pour exercer le droit de rétractation, le membre adresse une demande
        écrite à <a href="mailto:betterzapp@gmail.com">betterzapp@gmail.com</a>{' '}
        en précisant son adresse de facturation et la date de souscription.
      </p>

      <h2>6. Services inclus</h2>
      <p>
        L'abonnement annuel donne accès, pour la durée du contrat, à
        l'ensemble des services suivants :
      </p>
      <ul>
        <li>
          Accès illimité au catalogue de formations vidéo en ligne, mises à
          jour régulièrement par l'éditeur.
        </li>
        <li>
          Accès à l'espace communautaire et publication de contenus dans le
          respect des règles définies à l'article 7.
        </li>
        <li>
          Accès au coach IA conversationnel, dans la limite de{' '}
          <strong>trente (30) messages par jour</strong> (quota technique
          permettant de répartir équitablement la ressource entre tous les
          membres).
        </li>
        <li>
          Accès à la bibliothèque de ressources téléchargeables (prompts,
          guides, modèles, liens vers outils).
        </li>
        <li>
          Accès aux actualités IA résumées en français par l'agent éditorial
          automatique.
        </li>
        <li>
          Système de notifications relatif à la vie de la communauté et aux
          mises à jour du Service.
        </li>
      </ul>
      <p>
        L'éditeur se réserve la possibilité de faire évoluer ces services,
        d'en ajouter, ou d'en retirer, sans que cela puisse être considéré
        comme une rupture du contrat, dès lors que le périmètre global du
        Service reste sensiblement équivalent.
      </p>

      <h2>7. Engagements et obligations du membre</h2>
      <p>
        Chaque membre s'engage, dans le cadre de son utilisation du Service, à
        respecter les principes suivants :
      </p>
      <ul>
        <li>
          Faire preuve de respect, de bienveillance et de courtoisie envers
          les autres membres et les modérateurs. Sont strictement prohibés
          tout propos injurieux, diffamatoire, raciste, discriminatoire,
          sexiste, homophobe, ainsi que toute forme de harcèlement.
        </li>
        <li>
          Ne pas publier de contenus illégaux, contrevenant à l'ordre public
          ou aux bonnes mœurs, ni de contenus relevant de la pédopornographie,
          de l'apologie du terrorisme ou de l'incitation à la haine.
        </li>
        <li>
          Ne pas utiliser le Service à des fins de spam, de promotion
          commerciale non sollicitée, de prospection de membres pour des
          services concurrents ou tiers.
        </li>
        <li>
          Ne pas partager, reproduire ni diffuser hors de la plateforme les
          contenus exclusifs édités par Le Club IA (formations, articles,
          ressources), sauf autorisation expresse.
        </li>
        <li>
          Ne pas mettre en œuvre de procédés automatisés (scrapers, bots,
          scripts) en vue d'accéder, d'extraire ou de copier en masse les
          contenus de la plateforme.
        </li>
        <li>
          Ne pas tenter de contourner les limitations techniques (quotas,
          paywall, contrôle d'accès) ni de compromettre la sécurité du
          Service.
        </li>
      </ul>

      <h2>8. Modération</h2>
      <p>
        L'éditeur se réserve le droit, à sa seule discrétion et sans préavis,
        de modérer, masquer, modifier ou supprimer tout contenu publié par un
        membre qui ne respecterait pas les présentes CGU ou qui serait jugé
        contraire à l'intérêt général de la communauté.
      </p>
      <p>
        En cas de manquement grave ou répété aux engagements définis à
        l'article 7, l'éditeur pourra prononcer la suspension temporaire ou
        l'exclusion définitive du membre concerné. Une exclusion pour faute
        n'ouvre droit à <strong>aucun remboursement</strong> de l'abonnement
        en cours.
      </p>

      <h2>9. Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus produits par Le Club IA (formations, articles,
        ressources, interface, design, marque, logo) reste la propriété
        exclusive de BetterZapp LLC ou de ses partenaires. Le membre ne
        bénéficie que d'un droit personnel, non exclusif, non transférable et
        non cessible d'accès et d'usage de ces contenus pendant la durée de
        son abonnement.
      </p>
      <p>
        En publiant un contenu sur la plateforme (publication, commentaire,
        photo de profil, etc.), le membre conserve la propriété intellectuelle
        de ce contenu. Il accorde toutefois à l'éditeur une{' '}
        <strong>licence gratuite, non exclusive et mondiale</strong>{' '}
        d'affichage, de reproduction et de communication publique de ce
        contenu sur la plateforme, pour la durée de la publication et pour les
        besoins de l'exécution du Service.
      </p>
      <p>
        Toute reproduction, redistribution ou exploitation commerciale,
        partielle ou totale, des contenus exclusifs de la plateforme est
        rigoureusement interdite et passible de poursuites.
      </p>

      <h2>10. Limitations de responsabilité</h2>
      <p>
        Le Service est fourni « en l'état », sans garantie expresse ou
        implicite quant à son adéquation à un usage particulier. L'éditeur
        s'engage à mettre tous les moyens raisonnables à sa disposition pour
        assurer la disponibilité, la sécurité et l'intégrité du Service, sans
        toutefois pouvoir garantir un fonctionnement ininterrompu, exempt
        d'erreurs ou parfaitement sécurisé.
      </p>
      <p>
        Les contenus produits par le coach IA, par l'agent éditorial
        d'actualité ou publiés par les membres sont fournis à titre
        informatif. L'éditeur <strong>ne garantit aucun résultat
        commercial, financier, professionnel ou pédagogique</strong> à raison
        de l'utilisation du Service, et décline toute responsabilité quant aux
        décisions prises par le membre sur la base de ces contenus.
      </p>
      <p>
        L'éditeur ne pourra en aucun cas être tenu responsable des dommages
        indirects, immatériels ou consécutifs (perte de chiffre d'affaires,
        perte de clientèle, perte de données, atteinte à l'image de marque)
        résultant de l'utilisation, de l'incapacité d'utiliser le Service ou
        de toute interruption de celui-ci.
      </p>

      <h2>11. Données personnelles</h2>
      <p>
        Le traitement des données personnelles des membres est régi par notre{' '}
        <Link to="/confidentialite">Politique de confidentialité</Link>,
        conforme au Règlement général sur la protection des données (RGPD) et
        à la loi française « Informatique et Libertés » modifiée. Le membre
        est invité à en prendre connaissance.
      </p>

      <h2>12. Résiliation</h2>
      <p>
        Le membre peut, à tout moment et sans frais, résilier son abonnement
        et supprimer son compte depuis son espace de profil. La suppression du
        compte est définitive et entraîne la perte des données associées
        (progression dans les formations, publications, commentaires,
        historique de conversations avec le coach IA), sous réserve des
        durées de conservation imposées par la réglementation.
      </p>
      <p>
        L'éditeur se réserve la faculté de résilier l'abonnement d'un membre
        en cas de violation grave ou répétée des présentes CGU, après mise en
        demeure restée infructueuse pendant un délai de quinze (15) jours.
      </p>
      <p>
        Aucun remboursement, même au prorata de la période non consommée, ne
        sera dû en cas de résiliation à l'initiative du membre ou pour faute
        de celui-ci. Un remboursement intégral pourra être envisagé en cas de
        défaillance technique majeure et durable du Service rendant son
        utilisation impossible, après examen au cas par cas.
      </p>

      <h2>13. Droit applicable et juridiction compétente</h2>
      <p>
        Les présentes CGU sont soumises à différents droits selon le pays de
        résidence du membre, afin de respecter les dispositions impératives
        applicables aux consommateurs :
      </p>
      <ul>
        <li>
          Pour les membres résidant en <strong>France</strong> : les CGU sont
          régies par le droit français. Tout litige sera soumis à la
          compétence exclusive des tribunaux de Paris, sous réserve des
          dispositions impératives applicables aux consommateurs.
        </li>
        <li>
          Pour les membres résidant dans un État de l'<strong>Afrique
          francophone</strong> : les CGU sont régies par le droit ivoirien.
          Tout litige sera soumis à la compétence des tribunaux d'Abidjan,
          sous réserve des dispositions impératives applicables.
        </li>
        <li>
          Pour les membres résidant <strong>dans tout autre État</strong> : le
          droit français s'applique par défaut, sous réserve des dispositions
          impératives applicables au membre.
        </li>
      </ul>
      <p>
        Préalablement à toute procédure contentieuse, le membre s'engage à
        rechercher une solution amiable en contactant l'éditeur à l'adresse
        ci-dessous.
      </p>

      <h2>14. Indépendance des clauses</h2>
      <p>
        Si une ou plusieurs stipulations des présentes CGU étaient jugées
        invalides ou déclarées telles en application d'une loi, d'un règlement
        ou à la suite d'une décision définitive d'une juridiction compétente,
        les autres stipulations conserveraient toute leur force et leur portée.
      </p>

      <h2>15. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU, à l'exécution du
        Service ou à l'exercice de ses droits, le membre peut contacter
        l'éditeur à l'adresse suivante :{' '}
        <a href="mailto:betterzapp@gmail.com">betterzapp@gmail.com</a>.
      </p>
    </LegalLayout>
  )
}
