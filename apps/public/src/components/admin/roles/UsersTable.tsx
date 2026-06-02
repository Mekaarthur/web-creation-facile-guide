import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Shield, UserPlus, UserMinus } from 'lucide-react';
import { UserProfile } from '@/types/admin-roles';

interface UsersTableProps {
  users: UserProfile[];
  onPromote: (user: UserProfile) => void;
  onRevoke: (user: UserProfile) => void;
}

export const UsersTable = ({ users, onPromote, onRevoke }: UsersTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilisateurs</CardTitle>
        <CardDescription>
          Recherchez et gérez les rôles des utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email ou nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  {user.first_name || user.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : '-'}
                </TableCell>
                <TableCell>
                  {user.role === 'admin' ? (
                    <Badge variant="default" className="bg-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Utilisateur</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {user.role === 'admin' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRevoke(user)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Révoquer
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onPromote(user)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Promouvoir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
