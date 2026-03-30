import { useSimulationStore } from '@/stores/simulation-store';
import { motion } from 'framer-motion';

export function MetricStrip() {
  const { phase, baselineMetrics, floodedMetrics, resolvedMetrics, scenario } = useSimulationStore();
  const metrics = phase === 'resolved' ? resolvedMetrics
    : ['flooded', 'armed', 'applying'].includes(phase) ? floodedMetrics : baselineMetrics;
  if (!metrics) return null;

  const prev = phase === 'resolved' ? floodedMetrics : baselineMetrics;
  const delta = prev ? metrics.householdsWithAccess - prev.householdsWithAccess : 0;

  return (
    <div className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-card/80">
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">Riverbend East</div>
        <div className="text-sm font-semibold">{scenario ? scenario.label : 'Baseline'}</div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">Critical Access</div>
          <div className="flex items-center gap-2">
            <motion.span key={metrics.householdsWithAccess} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-bold font-mono">{metrics.householdsWithAccess}</motion.span>
            <span className="text-sm text-muted-foreground">/ {metrics.totalHouseholds}</span>
            {delta !== 0 && (
              <span className={`text-sm font-bold ${delta > 0 ? 'text-status-restored' : 'text-destructive'}`}>
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">Isolated</div>
          <div className="flex items-center gap-2">
            <motion.span key={metrics.isolatedClusters} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className={`text-2xl font-bold font-mono ${metrics.isolatedClusters > 0 ? 'text-destructive' : ''}`}>
              {metrics.isolatedClusters}
            </motion.span>
            <span className="text-sm text-muted-foreground">clusters</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em]
          ${phase === 'baseline' ? 'bg-secondary text-secondary-foreground' : ''}
          ${phase === 'flooded' ? 'bg-destructive/15 text-destructive' : ''}
          ${phase === 'armed' ? 'bg-accent/15 text-accent' : ''}
          ${phase === 'applying' ? 'bg-primary/15 text-primary' : ''}
          ${phase === 'resolved' ? 'bg-status-restored/15 text-status-restored' : ''}
        `}>{phase}</span>
      </div>
    </div>
  );
}
