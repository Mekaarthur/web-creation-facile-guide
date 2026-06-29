import { supabase } from '@/integrations/supabase/client';

export interface StaffMember {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  assignedAt: string;
  expiresAt: string | null;
  charterSignedAt: string | null;
}

export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

export type ExpiryVariant = 'expired' | 'urgent' | 'soon' | 'ok' | 'none';

export function expiryVariant(expiresAt: string | null): ExpiryVariant {
  const days = daysUntilExpiry(expiresAt);
  if (days === null) return 'none';
  if (days < 0)  return 'expired';
  if (days < 30) return 'urgent';
  if (days < 90) return 'soon';
  return 'ok';
}

export function expiryLabel(expiresAt: string | null): string {
  const days = daysUntilExpiry(expiresAt);
  if (days === null) return '—';
  if (days < 0)  return `Expiré il y a ${-days}j`;
  if (days === 0) return 'Expire aujourd\'hui';
  return `Expire dans ${days}j`;
}

export async function callGovernance(action: string, payload?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-governance', {
    body: { action, ...payload },
  });
  if (error) throw error;
  return data;
}
