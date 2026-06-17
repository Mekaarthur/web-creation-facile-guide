-- FIX 1 — Seed all 28 production services
-- Replaces 8 generic test records with real production data.
-- Adds slug column (used by verify-payment via 'sl' Stripe metadata field).
--
-- Slug strategy: suffixes added where servicesData.ts has collisions
--   (two services share slug "assistance-quotidienne": vie + seniors → -vie / -seniors)
--   (two services share slug "assistance-24-7": travel / urgences-24-7 seniors)
-- The NIGHT_SERVICE_SLUGS constant ("urgences-24-7") still matches the seniors urgency row.

-- ── 1a: Schema additions ───────────────────────────────────────────────────
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_unique
  ON public.services (slug)
  WHERE slug IS NOT NULL;

-- ── 1b: Remove the 8 generic test entries ─────────────────────────────────
DELETE FROM public.services
WHERE name IN (
  'Ménage à domicile',
  'Garde d''enfants',
  'Aide aux seniors',
  'Jardinage',
  'Cours particuliers',
  'Assistance administrative',
  'Garde d''animaux',
  'Bricolage'
);

-- ── 1c: Insert 28 production services ─────────────────────────────────────
INSERT INTO public.services (name, category, slug, price_per_hour, urssaf_eligible, is_active, description)
VALUES

-- BIKA KIDS
('Garde d''enfants & Babysitting',   'bika_kids', 'garde-enfants-babysitting',    25, true,  true, 'Garde ponctuelle et régulière, garde partagée, récupération scolaire, aide aux devoirs.'),
('Gardes de nuit & Urgence',         'bika_kids', 'gardes-de-nuit-urgence',       30, true,  true, 'Nuit complète, urgences soirée/weekend, accompagnement enfants malades.'),
('Anniversaires & Événements',       'bika_kids', 'anniversaires-evenements',     30, true,  true, 'Animation jeux, décoration thématique, gestion invitations, photographe.'),
('Soutien scolaire',                 'bika_kids', 'soutien-scolaire',             30, true,  true, 'Cours particuliers à domicile, préparation aux examens.'),

-- BIKA MAISON
('Courses & Approvisionnement',      'bika_maison',             'courses-approvisionnement',      25, true,  true, 'Courses alimentaires, achats spécialisés, gestion des stocks.'),
('Repassage vêtements',              'bika_maison',             'repassage-vetements',            28, true,  true, 'Ménage complet, vaisselle et repassage soigné des vêtements.'),
('Courses urgentes de nuit',         'bika_maison',             'courses-urgentes-nuit',          30, true,  true, 'Courses urgentes de dernière minute, courses de nuit et livraison.'),
('Logistique & Organisation',        'bika_maison',             'logistique-organisation',        30, true,  true, 'Retrait colis, gestion courriers, batch cooking, pressing.'),
('Rangement & Armoire',              'bika_maison',             'rangement-armoire',              30, true,  true, 'Tri et organisation vêtements, optimisation espace, conseils rangement.'),
('Batch cooking',                    'bika_maison',             'batch-cooking',                  30, true,  true, 'Préparation repas en grande quantité pour la semaine.'),
('Aide déménagement',                'bika_maison',             'aide-demenagement-amenagement',  30, true,  true, 'Cartons, transport, rangement et organisation d''espaces.'),
('Jardins & Espaces verts',          'entretien_espaces_verts', 'entretien-jardins-espaces-verts',30, true,  true, 'Tonte, scarification, arrosage, désherbage, traitement.'),
('Maintenance & Réparations',        'maintenance',             'maintenance',                    30, true,  true, 'Montage meubles, plomberie de base, installation luminaires.'),

-- BIKA VIE
('Services administratifs',          'bika_vie', 'services-administratifs-familiaux', 25, true, true, 'Gestion courrier, prise de RDV médicaux, suivi contrats, archivage.'),
('Services personnels',              'bika_vie', 'services-personnels',               25, true, true, 'Pressing, cordonnerie, réservations restaurants/spectacles.'),
('Assistance quotidienne vie',       'bika_vie', 'assistance-quotidienne-vie',         30, true, true, 'Planning personnel, interface administrations, résolution problèmes quotidiens.'),

-- BIKA TRAVEL
('Préparation voyage',               'bika_travel', 'preparation-voyage',       30, false, true, 'Billets avion/train, hébergements, activités, itinéraires personnalisés.'),
('Formalités & Documents',           'bika_travel', 'formalites-documents',     30, false, true, 'Passeports/visas, assurances voyage, transferts aéroport.'),
('Assistance 24/7 voyage',           'bika_travel', 'assistance-24-7-travel',   30, false, true, 'Modification réservations urgentes, gestion imprévus, support multilingue.'),

-- BIKA ANIMALS
('Soins quotidiens',                 'bika_animals', 'soins-quotidiens',       25, true, true, 'Promenades, nourrissage, administration médicaments, soins d''hygiène.'),
('Services vétérinaires',            'bika_animals', 'services-veterinaires',  30, true, true, 'Transport vétérinaire, urgences, suivi traitements, convalescence.'),
('Garde & Pension',                  'bika_animals', 'garde-pension',          30, true, true, 'Garde à domicile, pension famille d''accueil, pendant vacances.'),

-- BIKA SENIORS
('Assistance quotidienne seniors',   'bika_seniors', 'assistance-quotidienne-seniors', 30, true, true, 'Courses, préparation repas, sorties, aide toilette, médicaments, courrier.'),
('Support médical',                  'bika_seniors', 'support-medical',                30, true, true, 'Accompagnement RDV médicaux, coordination soignants, gestion traitements.'),
('Urgences 24/7',                    'bika_seniors', 'urgences-24-7',                  40, true, true, 'Assistance urgence jour et nuit, coordination services d''urgence.'),

-- BIKA PRO
('Support administratif',            'bika_pro', 'support-administratif',   40, false, true, 'Gestion administrative complète, secrétariat, organisation réunions.'),
('Assistance dirigeants',            'bika_pro', 'assistance-dirigeants',   60, false, true, 'Assistance personnalisée cadres, gestion priorités, coordination projets.'),
('Conciergerie entreprise',          'bika_pro', 'conciergerie-entreprise', 50, false, true, 'Services personnels employés, pressing, réservations restaurants d''affaires.')

ON CONFLICT DO NOTHING;

-- ── 1d: Correct urssaf_eligible on any surviving pre-existing rows ─────────
UPDATE public.services SET urssaf_eligible = false
WHERE category IN ('bika_travel', 'bika_pro') AND urssaf_eligible = true;

UPDATE public.services SET urssaf_eligible = true
WHERE category IN ('bika_kids', 'bika_maison', 'bika_vie', 'bika_animals', 'bika_seniors', 'entretien_espaces_verts', 'maintenance')
  AND urssaf_eligible = false;
