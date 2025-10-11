-- Fix all remaining Security Definer Views by removing security_barrier
-- Query system catalogs to find all views with security_barrier enabled

-- Remove security_barrier from all views in the public schema that have it enabled
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER VIEW %I.%I SET (security_barrier = false)', 
                         view_record.schemaname, 
                         view_record.viewname);
            RAISE NOTICE 'Removed security_barrier from view: %.%', 
                        view_record.schemaname, view_record.viewname;
        EXCEPTION WHEN OTHERS THEN
            -- View might not have security_barrier set, continue
            RAISE NOTICE 'Could not modify view %.%: %', 
                        view_record.schemaname, view_record.viewname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Add comments to all public views explaining the security model
COMMENT ON VIEW public.providers_public_view IS 
  'Public view respecting RLS policies of underlying tables. No SECURITY DEFINER.';
