import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOrg } from '@/lib/supabase/org-context';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveEvent {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
}

export function LiveActivityBar() {
  const { currentOrg } = useOrg();
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    if (!currentOrg?.organization_id) return;

    const channel = supabase
      .channel('live-runs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scenario_runs',
          filter: `organization_id=eq.${currentOrg.organization_id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; title: string; created_at: string; created_by: string };
          setEvents(prev => [{
            id: row.id,
            title: row.title || 'New run',
            created_at: row.created_at,
            created_by: row.created_by?.slice(0, 8) ?? 'someone',
          }, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentOrg?.organization_id]);

  if (events.length === 0) return null;

  return (
    <div className="border-b border-border/40 bg-card/20 px-6 py-1.5 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {events.slice(0, 2).map(e => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 py-0.5"
          >
            <Activity className="w-3 h-3 text-primary/60 shrink-0" />
            <span className="text-[10px] text-muted-foreground/60 truncate">
              <span className="font-mono text-muted-foreground/40">{e.created_by}…</span> saved{' '}
              <span className="text-foreground/60 font-medium">{e.title}</span>
            </span>
            <span className="text-[9px] text-muted-foreground/30 font-mono shrink-0 ml-auto">
              {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
