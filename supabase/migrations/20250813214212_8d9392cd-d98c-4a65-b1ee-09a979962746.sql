-- Créer la table zones_geographiques
CREATE TABLE public.zones_geographiques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_zone TEXT NOT NULL,
  codes_postaux TEXT[] NOT NULL DEFAULT '{}',
  type_zone TEXT NOT NULL DEFAULT 'departement',
  rayon_km INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter des champs à la table providers pour la géolocalisation
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS zones_couvertes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rayon_intervention_km INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS adresse_complete TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Créer une table provider_locations pour gérer les adresses des prestataires
CREATE TABLE public.provider_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  adresse_complete TEXT NOT NULL,
  code_postal TEXT NOT NULL,
  ville TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  rayon_service_km INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS sur les nouvelles tables
ALTER TABLE public.zones_geographiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour zones_geographiques
CREATE POLICY "Zones géographiques visibles par tous" 
ON public.zones_geographiques 
FOR SELECT 
USING (true);

CREATE POLICY "Admin peut gérer les zones" 
ON public.zones_geographiques 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Politiques RLS pour provider_locations
CREATE POLICY "Prestataires peuvent gérer leur localisation" 
ON public.provider_locations 
FOR ALL 
USING (auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_locations.provider_id));

CREATE POLICY "Localisations prestataires visibles par tous" 
ON public.provider_locations 
FOR SELECT 
USING (true);

-- Insérer quelques zones par défaut (Île-de-France)
INSERT INTO public.zones_geographiques (nom_zone, codes_postaux, type_zone) VALUES
('75 - Paris', ARRAY['75001','75002','75003','75004','75005','75006','75007','75008','75009','75010','75011','75012','75013','75014','75015','75016','75017','75018','75019','75020'], 'departement'),
('92 - Hauts-de-Seine', ARRAY['92000','92001','92002','92003','92004','92005','92006','92007','92008','92009','92010','92011','92012','92013','92014','92015','92016','92017','92018','92019','92020','92021','92022','92023','92024','92025','92026','92027','92028','92029','92030','92031','92032','92033','92034','92035','92036','92037','92038','92039','92040','92041','92042','92043','92044','92045','92046','92047','92048','92049','92050','92051','92052','92053','92054','92055','92056','92057','92058','92059','92060','92061','92062','92063','92064','92065','92066','92067','92068','92069','92070','92071','92072','92073','92074','92075','92076','92077','92078','92079','92080','92081','92082','92083','92084','92085','92086','92087','92088','92089','92090','92091','92092','92093','92094','92095','92096','92097','92098','92099'], 'departement'),
('93 - Seine-Saint-Denis', ARRAY['93000','93001','93002','93003','93004','93005','93006','93007','93008','93009','93010','93011','93012','93013','93014','93015','93016','93017','93018','93019','93020','93021','93022','93023','93024','93025','93026','93027','93028','93029','93030','93031','93032','93033','93034','93035','93036','93037','93038','93039','93040','93041','93042','93043','93044','93045','93046','93047','93048','93049','93050','93051','93052','93053','93054','93055','93056','93057','93058','93059','93060','93061','93062','93063','93064','93065','93066','93067','93068','93069','93070','93071','93072','93073','93074','93075','93076','93077','93078','93079','93080','93081','93082','93083','93084','93085','93086','93087','93088','93089','93090','93091','93092','93093','93094','93095','93096','93097','93098','93099'], 'departement'),
('94 - Val-de-Marne', ARRAY['94000','94001','94002','94003','94004','94005','94006','94007','94008','94009','94010','94011','94012','94013','94014','94015','94016','94017','94018','94019','94020','94021','94022','94023','94024','94025','94026','94027','94028','94029','94030','94031','94032','94033','94034','94035','94036','94037','94038','94039','94040','94041','94042','94043','94044','94045','94046','94047','94048','94049','94050','94051','94052','94053','94054','94055','94056','94057','94058','94059','94060','94061','94062','94063','94064','94065','94066','94067','94068','94069','94070','94071','94072','94073','94074','94075','94076','94077','94078','94079','94080','94081','94082','94083','94084','94085','94086','94087','94088','94089','94090','94091','94092','94093','94094','94095','94096','94097','94098','94099'], 'departement'),
('95 - Val-d''Oise', ARRAY['95000','95001','95002','95003','95004','95005','95006','95007','95008','95009','95010','95011','95012','95013','95014','95015','95016','95017','95018','95019','95020','95021','95022','95023','95024','95025','95026','95027','95028','95029','95030','95031','95032','95033','95034','95035','95036','95037','95038','95039','95040','95041','95042','95043','95044','95045','95046','95047','95048','95049','95050','95051','95052','95053','95054','95055','95056','95057','95058','95059','95060','95061','95062','95063','95064','95065','95066','95067','95068','95069','95070','95071','95072','95073','95074','95075','95076','95077','95078','95079','95080','95081','95082','95083','95084','95085','95086','95087','95088','95089','95090','95091','95092','95093','95094','95095','95096','95097','95098','95099'], 'departement'),
('91 - Essonne', ARRAY['91000','91001','91002','91003','91004','91005','91006','91007','91008','91009','91010','91011','91012','91013','91014','91015','91016','91017','91018','91019','91020','91021','91022','91023','91024','91025','91026','91027','91028','91029','91030','91031','91032','91033','91034','91035','91036','91037','91038','91039','91040','91041','91042','91043','91044','91045','91046','91047','91048','91049','91050','91051','91052','91053','91054','91055','91056','91057','91058','91059','91060','91061','91062','91063','91064','91065','91066','91067','91068','91069','91070','91071','91072','91073','91074','91075','91076','91077','91078','91079','91080','91081','91082','91083','91084','91085','91086','91087','91088','91089','91090','91091','91092','91093','91094','91095','91096','91097','91098','91099'], 'departement'),
('78 - Yvelines', ARRAY['78000','78001','78002','78003','78004','78005','78006','78007','78008','78009','78010','78011','78012','78013','78014','78015','78016','78017','78018','78019','78020','78021','78022','78023','78024','78025','78026','78027','78028','78029','78030','78031','78032','78033','78034','78035','78036','78037','78038','78039','78040','78041','78042','78043','78044','78045','78046','78047','78048','78049','78050','78051','78052','78053','78054','78055','78056','78057','78058','78059','78060','78061','78062','78063','78064','78065','78066','78067','78068','78069','78070','78071','78072','78073','78074','78075','78076','78077','78078','78079','78080','78081','78082','78083','78084','78085','78086','78087','78088','78089','78090','78091','78092','78093','78094','78095','78096','78097','78098','78099'], 'departement'),
('77 - Seine-et-Marne', ARRAY['77000','77001','77002','77003','77004','77005','77006','77007','77008','77009','77010','77011','77012','77013','77014','77015','77016','77017','77018','77019','77020','77021','77022','77023','77024','77025','77026','77027','77028','77029','77030','77031','77032','77033','77034','77035','77036','77037','77038','77039','77040','77041','77042','77043','77044','77045','77046','77047','77048','77049','77050','77051','77052','77053','77054','77055','77056','77057','77058','77059','77060','77061','77062','77063','77064','77065','77066','77067','77068','77069','77070','77071','77072','77073','77074','77075','77076','77077','77078','77079','77080','77081','77082','77083','77084','77085','77086','77087','77088','77089','77090','77091','77092','77093','77094','77095','77096','77097','77098','77099'], 'departement');

