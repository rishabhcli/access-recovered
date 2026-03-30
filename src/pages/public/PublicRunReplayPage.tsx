import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, MapPin, Zap, Anchor, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { RIVERBEND_EAST } from '@/data/seed/riverbend-east';
import type { GraphEdge } from '@/lib/simulation/types';
import { useState } from 'react';

/* ── Fetch run without auth (relies on RLS allowing public reads or service key) ── */
async function fetchPublicRun(runId: string) {
  const { data, error } = await supabase
    .from('scenario_runs')
    .select('*, districts(slug, name), scenarios(slug, label, severity)')
    .eq('id', runId)
    .single();
  if (error) throw error;
  return data;
}

async function fetchPublicRunEvents(runId: string) {
  const { data, error } = await supabase
    .from('scenario_run_events')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

/* ── Mini board SVG ── */
function BoardPreviewSVG({ edges }: { edges: GraphEdge[] }) {
  const nodes = RIVERBEND_EAST.nodes;
  const minX = Math.min(...nodes.map(n => n.x)) - 30;
  const minY = Math.min(...nodes.map(n => n.y)) - 30;
  const maxX = Math.max(...nodes.map(n => n.x)) + 30;
  const maxY = Math.max(...nodes.map(n => n.y)) + 30;

  return (
    <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      className="w-full h-auto rounded-lg border border-border bg-card" style={{ maxHeight: 300 }}>
      {edges.map(e => {
        const from = nodes.find(n => n.id === e.from);
        const to = nodes.find(n => n.id === e.to);
        if (!from || !to) return null;
        const color =
          e.status === 'blocked' ? 'hsl(0,70%,52%)'
          : e.status === 'degraded' ? 'hsl(38,85%,55%)'
          : e.status === 'restored' || e.status === 'temporary' ? 'hsl(145,65%,48%)'
          : 'hsl(210,15%,40%)';
        return (
          <line key={e.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={color} strokeWidth={e.status === 'blocked' ? 3 : 2}
            strokeDasharray={e.status === 'temporary' ? '6,3' : undefined} />
        );
      })}
      {nodes.map(n => {
        const r = n.type === 'facility' ? 8 : n.type === 'cluster' ? 7 : n.type === 'anchor' ? 6 : 3;
        const fill =
          n.type === 'facility' ? (n.facilityKind === 'shelter' ? 'hsl(38,85%,55%)' : 'hsl(185,65%,42%)')
          : n.type === 'cluster' ? 'hsl(210,15%,70%)'
          : n.type === 'anchor' ? 'hsl(145,65%,48%)'
          : 'hsl(210,15%,30%)';
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={r} fill={fill} />
            {n.label && (
              <text x={n.x} y={n.y - r - 4} textAnchor="middle" fontSize="9" fill="hsl(210,15%,60%)" fontFamily="Space Grotesk,sans-serif">
                {n.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function PublicRunReplayPage() {
  const { runId } = useParams<{ runId: string }>();
  const [copied, setCopied] = useState(false);

  const { data: run, isLoading, error } = useQuery({
    queryKey: ['public-run', runId],
    queryFn: () => fetchPublicRun(runId!),
    enabled: !!runId,
  });

  const { data: events } = useQuery({
    queryKey: ['public-run-events', runId],
    queryFn: () => fetchPublicRunEvents(runId!),
    enabled: !!runId,
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading replay…</div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive">Run not found or not accessible.</p>
          <Link to="/" className="text-xs text-primary hover:underline">Back to home</Link>
        </div>
      </div>
    );
  }

  const baseline = run.baseline_metrics_json as { totalHouseholds: number; householdsWithAccess: number; isolatedClusters: number } | null;
  const flooded = run.flooded_metrics_json as { totalHouseholds: number; householdsWithAccess: number; isolatedClusters: number } | null;
  const resolved = run.resolved_metrics_json as { totalHouseholds: number; householdsWithAccess: number; isolatedClusters: number } | null;
  const result = run.result_summary_json as { narrative: string; householdsRestored: number; clustersReconnected: number } | null;
  const district = run.districts as { slug: string; name: string } | null;
  const scenario = run.scenarios as { slug: string; label: string; severity: string } | null;
  const afterEdges = run.board_snapshot_after_json as unknown as GraphEdge[] | null;
  const beforeEdges = run.board_snapshot_before_json as unknown as GraphEdge[] | null;

  const interventionLabel = run.selected_intervention_slug === 'temporary-bridge' ? 'Temporary Bridge'
    : run.selected_intervention_slug === 'mobile-clinic' ? 'Mobile Clinic'
    : run.selected_intervention_slug === 'barrier-line' ? 'Barrier Line'
    : run.selected_intervention_slug === 'shuttle-link' ? 'Shuttle Link'
    : run.selected_intervention_slug;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Lifeline</span>
          <span className="text-[10px] text-muted-foreground">Public Replay</span>
        </div>
        <button onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
          <Share2 className="w-3 h-3" />
          {copied ? 'Link Copied!' : 'Share'}
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Title & Meta */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <h1 className="text-xl font-bold tracking-tight">{run.title || 'Untitled Run'}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {district && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> {district.name}
              </span>
            )}
            {scenario && (
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> {scenario.label}
                {scenario.severity && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    scenario.severity === 'severe' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'
                  }`}>{scenario.severity}</span>
                )}
              </span>
            )}
            {run.selected_intervention_slug && (
              <span className="flex items-center gap-1.5">
                <Anchor className="w-3 h-3" /> {interventionLabel}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> {new Date(run.created_at).toLocaleDateString()}
            </span>
          </div>
        </motion.div>

        {/* Board Preview */}
        {(afterEdges || beforeEdges) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-xl border border-border p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">
              Board Snapshot — {afterEdges ? 'After Intervention' : 'Before'}
            </div>
            <BoardPreviewSVG edges={afterEdges ?? beforeEdges!} />
            <div className="flex gap-4 text-[10px] text-muted-foreground justify-center">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-muted-foreground rounded" /> Normal</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-destructive rounded" /> Blocked</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 rounded" style={{ background: 'hsl(38,85%,55%)' }} /> Degraded</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 rounded" style={{ background: 'hsl(145,65%,48%)' }} /> Restored</span>
            </div>
          </motion.div>
        )}

        {/* Result Card */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-status-restored/30 bg-status-restored/5 p-6 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-status-restored font-bold">Result</div>
            <p className="text-base font-semibold leading-relaxed">{result.narrative}</p>
            <div className="grid grid-cols-2 gap-4 text-center pt-1">
              <div>
                <div className="text-3xl font-bold font-mono text-status-restored">+{result.householdsRestored}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Households Restored</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-status-restored">{result.clustersReconnected}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Clusters Reconnected</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Metrics Comparison */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-border p-6 space-y-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Metric Comparison</div>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center space-y-1">
              <div className="text-[10px] uppercase text-muted-foreground font-bold">Baseline</div>
              <div className="text-2xl font-bold font-mono">{baseline?.householdsWithAccess ?? '—'}</div>
              <div className="text-[10px] text-muted-foreground">of {baseline?.totalHouseholds} households</div>
              <div className="text-xs text-muted-foreground">{baseline?.isolatedClusters ?? 0} isolated</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-[10px] uppercase text-destructive font-bold">Flooded</div>
              <div className="text-2xl font-bold font-mono text-destructive">{flooded?.householdsWithAccess ?? '—'}</div>
              <div className="text-[10px] text-muted-foreground">of {flooded?.totalHouseholds} households</div>
              <div className="text-xs text-destructive">{flooded?.isolatedClusters ?? 0} isolated</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-[10px] uppercase text-status-restored font-bold">Resolved</div>
              <div className="text-2xl font-bold font-mono text-status-restored">{resolved?.householdsWithAccess ?? '—'}</div>
              <div className="text-[10px] text-muted-foreground">of {resolved?.totalHouseholds} households</div>
              <div className="text-xs text-status-restored">{resolved?.isolatedClusters ?? 0} isolated</div>
            </div>
          </div>
        </motion.div>

        {/* Replay Timeline */}
        {events && events.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-xl border border-border p-6 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Replay Timeline</div>
            <div className="space-y-3">
              {events.map((event, i) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      event.event_type === 'baseline' ? 'bg-status-healthy'
                      : event.event_type === 'flooded' ? 'bg-destructive'
                      : event.event_type === 'intervention_applied' ? 'bg-primary'
                      : 'bg-status-restored'
                    }`} />
                    {i < events.length - 1 && <div className="w-px h-6 bg-border" />}
                  </div>
                  <div className="pb-2">
                    <div className="text-xs font-semibold capitalize">{event.event_type.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Notes (read-only) */}
        {run.notes && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl border border-border p-6 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Notes</div>
            <p className="text-sm whitespace-pre-wrap">{run.notes}</p>
          </motion.div>
        )}

        {/* Footer CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center py-6 space-y-3">
          <p className="text-xs text-muted-foreground">This is a read-only replay. Sign in to run your own rehearsals.</p>
          <Link to="/auth"
            className="inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
            Get Started
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
