import { supabase } from '@/lib/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type AuditAction =
  | 'run.saved'
  | 'invitation.sent'
  | 'invitation.accepted'
  | 'member.role_changed'
  | 'member.removed'
  | 'org.created';

export interface AuditEntry {
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  organization_id?: string;
  payload?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('audit_logs').insert({
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    organization_id: entry.organization_id ?? null,
    actor_user_id: user?.id ?? null,
    payload_json: (entry.payload ?? null) as unknown as Json,
  });
}

export async function fetchAuditLogs(orgId: string, limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
