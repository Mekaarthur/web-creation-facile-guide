CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-anomaly-alerts-job') THEN
    PERFORM cron.unschedule('send-anomaly-alerts-job');
  END IF;
END $$;

SELECT cron.schedule(
  'send-anomaly-alerts-job',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/send-anomaly-alerts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncm9zanptYmd4bXR2d3hpY3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDI2ODIsImV4cCI6MjA2NzU3ODY4Mn0.Cp_iShHv23lcHYOmztd1Q25raX8rQylgBy1er1fPHno"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);