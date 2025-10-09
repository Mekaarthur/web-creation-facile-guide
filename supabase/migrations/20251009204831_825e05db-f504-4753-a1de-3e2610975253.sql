-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule timeout check every 5 minutes
SELECT cron.schedule(
  'check-mission-timeouts',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/check-timeouts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncm9zanptYmd4bXR2d3hpY3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDI2ODIsImV4cCI6MjA2NzU3ODY4Mn0.Cp_iShHv23lcHYOmztd1Q25raX8rQylgBy1er1fPHno"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);