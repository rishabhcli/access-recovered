import { useSimulationStore } from '@/stores/simulation-store';
import { motion } from 'framer-motion';

export function MetricStrip() {
  const { phase, baselineMetrics, floodedMetrics, resolvedMetrics, scenario } = useSimulationStore();
  const metrics = phase === 'resolved' ? resolvedMetrics
    : ['flooded', 'armed', 'applying'].includes(phase) ? floodedMetrics : baselineMetrics;
  if (!metrics) return null;

  const prev = phase === 'resolved' ? floodedMetrics : baselineMetrics;
  const delta = prev ? metrics.householdsWithAccess - prev.householdsWithAccess : 0;

  const phaseBadge: Record<string, string> = {
    baseline: 'bg-secondary text-secondary-foreground',
    flooded: 'bg-destructive/12 text-destructive border border-destructive/20',
    armed: 'bg-accent/12 text-accent border border-accent/20',
    applying: 'bg-primary/12 text-primary border border-primary/20',
    resolved: 'bg-status-restored/12 text-status-restored border border-status-restored/20',
  };

  return (
    <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-card/40 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
        <div>
          <div className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.15em] font-mono">District</div>
          <div className="text-xs font-medium">{scenario ? scenario.label : 'Baseline'}</div>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-right">
          <div className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.15em] font-mono">Access</div>
          <div className="flex items-center gap-1.5">
            <motion.span key={metrics.householdsWithAccess} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="text-xl font-mono font-medium tabular-nums">{metrics.householdsWithAccess}</motion.span>
            <span className="text-xs text-muted-foreground/40 font-mono">/{metrics.totalHouseholds}</span>
            {delta !== 0 && (
              <span className={`text-xs font-mono font-medium ${delta > 0 ? 'text-status-restored' : 'text-destructive'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.15em] font-mono">Isolated</div>
          <div className="flex items-center gap-1.5">
            <motion.span key={metrics.isolatedClusters} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className={`text-xl font-mono font-medium tabular-nums ${metrics.isolatedClusters > 0 ? 'text-destructive' : ''}`}>
              {metrics.isolatedClusters}
            </motion.span>
            <span className="text-xs text-muted-foreground/40 font-mono">clusters</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-sm text-[9px] font-mono font-medium uppercase tracking-[0.1em] ${phaseBadge[phase] ?? ''}`}>
          {phase}
        </span>
      </div>
    </div>
  );
}
