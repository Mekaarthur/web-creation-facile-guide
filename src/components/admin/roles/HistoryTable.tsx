import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, UserPlus, UserMinus } from 'lucide-react';
import { AdminActionLog } from '@/types/admin-roles';

interface HistoryTableProps {
  logs: AdminActionLog[];
}

export const HistoryTable = ({ logs }: HistoryTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Historique des Actions Admin
        </CardTitle>
        <CardDescription>
          Historique complet de toutes les modifications de rôles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Heure</TableHead>
              <TableHead>Administrateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Utilisateur Cible</TableHead>
              <TableHead>Adresse IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucune action enregistrée
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="font-medium">{log.admin_email}</TableCell>
                  <TableCell>
                    {log.action_type === 'promote_admin' ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Promotion Admin
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <UserMinus className="h-3 w-3 mr-1" />
                        Révocation Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{log.target_email}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ip_address || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
