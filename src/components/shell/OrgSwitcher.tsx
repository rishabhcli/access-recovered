import { useState } from 'react';
import { useOrg } from '@/lib/supabase/org-context';
import { Building2, ChevronDown, Check } from 'lucide-react';

export function OrgSwitcher() {
  const { memberships, currentOrg, switchOrg } = useOrg();
  const [open, setOpen] = useState(false);

  if (memberships.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
        <Building2 className="w-3 h-3" />
        <span className="truncate max-w-[140px] font-medium">{currentOrg?.organization.name ?? 'No org'}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
        <Building2 className="w-3 h-3" />
        <span className="truncate max-w-[140px] font-medium">{currentOrg?.organization.name ?? 'Select'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-56 rounded border border-border bg-card shadow-xl z-50 py-1">
            {memberships.map(m => (
              <button key={m.organization_id}
                onClick={() => { switchOrg(m.organization_id); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                  <span className="truncate font-medium">{m.organization.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] text-muted-foreground/50 capitalize font-mono">{m.role}</span>
                  {m.organization_id === currentOrg?.organization_id && <Check className="w-3 h-3 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
