-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to retry failed emails every 30 minutes
SELECT cron.schedule(
  'retry-failed-emails-job',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/retry-failed-emails',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncm9zanptYmd4bXR2d3hpY3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDI2ODIsImV4cCI6MjA2NzU3ODY4Mn0.Cp_iShHv23lcHYOmztd1Q25raX8rQylgBy1er1fPHno"}'::jsonb,
      body := jsonb_build_object(
        'maxRetries', 3,
        'retryDelay', 30
      )
    ) as request_id;
  $$
);

-- Create a function to check cron job status
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
  FROM cron.job
  WHERE jobname LIKE '%retry%' OR jobname LIKE '%email%'
  ORDER BY jobid DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO authenticated;

COMMENT ON FUNCTION public.get_cron_jobs() IS 'Returns the list of active cron jobs related to email retries';
