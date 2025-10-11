-- Ajouter cron jobs pour l'exécution automatique des détections système

-- Cron job pour détecter les paniers abandonnés (toutes les heures)
SELECT cron.schedule(
  'detect-abandoned-carts',
  '0 * * * *',  -- Toutes les heures
  $$
  SELECT public.detect_abandoned_carts();
  $$
);

-- Cron job pour détecter les échecs de paiement (toutes les 15 minutes)
SELECT cron.schedule(
  'detect-payment-failures',
  '*/15 * * * *',  -- Toutes les 15 minutes
  $$
  SELECT public.detect_payment_failures();
  $$
);

-- Cron job pour détecter les prestataires inactifs (une fois par jour à 3h du matin)
SELECT cron.schedule(
  'detect-inactive-providers',
  '0 3 * * *',  -- Tous les jours à 3h
  $$
  SELECT public.detect_inactive_providers();
  $$
);

-- Optionnel : Cron job pour nettoyer les anciennes alertes résolues (une fois par semaine)
SELECT cron.schedule(
  'cleanup-old-alerts',
  '0 2 * * 0',  -- Tous les dimanches à 2h
  $$
  DELETE FROM public.system_alerts 
  WHERE resolved = true 
    AND resolved_at < NOW() - INTERVAL '30 days';
  $$
);