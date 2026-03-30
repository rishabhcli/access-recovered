import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRun, fetchRunEvents, updateRunNotes } from '@/lib/services/runs';
import { ArrowLeft, Calendar, User, MapPin, Zap, Anchor, FileJson, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: run, isLoading, error } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => fetchRun(runId!),
    enabled: !!runId,
  });

  const { data: events } = useQuery({
    queryKey: ['run-events', runId],
    queryFn: () => fetchRunEvents(runId!),
    enabled: !!runId,
  });

  const notesMutation = useMutation({
    mutationFn: (newNotes: string) => updateRunNotes(runId!, newNotes),
    onSuccess: () => {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['run', runId] });
    },
  });

  useEffect(() => {
    if (run?.notes) setNotes(run.notes);
  }, [run?.notes]);

  const handleExportJSON = () => {
    if (!run) return;
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeline-run-${runId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading run…</div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive">Failed to load run.</p>
          <Link to="/app" className="text-xs text-primary hover:underline">Back to workspace</Link>
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

  const interventionLabel = run.selected_intervention_slug === 'temporary-bridge' ? 'Temporary Bridge'
    : run.selected_intervention_slug === 'mobile-clinic' ? 'Mobile Clinic'
    : run.selected_intervention_slug === 'barrier-line' ? 'Barrier Line'
    : run.selected_intervention_slug === 'shuttle-link' ? 'Shuttle Link'
    : run.selected_intervention_slug;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/80 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/app" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Lifeline</span>
          <span className="text-[10px] text-muted-foreground">Run Detail</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <FileJson className="w-3 h-3" /> Export JSON
          </button>
        </div>
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
              </span>
            )}
            {run.selected_intervention_slug && (
              <span className="flex items-center gap-1.5">
                <Anchor className="w-3 h-3" /> {interventionLabel} at {run.selected_anchor_id}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> {new Date(run.created_at).toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3" /> {run.created_by?.slice(0, 8)}…
            </span>
          </div>
        </motion.div>

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

        {/* Notes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl border border-border p-6 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Notes</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add operational notes, assumptions, or considerations…"
            className="w-full h-24 px-3 py-2 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground resize-none"
          />
          <div className="flex items-center gap-2">
            <button onClick={() => notesMutation.mutate(notes)}
              disabled={notesMutation.isPending}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {notesMutation.isPending ? 'Saving…' : notesSaved ? 'Saved ✓' : 'Save Notes'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
