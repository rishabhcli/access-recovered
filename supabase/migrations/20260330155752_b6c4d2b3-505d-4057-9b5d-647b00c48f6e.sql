
-- Allow authenticated users to read profiles of users in their org
CREATE POLICY "Org members can view member profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT ur.user_id FROM public.user_roles ur
      WHERE ur.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
    )
  );
