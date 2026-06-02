import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onAction: (userId: string, action: 'activate' | 'suspend') => void;
}

export const UserDetailsModal = ({ user, isOpen, onClose, onAction }: UserDetailsModalProps) => {
  if (!user) return null;

  const getUserDisplayName = (user: any) => {
    if (user.profiles?.first_name && user.profiles?.last_name) {
      return `${user.profiles.first_name} ${user.profiles.last_name}`;
    }
    return "Utilisateur";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails utilisateur</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
              <p className="font-semibold">{getUserDisplayName(user)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date d'inscription</label>
              <p>{format(new Date(user.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Statut compte</label>
              <Badge variant={user.auth_data?.banned_until ? "destructive" : "default"}>
                {user.auth_data?.banned_until ? "Suspendu" : "Actif"}
              </Badge>
            </div>
          </div>
          
          {user.bookings && user.bookings.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Réservations récentes</label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {user.bookings.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <p className="text-sm font-medium">{booking.services?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {booking.status}
                      </Badge>
                      <p className="text-sm font-semibold">{booking.total_price}€</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAction(user.id, user.auth_data?.banned_until ? 'activate' : 'suspend')}
            >
              {user.auth_data?.banned_until ? 'Réactiver' : 'Suspendre'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};