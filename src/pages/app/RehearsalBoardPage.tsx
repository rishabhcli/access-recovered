import { useEffect } from 'react';
import { useSimulationStore } from '@/stores/simulation-store';
import { SimulationBoard } from '@/components/board/SimulationBoard';
import { InterventionTray } from '@/components/controls/InterventionTray';
import { MetricStrip } from '@/components/shell/MetricStrip';
import { SidePanel } from '@/components/panels/SidePanel';
import { SCENARIOS } from '@/data/seed/riverbend-east';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';

export default function RehearsalBoardPage() {
  const { loadDistrict, selectScenario, resetToFlooded, resetToBaseline, phase } = useSimulationStore();

  useEffect(() => { loadDistrict(); }, [loadDistrict]);

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
