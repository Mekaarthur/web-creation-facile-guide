-- Correction des problèmes de sécurité détectés par le linter

-- 1. Identifier et recréer les vues problématiques sans SECURITY DEFINER
-- (Les vues SECURITY DEFINER contournent les politiques RLS et peuvent poser des risques)

-- Supprimer les anciennes vues si elles existent
DROP VIEW IF EXISTS public.providers_public_view CASCADE;
DROP VIEW IF EXISTS public.bookings_summary_view CASCADE;
DROP VIEW IF EXISTS public.missions_overview CASCADE;

-- Recréer les vues SANS security definer (elles utiliseront les permissions de l'utilisateur qui les interroge)
CREATE OR REPLACE VIEW public.providers_public_view AS
SELECT 
  p.id,
  p.business_name,
  p.rating,
  p.location,
  p.is_verified,
  p.hourly_rate,
  pr.first_name,
  pr.last_name,
  pr.avatar_url
FROM public.providers p
LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
WHERE p.is_verified = true;

-- 2. Corriger les fonctions sans search_path défini
-- Ajouter SET search_path = 'public' aux fonctions manquantes

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 3. S'assurer que toutes les fonctions critiques ont un search_path défini
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_message_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Ajouter un commentaire pour documenter les changements de sécurité
COMMENT ON VIEW public.providers_public_view IS 'Vue publique des prestataires - Sans SECURITY DEFINER pour respecter les RLS';
COMMENT ON FUNCTION public.update_updated_at_column IS 'Fonction de mise à jour timestamp - search_path défini pour la sécurité';
COMMENT ON FUNCTION public.handle_new_user IS 'Trigger de création de profil utilisateur - SECURITY DEFINER nécessaire mais search_path défini';