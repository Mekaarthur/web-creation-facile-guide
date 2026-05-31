import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AdminActionLog } from '@/types/admin-roles';

const QUERY_KEY = ['admin-roles-management'] as const;

const fetchAdminData = async () => {
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('user_id, email, first_name, last_name')
    .order('email');

  if (usersError) throw usersError;

  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) throw rolesError;

  const usersWithRoles: UserProfile[] = (usersData || []).map(user => ({
    ...user,
    role: rolesData?.find(r => r.user_id === user.user_id)?.role || 'user'
  }));

  const { data: logsData, error: logsError } = await supabase
    .from('admin_actions_log')
    .select('*')
    .in('action_type', ['promote_admin', 'revoke_admin'])
    .order('created_at', { ascending: false })
    .limit(100);

  if (logsError) {
    console.error('Error loading logs:', logsError);
  }

  const enrichedLogs: AdminActionLog[] = (logsData || []).map(log => {
    const adminUser = usersWithRoles.find(u => u.user_id === log.admin_user_id);
    const targetUser = usersWithRoles.find(u => u.user_id === log.entity_id);
    const newDataEmail = typeof log.new_data === 'object' && log.new_data !== null ? (log.new_data as any).email : null;
    const oldDataEmail = typeof log.old_data === 'object' && log.old_data !== null ? (log.old_data as any).email : null;
    return {
      id: log.id,
      admin_user_id: log.admin_user_id,
      entity_id: log.entity_id,
      action_type: log.action_type,
      description: log.description || '',
      created_at: log.created_at,
      old_data: log.old_data,
      new_data: log.new_data,
      ip_address: (log.ip_address as string) || null,
      admin_email: adminUser?.email || 'Inconnu',
      target_email: targetUser?.email || newDataEmail || oldDataEmail || 'Inconnu'
    };
  });

  return { usersWithRoles, enrichedLogs };
};

export const useAdminRolesManagement = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading: loading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAdminData,
    staleTime: 2 * 60 * 1000,
  });

  const users: UserProfile[] = data?.usersWithRoles ?? [];
  const admins: UserProfile[] = users.filter(u => u.role === 'admin');
  const actionLogs: AdminActionLog[] = data?.enrichedLogs ?? [];

  const promoteMutation = useMutation({
    mutationFn: (user: UserProfile) =>
      supabase.functions.invoke('admin-manage-roles', {
        body: { action: 'promote', targetUserId: user.user_id }
      }).then(({ error }) => { if (error) throw error; }),
    onSuccess: (_data, user) => {
      toast({ title: '✅ Promotion réussie', description: `${user.email} est maintenant administrateur` });
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message || 'Échec de la promotion', variant: 'destructive' });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (user: UserProfile) =>
      supabase.functions.invoke('admin-manage-roles', {
        body: { action: 'revoke', targetUserId: user.user_id }
      }).then(({ error }) => { if (error) throw error; }),
    onSuccess: (_data, user) => {
      toast({ title: '✅ Révocation réussie', description: `${user.email} n'est plus administrateur` });
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.message || 'Échec de la révocation', variant: 'destructive' });
    },
  });

  const exportAdmins = () => {
    const csv = admins.map(admin =>
      `${admin.email},${admin.first_name || ''},${admin.last_name || ''}`
    ).join('\n');
    const blob = new Blob([`Email,Prénom,Nom\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return {
    users,
    admins,
    loading,
    actionLogs,
    handlePromote: promoteMutation.mutate,
    handleRevoke: revokeMutation.mutate,
    exportAdmins,
  };
};
