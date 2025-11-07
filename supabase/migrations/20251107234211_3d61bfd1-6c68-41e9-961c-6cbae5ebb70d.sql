-- =======================
-- AJOUT DES NOUVEAUX RÔLES (SEULEMENT)
-- =======================

-- Ajouter 'provider' si pas déjà présent
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'provider' AND enumtypid = 'app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'provider';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter 'client' si pas déjà présent  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client' AND enumtypid = 'app_role'::regtype) THEN
        ALTER TYPE public.app_role ADD VALUE 'client';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter les colonnes manquantes à user_roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'created_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'created_by') THEN
        ALTER TABLE public.user_roles ADD COLUMN created_by uuid REFERENCES auth.users(id);
    END IF;
END $$;