import { GraphNode, GraphEdge, EdgeStatus, AccessMetrics, Scenario, InterventionSlug, RunResult } from './types';

const ACCESS_THRESHOLD = 900;

function dijkstra(nodes: GraphNode[], edges: GraphEdge[], sourceId: string): Map<string, number> {
  const dist = new Map<string, number>();
  const visited = new Set<string>();
  for (const node of nodes) dist.set(node.id, Infinity);
  dist.set(sourceId, 0);

  while (true) {
    let minDist = Infinity;
    let minNode: string | null = null;
    for (const [id, d] of dist) {
      if (!visited.has(id) && d < minDist) { minDist = d; minNode = id; }
    }
    if (minNode === null || minDist === Infinity) break;
    visited.add(minNode);

    for (const edge of edges) {
      if (edge.status === 'blocked') continue;
      let neighbor: string | null = null;
      if (edge.from === minNode) neighbor = edge.to;
      else if (edge.to === minNode) neighbor = edge.from;
      if (neighbor && !visited.has(neighbor)) {
        const w = edge.status === 'degraded' ? edge.weight * 2 : edge.weight;
        const nd = minDist + w;
        if (nd < (dist.get(neighbor) ?? Infinity)) dist.set(neighbor, nd);
      }
    }
  }
  return dist;
}

export function computeAccessMetrics(nodes: GraphNode[], edges: GraphEdge[]): AccessMetrics {
  const clusters = nodes.filter(n => n.type === 'cluster');
  const shelters = nodes.filter(n => n.type === 'facility' && n.facilityKind === 'shelter');
  const clinics = nodes.filter(n => n.type === 'facility' && n.facilityKind === 'clinic');

  let householdsWithAccess = 0;
  let isolatedClusters = 0;
  const clusterAccess: AccessMetrics['clusterAccess'] = {};

  for (const cluster of clusters) {
    const distances = dijkstra(nodes, edges, cluster.id);
    let nearestShelter: number | null = null;
    for (const s of shelters) {
      const d = distances.get(s.id);
      if (d !== undefined && d < Infinity && (nearestShelter === null || d < nearestShelter)) nearestShelter = d;
    }
    let nearestClinic: number | null = null;
    for (const c of clinics) {
      const d = distances.get(c.id);
      if (d !== undefined && d < Infinity && (nearestClinic === null || d < nearestClinic)) nearestClinic = d;
    }

    const hasShelter = nearestShelter !== null && nearestShelter <= ACCESS_THRESHOLD;
    const hasClinic = nearestClinic !== null && nearestClinic <= ACCESS_THRESHOLD;
    const hasAccess = hasShelter && hasClinic;

    clusterAccess[cluster.id] = { hasAccess, nearestShelter, nearestClinic };
    if (hasAccess) householdsWithAccess += cluster.households || 0;
    else isolatedClusters++;
  }

  return { totalHouseholds: clusters.reduce((s, c) => s + (c.households || 0), 0), householdsWithAccess, isolatedClusters, clusterAccess };
}

export function applyScenario(edges: GraphEdge[], scenario: Scenario): GraphEdge[] {
  return edges.map(edge => {
    const effect = scenario.edgeEffects[edge.id];
    return effect ? { ...edge, status: effect.status } : { ...edge };
  });
}

export function applyIntervention(
  nodes: GraphNode[], edges: GraphEdge[], slug: InterventionSlug, anchorId: string
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const anchor = nodes.find(n => n.id === anchorId);
  if (!anchor) return { nodes: [...nodes], edges: [...edges] };

  switch (slug) {
    case 'temporary-bridge': {
      const restored = edges.map(e =>
        (e.from === anchorId || e.to === anchorId) && e.status === 'blocked'
          ? { ...e, status: 'temporary' as EdgeStatus, weight: Math.round(e.weight * 1.2) }
          : { ...e }
      );
      return { nodes: [...nodes], edges: restored };
    }
    case 'mobile-clinic': {
      const tempClinic: GraphNode = { id: `temp-clinic-${anchorId}`, type: 'facility', facilityKind: 'clinic', x: anchor.x, y: anchor.y - 20, label: 'Mobile Clinic' };
      const tempEdge: GraphEdge = { id: `temp-edge-clinic-${anchorId}`, from: anchorId, to: tempClinic.id, weight: 30, status: 'temporary' };
      return { nodes: [...nodes, tempClinic], edges: [...edges, tempEdge] };
    }
    case 'barrier-line': {
      const restored = edges.map(e =>
        (e.from === anchorId || e.to === anchorId) && (e.status === 'degraded' || e.status === 'blocked')
          ? { ...e, status: 'restored' as EdgeStatus }
          : { ...e }
      );
      return { nodes: [...nodes], edges: restored };
    }
    case 'shuttle-link': {
      const tempEdge: GraphEdge = { id: `temp-shuttle-${anchorId}`, from: anchorId, to: 'j-east-south', weight: 360, status: 'temporary' };
      return { nodes: [...nodes], edges: [...edges, tempEdge] };
    }
    default:
      return { nodes: [...nodes], edges: [...edges] };
  }
}

export function generateNarrative(result: RunResult): string {
  const name = result.interventionSlug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  if (result.householdsRestored > 0 && result.clustersReconnected > 0) {
    return `${name} reconnects ${result.householdsRestored} households. ${result.clustersReconnected === 1 ? '1 cluster regains' : `${result.clustersReconnected} clusters regain`} critical access to shelter and care.`;
  }
  if (result.householdsRestored > 0) {
    return `${name} restores access for ${result.householdsRestored} households.`;
  }
  if (result.interventionSlug === 'mobile-clinic') {
    return `${name} deploys temporary care services. Shelter access remains constrained for isolated clusters.`;
  }
  if (result.interventionSlug === 'barrier-line') {
    return `${name} reinforces the corridor but does not reconnect the east crossing. Eastern clusters remain isolated.`;
  }
  return `${name} placed. Impact on critical access is limited under current conditions.`;
}
