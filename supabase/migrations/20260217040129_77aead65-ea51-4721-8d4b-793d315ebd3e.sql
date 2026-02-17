
-- Profiles table (synced from Auth0 on login)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_sub TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  picture TEXT,
  demo_mode TEXT DEFAULT 'demo' CHECK (demo_mode IN ('demo', 'builder')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile (matched by auth0_sub stored in JWT)
-- Since we use Auth0 (not Supabase Auth), we'll use service role from edge functions
-- For now, allow authenticated reads via edge functions only
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Demo templates (read-only reference data)
CREATE TABLE public.demo_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.demo_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates are publicly readable"
  ON public.demo_templates FOR SELECT USING (true);

-- Demo environments (per-user, per-template isolated state)
CREATE TABLE public.demo_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  env_id TEXT NOT NULL UNIQUE,
  auth0_sub TEXT NOT NULL REFERENCES public.profiles(auth0_sub) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES public.demo_templates(id),
  env_type TEXT NOT NULL DEFAULT 'ephemeral' CHECK (env_type IN ('ephemeral', 'persistent', 'snapshot')),
  config_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.demo_environments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on demo_environments"
  ON public.demo_environments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Agent memory (per-environment conversation storage)
CREATE TABLE public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  env_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on agent_memory"
  ON public.agent_memory FOR ALL
  USING (true)
  WITH CHECK (true);
CREATE INDEX idx_agent_memory_env ON public.agent_memory(env_id, created_at);

-- Tool state (per-environment tool execution state)
CREATE TABLE public.tool_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  env_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed')),
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on tool_state"
  ON public.tool_state FOR ALL
  USING (true)
  WITH CHECK (true);
CREATE INDEX idx_tool_state_env ON public.tool_state(env_id, created_at);

-- Approval requests (per-environment approval decisions)
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  env_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  action_summary TEXT NOT NULL,
  data_summary JSONB DEFAULT '{}',
  auth0_feature TEXT,
  decision TEXT CHECK (decision IN ('approved', 'denied')),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on approval_requests"
  ON public.approval_requests FOR ALL
  USING (true)
  WITH CHECK (true);
CREATE INDEX idx_approval_env ON public.approval_requests(env_id, created_at);

-- Audit logs (per-environment event timeline)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  env_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  auth0_sub TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on audit_logs"
  ON public.audit_logs FOR ALL
  USING (true)
  WITH CHECK (true);
CREATE INDEX idx_audit_env ON public.audit_logs(env_id, created_at);

-- Seed the 5 demo templates
INSERT INTO public.demo_templates (id, name, description, icon, color, config) VALUES
  ('travel-agent', 'AI Travel Agent', 'Books flights & hotels, shows delegated access and approval gates for purchases.', 'Plane', 'hsl(18 95% 54%)', '{"category": "travel"}'),
  ('exec-assistant', 'AI Executive Assistant', 'Sends emails, schedules meetings — shows consent and Token Vault delegation.', 'Briefcase', 'hsl(174 62% 47%)', '{"category": "productivity"}'),
  ('personal-shopper', 'AI Personal Shopper', 'Browses catalogs, places orders — shows fine-grained authorization.', 'ShoppingBag', 'hsl(262 60% 55%)', '{"category": "commerce"}'),
  ('dev-copilot', 'AI Developer Copilot', 'Manages commits, deploys, documentation — shows scoped tool access.', 'Code', 'hsl(142 60% 45%)', '{"category": "developer"}'),
  ('generic-agent', 'Generic Tool Agent', 'Configurable tools — shows raw auth patterns and authorization mechanics.', 'Wrench', 'hsl(45 90% 55%)', '{"category": "generic"}');

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demo_environments_updated_at
  BEFORE UPDATE ON public.demo_environments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
