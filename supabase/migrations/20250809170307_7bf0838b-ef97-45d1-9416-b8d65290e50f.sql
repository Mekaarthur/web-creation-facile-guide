-- Create table for client rewards (psychologist vouchers)
CREATE TABLE public.client_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'psychologist_voucher',
  status TEXT NOT NULL DEFAULT 'active', -- active, used, expired
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_date TIMESTAMP WITH TIME ZONE NULL,
  booking_id UUID NULL, -- booking where the reward was used
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for provider rewards
CREATE TABLE public.provider_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  reward_tier TEXT NOT NULL, -- bronze, silver, gold
  amount NUMERIC NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_date TIMESTAMP WITH TIME ZONE NULL,
  missions_count INTEGER NOT NULL DEFAULT 0,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  average_rating NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track monthly client activity for reward calculation
CREATE TABLE public.client_monthly_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  consecutive_months INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, year, month)
);

-- Enable Row Level Security
ALTER TABLE public.client_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_monthly_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for client_rewards
CREATE POLICY "Users can view their own client rewards" 
ON public.client_rewards 
FOR SELECT 
USING (client_id = auth.uid());

CREATE POLICY "Users can update their own client rewards" 
ON public.client_rewards 
FOR UPDATE 
USING (client_id = auth.uid());

CREATE POLICY "System can create client rewards" 
ON public.client_rewards 
FOR INSERT 
WITH CHECK (true);

-- Create policies for provider_rewards
CREATE POLICY "Providers can view their own rewards" 
ON public.provider_rewards 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id));

CREATE POLICY "System can manage provider rewards" 
ON public.provider_rewards 
FOR ALL 
USING (true);

-- Create policies for client_monthly_activity
CREATE POLICY "Users can view their own monthly activity" 
ON public.client_monthly_activity 
FOR SELECT 
USING (client_id = auth.uid());

CREATE POLICY "System can manage monthly activity" 
ON public.client_monthly_activity 
FOR ALL 
USING (true);

-- Create function to calculate client reward eligibility
CREATE OR REPLACE FUNCTION public.check_client_reward_eligibility(p_client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  consecutive_count INTEGER := 0;
  current_month INTEGER;
  current_year INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Check for 3 consecutive months with 10+ hours each
  SELECT COUNT(*)
  INTO consecutive_count
  FROM public.client_monthly_activity
  WHERE client_id = p_client_id
    AND total_hours >= 10
    AND (
      (year = current_year AND month >= current_month - 2)
      OR (year = current_year - 1 AND month >= 12 - (2 - current_month))
    )
    AND consecutive_months >= 3;
    
  RETURN consecutive_count > 0;
END;
$$;

-- Create function to calculate provider reward tier
CREATE OR REPLACE FUNCTION public.calculate_provider_reward_tier(
  p_provider_id UUID,
  p_missions_count INTEGER,
  p_hours_worked NUMERIC,
  p_average_rating NUMERIC,
  p_months_active INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Must have 6+ months of activity
  IF p_months_active < 6 THEN
    RETURN NULL;
  END IF;
  
  -- Gold tier
  IF (p_missions_count >= 50 OR p_hours_worked >= 400) AND p_average_rating >= 4.5 THEN
    RETURN 'gold';
  END IF;
  
  -- Silver tier
  IF (p_missions_count >= 30 OR p_hours_worked >= 240) AND p_average_rating >= 4.3 THEN
    RETURN 'silver';
  END IF;
  
  -- Bronze tier
  IF (p_missions_count >= 15 OR p_hours_worked >= 120) AND p_average_rating >= 4.0 THEN
    RETURN 'bronze';
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create function to get reward amount by tier
CREATE OR REPLACE FUNCTION public.get_reward_amount(p_tier TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE p_tier
    WHEN 'bronze' THEN RETURN 50;
    WHEN 'silver' THEN RETURN 100;
    WHEN 'gold' THEN RETURN 150;
    ELSE RETURN 0;
  END CASE;
END;
$$;

-- Create trigger to automatically set expiration dates for client rewards
CREATE OR REPLACE FUNCTION public.set_client_reward_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Valid for 3 months from earning date
  NEW.valid_until := NEW.earned_date + INTERVAL '3 months';
  
  -- Expires on December 31st of current year
  NEW.expires_at := DATE_TRUNC('year', NEW.earned_date) + INTERVAL '1 year' - INTERVAL '1 day';
  
  -- If valid_until is after expires_at, use expires_at
  IF NEW.valid_until > NEW.expires_at THEN
    NEW.valid_until := NEW.expires_at;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_client_reward_expiration_trigger
  BEFORE INSERT ON public.client_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_client_reward_expiration();

-- Create trigger for updated_at columns
CREATE TRIGGER update_client_rewards_updated_at
  BEFORE UPDATE ON public.client_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_rewards_updated_at
  BEFORE UPDATE ON public.provider_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_monthly_activity_updated_at
  BEFORE UPDATE ON public.client_monthly_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();