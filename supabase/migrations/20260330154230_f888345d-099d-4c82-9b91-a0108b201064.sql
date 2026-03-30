
-- ============================================================
-- Lifeline: Full production schema
-- ============================================================

-- 1. Utility: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'planner', 'viewer');

-- 3. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  default_org_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. User roles (separate table per instructions)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND organization_id = _org_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT organization_id FROM public.user_roles WHERE user_id = _user_id
$$;

-- Org RLS: members can read their orgs
CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT USING (id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Authenticated users can create orgs" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins can update org" ON public.organizations
  FOR UPDATE USING (public.has_role(auth.uid(), id, 'admin'));

-- User roles RLS
CREATE POLICY "Members can view roles in their org" ON public.user_roles
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), organization_id, 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.has_role(auth.uid(), organization_id, 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), organization_id, 'admin'));

-- 6. Districts
CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  version TEXT NOT NULL DEFAULT '1.0.0',
  viewport_json JSONB,
  baseline_bundle_json JSONB,
  provenance_summary_json JSONB,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  is_public_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON public.districts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public demo districts readable by all authenticated; private by org membership
CREATE POLICY "Public demo districts readable by all" ON public.districts
  FOR SELECT USING (is_public_demo = true);
CREATE POLICY "Org members can view their districts" ON public.districts
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Admins can manage districts" ON public.districts
  FOR ALL USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())) AND public.has_role(auth.uid(), organization_id, 'admin'));

-- 7. District access
CREATE TABLE public.district_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'planner', 'admin')),
  UNIQUE (district_id, organization_id)
);
ALTER TABLE public.district_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view district access" ON public.district_access
  FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));

-- 8. Scenarios
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  severity TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  scenario_json JSONB,
  provenance_json JSONB,
  default_for_demo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (district_id, slug)
);
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Published scenarios readable with district access" ON public.scenarios
  FOR SELECT USING (
    status = 'published' AND (
      EXISTS (SELECT 1 FROM public.districts d WHERE d.id = district_id AND d.is_public_demo = true)
      OR district_id IN (
        SELECT da.district_id FROM public.district_access da WHERE da.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
      )
    )
  );

-- 9. Intervention types
CREATE TABLE public.intervention_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  effect_type TEXT,
  rules_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.intervention_types ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_intervention_types_updated_at BEFORE UPDATE ON public.intervention_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Intervention types readable by all authenticated" ON public.intervention_types
  FOR SELECT TO authenticated USING (true);

-- 10. Scenario runs
CREATE TABLE public.scenario_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  district_id UUID NOT NULL REFERENCES public.districts(id),
  scenario_id UUID REFERENCES public.scenarios(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'resolved', 'archived')),
  baseline_metrics_json JSONB,
  flooded_metrics_json JSONB,
  resolved_metrics_json JSONB,
  selected_intervention_slug TEXT,
  selected_anchor_id TEXT,
  result_summary_json JSONB,
  board_snapshot_before_json JSONB,
  board_snapshot_after_json JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scenario_runs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_scenario_runs_updated_at BEFORE UPDATE ON public.scenario_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own runs" ON public.scenario_runs
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Org members can view org runs" ON public.scenario_runs
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Authenticated users can create runs" ON public.scenario_runs
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own runs" ON public.scenario_runs
  FOR UPDATE USING (auth.uid() = created_by);

-- 11. Scenario run events
CREATE TABLE public.scenario_run_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.scenario_runs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload_json JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scenario_run_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Run events follow parent run access" ON public.scenario_run_events
  FOR SELECT USING (
    run_id IN (SELECT id FROM public.scenario_runs)
  );
CREATE POLICY "Authenticated can create run events" ON public.scenario_run_events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 12. Exports
CREATE TABLE public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.scenario_runs(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  export_type TEXT NOT NULL CHECK (export_type IN ('png', 'pdf', 'json')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  storage_path TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_exports_updated_at BEFORE UPDATE ON public.exports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view exports for accessible runs" ON public.exports
  FOR SELECT USING (
    run_id IN (SELECT id FROM public.scenario_runs)
  );
CREATE POLICY "Authenticated can create exports" ON public.exports
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- 13. Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  actor_user_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = actor_user_id);