-- Ajouter triggers pour updated_at
CREATE TRIGGER update_zones_geographiques_updated_at
BEFORE UPDATE ON public.zones_geographiques
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_locations_updated_at
BEFORE UPDATE ON public.provider_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour calculer la distance entre deux points GPS
CREATE OR REPLACE FUNCTION public.calculate_distance_between_points(lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  r DECIMAL := 6371; -- Rayon de la Terre en km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r * c;
END;
$$;

-- Fonction pour trouver les prestataires dans une zone géographique
CREATE OR REPLACE FUNCTION public.find_providers_in_zone(
  p_code_postal TEXT,
  p_service_type TEXT DEFAULT NULL,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_max_distance_km INTEGER DEFAULT 50
)
RETURNS TABLE(
  provider_id UUID,
  business_name TEXT,
  rating NUMERIC,
  distance_km NUMERIC,
  zones_coverage TEXT[],
  location TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.business_name,
    p.rating,
    CASE 
      WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      THEN public.calculate_distance_between_points(p_latitude, p_longitude, p.latitude, p.longitude)
      ELSE 0
    END as distance_km,
    p.zones_couvertes,
    p.location
  FROM public.providers p
  WHERE p.status = 'active'
    AND p.is_verified = true
    AND (
      -- Vérifier si le code postal est dans les zones couvertes
      p_code_postal = ANY(p.zones_couvertes)
      OR
      -- Ou vérifier la distance si les coordonnées GPS sont disponibles
      (
        p_latitude IS NOT NULL AND p_longitude IS NOT NULL 
        AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        AND public.calculate_distance_between_points(p_latitude, p_longitude, p.latitude, p.longitude) <= COALESCE(p.rayon_intervention_km, p_max_distance_km)
      )
    )
    AND (
      p_service_type IS NULL 
      OR EXISTS (
        SELECT 1 FROM public.provider_services ps
        JOIN public.services s ON s.id = ps.service_id
        WHERE ps.provider_id = p.id 
        AND ps.is_active = true
        AND LOWER(s.name) LIKE '%' || LOWER(p_service_type) || '%'
      )
    )
  ORDER BY distance_km ASC, p.rating DESC;
END;
$$;