import { DistrictBundle, Scenario, InterventionType, GraphNode, GraphEdge } from '@/lib/simulation/types';

const nodes: GraphNode[] = [
  { id: 'j-west', type: 'junction', x: 180, y: 380 },
  { id: 'j-market-w', type: 'junction', x: 360, y: 350 },
  { id: 'j-market-center', type: 'junction', x: 530, y: 340 },
  { id: 'j-market-e', type: 'junction', x: 680, y: 320 },
  { id: 'j-east-crossing', type: 'junction', x: 800, y: 280, anchorKind: 'crossing-gap', allowedInterventions: ['temporary-bridge'], label: 'East Crossing' },
  { id: 'j-east', type: 'junction', x: 920, y: 300 },
  { id: 'j-east-south', type: 'junction', x: 960, y: 430 },
  { id: 'j-north-w', type: 'junction', x: 320, y: 190 },
  { id: 'j-north-center', type: 'junction', x: 480, y: 170 },
  { id: 'j-south-market', type: 'junction', x: 530, y: 470 },
  { id: 'facility-shelter', type: 'facility', facilityKind: 'shelter', x: 280, y: 110, label: 'North High Shelter' },
  { id: 'facility-clinic', type: 'facility', facilityKind: 'clinic', x: 560, y: 560, label: 'Market Street Clinic' },
  { id: 'cluster-west', type: 'cluster', x: 80, y: 400, households: 142, label: 'West Blocks' },
  { id: 'cluster-market', type: 'cluster', x: 430, y: 510, households: 118, label: 'Market District' },
  { id: 'cluster-east-a', type: 'cluster', x: 1000, y: 230, households: 136, label: 'Eastside Block A' },
  { id: 'cluster-east-b', type: 'cluster', x: 1040, y: 460, households: 148, label: 'Eastside Block B' },
  { id: 'cluster-north', type: 'cluster', x: 240, y: 220, households: 68, label: 'North Quarter' },
  { id: 'east-school-lot', type: 'anchor', x: 940, y: 190, anchorKind: 'school-lot', allowedInterventions: ['mobile-clinic'], label: 'East School Lot' },
  { id: 'market-bus-turn', type: 'anchor', x: 650, y: 490, anchorKind: 'bus-turn', allowedInterventions: ['shuttle-link'], label: 'Market Bus Turn' },
  { id: 'north-drain-corridor', type: 'anchor', x: 530, y: 100, anchorKind: 'drain-corridor', allowedInterventions: ['barrier-line'], label: 'Drain Corridor' },
];

const edges: GraphEdge[] = [
  { id: 'e01', from: 'cluster-west', to: 'j-west', weight: 80, status: 'normal' },
  { id: 'e02', from: 'j-west', to: 'j-market-w', weight: 120, status: 'normal' },
  { id: 'e03', from: 'j-market-w', to: 'j-market-center', weight: 100, status: 'normal' },
  { id: 'e04', from: 'j-market-center', to: 'j-market-e', weight: 100, status: 'normal' },
  { id: 'e05', from: 'j-market-e', to: 'j-east-crossing', weight: 120, status: 'normal' },
  { id: 'e06', from: 'j-east-crossing', to: 'j-east', weight: 60, status: 'normal' },
  { id: 'e07', from: 'j-east', to: 'cluster-east-a', weight: 90, status: 'normal' },
  { id: 'e08', from: 'j-east', to: 'j-east-south', weight: 60, status: 'normal' },
  { id: 'e09', from: 'j-east-south', to: 'cluster-east-b', weight: 70, status: 'normal' },
  { id: 'e10', from: 'j-market-w', to: 'j-north-w', weight: 100, status: 'normal' },
  { id: 'e11', from: 'j-north-w', to: 'facility-shelter', weight: 60, status: 'normal' },
  { id: 'e12', from: 'j-north-w', to: 'cluster-north', weight: 50, status: 'normal' },
  { id: 'e13', from: 'j-north-w', to: 'j-north-center', weight: 130, status: 'normal' },
  { id: 'e14', from: 'j-north-center', to: 'north-drain-corridor', weight: 60, status: 'normal' },
  { id: 'e15', from: 'j-market-center', to: 'j-south-market', weight: 80, status: 'normal' },
  { id: 'e16', from: 'j-south-market', to: 'facility-clinic', weight: 60, status: 'normal' },
  { id: 'e17', from: 'cluster-market', to: 'j-south-market', weight: 80, status: 'normal' },
  { id: 'e18', from: 'j-east', to: 'east-school-lot', weight: 80, status: 'normal' },
  { id: 'e19', from: 'j-south-market', to: 'market-bus-turn', weight: 70, status: 'normal' },
];

export const RIVERBEND_EAST: DistrictBundle = {
  slug: 'riverbend-east',
  name: 'Riverbend East',
  version: '1.0.0',
  nodes,
  edges,
  viewBox: '0 0 1120 650',
};

export const SCENARIOS: Scenario[] = [
  {
    slug: 'severe-flash-flood',
    label: 'Severe Flash Flood',
    description: 'Intense rainfall overwhelms drainage. East crossing fails. Drain corridor floods.',
    severity: 'severe',
    edgeEffects: {
      'e05': { status: 'blocked' },
      'e06': { status: 'blocked' },
      'e14': { status: 'degraded' },
    },
    floodZones: [
      { cx: 790, cy: 290, rx: 140, ry: 90 },
      { cx: 520, cy: 120, rx: 110, ry: 55 },
    ],
  },
  {
    slug: 'moderate-river-rise',
    label: 'Moderate River Rise',
    description: 'Gradual river level increase. East crossing degraded. Drain corridor at risk.',
    severity: 'moderate',
    edgeEffects: {
      'e05': { status: 'degraded' },
      'e14': { status: 'degraded' },
    },
    floodZones: [
      { cx: 790, cy: 300, rx: 100, ry: 60 },
      { cx: 520, cy: 130, rx: 80, ry: 40 },
    ],
  },
];

export const INTERVENTION_TYPES: InterventionType[] = [
  { slug: 'temporary-bridge', label: 'Temporary Bridge', description: 'Restore a failed crossing with deployable bridge.', icon: 'construction', allowedAnchorKinds: ['crossing-gap'] },
  { slug: 'mobile-clinic', label: 'Mobile Clinic', description: 'Deploy temporary medical care at staging area.', icon: 'heart', allowedAnchorKinds: ['school-lot', 'lot'] },
  { slug: 'barrier-line', label: 'Barrier Line', description: 'Protect vulnerable corridor with flood barriers.', icon: 'shield', allowedAnchorKinds: ['drain-corridor'] },
  { slug: 'shuttle-link', label: 'Shuttle Link', description: 'Create temporary transit to isolated areas.', icon: 'bus', allowedAnchorKinds: ['bus-turn'] },
];
