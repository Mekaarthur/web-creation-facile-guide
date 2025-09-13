-- Table pour les incidents
CREATE TABLE public.incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id),
    type TEXT NOT NULL, -- cancellation_last_minute, absence_provider, absence_client, quality_complaint, payment_dispute
    severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    description TEXT NOT NULL,
    reported_by UUID,
    status TEXT NOT NULL DEFAULT 'open', -- open, investigating, resolved, closed
    resolution_notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les contre-propositions
CREATE TABLE public.counter_proposals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    original_booking_id UUID REFERENCES public.bookings(id) NOT NULL,
    provider_id UUID REFERENCES public.providers(id) NOT NULL,
    proposed_date DATE NOT NULL,
    proposed_time TIME NOT NULL,
    proposed_price NUMERIC,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired
    client_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '48 hours'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les pénalités prestataires
CREATE TABLE public.provider_penalties (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    penalty_type TEXT NOT NULL, -- absence, late_cancellation, quality_issue
    amount NUMERIC NOT NULL DEFAULT 0,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, applied, disputed, waived
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les compensations prestataires
CREATE TABLE public.provider_compensations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.providers(id) NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    amount NUMERIC NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les assignations d'urgence
CREATE TABLE public.emergency_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    original_booking_id UUID REFERENCES public.bookings(id) NOT NULL,
    replacement_provider_id UUID REFERENCES public.providers(id) NOT NULL,
    reason TEXT NOT NULL,
    auto_assigned BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les alertes système
CREATE TABLE public.system_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL, -- info, warning, critical
    message TEXT NOT NULL,
    component TEXT, -- database, email_service, payment_gateway, etc.
    metadata JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open', -- open, acknowledged, resolved
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour le tracking NPS
CREATE TABLE public.nps_surveys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    booking_id UUID REFERENCES public.bookings(id),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    feedback TEXT,
    survey_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    category TEXT NOT NULL, -- promoter, passive, detractor
    follow_up_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counter_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_compensations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;

-- Policies pour incidents
CREATE POLICY "Admin peut tout voir incidents" ON public.incidents FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Utilisateurs peuvent voir leurs incidents" ON public.incidents FOR SELECT USING (
    reported_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = incidents.booking_id 
        AND (b.client_id = auth.uid() OR b.provider_id IN (
            SELECT id FROM public.providers WHERE user_id = auth.uid()
        ))
    )
);

-- Policies pour contre-propositions
CREATE POLICY "Admin peut tout voir contre-propositions" ON public.counter_proposals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Prestataires peuvent gérer leurs contre-propositions" ON public.counter_proposals FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.providers WHERE id = counter_proposals.provider_id)
);
CREATE POLICY "Clients peuvent voir leurs contre-propositions" ON public.counter_proposals FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = counter_proposals.original_booking_id 
        AND b.client_id = auth.uid()
    )
);

-- Policies pour pénalités
CREATE POLICY "Admin peut gérer pénalités" ON public.provider_penalties FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Prestataires peuvent voir leurs pénalités" ON public.provider_penalties FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_penalties.provider_id)
);

-- Policies pour compensations
CREATE POLICY "Admin peut gérer compensations" ON public.provider_compensations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Prestataires peuvent voir leurs compensations" ON public.provider_compensations FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.providers WHERE id = provider_compensations.provider_id)
);

-- Policies pour assignations d'urgence
CREATE POLICY "Admin peut gérer assignations urgence" ON public.emergency_assignments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Prestataires peuvent voir leurs assignations urgence" ON public.emergency_assignments FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.providers WHERE id = emergency_assignments.replacement_provider_id)
);

-- Policies pour alertes système
CREATE POLICY "Admin peut gérer alertes système" ON public.system_alerts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies pour NPS
CREATE POLICY "Admin peut voir NPS" ON public.nps_surveys FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clients peuvent gérer leur NPS" ON public.nps_surveys FOR ALL USING (client_id = auth.uid());
CREATE POLICY "Système peut créer NPS" ON public.nps_surveys FOR INSERT WITH CHECK (true);

-- Index pour optimiser les performances
CREATE INDEX idx_incidents_booking_id ON public.incidents(booking_id);
CREATE INDEX idx_incidents_type_status ON public.incidents(type, status);
CREATE INDEX idx_incidents_created_at ON public.incidents(created_at);
CREATE INDEX idx_counter_proposals_booking_id ON public.counter_proposals(original_booking_id);
CREATE INDEX idx_counter_proposals_provider_id ON public.counter_proposals(provider_id);
CREATE INDEX idx_provider_penalties_provider_id ON public.provider_penalties(provider_id);
CREATE INDEX idx_provider_compensations_provider_id ON public.provider_compensations(provider_id);
CREATE INDEX idx_system_alerts_severity_status ON public.system_alerts(severity, status);
CREATE INDEX idx_nps_surveys_client_id ON public.nps_surveys(client_id);
CREATE INDEX idx_nps_surveys_survey_date ON public.nps_surveys(survey_date);

-- Triggers pour updated_at
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_counter_proposals_updated_at BEFORE UPDATE ON public.counter_proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();