import { create } from 'zustand';
import { BoardPhase, GraphNode, GraphEdge, AccessMetrics, InterventionSlug, RunResult, Scenario } from '@/lib/simulation/types';
import { computeAccessMetrics, applyScenario as applyScenarioEdges, applyIntervention, generateNarrative } from '@/lib/simulation/engine';
import { RIVERBEND_EAST, SCENARIOS, INTERVENTION_TYPES } from '@/data/seed/riverbend-east';

interface SimulationState {
  phase: BoardPhase;
  nodes: GraphNode[];
  edges: GraphEdge[];
  baselineEdges: GraphEdge[];
  floodedEdges: GraphEdge[];
  scenario: Scenario | null;
  baselineMetrics: AccessMetrics | null;
  floodedMetrics: AccessMetrics | null;
  resolvedMetrics: AccessMetrics | null;
  selectedCluster: string | null;
  armedIntervention: InterventionSlug | null;
  selectedAnchor: string | null;
  result: RunResult | null;
  loadDistrict: () => void;
  selectScenario: (slug: string) => void;
  armIntervention: (slug: InterventionSlug) => void;
  disarmIntervention: () => void;
  selectAnchor: (anchorId: string) => void;
  executeIntervention: () => void;
  selectCluster: (id: string | null) => void;
  resetToFlooded: () => void;
  resetToBaseline: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  phase: 'baseline',
  nodes: [],
  edges: [],
  baselineEdges: [],
  floodedEdges: [],
  scenario: null,
  baselineMetrics: null,
  floodedMetrics: null,
  resolvedMetrics: null,
  selectedCluster: null,
  armedIntervention: null,
  selectedAnchor: null,
  result: null,

  loadDistrict: () => {
    const d = RIVERBEND_EAST;
    const bl = d.edges.map(e => ({ ...e }));
    set({
      nodes: d.nodes,
      edges: bl.map(e => ({ ...e })),
      baselineEdges: bl,
      baselineMetrics: computeAccessMetrics(d.nodes, bl),
      phase: 'baseline',
      scenario: null,
      floodedEdges: [],
      floodedMetrics: null,
      resolvedMetrics: null,
      result: null,
      armedIntervention: null,
      selectedAnchor: null,
      selectedCluster: null,
    });
  },

  selectScenario: (slug) => {
    const sc = SCENARIOS.find(s => s.slug === slug);
    if (!sc) return;
    const { nodes, baselineEdges } = get();
    const fe = applyScenarioEdges(baselineEdges, sc);
    set({
      scenario: sc,
      edges: fe.map(e => ({ ...e })),
      floodedEdges: fe,
      floodedMetrics: computeAccessMetrics(nodes, fe),
      phase: 'flooded',
      armedIntervention: null,
      selectedAnchor: null,
      resolvedMetrics: null,
      result: null,
      selectedCluster: null,
    });
  },

  armIntervention: (slug) => set({ armedIntervention: slug, selectedAnchor: null, phase: 'armed' }),
  disarmIntervention: () => set({ armedIntervention: null, selectedAnchor: null, phase: 'flooded' }),

  selectAnchor: (anchorId) => {
    const { armedIntervention, nodes } = get();
    if (!armedIntervention) return;
    const anchor = nodes.find(n => n.id === anchorId);
    if (!anchor?.allowedInterventions?.includes(armedIntervention)) return;
    set({ selectedAnchor: anchorId });
  },

  executeIntervention: () => {
    const state = get();
    if (!state.armedIntervention || !state.selectedAnchor) return;
    set({ phase: 'applying' });
    const slug = state.armedIntervention;
    const anchor = state.selectedAnchor;

    setTimeout(() => {
      const { nodes: newNodes, edges: newEdges } = applyIntervention(
        RIVERBEND_EAST.nodes, state.floodedEdges, slug, anchor
      );
      const rm = computeAccessMetrics(newNodes, newEdges);
      const hr = rm.householdsWithAccess - (state.floodedMetrics?.householdsWithAccess || 0);
      const cr = (state.floodedMetrics?.isolatedClusters || 0) - rm.isolatedClusters;
      const result: RunResult = {
        interventionSlug: slug, anchorId: anchor,
        baselineMetrics: state.baselineMetrics!, floodedMetrics: state.floodedMetrics!,
        resolvedMetrics: rm, narrative: '', householdsRestored: hr, clustersReconnected: cr,
      };
      result.narrative = generateNarrative(result);
      set({ nodes: newNodes, edges: newEdges, resolvedMetrics: rm, result, phase: 'resolved' });
    }, 400);
  },

  selectCluster: (id) => set({ selectedCluster: id }),

  resetToFlooded: () => {
    const { floodedEdges } = get();
    set({
      edges: floodedEdges.map(e => ({ ...e })),
      nodes: RIVERBEND_EAST.nodes,
      resolvedMetrics: null, result: null,
      armedIntervention: null, selectedAnchor: null, selectedCluster: null,
      phase: 'flooded',
    });
  },

  resetToBaseline: () => {
    const { baselineEdges } = get();
    set({
      edges: baselineEdges.map(e => ({ ...e })),
      nodes: RIVERBEND_EAST.nodes,
      scenario: null, floodedEdges: [], floodedMetrics: null,
      resolvedMetrics: null, result: null,
      armedIntervention: null, selectedAnchor: null, selectedCluster: null,
      phase: 'baseline',
    });
  },
}));
