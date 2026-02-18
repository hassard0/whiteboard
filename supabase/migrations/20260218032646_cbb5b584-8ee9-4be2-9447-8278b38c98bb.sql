
-- Drop existing restrictive policies that require 'authenticated' role
-- (Auth0 users use the anon key and are always in 'anon' role)
DROP POLICY IF EXISTS "Users can insert own demo environments" ON public.demo_environments;
DROP POLICY IF EXISTS "Users can read own demo environments" ON public.demo_environments;
DROP POLICY IF EXISTS "Users can update own demo environments" ON public.demo_environments;
DROP POLICY IF EXISTS "Users can delete own demo environments" ON public.demo_environments;

-- Recreate as permissive policies for anon role
CREATE POLICY "Anon can insert demo environments"
ON public.demo_environments FOR INSERT
TO anon
WITH CHECK (auth0_sub IS NOT NULL);

CREATE POLICY "Anon can read demo environments"
ON public.demo_environments FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can update demo environments"
ON public.demo_environments FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can delete demo environments"
ON public.demo_environments FOR DELETE
TO anon
USING (true);
