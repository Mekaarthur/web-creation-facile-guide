-- Vider et resynchroniser la base de connaissances FAQ avec le site
DELETE FROM faq_knowledge_base;

-- À propos de BIKAWO
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Qu''est-ce que BIKAWO ?', 'BIKAWO est une plateforme de services personnalisés pour simplifier votre quotidien avec tendresse et professionnalisme : garde d''enfants, gestion du foyer, conciergerie, assistance voyage, soins aux animaux et accompagnement des seniors. Nous intervenons en Île-de-France avec des professionnels qualifiés et vérifiés.', 'general', ARRAY['bikawo', 'présentation', 'services', 'qui'], 100, true),
('Où intervenez-vous ?', 'Nous intervenons dans toute l''Île-de-France : Paris (75), Seine-et-Marne (77), Yvelines (78), Essonne (91), Hauts-de-Seine (92), Seine-Saint-Denis (93), Val-de-Marne (94), Val d''Oise (95). Contactez-nous pour confirmer la disponibilité dans votre secteur.', 'general', ARRAY['zone', 'intervention', 'paris', 'ile-de-france', 'département'], 95, true),
('Quels sont vos horaires ?', 'Services standards : de 7h à 22h (semaine) et de 8h à 20h (week-end). Services d''urgence et de nuit : 24h/24, 7j/7 pour vous accompagner à tout moment.', 'general', ARRAY['horaires', 'disponibilité', 'heures', 'nuit', 'urgence'], 90, true);

-- Réservation & Paiement
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Comment réserver un service ?', 'Via notre plateforme en ligne : choisissez le service, la date, l''heure et la durée. Une confirmation vous sera envoyée immédiatement. Vous pouvez aussi nous appeler au 06 09 08 53 90.', 'reservation', ARRAY['réserver', 'réservation', 'commander', 'comment'], 100, true),
('Combien de temps à l''avance réserver ?', 'Services réguliers : 48h minimum pour nous permettre de vous trouver le meilleur intervenant. Services urgents : intervention dans les meilleurs délais.', 'reservation', ARRAY['délai', 'avance', 'temps', 'quand'], 95, true),
('Quels sont vos tarifs ?', 'Services standards : 25€/h • Services urgents, nuit et spécialisés : 30 à 40€/h • Prestations spécifiques (Bika Pro, Bika Plus) : sur devis. Bénéficiez de 50% d''avance immédiate sur vos impôts sur les services éligibles !', 'tarifs', ARRAY['prix', 'tarif', 'coût', 'combien', 'euro'], 100, true),
('Quels modes de paiement acceptez-vous ?', 'Carte bancaire et CESU (Chèque Emploi Service Universel). Le montant est prélevé après validation de la réservation. Paiement 100% sécurisé.', 'paiement', ARRAY['paiement', 'payer', 'carte', 'cesu', 'bancaire'], 95, true),
('Y a-t-il des frais cachés ?', 'Non, jamais ! Nos tarifs sont transparents, sans frais supplémentaires. Le prix affiché est le prix final.', 'tarifs', ARRAY['frais', 'cachés', 'supplémentaires', 'transparent'], 85, true),
('Comment fonctionne le crédit d''impôt ?', 'Vous bénéficiez de 50% d''avance immédiate sur vos impôts pour les services à la personne éligibles (garde d''enfants, ménage, aide aux seniors...). Le montant est directement déduit, vous ne payez que la moitié !', 'tarifs', ARRAY['crédit', 'impôt', 'avance', 'réduction', 'fiscal', '50%'], 100, true);

-- Annulation
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Puis-je annuler ma réservation ?', 'Oui ! Conditions d''annulation :
• Plus de 24h avant : GRATUIT
• Entre 8h et 24h avant : 5€
• Entre 4h et 8h avant : 10€
• Entre 2h et 4h avant : 50% (max 15€)
• Moins de 2h avant : 80% (max 20€)
Annulation facile depuis votre espace client.', 'annulation', ARRAY['annuler', 'annulation', 'modifier', 'changer'], 100, true),
('Puis-je modifier ma réservation ?', 'Oui, vous pouvez modifier votre réservation depuis votre espace client. Si la modification implique un changement de créneau, les conditions d''annulation s''appliquent.', 'annulation', ARRAY['modifier', 'changer', 'reporter', 'décaler'], 90, true);

