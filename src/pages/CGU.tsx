import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileText, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CGU = () => {
  const lastUpdate = "20/01/2026";

  const sections = [
    {
      id: "definitions",
      title: "1. Définitions",
      content: `Les définitions ci-dessous s'appliquent à l'ensemble des présentes CGU :

• « CGU » : désigne les présentes conditions générales d'utilisation.
• « Client » : désigne toute personne physique ou morale utilisant la Plateforme afin d'être mise en relation avec un Partenaire pour bénéficier d'une Prestation.
• « Commande » : désigne toute commande d'une Prestation effectuée par un Client.
• « Compte » : désigne l'espace numérique, personnel et individualisé, créé par un Utilisateur sur la Plateforme.
• « Contenu » : désigne l'ensemble des propos, messages, informations ou données publiés sur la Plateforme par les Utilisateurs.
• « Partenaire » : désigne un travailleur indépendant ou une personne morale exerçant une activité de Services ou de Services à la Personne, régulièrement inscrit(e) sur la Plateforme, et disposant des compétences et certifications nécessaires à la réalisation de Prestations.
• « Plateforme » : désigne la plateforme de mise en relation opérée par Bikawo, accessible depuis le Site et/ou l'Application Bikawo, permettant la réalisation des Services.
• « Prestation » : désigne, au sens des présentes, les prestations proposées via la Plateforme et réalisées par un Partenaire au bénéfice d'un Client, notamment des prestations de garde d'enfants à domicile et/ou de ménage.
• « Prestation Récurrente » : désigne une Prestation souscrite par un Client avec une régularité (hebdomadaire, bimensuelle, mensuelle, plusieurs fois par semaine), réalisée par un Partenaire déterminé.
• « Services » : désigne les services fournis par Bikawo aux Utilisateurs, incluant notamment la mise en relation et les services permettant d'organiser et coordonner des Services à la Personne (ex. information, intermédiation, suivi, facturation, envoi d'attestation fiscale).
• « Service à la Personne » : désigne exclusivement les activités relevant des articles L.7231-1 et suivants et D.7231-1 et suivants du Code du travail (ex. entretien de la maison et travaux ménagers), à l'exclusion de toute activité soumise à agrément, conformément à la loi.
• « Site » : désigne le site internet accessible à l'adresse https://bikawo.com/ ainsi que l'ensemble de ses sous-domaines.
• « Utilisateur » : désigne indifféremment un Client ou un Partenaire utilisant la Plateforme.
• « Bikawo » : désigne l'auto-entreprise enregistrée à l'INPI sous le numéro 880 491 436, domiciliée 231 rue Saint-Honoré, Paris. L'activité de Bikawo est dédiée aux services à la personne (notamment : ménage, garde d'enfants, gestion animalière, accompagnement de personnes âgées, etc.).

Sauf exigence contraire résultant du contexte, les termes définis au singulier incluent le pluriel, et inversement.`
    },
    {
      id: "objet",
      title: "2. Objet et portée des CGU",
      content: `Bikawo exploite la Plateforme, un service numérique de mise en relation permettant aux Partenaires d'être mis en relation avec des Clients afin que ces derniers bénéficient de Prestations.

Les présentes CGU ont pour objet :
• de définir les modalités d'accès et d'utilisation de la Plateforme ;
• de préciser les droits et obligations de Bikawo, des Partenaires et des Clients dans le cadre de l'utilisation de la Plateforme.

Les CGU ne régissent pas la relation contractuelle entre le Client et le Partenaire pour l'exécution des Prestations.

En qualité d'opérateur de plateforme en ligne, Bikawo n'assume aucune obligation au titre de la relation contractuelle entre Client et Partenaire. Le rôle de Bikawo est strictement limité à la fourniture des Services.

Les présentes CGU s'appliquent à toute utilisation de la Plateforme opérée par Bikawo.`
    },
    {
      id: "inscription-client",
      title: "3. Inscription et acceptation des CGU",
      content: `3.1. Pour le Client

Le Client peut créer un Compte et s'inscrire sur la Plateforme via le Site, soit au cours du processus de réservation d'une Commande, soit en cliquant sur « Créer un compte » dans l'onglet « Connexion ».

Lors de sa première connexion, le Client doit renseigner les informations nécessaires à la création de son Compte, à savoir : nom, prénom, adresse email, numéro de téléphone et coordonnées de son domicile. Le Client garantit à Bikawo disposer du pouvoir et de la capacité nécessaires pour créer un Compte et utiliser les Services.

Conformément à l'article L.223-2 du Code de la consommation, le Client est informé de la possibilité de s'inscrire sur la liste d'opposition au démarchage téléphonique : https://www.bloctel.gouv.fr/.

Au moment de la création du Compte, le Client reconnaît avoir pris connaissance des CGU avant toute Commande et matérialise son consentement en cochant la case « J'accepte les conditions générales d'utilisation ». Le Client est libre d'accepter ou de refuser les CGU.

À compter de l'acceptation des CGU et/ou à l'issue du processus de réservation, le Client reçoit un email confirmant la création de son Compte.

3.2. Pour le Partenaire

Le Partenaire peut s'inscrire sur la Plateforme et créer un Compte via le Site, dans la section dédiée aux Prestataires.

Lors de sa première connexion, le Partenaire doit obligatoirement fournir les informations suivantes : nom, prénom, numéro SIREN, casier judiciaire, adresse email, date de naissance, téléphone, adresse, ainsi que son domaine d'activité parmi les choix proposés.

Le Partenaire garantit à Bikawo disposer du pouvoir et de la capacité nécessaires pour créer un Compte et utiliser les Services.

Le Partenaire reconnaît avoir pris connaissance des CGU avant toute conclusion de contrat et matérialise son consentement en cochant la case « J'accepte les conditions générales d'utilisation ». Il est libre d'accepter ou de refuser les CGU.

Après acceptation, le Partenaire reçoit un email confirmant la création du Compte, incluant une copie PDF des CGU acceptées.`
    },
    {
      id: "conditions-partenaires",
      title: "4. Conditions d'inscription spécifiques aux Partenaires",
      content: `Afin de finaliser la création du Compte et de pouvoir réaliser des Prestations, le Partenaire doit :

• fournir un justificatif d'identité autorisant le travail en France ;
• fournir un document attestant de son statut légal (n° SIRET ou immatriculation RCS) ;
• fournir une photographie destinée à être transmise aux Clients ;
• fournir une attestation de vigilance URSSAF, à renouveler au maximum tous les six (6) mois ou, à défaut, tout document équivalent justifiant du respect des obligations de déclaration et de paiement ;
• pour toute activité de Services à la Personne (ex. ménage, garde d'enfant) : fournir (i) un extrait de casier judiciaire et (ii) la déclaration de services à la personne.

Le Partenaire reconnaît et accepte que Bikawo peut organiser un entretien téléphonique et mettre en œuvre un processus de vérification des compétences, notamment via un test. Bikawo peut refuser une inscription sans avoir à en justifier.

L'activation et le maintien du Compte sont conditionnés à la fourniture et à la mise à jour régulière des justificatifs requis.`
    },
    {
      id: "evolution-services",
      title: "5. Évolution des Services et modification des CGU",
      content: `Afin d'améliorer son fonctionnement et la qualité des Services, Bikawo peut faire évoluer les caractéristiques et fonctionnalités de la Plateforme.

Bikawo peut modifier unilatéralement les CGU concernant les aspects techniques de la Plateforme et des Services dès lors que ces modifications n'entraînent ni hausse de prix ni altération de qualité, et que les caractéristiques déterminantes de l'engagement de l'Utilisateur figurent dans les CGU.

Pour toute autre modification des CGU ou des Services, Bikawo informera l'Utilisateur par tout moyen au moins vingt (20) jours avant l'entrée en vigueur.

À défaut d'objection dans ce délai, les modifications seront réputées acceptées. En cas de refus, les CGU seront immédiatement résiliées et l'Utilisateur devra cesser d'utiliser la Plateforme et les Services, sous réserve de l'exécution des obligations en cours (notamment l'exécution des Commandes en cours).`
    },
    {
      id: "acces-compte",
      title: "6. Accès, usage et sécurité du Compte",
      content: `L'accès à la Plateforme et aux Services est réservé aux Utilisateurs. Chaque Utilisateur reconnaît être responsable de l'accès et de l'utilisation de son Compte.

Sauf défaillance technique imputable à Bikawo ou cas de force majeure, l'Utilisateur est responsable de la confidentialité de ses identifiants et s'engage à prendre toutes mesures nécessaires pour en assurer la sécurité.

En cas de perte, vol, détournement, compromission des identifiants ou d'utilisation non autorisée du Compte, l'Utilisateur doit en informer immédiatement Bikawo. Dans une telle situation, l'Utilisateur autorise Bikawo à prendre toutes mesures appropriées afin d'empêcher tout accès non autorisé.`
    },
    {
      id: "realisation-prestations",
      title: "7. Réalisation des Prestations",
      content: `7.1. Commande

Le Client peut effectuer une Commande sur le Site en sélectionnant une ou plusieurs Prestations parmi les catégories proposées, puis en renseignant la date et l'heure souhaitées. Les Prestations ne peuvent être réalisées qu'aux créneaux indiqués sur le Site. Certaines plages horaires peuvent donner lieu à un supplément tarifaire, indiqué au moment de la Commande.

Avant validation, le Client dispose d'un récapitulatif et peut indiquer des demandes particulières ou instructions à destination du partenaire sélectionné. Le Client reconnaît que ces informations sont fournies à titre indicatif et n'engagent pas le Partenaire.

Pour les Services à la Personne, le Client peut obtenir gratuitement un devis lorsque le prix total est supérieur ou égal à 75 € TTC. Le Client et le Partenaire peuvent, d'un commun accord, modifier une Commande avant la date prévue.

7.2. Mise en relation des Clients et des Partenaires

Après validation, la Commande est transmise aux Partenaires disponibles correspondant le mieux à la demande. Une Commande est confirmée dès lors qu'un Partenaire l'accepte. Le Client est informé que les Partenaires exécutent les Prestations de Services à la Personne selon le mode prestataire au sens de la réglementation applicable (article L.7232-6 3° du Code du travail).

Bikawo propose la Commande à un Partenaire sur la base d'un score tenant compte notamment :
• de la capacité de fidélisation des Clients par le Partenaire ; et/ou
• du nombre d'annulations de commandes imputables au Partenaire.

L'attribution prend également en compte la localisation des Partenaires et des Clients. Le Partenaire demeure libre d'accepter ou de refuser une proposition via la fonctionnalité prévue.

7.3. Rétractation et annulation d'une Commande

Lorsqu'une Commande est validée plus de quatorze (14) jours à l'avance, le Client bénéficie du droit légal de rétractation. Il peut l'exercer en annulant la Commande sur la Plateforme via la fonctionnalité dédiée, sans frais.

Lorsqu'une Commande est validée moins de quatorze (14) jours à l'avance, le Client demande l'exécution de la Prestation avant la fin du délai de rétractation et reconnaît renoncer expressément à ce droit.

Lorsque le Client a renoncé à la rétractation et annule la Commande, les frais suivants s'appliquent :
• annulation plus de 24h avant : aucun frais ;
• annulation entre 8h et 24h : frais forfaitaires de 5 € ;
• annulation entre 4h et 8h : frais forfaitaires de 10 € ;
• annulation entre 2h et 4h : 50 % du montant (plafond 15 €) ;
• annulation entre 2h et l'heure du rendez-vous : 80 % (plafond 25 €) ;
• annulation après l'heure prévue, ou absence 30 minutes après : 100 % (plafond 30 €).

7.4. Déroulement des Prestations

Bikawo n'assume aucune responsabilité quant à l'acceptation ou au rejet des Prestataires sur la Plateforme, ni quant à leurs capacités. Bikawo n'intervient pas dans l'exécution du Service, laquelle relève exclusivement du Partenaire.

Le Partenaire demeure seul responsable, notamment des produits utilisés, de son apparence et de son comportement. À l'issue d'une Prestation, le Client peut évaluer la Prestation via un système de notation. Les évaluations ont vocation à être définitives et ne sont supprimées qu'exceptionnellement, sur demande expresse de leur auteur.`
    },
    {
      id: "conditions-financieres",
      title: "8. Conditions financières",
      content: `8.1. Prix des Prestations

Le prix des prestations est affiché sur la Plateforme. Le Client règle les Prestations par carte bancaire, via l'avance immédiate URSSAF, ou tout autre moyen proposé sur la Plateforme.

Bikawo se réserve le droit de modifier les prix affichés, sans affecter les Commandes déjà confirmées.

La rémunération du Partenaire correspond au montant indiqué avant acceptation de la Prestation.
La rémunération de Bikawo correspond à la différence entre le prix accepté par le Partenaire et le prix payé par le Client.

8.2. Paiement des Prestations

Le paiement fait l'objet d'une pré-autorisation bancaire 24h avant le début de la Prestation et est débité dans les 24h suivant sa réalisation.

Dans le cadre de l'avance immédiate de crédit d'impôt, les montants dus au titre des prestations sont prélevés par l'URSSAF Caisse nationale sur le compte bancaire du Client.

La rémunération du Partenaire est reversée via Stripe par Bikawo sur le compte bancaire indiqué par le Partenaire.

Les versements au Partenaire sont effectués par défaut de manière hebdomadaire, ou mensuelle sur demande, avec un délai supplémentaire de 2 à 5 jours pour la transmission.

Pour la gestion des flux financiers, Bikawo utilise Stripe (Stripe Connect), soumis à ses conditions d'utilisation : https://stripe.com/fr/legal/connect-account.

8.3. Facturation

À l'issue de la Prestation, le Partenaire doit activer le processus de facturation via la fonctionnalité dédiée dans son espace Bikawo, attestant la bonne exécution. Cette action déclenche l'émission de la facture et le prélèvement correspondant.

Les factures Client sont disponibles dans le Compte dans les 24h suivant la Prestation. Une attestation fiscale est mise à disposition en début d'année civile.

8.4. Mandat de facturation

Le Partenaire donne mandat exprès à Bikawo, qui l'accepte, pour établir en son nom et pour son compte les factures relatives aux Prestations. Le Partenaire demeure seul responsable de ses obligations légales et fiscales, notamment en matière de TVA.

8.5. Avance immédiate du crédit d'impôt

Les Clients peuvent bénéficier de l'avance immédiate de crédit d'impôt. Pour en bénéficier, le Client doit :
• disposer d'une adresse en France ;
• appartenir à un foyer fiscal ayant déjà déclaré ses revenus et être à jour ;
• disposer d'un mandat SEPA actif au bénéfice de l'URSSAF ;
• avoir accès à son compte www.particulier.urssaf.fr ;
• disposer de fonds suffisants pour payer la Prestation.`
    },
    {
      id: "engagements-bikawo",
      title: "9. Engagements de Bikawo",
      content: `Bikawo s'engage à mettre la Plateforme et les Services à disposition des Utilisateurs et à faire ses meilleurs efforts pour en assurer l'accessibilité et le bon fonctionnement.

La Plateforme est accessible 24h/24 et 7j/7, sauf force majeure, fait imprévisible et insurmontable d'un tiers, ou opérations de maintenance/mise à jour nécessaires.

Bikawo met à disposition un support accessible à l'adresse contact@bikawo.com pour toute question ou assistance.

En cas d'anomalie ou de dysfonctionnement, Bikawo s'engage à mettre en œuvre ses meilleurs efforts pour rétablir le service.`
    },
    {
      id: "responsabilite-bikawo",
      title: "10. Responsabilité de Bikawo",
      content: `Les Utilisateurs reconnaissent que la responsabilité de Bikawo est strictement limitée à son rôle d'opérateur de plateforme en ligne.

Bikawo n'est en aucun cas responsable des Prestations, celles-ci étant réalisées par les Partenaires.

Bikawo ne saurait être tenue responsable des difficultés temporaires d'accès dues à une faute de l'Utilisateur, à un événement extérieur, à un cas de force majeure, à des perturbations des réseaux ou aux limites d'Internet.

En tout état de cause, si la responsabilité de Bikawo était engagée, elle est limitée aux dommages certains, directs et prévisibles, et l'indemnisation est plafonnée au coût effectivement supporté par l'Utilisateur.`
    },
    {
      id: "engagements-utilisateurs",
      title: "11. Engagements des Utilisateurs",
      content: `11.1. Engagements communs

L'Utilisateur s'engage notamment à :
• respecter les lois et règlements, l'ordre public, les bonnes mœurs, et les droits des tiers ;
• ne pas permettre à un tiers d'utiliser son Compte ;
• ne pas publier de contenus injurieux, diffamatoires, dénigrants, contrefaisants, ou portant atteinte aux droits de tiers ou à l'image de Bikawo ;
• ne pas utiliser la Plateforme de manière frauduleuse (ex. fausse identité) ;
• ne pas céder son Compte ;
• fournir les informations nécessaires à l'exécution des Services et garantir leur exactitude ;
• utiliser loyalement la Plateforme (inscription, Commandes, notation) ;
• informer Bikawo de tout problème rencontré ;
• conserver strictement confidentiels les échanges et informations liés aux Prestations et Commandes.

Il est strictement interdit :
• tout acte visant à interrompre ou altérer le fonctionnement de la Plateforme ;
• toute intrusion ou tentative d'intrusion ;
• tout détournement des ressources ;
• toute charge disproportionnée sur les infrastructures ;
• toute atteinte aux mesures de sécurité ;
• tout acte portant atteinte aux droits et intérêts de Bikawo et/ou des Utilisateurs.

11.2. Engagements du Client

Le Client s'engage à :
• adopter une attitude correcte et respectueuse envers les Partenaires ;
• ne pas annuler de manière récurrente ;
• mettre le Partenaire en mesure d'exécuter la Prestation dans de bonnes conditions ;
• informer le Partenaire de conditions particulières, notamment de la présence d'animaux ;
• ne pas solliciter le Partenaire en dehors de la Plateforme après une Prestation ;
• n'utiliser les Services qu'à son domicile (résidence principale ou secondaire).

11.3. Engagements du Partenaire

Le Partenaire s'engage à :
• honorer les rendez-vous acceptés ;
• effectuer la déclaration de services à la personne via la téléprocédure : https://nova.entreprises.gouv.fr/ ;
• maintenir les compétences nécessaires ;
• agir loyalement et ne pas inciter les Clients à réserver hors Plateforme ;
• respecter la réglementation applicable aux services à la personne.`
    },
    {
      id: "responsabilite-utilisateurs",
      title: "12. Responsabilité des Utilisateurs",
      content: `L'Utilisateur est responsable de l'usage qu'il fait de la Plateforme et des Services, ainsi que des dommages résultant de son comportement ou d'informations inexactes, incomplètes ou trompeuses fournies lors de l'inscription ou en cas de non-mise à jour.

Plus spécifiquement, les Utilisateurs sont responsables :
• des informations publiées via leur Compte ;
• de la négociation, conclusion et exécution de leurs contrats de prestation, Bikawo n'étant qu'un intermédiaire de mise en relation.`
    },
    {
      id: "duree-resiliation",
      title: "13. Durée, suspension et résiliation",
      content: `13.1. Durée

Les CGU sont conclues pour une durée indéterminée et entrent en vigueur à compter de leur acceptation.

13.2. Limitations du Compte pour les Partenaires

Limitations manuelles : Le Compte et les Services pourront être limités pour une durée déterminée notamment si :
• messages désobligeants/agressifs envers Bikawo ;
• comportement agressif envers les Clients ;
• avis négatifs répétés ;
• rendez-vous non honoré sans prévenir ;
• annulations répétées de rendez-vous acceptés.

Limitations automatiques : Le Compte et les Services seront limités si le Partenaire annule quatre (4) Prestations différentes moins de 24h avant le début d'un mois calendaire. La limitation automatique dure 72h.

13.3. Résiliation des CGU

Entre le Client et Bikawo :
Bikawo et le Client peuvent résilier à tout moment, par tout moyen, sans motif ni préavis. En cas de manquement grave ou répété, résiliation sans préavis et annulation automatique des commandes.

Entre le Partenaire et Bikawo :
• Résiliation par le Partenaire : sans motif avec un préavis de 28 jours, par email. Les Commandes en cours doivent être honorées.
• Résiliation par Bikawo : avec un préavis dépendant de l'ancienneté (aucun préavis si moins de 3 mois, 7 jours entre 3 et 6 mois, 15 jours entre 6 mois et 1 an, 1 mois entre 1 et 2 ans, 2 mois au-delà).`
    },
    {
      id: "obligations-fiscales",
      title: "14. Respect des obligations fiscales et sociales",
      content: `Le Partenaire est informé que son activité génère des obligations légales, fiscales, sociales administratives dont il doit s'acquitter. Il demeure seul responsable des déclarations et formalités, notamment du paiement des cotisations et contributions sociales.

Le Partenaire est invité à consulter :
• impôts : https://www.impots.gouv.fr/portail/node/10841`
    },
    {
      id: "autonomie",
      title: "15. Autonomie et indépendance",
      content: `Bikawo et le Partenaire exercent en autonomie totale, chacun supportant les risques liés à son activité.

Le Partenaire choisit librement ses jours d'activité et de repos, ainsi que son matériel. Il n'existe aucune exclusivité, aucune obligation de CA, ni de niveau minimal d'activité.

Le Partenaire peut développer sa clientèle via la Plateforme, notamment :
• les Prestations Récurrentes étant réalisées avec le même Partenaire tant que le Client maintient l'abonnement ;
• la possibilité pour le Client de sélectionner un Partenaire lors d'une nouvelle Commande.

Le Partenaire est informé qu'il peut bénéficier du soutien de Bikawo au titre de la responsabilité sociale de plateforme (articles L.7342-1 et suivants du Code du travail).`
    },
    {
      id: "indemnisation",
      title: "16. Indemnisation",
      content: `Bikawo n'étant pas partie au contrat Client/Partenaire, elle n'est pas responsable des dommages pouvant survenir lors de l'exécution d'une commande.

Toutefois, certains dommages matériels liés à la casse ou à l'endommagement d'un bien peuvent être indemnisés par Bikawo à titre gracieux, sans reconnaissance d'obligation légale.

Le Client doit transmettre :
• déclaration circonstanciée ;
• photos ;
• facture d'origine ou devis équivalent ;
• attestation d'irréparabilité si applicable.

Transmission exclusivement à contact@bikawo.com, dans un délai de 72h après la Prestation.

Franchise 200 € et clause de vétusté (10 %/an plafonnée à 50 %).

Barème d'indemnisation :
• < 200 € : non pris en charge
• 200 € à 1 000 € : prise en charge possible ; bons d'achat jusqu'à 150 €, au-delà virement bancaire
• > 1 000 € : prise en charge par l'assureur

Exclusions : vol, œuvres d'art, rayures/taches n'empêchant pas l'usage, prestations hors Plateforme.`
    },
    {
      id: "propriete-intellectuelle",
      title: "17. Propriété intellectuelle",
      content: `La Plateforme, le Site et l'ensemble de leurs éléments (logiciels, infrastructures, bases de données, contenus, textes, images, logos, marques…) sont protégés par les droits de propriété intellectuelle.

L'utilisateur reconnaît que ces éléments sont la propriété exclusive de Bikawo ou de ses partenaires et s'engage à ne pas les reproduire, modifier, distribuer ou exploiter de quelque manière que ce soit sans autorisation préalable écrite.`
    },
    {
      id: "donnees-personnelles",
      title: "18. Données personnelles",
      content: `Bikawo attache une importance particulière à la protection des données personnelles et au respect du RGPD (Règlement (UE) 2016/679).

Pour plus d'informations sur la collecte, le traitement et la protection de vos données personnelles, veuillez consulter notre Politique de Confidentialité.`
    },
    {
      id: "litiges",
      title: "19. Règlement des différends et médiation",
      content: `En cas de litige entre un Utilisateur et Bikawo, les parties s'engagent à rechercher une solution amiable.

La responsabilité de Bikawo, limitée à son rôle d'intermédiaire, ne peut être recherchée qu'en cas de mauvaise exécution d'une Prestation.

En cas de litige Partenaire/Client, Bikawo peut intervenir pour faciliter un règlement amiable. Dans ce cadre, Bikawo peut demander des éléments justificatifs (ex. photos), traités conformément à la politique de confidentialité.

Toute réclamation doit être adressée à contact@bikawo.com dans les 72h. Passé ce délai, elle ne sera pas traitée.`
    },
    {
      id: "divers",
      title: "20. Divers",
      content: `Les CGU remplacent tout accord antérieur.

Si une clause est nulle, les autres demeurent applicables.

Le fait de ne pas exercer un droit n'emporte pas renonciation.`
    },
    {
      id: "loi-applicable",
      title: "21. Loi applicable – Juridiction compétente",
      content: `Les CGU sont régies par le droit français.

Pour les professionnels :
Tout litige relatif aux CGU (validité, interprétation, exécution, rupture) relève du Tribunal de commerce de Paris, uniquement pour les litiges commerciaux Partenaire/Bikawo. Cette clause ne s'applique pas aux litiges Client/Bikawo ni Client/Partenaire.

Pour les consommateurs :
Conformément à l'article R.631-3 du Code de la consommation, le consommateur peut saisir, à son choix, la juridiction du lieu où il demeurait lors de la conclusion du contrat ou lors de la survenance du fait dommageable, outre les règles de compétence de droit commun.`
    },
    {
      id: "retractation",
      title: "22. Formulaire de rétractation",
      content: `Si vous souhaitez vous rétracter d'une prestation commandée, veuillez remplir ce formulaire et l'adresser à Bikawo par courrier ou par email à contact@bikawo.com.

À l'attention de Bikawo, 231 rue Saint-Honoré, 75001 Paris
Courriel : contact@bikawo.com

Je/nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat pour la prestation de services ci-dessous :

Description de la Prestation commandée : ________________________________
Commandé le (*) : ________________________________
Nom du consommateur : ________________________________
Adresse du consommateur : ________________________________
Signature du consommateur (uniquement en cas de notification sur papier) : ________________________________
Date : ________________________________

(*) Rayez la mention inutile.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Conditions Générales d'Utilisation | Bikawo</title>
        <meta name="description" content="Conditions Générales d'Utilisation de la plateforme Bikawo - Services à la personne" />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : {lastUpdate}
            </p>
          </div>

          {/* Introduction Card */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-semibold text-foreground mb-2">
                    Bienvenue sur Bikawo
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme Bikawo, 
                    un service numérique de mise en relation entre Clients et Partenaires pour des prestations de services à la personne.
                    En utilisant notre plateforme, vous acceptez ces conditions dans leur intégralité.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CGU Sections */}
          <Accordion type="single" collapsible className="space-y-4">
            {sections.map((section) => (
              <AccordionItem 
                key={section.id} 
                value={section.id}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold text-foreground">{section.title}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                    {section.content}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact Card */}
          <Card className="mt-12">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Contact</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Bikawo</strong></p>
                <p>231 rue Saint-Honoré, 75001 Paris</p>
                <p>Email : contact@bikawo.com</p>
                <p>N° INPI : 880 491 436</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CGU;
