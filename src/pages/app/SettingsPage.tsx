import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, UserPlus, Trash2, Shield, Eye, PenLine, RotateCcw } from 'lucide-react';
import { useOrg } from '@/lib/supabase/org-context';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  fetchOrgMembers, fetchOrgInvitations,
  createInvitation, deleteInvitation,
  updateMemberRole, removeMember,
} from '@/lib/services/organizations';
import { fetchAuditLogs } from '@/lib/services/audit';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';

function formatAction(action: string) {
  return action.replace(/\./g, ' · ').replace(/_/g, ' ');
}

export default function SettingsPage() {
  const { currentOrg, currentRole, refetch: refetchOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = currentRole === 'admin';
  const orgId = currentOrg?.organization_id;
  const [showTutorial, setShowTutorial] = useState(false);

  const replayTutorial = useCallback(() => {
    localStorage.removeItem('lifeline-onboarding-completed');
    setShowTutorial(true);
  }, []);

  const closeTutorial = useCallback(() => {
    localStorage.setItem('lifeline-onboarding-completed', 'true');
    setShowTutorial(false);
  }, []);

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

  const { data: auditLogs } = useQuery({
    queryKey: ['settings-audit', orgId],
    queryFn: () => fetchAuditLogs(orgId!, 20),
    enabled: !!orgId && isAdmin,
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'planner' | 'viewer'>('planner');

  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(orgId!, inviteEmail, inviteRole),
    onSuccess: () => {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
      queryClient.invalidateQueries({ queryKey: ['settings-audit', orgId] });
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
      queryClient.invalidateQueries({ queryKey: ['settings-audit', orgId] });
      refetchOrg();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      queryClient.invalidateQueries({ queryKey: ['settings-audit', orgId] });
    },
  });

  const roleIcon = (role: string) => {
    if (role === 'admin') return <Shield className="w-3 h-3 text-primary" />;
    if (role === 'planner') return <PenLine className="w-3 h-3 text-status-restored" />;
    return <Eye className="w-3 h-3 text-muted-foreground/50" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {showTutorial && (
        <OnboardingTutorial onComplete={closeTutorial} onDismiss={closeTutorial} />
      )}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm px-6 py-3 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/app" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm bg-primary/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <span className="font-display text-sm">Lifeline</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Settings</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* Organization */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Organization</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="rounded border border-border bg-card/50 p-5">
            <div className="font-display text-base">{currentOrg?.organization.name ?? 'No organization'}</div>
            <div className="text-xs text-muted-foreground/60 mt-1 flex items-center justify-between">
              <span>Your role: <span className="capitalize font-medium text-foreground/70">{currentRole}</span></span>
              <button
                onClick={replayTutorial}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono rounded border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Replay Tutorial
              </button>
            </div>
          </div>
        </section>

        {/* Members */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Members</span>
            <div className="h-px flex-1 bg-border/50" />
            {members && <span className="text-[10px] font-mono text-muted-foreground/30">{members.length}</span>}
          </div>
          <div className="rounded border border-border divide-y divide-border/60">
            {members?.map((m, i) => {
              const profile = m.profile;
              const isSelf = m.user_id === user?.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center text-[10px] font-mono font-medium uppercase text-muted-foreground">
                      {(profile?.full_name?.[0]) ?? '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {profile?.full_name || 'Unknown'}
                        {isSelf && <span className="text-muted-foreground/40 ml-1 text-xs">(you)</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {roleIcon(m.role as string)}
                    {isAdmin && !isSelf ? (
                      <select
                        value={m.role as string}
                        onChange={e => roleUpdateMutation.mutate({ roleId: m.id, newRole: e.target.value as 'admin' | 'planner' | 'viewer' })}
                        aria-label={`Role for ${profile?.full_name || 'member'}`}
                        className="text-[10px] bg-secondary border border-border rounded px-1.5 py-0.5 capitalize font-mono"
                      >
                        <option value="admin">Admin</option>
                        <option value="planner">Planner</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 capitalize font-mono">{m.role as string}</span>
                    )}
                    {isAdmin && !isSelf && (
                      <button onClick={() => removeMemberMutation.mutate(m.id)}
                        aria-label={`Remove ${profile?.full_name || 'member'}`}
                        className="text-muted-foreground/30 hover:text-destructive transition-colors ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Invite */}
        {isAdmin && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Invite Member</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <div className="rounded border border-border bg-card/50 p-5 space-y-3">
              <div className="flex gap-2">
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  aria-label="Invite email"
                  placeholder="colleague@city.gov"
                  className="flex-1 px-3 py-2 rounded bg-secondary border border-border text-sm placeholder:text-muted-foreground/30 font-mono text-xs" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'planner' | 'viewer')}
                  aria-label="Invite role"
                  className="px-2 py-2 rounded bg-secondary border border-border text-xs font-mono">
                  <option value="planner">Planner</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={() => inviteMutation.mutate()}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                <UserPlus className="w-3 h-3" />
                {inviteMutation.isPending ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>

            {invitations && invitations.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">Pending</div>
                <div className="rounded border border-border divide-y divide-border/60">
                  {invitations.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="text-sm font-mono">{inv.email}</div>
                        <div className="text-[10px] text-muted-foreground/40 capitalize font-mono">
                          {inv.role} · {new Date(inv.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button onClick={() => deleteInvMutation.mutate(inv.id)}
                        aria-label={`Cancel invitation for ${inv.email}`}
                        className="text-muted-foreground/30 hover:text-destructive transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Recent Audit */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Recent Activity</span>
            <div className="h-px flex-1 bg-border/50" />
            <Link to="/app/analytics" className="text-[10px] text-primary/60 hover:text-primary transition-colors font-mono">
              View All →
            </Link>
          </div>
          {!isAdmin ? (
            <div className="rounded border border-dashed border-border/60 p-6 text-center">
              <p className="text-xs text-muted-foreground/40">Recent activity is visible to organization admins only.</p>
            </div>
          ) : (!auditLogs || auditLogs.length === 0) ? (
            <div className="rounded border border-dashed border-border/60 p-6 text-center">
              <p className="text-xs text-muted-foreground/40">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {auditLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 py-1.5 px-3 rounded hover:bg-card/30 transition-colors"
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    log.action.startsWith('run') ? 'bg-primary/50'
                    : log.action.startsWith('invitation') ? 'bg-accent/50'
                    : 'bg-muted-foreground/20'
                  }`} />
                  <span className="text-xs text-foreground/60 capitalize flex-1 truncate">{formatAction(log.action)}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/25 shrink-0">
                    {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
