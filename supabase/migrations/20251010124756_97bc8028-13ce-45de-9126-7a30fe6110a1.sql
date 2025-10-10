-- Remove the problematic cron job that uses pg_net
SELECT cron.unschedule('check-mission-timeouts');

-- Create a simpler cron job that calls the database function directly
SELECT cron.schedule(
  'check-mission-timeouts',
  '*/5 * * * *', -- Every 5 minutes
  $$SELECT public.check_mission_timeouts();$$
);