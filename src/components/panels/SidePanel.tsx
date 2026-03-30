import { useSimulationStore } from '@/stores/simulation-store';
import { INTERVENTION_TYPES } from '@/data/seed/riverbend-east';
import { motion, AnimatePresence } from 'framer-motion';

export function SidePanel() {
  const { phase, selectedCluster, nodes, result, armedIntervention, selectedAnchor,
    baselineMetrics, floodedMetrics, resolvedMetrics } = useSimulationStore();
  const cluster = selectedCluster ? nodes.find(n => n.id === selectedCluster) : null;
  const metrics = phase === 'resolved' ? resolvedMetrics
    : ['flooded', 'armed', 'applying'].includes(phase) ? floodedMetrics : baselineMetrics;
  const ca = cluster ? metrics?.clusterAccess[cluster.id] : null;

  return (
    <div className="w-[300px] border-l border-border bg-card flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Detail</h3>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <AnimatePresence mode="wait">
          {phase === 'resolved' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-lg border border-status-restored/30 bg-status-restored/5 p-4 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-status-restored font-bold">Result</div>
              <p className="text-sm font-medium leading-relaxed">{result.narrative}</p>
              <div className="grid grid-cols-2 gap-3 text-center pt-1">
                <div>
                  <div className="text-2xl font-bold font-mono text-status-restored">+{result.householdsRestored}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Restored</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-status-restored">{result.clustersReconnected}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Reconnected</div>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'armed' && armedIntervention && (
            <motion.div key="armed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="text-[10px] uppercase tracking-[0.15em] text-primary font-bold">Intervention Armed</div>
              <p className="text-sm font-semibold">{INTERVENTION_TYPES.find(i => i.slug === armedIntervention)?.label}</p>
              <p className="text-xs text-muted-foreground">
                {selectedAnchor ? 'Click Deploy on the board.' : 'Select a valid anchor on the board.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {cluster && ca && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Cluster</div>
            <div className="text-sm font-semibold">{cluster.label}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Households</span><span className="font-mono font-semibold">{cluster.households}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <span className={`font-semibold ${ca.hasAccess ? 'text-status-healthy' : 'text-destructive'}`}>{ca.hasAccess ? 'Connected' : 'Isolated'}</span>
              </div>
              {ca.nearestShelter !== null && (
                <div className="flex justify-between"><span className="text-muted-foreground">Shelter</span><span className="font-mono">{Math.round(ca.nearestShelter / 60)}m</span></div>
              )}
              {ca.nearestClinic !== null && (
                <div className="flex justify-between"><span className="text-muted-foreground">Clinic</span><span className="font-mono">{Math.round(ca.nearestClinic / 60)}m</span></div>
              )}
              {!ca.hasAccess && ca.nearestShelter === null && ca.nearestClinic === null && (
                <p className="text-xs text-destructive pt-1">No reachable critical services within 15-minute threshold.</p>
              )}
            </div>
          </div>
        )}

        {phase === 'flooded' && !cluster && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-destructive font-bold">Disruption Active</div>
            <p className="text-sm text-muted-foreground">Select an intervention below, then place it at a valid anchor to restore access.</p>
            <p className="text-xs text-muted-foreground">Click a cluster to inspect.</p>
          </div>
        )}

        {phase === 'baseline' && !cluster && (
          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Baseline</div>
            <p className="text-sm text-muted-foreground">All clusters have critical access. Select a scenario to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
