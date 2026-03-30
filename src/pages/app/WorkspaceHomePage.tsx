import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Clock, Zap, Settings, BarChart3, Activity } from 'lucide-react';
import { ThemeToggle } from '@/components/shell/ThemeToggle';
import { useQuery } from '@tanstack/react-query';
import { fetchRecentRuns } from '@/lib/services/runs';
import { useAuth } from '@/lib/supabase/auth-context';
import { OrgSwitcher } from '@/components/shell/OrgSwitcher';
import { useOrg } from '@/lib/supabase/org-context';
import { LiveActivityBar } from '@/components/shell/LiveActivityBar';
import { motion } from 'framer-motion';

export default function WorkspaceHomePage() {
  const { signOut } = useAuth();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization_id;

  const { data: runs } = useQuery({
    queryKey: ['recent-runs', orgId],
    queryFn: () => fetchRecentRuns(orgId ?? undefined),
    enabled: !!orgId,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span className="font-display text-sm">Lifeline</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <OrgSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <Link to="/app/analytics" className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Analytics">
            <BarChart3 className="w-4 h-4" />
          </Link>
          <Link to="/app/settings" className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </Link>
          <div className="w-px h-4 bg-border" />
          <button onClick={() => signOut()} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1">
            Sign Out
          </button>
        </div>
      </div>

      {/* Live activity bar */}
      <LiveActivityBar />

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Districts */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Districts</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <Link to="/app/districts/riverbend-east" className="block group">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded border border-border bg-card p-5 hover:border-primary/30 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 topo-grid opacity-20 pointer-events-none" />
              <div className="relative flex items-start justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-display text-base">Riverbend East</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    5 clusters · 2 facilities · 612 households
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-sm text-[10px] bg-destructive/8 text-destructive/80 font-medium border border-destructive/10">
                      Severe Flash Flood
                    </span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] bg-accent/8 text-accent/80 font-medium border border-accent/10">
                      Moderate River Rise
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
            </motion.div>
          </Link>
        </section>

        {/* Recent Runs */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Recent Runs</span>
            <div className="h-px flex-1 bg-border/50" />
            {runs && runs.length > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground/40">{runs.length}</span>
            )}
          </div>
          {(!runs || runs.length === 0) ? (
            <div className="rounded border border-dashed border-border/60 p-8 text-center">
              <p className="text-sm text-muted-foreground/60">No saved runs yet.</p>
              <p className="text-xs text-muted-foreground/40 mt-1">Open a district to begin rehearsal.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {runs.map((run, i) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/app/runs/${run.id}`} className="block group">
                    <div className="rounded border border-border/60 bg-card/40 px-4 py-3 hover:border-primary/20 hover:bg-card/80 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 min-w-0">
                          <div className="text-sm font-medium truncate">{run.title || 'Untitled Run'}</div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                            {run.districts && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {(run.districts as { name: string }).name}
                              </span>
                            )}
                            {run.selected_intervention_slug && (
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" /> {run.selected_intervention_slug.replace(/-/g, ' ')}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(run.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
