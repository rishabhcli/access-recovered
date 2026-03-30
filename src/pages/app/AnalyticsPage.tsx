import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, Zap, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrg } from '@/lib/supabase/org-context';
import { fetchRecentRuns } from '@/lib/services/runs';
import { fetchAuditLogs } from '@/lib/services/audit';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(168,38%,46%)', 'hsl(32,60%,52%)', 'hsl(4,62%,50%)', 'hsl(210,30%,50%)'];

function formatAction(action: string) {
  return action.replace(/\./g, ' · ').replace(/_/g, ' ');
}

export default function AnalyticsPage() {
  const { currentOrg, currentRole } = useOrg();
  const orgId = currentOrg?.organization_id;
  const isAdmin = currentRole === 'admin';

  const { data: runs } = useQuery({
    queryKey: ['analytics-runs', orgId],
    queryFn: () => fetchRecentRuns(orgId ?? undefined),
    enabled: !!orgId,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs', orgId],
    queryFn: () => fetchAuditLogs(orgId!),
    enabled: !!orgId && isAdmin,
  });

  // Compute intervention usage
  const interventionCounts: Record<string, number> = {};
  (runs ?? []).forEach(r => {
    const slug = r.selected_intervention_slug || 'none';
    interventionCounts[slug] = (interventionCounts[slug] || 0) + 1;
  });
  const interventionData = Object.entries(interventionCounts).map(([name, value]) => ({
    name: name.replace(/-/g, ' '),
    value,
  }));

  // Compute runs per day (last 14 days)
  const dayMap: Record<string, number> = {};
  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    dayMap[d.toISOString().slice(5, 10)] = 0;
  }
  (runs ?? []).forEach(r => {
    const key = r.created_at.slice(5, 10);
    if (key in dayMap) dayMap[key]++;
  });
  const dailyData = Object.entries(dayMap).map(([day, count]) => ({ day, count }));

  return (
    <div className="min-h-screen bg-background">
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
        <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Analytics</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Runs', value: runs?.length ?? 0, icon: TrendingUp },
            { label: 'Interventions Used', value: Object.keys(interventionCounts).length, icon: Zap },
            { label: 'Audit Events', value: auditLogs?.length ?? 0, icon: Users },
            { label: 'Last Run', value: runs?.[0] ? new Date(runs[0].created_at).toLocaleDateString() : '—', icon: Clock },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded border border-border bg-card/50 p-4 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <s.icon className="w-3 h-3 text-muted-foreground/40" />
                <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{s.label}</span>
              </div>
              <div className="text-xl font-mono font-medium tabular-nums">{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Runs over time */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded border border-border bg-card/50 p-5 space-y-3"
          >
            <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Runs — Last 14 Days</div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(38,8%,48%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(38,8%,48%)' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(38,14%,10%)', border: '1px solid hsl(38,8%,16%)', borderRadius: 4, fontSize: 11 }}
                    cursor={{ fill: 'hsl(38,8%,12%)' }}
                  />
                  <Bar dataKey="count" fill="hsl(168,38%,46%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Intervention usage */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded border border-border bg-card/50 p-5 space-y-3"
          >
            <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Intervention Usage</div>
            <div className="h-48 flex items-center justify-center">
              {interventionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={interventionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {interventionData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(38,14%,10%)', border: '1px solid hsl(38,8%,16%)', borderRadius: 4, fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-muted-foreground/40">No data yet</span>
              )}
            </div>
            {interventionData.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center">
                {interventionData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="capitalize">{d.name}</span>
                    <span className="font-mono text-muted-foreground/40">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Audit Feed */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Audit Feed</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          {!isAdmin ? (
            <div className="rounded border border-dashed border-border/60 p-8 text-center">
              <p className="text-sm text-muted-foreground/50">Audit events are visible to organization admins only.</p>
            </div>
          ) : (!auditLogs || auditLogs.length === 0) ? (
            <div className="rounded border border-dashed border-border/60 p-8 text-center">
              <p className="text-sm text-muted-foreground/50">No audit events recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {auditLogs.slice(0, 30).map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 py-2 px-3 rounded hover:bg-card/30 transition-colors"
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    log.action.startsWith('run') ? 'bg-primary/60'
                    : log.action.startsWith('invitation') ? 'bg-accent/60'
                    : log.action.startsWith('member') ? 'bg-status-restored/60'
                    : 'bg-muted-foreground/30'
                  }`} />
                  <span className="text-xs text-foreground/70 capitalize flex-1 truncate">{formatAction(log.action)}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/30 shrink-0">
                    {log.actor_user_id?.slice(0, 8)}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/30 shrink-0">
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
