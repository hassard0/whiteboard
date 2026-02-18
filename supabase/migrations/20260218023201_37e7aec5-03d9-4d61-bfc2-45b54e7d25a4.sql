-- Allow anon role to read user_roles so Auth0-authenticated clients can check roles client-side
CREATE POLICY "Anon can read user_roles"
  ON public.user_roles
  FOR SELECT
  TO anon
  USING (true);