-- BIKA KIDS - Garde d'enfants
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Proposez-vous de la garde d''enfants ?', 'Oui ! BIKA KIDS propose : garde ponctuelle et régulière (25€/h), garde partagée entre familles, récupération école, aide aux devoirs, gardes de nuit et urgence (30€/h). Tous nos intervenants sont qualifiés et vérifiés.', 'bika_kids', ARRAY['garde', 'enfants', 'baby-sitting', 'kids', 'babysitter'], 100, true),
('Vos intervenants sont-ils qualifiés ?', 'Oui, tous nos intervenants sont diplômés, expérimentés, avec casier judiciaire vierge et formation premiers secours. Votre sérénité est notre priorité.', 'bika_kids', ARRAY['qualifiés', 'diplômés', 'formation', 'expérience', 'sécurité'], 95, true),
('Quel est l''âge minimum des enfants gardés ?', 'Dès 3 mois avec nos intervenants spécialisés dans l''accompagnement des tout-petits.', 'bika_kids', ARRAY['âge', 'bébé', 'nourrisson', 'minimum'], 90, true),
('Que se passe-t-il en cas d''urgence avec mon enfant ?', 'Nos intervenants vous contactent immédiatement et, si besoin, accompagnent l''enfant chez le médecin ou aux urgences. Aucune décision sans votre accord. Aucun médicament administré sans ordonnance ni présence parentale.', 'bika_kids', ARRAY['urgence', 'médecin', 'secours', 'accident'], 95, true),
('Puis-je demander toujours le même intervenant ?', 'Absolument ! Nous favorisons la continuité pour créer un lien de confiance avec votre enfant.', 'bika_kids', ARRAY['même', 'intervenant', 'continuité', 'régulier'], 85, true),
('Proposez-vous du soutien scolaire ?', 'Oui ! BIKA KIDS propose aide aux devoirs et soutien scolaire toutes matières avec des intervenants pédagogues.', 'bika_kids', ARRAY['soutien', 'scolaire', 'devoirs', 'cours', 'école'], 85, true);

-- BIKA MAISON - Gestion du foyer
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Quels services propose BIKA MAISON ?', 'BIKA MAISON propose : ménage, vaisselle et repassage, prep meal (préparation de repas), courses alimentaires, aide à l''installation de luminaires, réception de colis, aide au déménagement, montage de meubles, entretien jardin.', 'bika_maison', ARRAY['maison', 'ménage', 'courses', 'foyer', 'entretien'], 100, true),
('Comment gérez-vous les courses ?', 'Courses avec liste fournie par vous. En cas d''indisponibilité d''un produit, nous validons toujours avec vous avant substitution.', 'bika_maison', ARRAY['courses', 'alimentaires', 'supermarché', 'liste'], 90, true),
('Puis-je recevoir des colis en mon absence ?', 'Oui ! Réception de colis et livraisons possible en votre absence pour vous faciliter la vie.', 'bika_maison', ARRAY['colis', 'livraison', 'réception', 'absence'], 85, true),
('Faites-vous le ménage ?', 'Oui ! BIKA MAISON propose ménage, vaisselle et repassage des vêtements à 25€/h.', 'bika_maison', ARRAY['ménage', 'nettoyage', 'repassage', 'vaisselle', 'propre'], 95, true);

-- BIKA VIE - Conciergerie
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Quels services de conciergerie proposez-vous ?', 'BIKA VIE propose : démarches administratives courantes, accompagnement aux rendez-vous médicaux ou administratifs, gestion quotidienne pour vous simplifier la vie.', 'bika_vie', ARRAY['conciergerie', 'administratif', 'démarches', 'accompagnement'], 100, true),
('Proposez-vous un accompagnement aux rendez-vous ?', 'Oui, accompagnement aux rendez-vous médicaux ou administratifs avec bienveillance et discrétion.', 'bika_vie', ARRAY['accompagnement', 'rendez-vous', 'médical', 'administratif'], 90, true),
('Comment garantissez-vous la confidentialité ?', 'Engagement strict de confidentialité avec accord signé par tous nos intervenants. Votre intimité est sacrée.', 'bika_vie', ARRAY['confidentialité', 'discrétion', 'privé', 'secret'], 85, true);

