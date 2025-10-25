import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AdminActionLog } from '@/types/admin-roles';

export const useAdminRolesManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLogs, setActionLogs] = useState<AdminActionLog[]>([]);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .order('email');

      if (usersError) throw usersError;

      // Load user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge users with roles
      const usersWithRoles = usersData?.map(user => ({
        ...user,
        role: rolesData?.find(r => r.user_id === user.user_id)?.role || 'user'
      })) || [];

      setUsers(usersWithRoles);
      setAdmins(usersWithRoles.filter(u => u.role === 'admin'));

      // Load admin action logs
      const { data: logsData, error: logsError } = await supabase
        .from('admin_actions_log')
        .select('*')
        .in('action_type', ['promote_admin', 'revoke_admin'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error('Error loading logs:', logsError);
      } else {
        // Enrich logs with email information
        const enrichedLogs = (logsData || []).map(log => {
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
        setActionLogs(enrichedLogs);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (user: UserProfile) => {
    try {
      const { error } = await supabase.functions.invoke('admin-manage-roles', {
        body: { action: 'promote', targetUserId: user.user_id }
      });

      if (error) throw error;

      toast({
        title: '✅ Promotion réussie',
        description: `${user.email} est maintenant administrateur`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la promotion',
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async (user: UserProfile) => {
    try {
      const { error } = await supabase.functions.invoke('admin-manage-roles', {
        body: { action: 'revoke', targetUserId: user.user_id }
      });

      if (error) throw error;

      toast({
        title: '✅ Révocation réussie',
        description: `${user.email} n'est plus administrateur`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la révocation',
        variant: 'destructive',
      });
    }
  };

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

  useEffect(() => {
    loadData();
  }, []);

  return {
    users,
    admins,
    loading,
    actionLogs,
    handlePromote,
    handleRevoke,
    exportAdmins,
  };
};
