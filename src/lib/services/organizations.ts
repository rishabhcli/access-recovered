import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/services/audit';

export interface OrgMembership {
  organization_id: string;
  role: string;
  organization: { id: string; name: string; slug: string };
}

export async function fetchUserOrgs(): Promise<OrgMembership[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('organization_id, role, organizations(id, name, slug)')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(d => ({
    organization_id: d.organization_id,
    role: d.role as string,
    organization: d.organizations as unknown as { id: string; name: string; slug: string },
  }));
}

export interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: { full_name: string | null; avatar_url: string | null } | null;
}

export async function fetchOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('id, user_id, role, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fetch profiles separately since there's no direct FK from user_roles to profiles
  const userIds = data.map(d => d.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  return data.map(d => ({
    id: d.id,
    user_id: d.user_id,
    role: d.role as string,
    created_at: d.created_at,
    profile: profileMap.get(d.user_id) ?? null,
  }));
}

export async function fetchOrgInvitations(orgId: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createInvitation(orgId: string, email: string, role: 'admin' | 'planner' | 'viewer') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('invitations')
    .insert({
      organization_id: orgId,
      email,
      role,
      invited_by: user.id,
    });

  if (error) throw error;
  logAudit({ action: 'invitation.sent', entity_type: 'invitation', organization_id: orgId, payload: { email, role } });

export async function deleteInvitation(invitationId: string) {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId);

  if (error) throw error;
}

export async function updateMemberRole(roleId: string, newRole: 'admin' | 'planner' | 'viewer') {
  const { error } = await supabase
    .from('user_roles')
    .update({ role: newRole })
    .eq('id', roleId);

  if (error) throw error;
}

export async function removeMember(roleId: string) {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', roleId);

  if (error) throw error;
}

export async function acceptPendingInvitations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return;

  await supabase.rpc('accept_invitation', { _email: user.email });
}

export async function fetchProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function updateProfile(updates: { full_name?: string; default_org_id?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw error;
}
