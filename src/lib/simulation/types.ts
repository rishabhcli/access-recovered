export type NodeType = 'junction' | 'facility' | 'cluster' | 'anchor';
export type FacilityKind = 'shelter' | 'clinic';
export type AnchorKind = 'crossing-gap' | 'lot' | 'school-lot' | 'bus-turn' | 'drain-corridor';
export type EdgeStatus = 'normal' | 'degraded' | 'blocked' | 'restored' | 'temporary';
export type BoardPhase = 'baseline' | 'flooded' | 'armed' | 'applying' | 'resolved' | 'replay' | 'error';
export type InterventionSlug = 'temporary-bridge' | 'mobile-clinic' | 'barrier-line' | 'shuttle-link';

export interface GraphNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  label?: string;
  facilityKind?: FacilityKind;
  anchorKind?: AnchorKind;
  households?: number;
  allowedInterventions?: InterventionSlug[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
  status: EdgeStatus;
  label?: string;
}

export interface DistrictBundle {
  slug: string;
  name: string;
  version: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  viewBox: string;
}

export interface Scenario {
  slug: string;
  label: string;
  description: string;
  severity: string;
  edgeEffects: Record<string, { status: EdgeStatus; multiplier?: number }>;
  floodZones: { cx: number; cy: number; rx: number; ry: number }[];
}

export interface InterventionType {
  slug: InterventionSlug;
  label: string;
  description: string;
  icon: string;
  allowedAnchorKinds: AnchorKind[];
}

export interface AccessMetrics {
  totalHouseholds: number;
  householdsWithAccess: number;
  isolatedClusters: number;
  clusterAccess: Record<string, { hasAccess: boolean; nearestShelter: number | null; nearestClinic: number | null }>;
}

export interface RunResult {
  interventionSlug: InterventionSlug;
  anchorId: string;
  baselineMetrics: AccessMetrics;
  floodedMetrics: AccessMetrics;
  resolvedMetrics: AccessMetrics;
  narrative: string;
  householdsRestored: number;
  clustersReconnected: number;
}