-- BIKA TRAVEL - Assistance voyage
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Quels services voyage proposez-vous ?', 'BIKA TRAVEL propose : organisation complète de voyage (transport, hébergement, documents, assurances), vérification documents de voyage, assistance 24h/24 pendant le voyage.', 'bika_travel', ARRAY['voyage', 'travel', 'vacances', 'transport'], 100, true),
('Proposez-vous une assistance pendant le voyage ?', 'Oui ! Assistance 24h/24 : modifications de réservations, imprévus, retards... Nous sommes là même à distance.', 'bika_travel', ARRAY['assistance', 'aide', '24h', 'urgence', 'voyage'], 90, true);

-- BIKA ANIMAL - Soins aux animaux
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Gardez-vous les animaux ?', 'Oui ! BIKA ANIMAL propose : promenades, nourrissage, brossage, transport vétérinaire, garde à domicile ou en famille d''accueil. Chiens, chats et NAC selon disponibilités.', 'bika_animal', ARRAY['animaux', 'garde', 'chien', 'chat', 'pet'], 100, true),
('Promenez-vous les chiens ?', 'Oui ! Promenades régulières adaptées, sorties exercice et socialisation, compagnie et jeux.', 'bika_animal', ARRAY['promenade', 'chien', 'sortie', 'balade'], 95, true),
('Comment se passe la garde à domicile ?', 'Garde à domicile avec envoi régulier de nouvelles et photos pour vous rassurer sur le bien-être de votre compagnon.', 'bika_animal', ARRAY['garde', 'domicile', 'photos', 'nouvelles'], 90, true),
('Que faites-vous en cas d''urgence vétérinaire ?', 'Gestion des urgences vétérinaires selon vos consignes précises, avec contact immédiat pour vous tenir informé.', 'bika_animal', ARRAY['urgence', 'vétérinaire', 'médical', 'animal'], 90, true);

-- BIKA SENIORS - Accompagnement
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Proposez-vous des services pour les seniors ?', 'Oui ! BIKA SENIORS propose : aide quotidienne, accompagnement médical, stimulation sociale, aide aux nouvelles technologies. Intervenants spécialisés et expérimentés.', 'bika_seniors', ARRAY['seniors', 'personnes âgées', 'aide', 'accompagnement'], 100, true),
('Aidez-vous avec les nouvelles technologies ?', 'Oui ! Aide aux nouvelles technologies (téléphone, tablette, ordinateur) pour maintenir le lien précieux avec la famille.', 'bika_seniors', ARRAY['technologie', 'téléphone', 'tablette', 'internet', 'ordinateur'], 85, true);

-- Sécurité & Qualité
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Comment sélectionnez-vous vos intervenants ?', 'Vérification complète : diplômes, références, casier judiciaire vierge, entretien approfondi, période d''essai supervisée. Votre sécurité n''est pas négociable.', 'securite', ARRAY['sélection', 'vérification', 'sécurité', 'confiance', 'casier'], 100, true),
('Êtes-vous assurés ?', 'Oui ! Assurance responsabilité civile professionnelle couvrant toutes nos prestations. Nos intervenants bénéficient aussi d''une couverture accident du travail.', 'securite', ARRAY['assurance', 'couverture', 'responsabilité', 'protégé'], 95, true),
('Comment évaluez-vous la qualité ?', 'Après chaque prestation, vous pouvez évaluer nos services. Vos retours nous aident à améliorer continuellement la qualité.', 'securite', ARRAY['qualité', 'évaluation', 'avis', 'note', 'retour'], 85, true);

-- Contact
INSERT INTO faq_knowledge_base (question, answer, category, keywords, priority, is_active) VALUES
('Comment vous contacter ?', 'Par téléphone : 06 09 08 53 90 • Par email via notre formulaire de contact • Via le chat en ligne. Nous sommes là pour vous aider !', 'contact', ARRAY['contact', 'téléphone', 'email', 'appeler', 'joindre'], 100, true);