-- Create function to notify provider of new performance reward
CREATE OR REPLACE FUNCTION public.notify_provider_performance_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  provider_user_id UUID;
  tier_label TEXT;
  tier_emoji TEXT;
BEGIN
  -- Get provider user_id
  SELECT user_id INTO provider_user_id
  FROM public.providers
  WHERE id = NEW.provider_id;
  
  -- Determine tier label and emoji
  CASE NEW.reward_tier
    WHEN 'bronze' THEN
      tier_label := 'Bronze';
      tier_emoji := '🥉';
    WHEN 'silver' THEN
      tier_label := 'Argent';
      tier_emoji := '🥈';
    WHEN 'gold' THEN
      tier_label := 'Or';
      tier_emoji := '🥇';
    ELSE
      tier_label := NEW.reward_tier;
      tier_emoji := '🏆';
  END CASE;
  
  -- Create notification
  INSERT INTO public.realtime_notifications (
    user_id,
    type,
    title,
    message,
    data,
    priority,
    created_at
  ) VALUES (
    provider_user_id,
    'performance_reward_earned',
    CONCAT(tier_emoji, ' Récompense de Performance ', tier_label),
    CONCAT('Félicitations ! Vous avez gagné une récompense de performance ', tier_label, ' de ', NEW.amount, '€ pour vos excellentes performances.'),
    jsonb_build_object(
      'reward_id', NEW.id,
      'tier', NEW.reward_tier,
      'amount', NEW.amount,
      'year', NEW.year
    ),
    'high',
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new performance rewards
DROP TRIGGER IF EXISTS trigger_notify_performance_reward ON public.provider_rewards;
CREATE TRIGGER trigger_notify_performance_reward
AFTER INSERT ON public.provider_rewards
FOR EACH ROW
EXECUTE FUNCTION public.notify_provider_performance_reward();

-- Create function to notify provider when reward is paid
CREATE OR REPLACE FUNCTION public.notify_provider_reward_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  provider_user_id UUID;
  tier_label TEXT;
BEGIN
  -- Only notify when status changes to paid
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Get provider user_id
    SELECT user_id INTO provider_user_id
    FROM public.providers
    WHERE id = NEW.provider_id;
    
    -- Determine tier label
    CASE NEW.reward_tier
      WHEN 'bronze' THEN tier_label := 'Bronze';
      WHEN 'silver' THEN tier_label := 'Argent';
      WHEN 'gold' THEN tier_label := 'Or';
      ELSE tier_label := NEW.reward_tier;
    END CASE;
    
    -- Create notification
    INSERT INTO public.realtime_notifications (
      user_id,
      type,
      title,
      message,
      data,
      priority,
      created_at
    ) VALUES (
      provider_user_id,
      'performance_reward_paid',
      '💰 Récompense Payée',
      CONCAT('Votre récompense de performance ', tier_label, ' de ', NEW.amount, '€ a été payée avec succès.'),
      jsonb_build_object(
        'reward_id', NEW.id,
        'tier', NEW.reward_tier,
        'amount', NEW.amount,
        'paid_date', NEW.paid_date
      ),
      'normal',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for paid performance rewards
DROP TRIGGER IF EXISTS trigger_notify_reward_paid ON public.provider_rewards;
CREATE TRIGGER trigger_notify_reward_paid
AFTER UPDATE ON public.provider_rewards
FOR EACH ROW
EXECUTE FUNCTION public.notify_provider_reward_paid();