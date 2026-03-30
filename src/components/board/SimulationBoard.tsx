import { useSimulationStore } from '@/stores/simulation-store';
import { EdgeStatus } from '@/lib/simulation/types';

const EDGE_COLORS: Record<EdgeStatus, string> = {
  normal: 'hsl(210,15%,35%)', degraded: 'hsl(38,85%,55%)', blocked: 'hsl(0,60%,45%)',
  restored: 'hsl(145,65%,48%)', temporary: 'hsl(185,80%,55%)',
};
const EDGE_W: Record<EdgeStatus, number> = { normal: 2.5, degraded: 2, blocked: 1.5, restored: 2.5, temporary: 3 };
const EDGE_DASH: Record<EdgeStatus, string> = { normal: '', degraded: '8 4', blocked: '4 4', restored: '', temporary: '10 5' };

function handleSvgAction(event: React.KeyboardEvent<SVGGElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

export function SimulationBoard() {
  const { nodes, edges, phase, scenario, baselineMetrics, floodedMetrics, resolvedMetrics,
    armedIntervention, selectedAnchor, selectedCluster, selectCluster, selectAnchor, executeIntervention,
  } = useSimulationStore();

  const metrics = phase === 'resolved' ? resolvedMetrics
    : ['flooded', 'armed', 'applying'].includes(phase) ? floodedMetrics : baselineMetrics;
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const facilities = nodes.filter(n => n.type === 'facility');
  const clusters = nodes.filter(n => n.type === 'cluster');
  const anchors = nodes.filter(n => n.anchorKind);

  return (
    <svg viewBox="0 0 1120 650" className="w-full h-full" style={{ background: 'hsl(220,25%,5%)' }} aria-label="Simulation board">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(220,15%,10%)" strokeWidth="0.5" />
        </pattern>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="pulseGlow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="1120" height="650" fill="url(#grid)" />

      {/* Flood zones */}
      {phase !== 'baseline' && scenario?.floodZones.map((z, i) => (
        <ellipse key={i} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill="hsl(210,70%,30%)" opacity={0.2}>
          <animate attributeName="opacity" values="0.15;0.25;0.15" dur="4s" repeatCount="indefinite" />
        </ellipse>
      ))}

      {/* Roads */}
      {edges.map(e => {
        const f = nodeMap[e.from], t = nodeMap[e.to];
        if (!f || !t) return null;
        return <g key={e.id}>
          {e.status === 'temporary' && (
            <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="hsl(185,80%,55%)" strokeWidth={7} opacity={0.15} filter="url(#glow)" strokeLinecap="round" />
          )}
          <line x1={f.x} y1={f.y} x2={t.x} y2={t.y}
            stroke={EDGE_COLORS[e.status]} strokeWidth={EDGE_W[e.status]}
            strokeDasharray={EDGE_DASH[e.status]} opacity={e.status === 'blocked' ? 0.35 : 0.85} strokeLinecap="round" />
        </g>;
      })}

      {/* Junction dots */}
      {nodes.filter(n => n.type === 'junction' && !n.anchorKind).map(n => (
        <circle key={n.id} cx={n.x} cy={n.y} r={3} fill="hsl(210,15%,28%)" />
      ))}

      {/* Facilities */}
      {facilities.map(f => (
        <g key={f.id} transform={`translate(${f.x},${f.y})`}>
          {f.facilityKind === 'shelter' ? (
            <polygon points="-14,-16 0,-26 14,-16 14,2 -14,2" fill="hsl(185,65%,42%)" opacity={0.9} stroke="hsl(185,65%,55%)" strokeWidth={1} />
          ) : (
            <g>
              <rect x={-12} y={-12} width={24} height={24} rx={4} fill="hsl(185,65%,42%)" opacity={0.9} stroke="hsl(185,65%,55%)" strokeWidth={1} />
              <line x1={0} y1={-6} x2={0} y2={6} stroke="hsl(220,25%,5%)" strokeWidth={2.5} />
              <line x1={-6} y1={0} x2={6} y2={0} stroke="hsl(220,25%,5%)" strokeWidth={2.5} />
            </g>
          )}
          <text y={f.facilityKind === 'shelter' ? -32 : 28} textAnchor="middle" fill="hsl(185,50%,60%)" fontSize={10} fontWeight={600} fontFamily="'Space Grotesk',system-ui">{f.label}</text>
        </g>
      ))}

      {/* Clusters */}
      {clusters.map(c => {
        const acc = metrics?.clusterAccess[c.id];
        const isolated = acc && !acc.hasAccess;
        const sel = selectedCluster === c.id;
        const col = isolated ? 'hsl(0,70%,55%)' : 'hsl(185,60%,40%)';
        const onSelect = () => selectCluster(sel ? null : c.id);
        return (
          <g
            key={c.id}
            transform={`translate(${c.x},${c.y})`}
            onClick={onSelect}
            onKeyDown={(event) => handleSvgAction(event, onSelect)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            focusable="true"
            aria-pressed={sel}
            aria-label={`${c.label ?? c.id}, ${c.households ?? 0} households, ${isolated ? 'isolated' : 'connected'}`}
            data-testid={`board-cluster-${c.id}`}
          >
            {sel && <rect x={-24} y={-24} width={48} height={48} rx={10} fill="none" stroke={col} strokeWidth={2} opacity={0.7} />}
            {isolated && <rect x={-20} y={-20} width={40} height={40} rx={8} fill={col} opacity={0.12}>
              <animate attributeName="opacity" values="0.08;0.18;0.08" dur="2s" repeatCount="indefinite" />
            </rect>}
            <rect x={-16} y={-16} width={32} height={32} rx={6} fill={col} opacity={isolated ? 0.85 : 0.7} />
            <text textAnchor="middle" y={5} fill="hsl(220,25%,95%)" fontSize={12} fontWeight={700} fontFamily="'JetBrains Mono',monospace">{c.households}</text>
            <text textAnchor="middle" y={-24} fill="hsl(210,12%,60%)" fontSize={9} fontFamily="'Space Grotesk',system-ui" fontWeight={500}>{c.label}</text>
          </g>
        );
      })}

      {/* Anchors */}
      {anchors.map(a => {
        const valid = armedIntervention ? a.allowedInterventions?.includes(armedIntervention) : false;
        const sel = selectedAnchor === a.id;
        if (phase !== 'armed' && !sel) return null;
        if (phase === 'armed' && !valid) return null;
        const onSelect = () => selectAnchor(a.id);
        return (
          <g
            key={a.id}
            transform={`translate(${a.x},${a.y})`}
            onClick={onSelect}
            onKeyDown={(event) => handleSvgAction(event, onSelect)}
            style={{ cursor: valid ? 'pointer' : 'default' }}
            role="button"
            tabIndex={0}
            focusable="true"
            aria-pressed={sel}
            aria-label={`Anchor ${a.label ?? a.id}${valid ? '' : ', unavailable'}`}
            data-testid={`board-anchor-${a.id}`}
          >
            {valid && !sel && (
              <circle r={20} fill="hsl(185,80%,55%)" opacity={0.15} filter="url(#pulseGlow)">
                <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {sel && <circle r={24} fill="hsl(185,80%,55%)" opacity={0.25} filter="url(#glow)" />}
            <polygon points="0,-11 11,0 0,11 -11,0" fill={sel ? 'hsl(185,80%,55%)' : 'hsl(185,60%,40%)'} stroke="hsl(185,80%,55%)" strokeWidth={1.5} />
            <text y={22} textAnchor="middle" fill="hsl(185,50%,55%)" fontSize={9} fontWeight={500} fontFamily="'Space Grotesk',system-ui">{a.label}</text>
          </g>
        );
      })}

      {/* Deploy button */}
      {phase === 'armed' && selectedAnchor && nodeMap[selectedAnchor] && (
        <g
          transform={`translate(${nodeMap[selectedAnchor].x},${nodeMap[selectedAnchor].y + 42})`}
          onClick={executeIntervention}
          onKeyDown={(event) => handleSvgAction(event, executeIntervention)}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          focusable="true"
          aria-label="Deploy intervention"
          data-testid="board-deploy-intervention"
        >
          <rect x={-44} y={-13} width={88} height={26} rx={6} fill="hsl(185,65%,42%)" />
          <text textAnchor="middle" y={4} fill="hsl(220,25%,5%)" fontSize={11} fontWeight={700} fontFamily="'Space Grotesk',system-ui">Deploy</text>
        </g>
      )}

      {/* Applying overlay */}
      {phase === 'applying' && (
        <rect width="1120" height="650" fill="hsl(185,80%,55%)" opacity={0.04}>
          <animate attributeName="opacity" values="0.02;0.06;0.02" dur="0.6s" repeatCount="indefinite" />
        </rect>
      )}
    </svg>
  );
}
