
-- Table acquisition_tracking pour le suivi des coûts par canal
CREATE TABLE public.acquisition_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.acquisition_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage acquisition_tracking"
ON public.acquisition_tracking FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 1. Prestations réalisées sur les 7 derniers jours
CREATE OR REPLACE FUNCTION public.get_weekly_completed_bookings()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'count', COUNT(*),
    'previous_count', (
      SELECT COUNT(*) FROM bookings
      WHERE status = 'completed'
        AND completed_at >= (now() - interval '14 days')
        AND completed_at < (now() - interval '7 days')
    )
  )
  FROM bookings
  WHERE status = 'completed'
    AND completed_at >= (now() - interval '7 days');
$$;

-- 2. Moyenne des notes sur les 7 derniers jours
CREATE OR REPLACE FUNCTION public.get_weekly_avg_rating()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'avg_rating', COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    'review_count', COUNT(*),
    'previous_avg', COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews
      WHERE is_approved = true
        AND created_at >= (now() - interval '14 days')
        AND created_at < (now() - interval '7 days')
    ), 0)
  )
  FROM reviews
  WHERE is_approved = true
    AND created_at >= (now() - interval '7 days');
$$;

-- 3. Pourcentage de clients récurrents (2+ commandes)
CREATE OR REPLACE FUNCTION public.get_recurring_clients_rate()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH client_counts AS (
    SELECT client_id, COUNT(*) as booking_count
    FROM bookings
    WHERE status IN ('completed', 'confirmed', 'in_progress')
    GROUP BY client_id
  )
  SELECT json_build_object(
    'total_clients', COUNT(*),
    'recurring_clients', COUNT(*) FILTER (WHERE booking_count >= 2),
    'rate', CASE WHEN COUNT(*) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE booking_count >= 2))::numeric / COUNT(*)::numeric * 100, 1)
      ELSE 0
    END
  )
  FROM client_counts;
$$;

-- 4. Prestataires actifs vs total
CREATE OR REPLACE FUNCTION public.get_active_providers_ratio()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'total', COUNT(*),
    'rate', CASE WHEN COUNT(*) > 0
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'active'))::numeric / COUNT(*)::numeric * 100, 1)
      ELSE 0
    END
  )
  FROM providers;
$$;

-- 5. Coût d'acquisition par canal (30 derniers jours)
CREATE OR REPLACE FUNCTION public.get_acquisition_cost_by_channel()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(
    json_build_object(
      'channel', channel,
      'total_cost', total_cost,
      'conversions', total_conversions,
      'cac', CASE WHEN total_conversions > 0
        THEN ROUND(total_cost / total_conversions, 2)
        ELSE 0
      END
    )
  ), '[]'::json)
  FROM (
    SELECT channel,
      SUM(cost) as total_cost,
      SUM(conversions) as total_conversions
    FROM acquisition_tracking
    WHERE period_start >= (now() - interval '30 days')
    GROUP BY channel
    ORDER BY SUM(cost) / GREATEST(SUM(conversions), 1) ASC
  ) sub;
$$;
