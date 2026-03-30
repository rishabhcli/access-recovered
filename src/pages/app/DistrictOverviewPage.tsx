import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Shield, Heart, Zap, Clock, ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchRecentRuns } from '@/lib/services/runs';
import { RIVERBEND_EAST, SCENARIOS, INTERVENTION_TYPES } from '@/data/seed/riverbend-east';
import { useOrg } from '@/lib/supabase/org-context';

export default function DistrictOverviewPage() {
  const { districtSlug } = useParams<{ districtSlug: string }>();
  const district = RIVERBEND_EAST;
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization_id;

  const { data: runs } = useQuery({
    queryKey: ['recent-runs', orgId],
    queryFn: () => fetchRecentRuns(orgId ?? undefined),
    enabled: !!orgId,
  });

  const districtRuns = runs?.filter(r => (r.districts as { slug: string } | null)?.slug === districtSlug) ?? [];

  const facilities = district.nodes.filter(n => n.type === 'facility');
  const clusters = district.nodes.filter(n => n.type === 'cluster');
  const anchors = district.nodes.filter(n => n.type === 'anchor' || n.anchorKind);
  const totalHouseholds = clusters.reduce((sum, c) => sum + (c.households ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Lifeline</span>
          <span className="text-[10px] text-muted-foreground">{district.name}</span>
        </div>
        <Link to={`/app/rehearsal/${districtSlug}`}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Play className="w-3 h-3" /> Open Rehearsal Board
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">{district.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            A compact riverfront district with {clusters.length} residential clusters and {facilities.length} critical facilities.
            Vulnerable east crossing creates dramatic isolation risk under flood scenarios.
          </p>
          <div className="flex gap-3 text-xs text-muted-foreground pt-1">
            <span className="font-mono">{totalHouseholds} households</span>
            <span>·</span>
            <span className="font-mono">{clusters.length} clusters</span>
            <span>·</span>
            <span className="font-mono">{facilities.length} facilities</span>
            <span>·</span>
            <span className="font-mono">v{district.version}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Facilities */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-border p-5 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Critical Facilities</div>
            <div className="space-y-3">
              {facilities.map(f => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    f.facilityKind === 'shelter' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {f.facilityKind === 'shelter' ? <Shield className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{f.facilityKind}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Clusters */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-xl border border-border p-5 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Residential Clusters</div>
            <div className="space-y-2">
              {clusters.map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <span className="text-sm">{c.label}</span>
                  <span className="text-xs font-mono text-muted-foreground">{c.households} hh</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scenarios */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Available Scenarios</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCENARIOS.map(s => (
              <div key={s.slug} className="rounded-xl border border-border p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${s.severity === 'severe' ? 'text-destructive' : 'text-amber-400'}`} />
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    s.severity === 'severe' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-400'
                  }`}>{s.severity}</span>
                  <span className="text-[10px] text-muted-foreground">{Object.keys(s.edgeEffects).length} edges affected</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Anchors */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl border border-border p-5 space-y-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Anchor Points</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anchors.map(a => {
              const interventions = INTERVENTION_TYPES.filter(i => a.allowedInterventions?.includes(i.slug));
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{a.label}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {a.anchorKind?.replace(/-/g, ' ')} · {interventions.map(i => i.label).join(', ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Runs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="space-y-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Recent Runs</div>
          {districtRuns.length === 0 ? (
            <div className="rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground">No runs yet. Open the rehearsal board to begin.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {districtRuns.map(run => (
                <Link key={run.id} to={`/app/runs/${run.id}`} className="block group">
                  <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{run.title || 'Untitled Run'}</div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          {run.selected_intervention_slug && (
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3" /> {run.selected_intervention_slug}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(run.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
