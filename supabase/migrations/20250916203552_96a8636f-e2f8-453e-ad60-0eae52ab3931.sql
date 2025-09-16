-- Créer une table pour les signalements de contenus
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reported_by UUID NOT NULL,
  reported_content_type TEXT NOT NULL, -- 'review', 'profile', 'message', 'booking'
  reported_content_id UUID NOT NULL,
  report_reason TEXT NOT NULL,
  report_category TEXT NOT NULL DEFAULT 'inappropriate_content',
  additional_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
  resolved_by UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS pour la table des signalements
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent créer des signalements
CREATE POLICY "Users can create content reports" 
ON public.content_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reported_by);

-- Politique pour que les utilisateurs voient leurs propres signalements
CREATE POLICY "Users can view their own reports" 
ON public.content_reports 
FOR SELECT 
USING (auth.uid() = reported_by);

-- Politique pour que les admins voient tous les signalements
CREATE POLICY "Admins can manage all reports" 
ON public.content_reports 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_content_reports_updated_at
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Créer une table pour les statistiques de modération
CREATE TABLE IF NOT EXISTS public.moderation_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  open_reports INTEGER DEFAULT 0,
  pending_reviews INTEGER DEFAULT 0,
  suspended_users INTEGER DEFAULT 0,
  weekly_actions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stat_date)
);

-- RLS pour les statistiques de modération
ALTER TABLE public.moderation_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage moderation stats" 
ON public.moderation_stats 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fonction pour calculer les statistiques de modération
CREATE OR REPLACE FUNCTION public.calculate_moderation_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  open_reports_count INTEGER := 0;
  pending_reviews_count INTEGER := 0;
  suspended_users_count INTEGER := 0;
  weekly_actions_count INTEGER := 0;
BEGIN
  -- Compter les signalements ouverts
  SELECT COUNT(*) INTO open_reports_count
  FROM public.content_reports
  WHERE status IN ('pending', 'reviewing');
  
  -- Compter les avis en attente
  SELECT COUNT(*) INTO pending_reviews_count
  FROM public.reviews
  WHERE is_approved = false;
  
  -- Compter les utilisateurs suspendus (approximation basée sur les prestataires inactifs)
  SELECT COUNT(*) INTO suspended_users_count
  FROM public.providers
  WHERE status = 'suspended';
  
  -- Compter les actions de la semaine
  SELECT COUNT(*) INTO weekly_actions_count
  FROM public.admin_actions_log
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND entity_type IN ('review', 'content_report', 'provider');
  
  RETURN jsonb_build_object(
    'open_reports', open_reports_count,
    'pending_reviews', pending_reviews_count,
    'suspended_users', suspended_users_count,
    'weekly_actions', weekly_actions_count
  );
END;
$$;