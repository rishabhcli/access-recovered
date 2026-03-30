
-- Update handle_new_user to also create a default org and admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  org_slug TEXT;
BEGIN
  -- Create profile
  user_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, user_name, NEW.raw_user_meta_data->>'avatar_url');

  -- Create default org
  org_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || substr(NEW.id::text, 1, 8);
  INSERT INTO public.organizations (id, name, slug, created_by)
  VALUES (gen_random_uuid(), user_name || '''s Team', org_slug, NEW.id)
  RETURNING id INTO new_org_id;

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'admin');

  -- Set default org on profile
  UPDATE public.profiles SET default_org_id = new_org_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admins can manage invitations in their org
CREATE POLICY "Admins can view invitations" ON public.invitations
  FOR SELECT USING (public.has_role(auth.uid(), organization_id, 'admin'));
CREATE POLICY "Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), organization_id, 'admin'));
CREATE POLICY "Admins can update invitations" ON public.invitations
  FOR UPDATE USING (public.has_role(auth.uid(), organization_id, 'admin'));
CREATE POLICY "Admins can delete invitations" ON public.invitations
  FOR DELETE USING (public.has_role(auth.uid(), organization_id, 'admin'));

-- Function to accept an invitation (called by the invited user after signup/login)
CREATE OR REPLACE FUNCTION public.accept_invitation(_email TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT id, organization_id, role FROM public.invitations
    WHERE email = _email AND status = 'pending'
  LOOP
    INSERT INTO public.user_roles (user_id, organization_id, role)
    VALUES (auth.uid(), inv.organization_id, inv.role)
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    UPDATE public.invitations SET status = 'accepted', updated_at = now() WHERE id = inv.id;
  END LOOP;
END;
$$;
