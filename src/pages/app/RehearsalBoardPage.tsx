import { useEffect, useState } from 'react';
import { useSimulationStore } from '@/stores/simulation-store';
import { SimulationBoard } from '@/components/board/SimulationBoard';
import { InterventionTray } from '@/components/controls/InterventionTray';
import { MetricStrip } from '@/components/shell/MetricStrip';
import { SidePanel } from '@/components/panels/SidePanel';
import { ProvenanceDrawer } from '@/components/panels/ProvenanceDrawer';
import { SCENARIOS } from '@/data/seed/riverbend-east';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Save, Loader2, FileText } from 'lucide-react';
import { saveRun } from '@/lib/services/runs';
import { useAuth } from '@/lib/supabase/auth-context';
import { useOrg } from '@/lib/supabase/org-context';
import { toast } from 'sonner';

export default function RehearsalBoardPage() {
  const { loadDistrict, selectScenario, resetToFlooded, resetToBaseline, phase,
    scenario, armedIntervention, selectedAnchor, baselineMetrics, floodedMetrics,
    resolvedMetrics, result, edges, floodedEdges } = useSimulationStore();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);

  useEffect(() => { loadDistrict(); }, [loadDistrict]);

  const handleSaveRun = async () => {
    if (!result || !scenario || !armedIntervention || !selectedAnchor || !baselineMetrics || !floodedMetrics || !resolvedMetrics) return;
    setSaving(true);
    try {
      const runId = await saveRun({
        districtSlug: 'riverbend-east',
        scenarioSlug: scenario.slug,
        interventionSlug: armedIntervention,
        anchorId: selectedAnchor,
        baselineMetrics,
        floodedMetrics,
        resolvedMetrics,
        result,
        floodedEdgesSnapshot: floodedEdges,
        resolvedEdgesSnapshot: edges,
        organizationId: currentOrg?.organization_id,
      });
      toast.success('Run saved');
      navigate(`/app/runs/${runId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save run';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Lifeline</span>
          <span className="text-[10px] text-muted-foreground">Riverbend East</span>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'baseline' && SCENARIOS.map(s => (
            <button key={s.slug} onClick={() => selectScenario(s.slug)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border border-destructive/20">
              {s.label}
            </button>
          ))}
          {phase !== 'baseline' && (
            <>
              {phase === 'resolved' && user && (
                <button onClick={handleSaveRun} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {saving ? 'Saving…' : 'Save Run'}
                </button>
              )}
              {phase === 'resolved' && (
                <button onClick={resetToFlooded}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                  <RotateCcw className="w-3 h-3" /> Try Another
                </button>
              )}
              <button onClick={resetToBaseline}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      <MetricStrip />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0">
          <SimulationBoard />
        </div>
        <SidePanel />
      </div>

      <div className="border-t border-border bg-card/80 shrink-0">
        <InterventionTray />
      </div>
    </div>
  );
}
