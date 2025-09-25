-- Vider la table FAQ existante
DELETE FROM public.faq_knowledge_base;

-- Insérer la FAQ complète Bikawo
INSERT INTO public.faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES

-- BIKA KIDS - Services aux Enfants
('Proposez-vous de la garde d''enfants ?', 'Oui ! Nous proposons BIKA KIDS avec plusieurs services :
• Garde ponctuelle : 25€/heure
• Garde régulière (après-école, vacances)
• Garde partagée entre familles
• Récupération école et transport activités
• Aide aux devoirs
• Gardes de nuit/urgence : 30€/heure
Tous nos intervenants sont qualifiés et vérifiés. Souhaitez-vous un devis personnalisé ? 👶', 'bika_kids', ARRAY['garde', 'enfants', 'baby-sitting', 'kids'], 100, true),

('Faites-vous du baby-sitting le soir ?', 'Absolument ! Nous proposons :
• Garde de soirée classique : 25€/heure
• Garde de nuit complète : 30€/heure
• Services d''urgence weekend : 30€/heure
• Accompagnement enfants malades
Nos baby-sitters sont expérimentées et de confiance. Voulez-vous réserver ? 🌙', 'bika_kids', ARRAY['baby-sitting', 'soir', 'nuit', 'urgence'], 95, true),

('Organisez-vous des anniversaires d''enfants ?', 'Oui, avec BIKA KIDS ! Nos prestations anniversaire à partir de 30€/heure :
• Animation et jeux adaptés par âge
• Décoration thématique personnalisée  
• Gestion invitations et logistique
• Photographe et souvenirs
Une fête mémorable clés en main ! Quel âge a votre enfant ? 🎉', 'bika_kids', ARRAY['anniversaire', 'enfants', 'animation', 'fête'], 90, true),

('Proposez-vous du soutien scolaire ?', 'Oui ! Nos cours particuliers BIKA KIDS à 30€/heure :
• Cours à domicile toutes matières
• Préparation examens et contrôles
• Aide aux devoirs quotidienne
• Méthodologie et organisation
Nos professeurs sont diplômés et pédagogues. Dans quelle matière avez-vous besoin d''aide ? 📚', 'bika_kids', ARRAY['soutien', 'scolaire', 'cours', 'devoirs'], 85, true),

-- BIKA MAISON - Gestion du Foyer
('Pouvez-vous faire mes courses ?', 'Bien sûr ! BIKA MAISON propose :
• Courses alimentaires hebdomadaires : 25€/heure
• Courses spécialisées (bio, sans gluten)
• Gestion stocks frigo/placards
• Courses urgentes de nuit : 30€/heure
• Retrait colis et livraisons
Fini la corvée des courses ! Quels sont vos besoins ? 🛒', 'bika_maison', ARRAY['courses', 'maison', 'alimentation', 'livraison'], 100, true),

('Aidez-vous pour un déménagement ?', 'Absolument ! BIKA MAISON - Aide déménagement (30€/heure) :
• Préparation et empaquetage cartons
• Transport cartons/meubles (dans logement)
• Rangement et organisation nouveaux espaces
• Coordination avec déménageurs professionnels
Nous facilitons votre déménagement ! Quelle est votre situation ? 📦', 'bika_maison', ARRAY['déménagement', 'cartons', 'transport', 'rangement'], 90, true),

('Montez-vous les meubles ?', 'Oui ! Notre service maintenance BIKA MAISON (30€/heure) :
• Montage meubles IKEA et autres
• Aide plomberie de base
• Petits travaux d''aménagement
• Coordination avec artisans si besoin
Nos intervenants sont habiles et équipés ! Quel type de montage ? 🔧', 'bika_maison', ARRAY['montage', 'meubles', 'bricolage', 'maintenance'], 85, true),

('Entretenez-vous les jardins ?', 'Oui ! BIKA MAISON - Entretien espaces verts :
• Taille et entretien jardins
• Tonte pelouse et débroussaillage
• Plantation et arrosage
• Tarifs sur devis selon surface
Nos jardiniers redonnent vie à vos extérieurs ! Décrivez-nous votre jardin ? 🌱', 'bika_maison', ARRAY['jardinage', 'jardin', 'tonte', 'plantation'], 80, true),

-- BIKA VIE - Conciergerie Complète
('Gérez-vous les démarches administratives ?', 'Oui ! BIKA VIE - Services administratifs (25€/heure) :
• Gestion courrier et documents
• Prise de rendez-vous médicaux/administratifs
• Suivi contrats et abonnements
• Accompagnement aux rendez-vous
• Archivage et classement personnel
Nous simplifions votre administratif ! Quelles démarches vous préoccupent ? 📋', 'bika_vie', ARRAY['administratif', 'démarches', 'courrier', 'rendez-vous'], 95, true),

('Allez-vous au pressing pour moi ?', 'Bien sûr ! BIKA VIE - Services personnels (25€/heure) :
• Dépôt et retrait pressing
• Dépôt/retrait cordonnerie
• Réservations restaurants et spectacles
• Recherche et réservation prestataires
Vos corvées deviennent nos missions ! Quels services personnels vous intéressent ? 👔', 'bika_vie', ARRAY['pressing', 'cordonnerie', 'réservations', 'conciergerie'], 85, true),

('Organisez-vous mon planning ?', 'Oui ! BIKA VIE - Assistance quotidienne (30€/heure) :
• Gestion planning personnel optimisé
• Interface avec administrations
• Résolution problèmes quotidiens
• Coordination avec tous prestataires
Votre assistant personnel dédié ! Quel niveau d''assistance souhaitez-vous ? 📅', 'bika_vie', ARRAY['planning', 'agenda', 'assistant', 'organisation'], 90, true),

-- BIKA TRAVEL - Assistance Voyage
('Organisez-vous les voyages ?', 'Oui ! BIKA TRAVEL - Préparation voyage (30€/heure) :
• Recherche et réservation billets avion/train
• Réservation hébergements
• Réservation activités et excursions
• Vérification documents de voyage
• Itinéraires personnalisés sur mesure
Votre travel planner personnel ! Où souhaitez-vous partir ? ✈️', 'bika_travel', ARRAY['voyage', 'travel', 'réservation', 'billets'], 100, true),

('Aidez-vous pour les formalités de voyage ?', 'Absolument ! BIKA TRAVEL - Formalités (30€/heure) :
• Assistance renouvellement passeports/visas
• Vérification validité documents
• Réservation transferts aéroport
• Recherche assurances voyage
• Change de devises
Plus de stress administratif ! Quelles formalités vous préoccupent ? 📄', 'bika_travel', ARRAY['formalités', 'passeport', 'visa', 'documents'], 95, true),

-- BIKA ANIMAL - Univers Animalier
('Gardez-vous les animaux ?', 'Oui ! BIKA ANIMAL propose :
• Soins quotidiens : 25€/heure (promenades, nourrissage, brossage)
• Services vétérinaires : 30€/heure (transport, accompagnement)
• Garde & pension : 30€/heure (garde domicile ou famille d''accueil)
• Compagnie pour animaux seuls
Vos compagnons entre de bonnes mains ! Quel type d''animal avez-vous ? 🐕', 'bika_animal', ARRAY['animaux', 'garde', 'chien', 'chat'], 100, true),

('Promenez-vous les chiens ?', 'Bien sûr ! BIKA ANIMAL - Soins quotidiens (25€/heure) :
• Promenades régulières adaptées
• Sorties exercice et socialisation
• Compagnie et jeux
• Administration médicaments si besoin
• Brossage et soins d''hygiène
Votre chien sera heureux ! Quelle race et quel âge ? 🦮', 'bika_animal', ARRAY['promenade', 'chien', 'sortie', 'exercice'], 95, true),

-- BIKA SENIORS - Accompagnement Personnes Âgées
('Aidez-vous les personnes âgées ?', 'Oui ! BIKA SENIORS - Assistance quotidienne (30€/heure) :
• Aide courses et préparation repas
• Accompagnement sorties et promenades
• Aide toilette et soins d''hygiène
• Administration médicaments
• Compagnie et conversation
• Gestion administrative et courrier
Nos intervenants sont formés et bienveillants ! Quels besoins spécifiques ? 👵', 'bika_seniors', ARRAY['seniors', 'âgées', 'aide', 'accompagnement'], 100, true),

('Proposez-vous de la compagnie aux seniors ?', 'Oui ! BIKA SENIORS - Lien social (30€/heure) :
• Visites régulières et écoute attentive
• Accompagnement activités culturelles
• Aide technologies (tablette, smartphone)
• Maintien lien famille éloignée
Contre l''isolement, pour le bien-être ! À quelle fréquence ? 💕', 'bika_seniors', ARRAY['compagnie', 'seniors', 'visite', 'isolement'], 95, true),

-- BIKA PRO - Services aux Entreprises
('Proposez-vous des services aux entreprises ?', 'Oui ! BIKA PRO à partir de 50€/heure :
• Support administratif dirigeants
• Gestion agenda et déplacements professionnels
• Conciergerie d''entreprise pour employés
• Services personnels équipes (pressing, courses)
• Réservations restaurants d''affaires
• Organisation cadeaux clients/partenaires
Votre business partenaire ! Quelle est votre entreprise ? 💼', 'bika_pro', ARRAY['entreprise', 'pro', 'dirigeant', 'business'], 100, true),

-- BIKA PLUS - Services Sur Mesure
('Avez-vous des services haut de gamme ?', 'Oui ! BIKA PLUS - Services sur mesure :
• Étude besoins spécifiques personnalisés
• Majordome personnel temps plein/partiel
• Gestionnaire patrimoine familial
• Organisateur grands événements privés
• Service 24h/24 et 7j/7
• Équipe dédiée à une famille
Excellence et exclusivité ! Quels sont vos besoins spécifiques ? 💎', 'bika_plus', ARRAY['haut', 'gamme', 'majordome', 'premium'], 100, true),

-- TARIFS ET CONDITIONS
('Quels sont vos tarifs ?', 'Nos tarifs varient selon le service :
• BIKA KIDS : 25€/h (garde) - 30€/h (nuit/anniversaires/soutien)
• BIKA MAISON : 25€/h (courses/logistique) - 30€/h (urgences/déménagement)
• BIKA VIE : 25€/h (administratif/personnel) - 30€/h (assistance)
• BIKA TRAVEL : 30€/h (organisation/formalités)
• BIKA ANIMAL : 25€/h (soins) - 30€/h (vétérinaire/garde)
• BIKA SENIORS : 30€/h (tous services)
• BIKA PRO : à partir de 50€/h
• BIKA PLUS : sur devis personnalisé
Souhaitez-vous un devis précis ? 💶', 'tarifs', ARRAY['tarifs', 'prix', 'coût', 'montant'], 100, true),

('Acceptez-vous les chèques CESU ?', 'Non, nous n''acceptons pas les chèques CESU actuellement. Nous acceptons les paiements par carte bancaire et virement. Contactez-nous pour plus d''informations sur nos modes de paiement.', 'paiement', ARRAY['cesu', 'paiement', 'chèque'], 90, true),

-- RÉSERVATION ET ANNULATION
('Comment réserver un service ?', 'C''est simple ! 3 étapes :
1️⃣ Connectez-vous sur notre site internet
2️⃣ Choisissez votre prestation dans nos services
3️⃣ Confirmez et choisissez votre créneau
4️⃣ Renseignez vos informations et validez le panier 📱', 'reservation', ARRAY['réserver', 'réservation', 'commande'], 100, true),

('Puis-je annuler ma réservation ?', 'Oui ! Conditions d''annulation selon délai :

**Commandes > 14 jours à l''avance :** Droit de rétractation légal
• Annulation gratuite sur notre plateforme

**Commandes < 14 jours (droit rétractation renoncé) :**
• > 24h avant : GRATUIT
• 8-24h avant : 5€
• 4-8h avant : 10€
• 2-4h avant : 50% (max 15€)
• 0-2h avant : 80% (max 20€)
• Après RDV ou absence 30min : 100% (max 40€)

Annulation facile sur votre espace client ! 📞', 'annulation', ARRAY['annuler', 'annulation', 'modifier'], 95, true),

-- SÉCURITÉ ET QUALITÉ
('Vos intervenants sont-ils fiables ?', 'Absolument ! Nos garanties sécurité :
• Vérification identité et droit de travail
• Casier judiciaire vierge obligatoire
• Diplômes et qualifications vérifiés
• Assurance responsabilité civile
• Évaluation continue par clients
• 12 mois d''expérience minimum (services réglementés)
Votre sécurité, notre priorité ! 🛡️', 'securite', ARRAY['fiable', 'sécurité', 'vérification', 'qualité'], 100, true),

-- ZONE D'INTERVENTION
('Dans quelles villes intervenez-vous ?', 'BIKAWO intervient à Paris (tous les arrondissements) et toute l''Île-de-France (77, 78, 91, 92, 93, 94, 95) dans un rayon de 30km. Frais de déplacement INCLUS dans nos tarifs !', 'zone', ARRAY['ville', 'zone', 'paris', 'ile-de-france'], 100, true),

-- CONTACT
('Comment vous contacter ?', 'Plusieurs moyens de nous joindre :
• Site web : www.bikawo.fr
• Email : contact@bikawo.fr
• Téléphone : 0609085390
• Chat en direct sur le site
• Formulaire de contact en ligne
Nous répondons rapidement ! 📱', 'contact', ARRAY['contacter', 'contact', 'téléphone', 'email'], 100, true),

('Qui est Bikawo ?', 'Bikawo, votre Assistant personnel au quotidien :
• Plateforme de services basée en Île-de-France
• Services complets pour particuliers et entreprises
• Intervenants sélectionnés et qualifiés
• Engagement qualité et satisfaction
• Innovation technologique au service du quotidien
• Valeurs : Confiance, Excellence, Proximité', 'entreprise', ARRAY['bikawo', 'entreprise', 'qui', 'présentation'], 100, true);