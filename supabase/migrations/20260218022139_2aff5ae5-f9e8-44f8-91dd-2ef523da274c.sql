
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (roles stored separately, never on profiles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_sub text NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (auth0_sub, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Service role gets full access
CREATE POLICY "Service role full access on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Security definer function to check admin role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_auth0_sub text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE auth0_sub = _auth0_sub AND role = 'admin'
  )
$$;

-- Seed ihassard@gmail.com as admin
INSERT INTO public.user_roles (auth0_sub, role)
VALUES ('auth0|6993e8b28d672b29e1e6421b', 'admin')
ON CONFLICT (auth0_sub, role) DO NOTHING;
