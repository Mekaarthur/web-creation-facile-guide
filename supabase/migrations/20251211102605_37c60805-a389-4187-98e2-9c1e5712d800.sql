-- Index pour optimiser les requêtes de réservations
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_client_status ON public.bookings(client_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_status ON public.bookings(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON public.bookings(booking_date, status);

-- Index pour les transactions financières
CREATE INDEX IF NOT EXISTS idx_financial_transactions_booking_id ON public.financial_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_client_id ON public.financial_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_provider_id ON public.financial_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_payment_status ON public.financial_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON public.financial_transactions(created_at DESC);

-- Index pour les demandes clients
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON public.client_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_requests_created_at ON public.client_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_requests_assigned_provider ON public.client_requests(assigned_provider_id);

-- Index pour les missions
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_assigned_provider ON public.missions(assigned_provider_id);
CREATE INDEX IF NOT EXISTS idx_missions_client_request ON public.missions(client_request_id);
CREATE INDEX IF NOT EXISTS idx_missions_expires_at ON public.missions(expires_at);

-- Index pour les prestataires
CREATE INDEX IF NOT EXISTS idx_providers_is_verified ON public.providers(is_verified);
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_rating ON public.providers(rating DESC);

-- Index pour les profils
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Index pour les paniers
CREATE INDEX IF NOT EXISTS idx_carts_client_id ON public.carts(client_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON public.carts(status);
CREATE INDEX IF NOT EXISTS idx_carts_expires_at ON public.carts(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_user_id ON public.realtime_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_is_read ON public.realtime_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_provider_notifications_provider_id ON public.provider_notifications(provider_id);

-- Index pour les avis
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);

-- Index pour les candidatures
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON public.job_applications(email);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON public.job_applications(created_at DESC);

-- Index pour les user_roles (critique pour les vérifications de permissions)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);