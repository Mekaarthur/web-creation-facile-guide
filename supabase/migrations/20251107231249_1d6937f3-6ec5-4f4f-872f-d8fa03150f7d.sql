-- Ajouter une valeur par défaut pour event_type dans security_audit_log
ALTER TABLE public.security_audit_log 
ALTER COLUMN event_type SET DEFAULT 'system_event';

-- Mettre à jour les éventuelles lignes avec event_type NULL
UPDATE public.security_audit_log 
SET event_type = 'system_event' 
WHERE event_type IS NULL;