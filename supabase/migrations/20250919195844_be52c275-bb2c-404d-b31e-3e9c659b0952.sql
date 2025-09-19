-- Ajouter le champ active à la table zones_geographiques pour permettre l'activation/désactivation des zones
ALTER TABLE public.zones_geographiques 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Mettre à jour/Créer les zones selon vos spécifications de couverture
INSERT INTO public.zones_geographiques (nom_zone, codes_postaux, type_zone, active) VALUES
-- Paris complet (75001 à 75020)
('75 - Paris', ARRAY['75001','75002','75003','75004','75005','75006','75007','75008','75009','75010','75011','75012','75013','75014','75015','75016','75017','75018','75019','75020'], 'departement', true),

-- Départements Île-de-France en entier
('77 - Seine-et-Marne', ARRAY['77000'], 'departement', true),
('78 - Yvelines', ARRAY['78000'], 'departement', true), 
('91 - Essonne', ARRAY['91000'], 'departement', true),
('92 - Hauts-de-Seine', ARRAY['92000'], 'departement', true),
('93 - Seine-Saint-Denis', ARRAY['93000'], 'departement', true),
('94 - Val-de-Marne', ARRAY['94000'], 'departement', true),
('95 - Val-d''Oise', ARRAY['95000'], 'departement', true)

ON CONFLICT (nom_zone) DO UPDATE SET
codes_postaux = EXCLUDED.codes_postaux,
type_zone = EXCLUDED.type_zone,
active = EXCLUDED.active;