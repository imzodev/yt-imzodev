DROP POLICY IF EXISTS "Public Read Access" ON public.users;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (((SELECT auth.uid()) = supabase_user_id));

ALTER POLICY "Users can insert own profile"
ON public.users
WITH CHECK (((SELECT auth.uid()) = supabase_user_id));

ALTER POLICY "Users can update own profile"
ON public.users
USING (((SELECT auth.uid()) = supabase_user_id));

ALTER POLICY "Users can view own subscriptions"
ON public.subscriptions
USING (
  user_id IN (
    SELECT users.id
    FROM public.users
    WHERE users.supabase_user_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Users can view own payments"
ON public.payments
USING (
  user_id IN (
    SELECT users.id
    FROM public.users
    WHERE users.supabase_user_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Users can manage own newsletter"
ON public.newsletter_subscriptions
USING (
  user_id IN (
    SELECT users.id
    FROM public.users
    WHERE users.supabase_user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  user_id IN (
    SELECT users.id
    FROM public.users
    WHERE users.supabase_user_id = (SELECT auth.uid())
  )
);

ALTER POLICY "Users can view own activity"
ON public.user_activity
USING (
  user_id IN (
    SELECT users.id
    FROM public.users
    WHERE users.supabase_user_id = (SELECT auth.uid())
  )
);
