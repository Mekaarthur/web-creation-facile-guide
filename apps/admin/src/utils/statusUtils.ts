// Centralized status utilities for bookings/missions

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'bg-success/10 text-success border-success/20';
    case 'pending': return 'bg-warning/10 text-warning border-warning/20';
    case 'in_progress': return 'bg-info/10 text-info border-info/20';
    case 'completed': return 'bg-muted text-muted-foreground border-border';
    case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const getStatusLabel = (status: string, t?: (key: string) => string): string => {
  // If translation function is provided, use it
  if (t) {
    const translationKey = `providerDashboard.status.${status === 'in_progress' ? 'inProgress' : status}`;
    const translated = t(translationKey);
    if (translated !== translationKey) return translated;
  }
  
  // Fallback to French labels
  switch (status) {
    case 'confirmed': return 'Confirmé';
    case 'pending': return 'En attente';
    case 'in_progress': return 'En cours';
    case 'completed': return 'Terminé';
    case 'cancelled': return 'Annulé';
    default: return status;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};
