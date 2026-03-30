import { supabase } from '@/lib/supabase/client';
import { AccessMetrics, RunResult } from '@/lib/simulation/types';
import type { Json } from '@/integrations/supabase/types';

export interface SaveRunParams {
  districtSlug: string;
  scenarioSlug: string;
  interventionSlug: string;
  anchorId: string;
  baselineMetrics: AccessMetrics;
  floodedMetrics: AccessMetrics;
  resolvedMetrics: AccessMetrics;
  result: RunResult;
  floodedEdgesSnapshot: unknown;
  resolvedEdgesSnapshot: unknown;
}

export async function saveRun(params: SaveRunParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Look up district id
  const { data: district } = await supabase
    .from('districts')
    .select('id')
    .eq('slug', params.districtSlug)
    .single();
  if (!district) throw new Error('District not found');

  // Look up scenario id
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('id')
    .eq('district_id', district.id)
    .eq('slug', params.scenarioSlug)
    .single();

  const title = `Riverbend East — ${params.scenarioSlug === 'severe-flash-flood' ? 'Severe Flash Flood' : 'Moderate River Rise'} — ${params.result.interventionSlug === 'temporary-bridge' ? 'Temporary Bridge' : params.result.interventionSlug === 'mobile-clinic' ? 'Mobile Clinic' : params.result.interventionSlug === 'barrier-line' ? 'Barrier Line' : 'Shuttle Link'}`;

  const { data: run, error } = await supabase
    .from('scenario_runs')
    .insert({
      district_id: district.id,
      scenario_id: scenario?.id ?? null,
      created_by: user.id,
      title,
      status: 'resolved' as const,
      baseline_metrics_json: params.baselineMetrics as unknown as Json,
      flooded_metrics_json: params.floodedMetrics as unknown as Json,
      resolved_metrics_json: params.resolvedMetrics as unknown as Json,
      selected_intervention_slug: params.interventionSlug,
      selected_anchor_id: params.anchorId,
      result_summary_json: {
        narrative: params.result.narrative,
        householdsRestored: params.result.householdsRestored,
        clustersReconnected: params.result.clustersReconnected,
      } as unknown as Json,
      board_snapshot_before_json: params.floodedEdgesSnapshot as unknown as Json,
      board_snapshot_after_json: params.resolvedEdgesSnapshot as unknown as Json,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Create replay events
  const events = [
    { run_id: run!.id, event_type: 'baseline', payload_json: { phase: 'baseline' } as Json, created_by: user.id },
    { run_id: run!.id, event_type: 'flooded', payload_json: { phase: 'flooded', scenarioSlug: params.scenarioSlug } as Json, created_by: user.id },
    { run_id: run!.id, event_type: 'intervention_applied', payload_json: { phase: 'resolved', interventionSlug: params.interventionSlug, anchorId: params.anchorId } as Json, created_by: user.id },
    { run_id: run!.id, event_type: 'resolved', payload_json: { phase: 'resolved', narrative: params.result.narrative } as Json, created_by: user.id },
  ];

  await supabase.from('scenario_run_events').insert(events);

  return run!.id;
}

export async function fetchRun(runId: string) {
  const { data, error } = await supabase
    .from('scenario_runs')
    .select('*, districts(slug, name), scenarios(slug, label, severity)')
    .eq('id', runId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchRunEvents(runId: string) {
  const { data, error } = await supabase
    .from('scenario_run_events')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchRecentRuns() {
  const { data, error } = await supabase
    .from('scenario_runs')
    .select('id, title, status, selected_intervention_slug, created_at, districts(slug, name)')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

export async function updateRunNotes(runId: string, notes: string) {
  const { error } = await supabase
    .from('scenario_runs')
    .update({ notes })
    .eq('id', runId);

  if (error) throw error;
}
