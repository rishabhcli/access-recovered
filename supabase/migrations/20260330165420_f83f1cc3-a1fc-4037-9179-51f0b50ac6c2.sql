CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  org_slug TEXT;
  demo_district_id UUID;
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

  -- Grant access to all public demo districts
  INSERT INTO public.district_access (district_id, organization_id, access_level)
  SELECT d.id, new_org_id, 'planner'
  FROM public.districts d
  WHERE d.is_public_demo = true;

  RETURN NEW;
END;
$$;