-- Fix remaining functions that need proper search_path settings
-- without recreating existing policies

-- Check if audit table exists before creating
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'security_function_audit') THEN
        CREATE TABLE public.security_function_audit (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            function_name text NOT NULL,
            called_by uuid REFERENCES auth.users(id),
            called_at timestamp with time zone DEFAULT now(),
            parameters jsonb,
            success boolean DEFAULT true,
            error_message text
        );
        
        -- Enable RLS on the audit table
        ALTER TABLE public.security_function_audit ENABLE ROW LEVEL SECURITY;
        
        -- Create policies only if they don't exist
        CREATE POLICY "Only admins can view security function audit"
        ON public.security_function_audit FOR SELECT
        USING (has_role(auth.uid(), 'admin'::app_role));
        
        CREATE POLICY "System can insert audit logs"
        ON public.security_function_audit FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;