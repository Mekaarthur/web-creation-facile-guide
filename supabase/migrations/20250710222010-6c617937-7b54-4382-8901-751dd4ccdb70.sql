-- Créer la table services
CREATE TABLE public.services (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_per_hour DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour services (lecture publique)
CREATE POLICY "Services are viewable by everyone" ON public.services
FOR SELECT USING (true);

-- Créer la table providers
CREATE TABLE public.providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    description TEXT,
    hourly_rate DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0,
    location TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Activer RLS sur providers
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour providers
CREATE POLICY "Providers are viewable by everyone" ON public.providers
FOR SELECT USING (true);

CREATE POLICY "Users can create their provider profile" ON public.providers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their provider profile" ON public.providers
FOR UPDATE USING (auth.uid() = user_id);

-- Créer la table bookings
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bookings
CREATE POLICY "Users can view their bookings" ON public.bookings
FOR SELECT USING (auth.uid() = client_id OR auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id));

CREATE POLICY "Clients can create bookings" ON public.bookings
FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients and providers can update bookings" ON public.bookings
FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = (SELECT user_id FROM providers WHERE id = provider_id));

-- Ajouter les triggers pour updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les services de base
INSERT INTO public.services (name, description, price_per_hour, category) VALUES
('Garde d''enfants', 'Service de garde d''enfants à domicile', 25.00, 'BIKA Kids'),
('Ménage', 'Service de ménage et nettoyage à domicile', 20.00, 'BIKA Maison'),
('Accompagnement courses', 'Aide aux courses et démarches administratives', 18.00, 'BIKA Vie'),
('Jardinage', 'Entretien de jardin et espaces verts', 22.00, 'BIKA Maison'),
('Aide aux devoirs', 'Soutien scolaire et aide aux devoirs', 30.00, 'BIKA Kids'),
('Promenade d''animaux', 'Sortie et soins pour vos animaux de compagnie', 15.00, 'BIKA Animals'),
('Accompagnement seniors', 'Aide et accompagnement pour personnes âgées', 22.00, 'BIKA Personnes Âgées'),
('Assistance administrative', 'Gestion administrative et démarches', 25.00, 'BIKA Pro');