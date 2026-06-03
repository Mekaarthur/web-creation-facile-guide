import { useState } from 'react';
import { AdminRolesHeader } from '@/components/admin/roles/AdminRolesHeader';
import { AdminStatsCards } from '@/components/admin/roles/AdminStatsCards';
import { SecurityWarningCard } from '@/components/admin/roles/SecurityWarningCard';
import { UsersTable } from '@/components/admin/roles/UsersTable';
import { HistoryTable } from '@/components/admin/roles/HistoryTable';
import { RoleConfirmationDialog } from '@/components/admin/roles/RoleConfirmationDialog';
import { useAdminRolesManagement } from '@/hooks/admin/useAdminRolesManagement';
import { UserProfile } from '@/types/admin-roles';

const AdminRoles = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'revoke' | null>(null);

  const {
    users,
    admins,
    loading,
    actionLogs,
    handlePromote,
    handleRevoke,
    exportAdmins,
  } = useAdminRolesManagement();

  const onConfirmAction = async () => {
    if (!selectedUser) return;
    
    if (actionType === 'promote') {
      await handlePromote(selectedUser);
    } else if (actionType === 'revoke') {
      await handleRevoke(selectedUser);
    }
    
    setSelectedUser(null);
    setActionType(null);
  };

  const onCancelAction = () => {
    setSelectedUser(null);
    setActionType(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AdminRolesHeader
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onExport={exportAdmins}
      />

      <AdminStatsCards
        totalUsers={users.length}
        totalAdmins={admins.length}
      />

      <SecurityWarningCard />

      {!showHistory ? (
        <UsersTable
          users={users}
          onPromote={(user) => {
            setSelectedUser(user);
            setActionType('promote');
          }}
          onRevoke={(user) => {
            setSelectedUser(user);
            setActionType('revoke');
          }}
        />
      ) : (
        <HistoryTable logs={actionLogs} />
      )}

      <RoleConfirmationDialog
        open={!!actionType}
        actionType={actionType}
        selectedUser={selectedUser}
        onConfirm={onConfirmAction}
        onCancel={onCancelAction}
      />
    </div>
  );
};

export default AdminRoles;
