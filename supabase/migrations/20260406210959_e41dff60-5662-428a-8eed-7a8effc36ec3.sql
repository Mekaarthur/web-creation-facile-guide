
-- Add client_validation_deadline to urssaf_declarations
ALTER TABLE public.urssaf_declarations 
ADD COLUMN IF NOT EXISTS client_validation_deadline timestamptz;

-- Add index for monitoring expired declarations
CREATE INDEX IF NOT EXISTS idx_urssaf_declarations_status_deadline 
ON public.urssaf_declarations (status, client_validation_deadline);

-- Add index for status-based queries
CREATE INDEX IF NOT EXISTS idx_urssaf_declarations_status 
ON public.urssaf_declarations (status);
