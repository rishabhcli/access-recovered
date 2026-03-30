import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { fetchUserOrgs, fetchProfile, acceptPendingInvitations, type OrgMembership } from '@/lib/services/organizations';

interface OrgContextType {
  memberships: OrgMembership[];
  currentOrg: OrgMembership | null;
  currentRole: string | null;
  switchOrg: (orgId: string) => void;
  loading: boolean;
  refetch: () => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setMemberships([]); setCurrentOrgId(null); setLoading(false); return; }
    try {
      await acceptPendingInvitations();
      const [orgs, profile] = await Promise.all([fetchUserOrgs(), fetchProfile()]);
      setMemberships(orgs);
      const defaultId = profile?.default_org_id;
      if (defaultId && orgs.some(o => o.organization_id === defaultId)) {
        setCurrentOrgId(defaultId);
      } else if (orgs.length > 0) {
        setCurrentOrgId(orgs[0].organization_id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const currentOrg = memberships.find(m => m.organization_id === currentOrgId) ?? null;

  return (
    <OrgContext.Provider value={{
      memberships,
      currentOrg,
      currentRole: currentOrg?.role ?? null,
      switchOrg: setCurrentOrgId,
      loading,
      refetch: load,
    }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
