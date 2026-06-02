export const getTierColor = (tier: string) => {
  switch (tier) {
    case 'bronze': return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
    case 'silver': return 'bg-slate-400/10 text-slate-600 border-slate-400/20';
    case 'gold': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const getTierLabel = (tier: string) => {
  switch (tier) {
    case 'bronze': return '🥉 Bronze - 50€';
    case 'silver': return '🥈 Silver - 100€';
    case 'gold': return '🥇 Gold - 150€';
    default: return tier;
  }
};

export const getRewardTypeLabel = (type: string) => {
  switch (type) {
    case 'validation': return 'Validation (50h)';
    case 'loyalty': return 'Fidélisation (120h)';
    case 'super_ambassador': return 'Super Ambassadeur';
    default: return type;
  }
};

export const getRewardTypeColor = (type: string) => {
  switch (type) {
    case 'validation': return 'bg-info/10 text-info border-info/20';
    case 'loyalty': return 'bg-primary/10 text-primary border-primary/20';
    case 'super_ambassador': return 'bg-warning/10 text-warning border-warning/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-success/10 text-success border-success/20';
    case 'pending': return 'bg-warning/10 text-warning border-warning/20';
    case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};
