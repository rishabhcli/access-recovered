import { useSimulationStore } from '@/stores/simulation-store';
import { INTERVENTION_TYPES } from '@/data/seed/riverbend-east';
import { Hammer, Heart, Shield, Bus } from 'lucide-react';
import type { InterventionSlug } from '@/lib/simulation/types';

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  'temporary-bridge': Hammer,
  'mobile-clinic': Heart,
  'barrier-line': Shield,
  'shuttle-link': Bus,
};

export function InterventionTray() {
  const { phase, armedIntervention, armIntervention, disarmIntervention } = useSimulationStore();
  const canSelect = phase === 'flooded' || phase === 'armed';

  return (
    <div className="flex gap-3 p-4 justify-center">
      {INTERVENTION_TYPES.map(iv => {
        const Icon = ICONS[iv.slug];
        const armed = armedIntervention === iv.slug;
        return (
          <button key={iv.slug} disabled={!canSelect}
            onClick={() => armed ? disarmIntervention() : armIntervention(iv.slug as InterventionSlug)}
            className={`flex items-center gap-3 px-5 py-3 rounded-lg border transition-all text-left
              ${armed ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/30' : 'border-border bg-card text-card-foreground hover:border-primary/40'}
              ${!canSelect ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
            {Icon && <Icon className="w-5 h-5 shrink-0" />}
            <div>
              <div className="text-sm font-semibold">{iv.label}</div>
              <div className="text-xs text-muted-foreground leading-tight">{iv.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
