-- Fix: missing UPDATE/INSERT/DELETE policies that cause silent failures
-- in the admin panel and client-side booking workflow.
--
-- Problems identified:
-- 1. bookings: only SELECT policy existed → admin UPDATE (status change, cancel)
--    and client UPDATE (reschedule via useBookingWorkflow) were silently blocked.
-- 2. reviews: only SELECT policy → admin could not approve/reject/delete reviews.

-- ============================================================
-- 1. BOOKINGS — admin UPDATE + client UPDATE + client INSERT
-- ============================================================

-- Admin: full UPDATE to change status, reassign, cancel
DROP POLICY IF EXISTS "Admin can update bookings" ON public.bookings;
CREATE POLICY "Admin can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Client: UPDATE own booking (reschedule — sets booking_date/start_time/status)
DROP POLICY IF EXISTS "Clients can update their own bookings" ON public.bookings;
CREATE POLICY "Clients can update their own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

-- Provider: UPDATE own assigned booking (accept reschedule, mark completed)
DROP POLICY IF EXISTS "Providers can update their assigned bookings" ON public.bookings;
CREATE POLICY "Providers can update their assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = (SELECT user_id FROM public.providers WHERE id = bookings.provider_id)
)
WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.providers WHERE id = bookings.provider_id)
);

-- Client INSERT: direct booking creation (checkout flow)
DROP POLICY IF EXISTS "Clients can create bookings" ON public.bookings;
CREATE POLICY "Clients can create bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

-- ============================================================
-- 2. REVIEWS — admin UPDATE + DELETE for moderation
-- ============================================================

DROP POLICY IF EXISTS "Admin can moderate reviews" ON public.reviews;
CREATE POLICY "Admin can moderate reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
