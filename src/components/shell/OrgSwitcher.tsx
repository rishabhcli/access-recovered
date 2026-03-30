import { useState } from 'react';
import { useOrg } from '@/lib/supabase/org-context';
import { Building2, ChevronDown, Check } from 'lucide-react';

export function OrgSwitcher() {
  const { memberships, currentOrg, switchOrg } = useOrg();
  const [open, setOpen] = useState(false);

  if (memberships.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="w-3 h-3" />
        <span className="truncate max-w-[120px]">{currentOrg?.organization.name ?? 'No org'}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
        <Building2 className="w-3 h-3" />
        <span className="truncate max-w-[120px]">{currentOrg?.organization.name ?? 'Select'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-border bg-card shadow-lg z-50 py-1">
            {memberships.map(m => (
              <button key={m.organization_id}
                onClick={() => { switchOrg(m.organization_id); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-secondary transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{m.organization.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
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
