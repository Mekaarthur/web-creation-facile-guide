SELECT cron.schedule(
  'check-mission-acceptance-timeout-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://cgrosjzmbgxmtvwxictr.supabase.co/functions/v1/check-mission-acceptance-timeout',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncm9zanptYmd4bXR2d3hpY3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDI2ODIsImV4cCI6MjA2NzU3ODY4Mn0.Cp_iShHv23lcHYOmztd1Q25raX8rQylgBy1er1fPHno"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);