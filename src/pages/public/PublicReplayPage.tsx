import { useEffect, useState } from 'react';
import { useSimulationStore } from '@/stores/simulation-store';
import { SimulationBoard } from '@/components/board/SimulationBoard';
import { MetricStrip } from '@/components/shell/MetricStrip';
import { Link } from 'react-router-dom';
import { ArrowLeft, SkipForward } from 'lucide-react';

const SCENES = [
  { id: 'baseline', label: 'Baseline', text: 'Before flooding, all five clusters retain critical access to shelter and care.' },
  { id: 'flooded', label: 'Flooded', text: 'The east crossing fails. Two eastside clusters lose reachable access to both shelter and clinic.' },
  { id: 'armed', label: 'Intervention', text: 'A temporary bridge is selected for the east crossing gap.' },
  { id: 'resolved', label: 'Resolved', text: '284 households regain critical access. Both eastside clusters reconnected.' },
];

export default function PublicReplayPage() {
  const { loadDistrict, selectScenario, armIntervention, selectAnchor, executeIntervention } = useSimulationStore();
  const [idx, setIdx] = useState(0);

  useEffect(() => { loadDistrict(); }, [loadDistrict]);

  const advance = () => {
    const next = idx + 1;
    if (next >= SCENES.length) return;
    if (next === 1) selectScenario('severe-flash-flood');
    if (next === 2) { armIntervention('temporary-bridge'); selectAnchor('j-east-crossing'); }
    if (next === 3) executeIntervention();
    setIdx(next);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Lifeline — Replay</span>
        </div>
      </div>
      <MetricStrip />
      <div className="flex-1 min-h-0"><SimulationBoard /></div>
      <div className="border-t border-border bg-card/80 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            {SCENES.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-2 ${i <= idx ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                <div className={`w-2 h-2 rounded-full ${i <= idx ? 'bg-primary' : 'bg-border'}`} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{s.label}</span>
              </div>
            ))}
          </div>
          <button onClick={advance} disabled={idx >= SCENES.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-xs hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <SkipForward className="w-3.5 h-3.5" /> Next
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{SCENES[idx].text}</p>
      </div>
    </div>
  );
}
