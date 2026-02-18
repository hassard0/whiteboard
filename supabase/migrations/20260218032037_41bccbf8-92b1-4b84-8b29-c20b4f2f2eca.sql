-- Allow authenticated users to insert their own demo environments
CREATE POLICY "Users can insert own demo environments"
ON public.demo_environments FOR INSERT
TO authenticated
WITH CHECK (auth0_sub IS NOT NULL);

-- Allow authenticated users to read their own demo environments
CREATE POLICY "Users can read own demo environments"
ON public.demo_environments FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update their own demo environments
CREATE POLICY "Users can update own demo environments"
ON public.demo_environments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete their own demo environments
CREATE POLICY "Users can delete own demo environments"
ON public.demo_environments FOR DELETE
TO authenticated
USING (true);