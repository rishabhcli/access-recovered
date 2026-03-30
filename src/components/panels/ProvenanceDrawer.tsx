import { useState } from 'react';
import { X, Cloud, Mountain, Route, GitBranch, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RIVERBEND_EAST, SCENARIOS } from '@/data/seed/riverbend-east';

const PROVENANCE = {
  weather: {
    title: 'Weather Context',
    icon: Cloud,
    items: [
      { label: 'Data Source', value: 'NOAA Atlas 14, Region 2' },
      { label: 'Return Period', value: '100-year, 24-hour rainfall' },
      { label: 'Precip Intensity', value: '6.2 in / 24 hr (severe), 3.8 in / 24 hr (moderate)' },
      { label: 'Antecedent Moisture', value: 'Saturated (AMC III)' },
      { label: 'Season', value: 'Late spring — peak convective season' },
      { label: 'River Stage Trigger', value: '≥ 18 ft gauge (moderate), ≥ 24 ft (severe)' },
    ],
  },
  elevation: {
    title: 'Elevation & Terrain',
    icon: Mountain,
    items: [
      { label: 'DEM Source', value: 'USGS 3DEP 1/3 arc-second' },
      { label: 'Elevation Range', value: '412–448 ft NAVD88' },
      { label: 'Low Point', value: 'East Crossing — 412 ft (flood-prone)' },
      { label: 'High Point', value: 'North High Shelter — 448 ft (safe zone)' },
      { label: 'Drain Corridor Slope', value: '1.2% grade, capacity limited' },
      { label: 'Floodplain', value: 'FEMA Zone AE, BFE 420 ft' },
    ],
  },
  routing: {
    title: 'Routing Assumptions',
    icon: Route,
    items: [
      { label: 'Graph Model', value: 'Weighted undirected — BFS reachability' },
      { label: 'Edge Weights', value: 'Walking time in seconds (avg 4 km/h)' },
      { label: 'Blocked Threshold', value: 'Water depth ≥ 6 in or structural failure' },
      { label: 'Degraded Threshold', value: 'Water depth 2–6 in, passable with risk' },
      { label: 'Access Criterion', value: 'Reachable path to ≥ 1 facility (shelter or clinic)' },
      { label: 'Intervention Effect', value: 'Restores blocked/degraded edges to temporary status' },
    ],
  },
  version: {
    title: 'Scenario Version',
    icon: GitBranch,
    items: [
      { label: 'District Bundle', value: `v${RIVERBEND_EAST.version}` },
      { label: 'Node Count', value: `${RIVERBEND_EAST.nodes.length} nodes` },
      { label: 'Edge Count', value: `${RIVERBEND_EAST.edges.length} edges` },
      { label: 'Scenarios', value: SCENARIOS.map(s => s.label).join(', ') },
      { label: 'Last Updated', value: '2026-03-15' },
      { label: 'Review Status', value: 'Peer-reviewed draft — not for operational use' },
    ],
  },
};

type SectionKey = keyof typeof PROVENANCE;

export function ProvenanceDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<SectionKey | null>('weather');

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 border-l border-border bg-card shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold tracking-tight">Data Provenance</h2>
                <p className="text-[10px] text-muted-foreground">Assumptions, sources & scenario metadata</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {(Object.entries(PROVENANCE) as [SectionKey, typeof PROVENANCE.weather][]).map(([key, section]) => {
                const Icon = section.icon;
                const isOpen = expanded === key;
                return (
                  <div key={key} className="rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setExpanded(isOpen ? null : key)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-semibold flex-1">{section.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-2">
                            {section.items.map((item, i) => (
                              <div key={i} className="flex justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
                                <span className="text-[10px] text-muted-foreground font-medium shrink-0">{item.label}</span>
                                <span className="text-[10px] text-foreground text-right">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border shrink-0">
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                <span>This is a rehearsal tool. Data reflects modeled assumptions, not real-time conditions. Always verify with field assessments before operational decisions.</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
