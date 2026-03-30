import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Trash2, Shield, Eye, PenLine } from 'lucide-react';
import { useOrg } from '@/lib/supabase/org-context';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  fetchOrgMembers, fetchOrgInvitations,
  createInvitation, deleteInvitation,
  updateMemberRole, removeMember, updateProfile,
} from '@/lib/services/organizations';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { currentOrg, currentRole, refetch: refetchOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = currentRole === 'admin';
  const orgId = currentOrg?.organization_id;

  const { data: members } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => fetchOrgMembers(orgId!),
    enabled: !!orgId,
  });

  const { data: invitations } = useQuery({
    queryKey: ['org-invitations', orgId],
    queryFn: () => fetchOrgInvitations(orgId!),
    enabled: !!orgId && isAdmin,
  });

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'planner' | 'viewer'>('planner');

  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(orgId!, inviteEmail, inviteRole),
    onSuccess: () => {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteInvMutation = useMutation({
    mutationFn: deleteInvitation,
    onSuccess: () => {
      toast.success('Invitation cancelled');
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
    },
  });

  const roleUpdateMutation = useMutation({
    mutationFn: ({ roleId, newRole }: { roleId: string; newRole: 'admin' | 'planner' | 'viewer' }) =>
      updateMemberRole(roleId, newRole),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      refetchOrg();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
  });

  const roleIcon = (role: string) => {
    if (role === 'admin') return <Shield className="w-3 h-3 text-primary" />;
    if (role === 'planner') return <PenLine className="w-3 h-3 text-status-restored" />;
    return <Eye className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 px-6 py-3 flex items-center gap-4">
        <Link to="/app" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs font-bold tracking-[0.2em] uppercase">Lifeline</span>
        <span className="text-[10px] text-muted-foreground">Settings</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Organization */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Organization</div>
          <div className="rounded-xl border border-border p-5">
            <div className="text-sm font-semibold">{currentOrg?.organization.name ?? 'No organization'}</div>
            <div className="text-xs text-muted-foreground mt-1">Your role: <span className="capitalize font-medium">{currentRole}</span></div>
          </div>
        </div>

        {/* Members */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Members</div>
          <div className="rounded-xl border border-border divide-y divide-border">
            {members?.map(m => {
              const profile = m.profiles as { full_name: string | null; avatar_url: string | null } | null;
              const isSelf = m.user_id === user?.id;
              return (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold uppercase">
                      {(profile?.full_name?.[0]) ?? '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{profile?.full_name || 'Unknown'} {isSelf && <span className="text-muted-foreground">(you)</span>}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {roleIcon(m.role as string)}
                    {isAdmin && !isSelf ? (
                      <select
                        value={m.role as string}
                        onChange={e => roleUpdateMutation.mutate({ roleId: m.id, newRole: e.target.value as 'admin' | 'planner' | 'viewer' })}
                        className="text-[10px] bg-secondary border border-border rounded px-1.5 py-0.5 capitalize"
                      >
                        <option value="admin">Admin</option>
                        <option value="planner">Planner</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-[10px] text-muted-foreground capitalize">{m.role as string}</span>
                    )}
                    {isAdmin && !isSelf && (
                      <button onClick={() => removeMemberMutation.mutate(m.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite (admin only) */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Invite Member</div>
            <div className="rounded-xl border border-border p-5 space-y-3">
              <div className="flex gap-2">
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@city.gov"
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'planner' | 'viewer')}
                  className="px-2 py-2 rounded-lg bg-secondary border border-border text-xs">
                  <option value="planner">Planner</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={() => inviteMutation.mutate()}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                <UserPlus className="w-3 h-3" />
                {inviteMutation.isPending ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>

            {/* Pending invitations */}
            {invitations && invitations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Pending Invitations</div>
                <div className="rounded-xl border border-border divide-y divide-border">
                  {invitations.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="text-sm">{inv.email}</div>
                        <div className="text-[10px] text-muted-foreground capitalize">{inv.role} · Sent {new Date(inv.created_at).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => deleteInvMutation.mutate(inv.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
