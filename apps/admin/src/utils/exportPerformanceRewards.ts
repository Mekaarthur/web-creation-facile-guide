import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PerformanceReward {
  id: string;
  provider_id: string;
  reward_tier: string;
  amount: number;
  year: number;
  status: string;
  earned_date: string;
  paid_date?: string;
  missions_count: number;
  hours_worked: number;
  average_rating: number;
  notes?: string;
  provider?: {
    business_name: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export const exportPerformanceRewardsToExcel = (rewards: PerformanceReward[], fileName: string = 'recompenses_performance') => {
  // Prepare data for export
  const data = rewards.map(reward => ({
    'Prestataire': reward.provider?.business_name || 'N/A',
    'Nom': `${reward.provider?.profiles?.first_name || ''} ${reward.provider?.profiles?.last_name || ''}`.trim() || 'N/A',
    'Palier': getTierLabel(reward.reward_tier),
    'Montant (€)': reward.amount.toFixed(2),
    'Année': reward.year,
    'Statut': reward.status === 'paid' ? 'Payé' : 'En attente',
    'Missions': reward.missions_count,
    'Heures': reward.hours_worked.toFixed(1),
    'Note moyenne': reward.average_rating.toFixed(2),
    'Date attribution': format(new Date(reward.earned_date), 'dd/MM/yyyy', { locale: fr }),
    'Date paiement': reward.paid_date ? format(new Date(reward.paid_date), 'dd/MM/yyyy', { locale: fr }) : '-',
    'Notes': reward.notes || '-'
  }));

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 25 }, // Prestataire
    { wch: 20 }, // Nom
    { wch: 10 }, // Palier
    { wch: 12 }, // Montant
    { wch: 8 },  // Année
    { wch: 12 }, // Statut
    { wch: 10 }, // Missions
    { wch: 10 }, // Heures
    { wch: 12 }, // Note moyenne
    { wch: 15 }, // Date attribution
    { wch: 15 }, // Date paiement
    { wch: 30 }  // Notes
  ];
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Récompenses');

  // Add summary sheet
  const summary = {
    'Total récompenses': rewards.length,
    'En attente': rewards.filter(r => r.status === 'pending').length,
    'Payées': rewards.filter(r => r.status === 'paid').length,
    'Montant total': rewards.reduce((sum, r) => sum + r.amount, 0).toFixed(2) + '€',
    'Montant en attente': rewards.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0).toFixed(2) + '€',
    'Montant payé': rewards.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0).toFixed(2) + '€',
    'Bronze': rewards.filter(r => r.reward_tier === 'bronze').length,
    'Argent': rewards.filter(r => r.reward_tier === 'silver').length,
    'Or': rewards.filter(r => r.reward_tier === 'gold').length,
  };

  const summaryData = Object.entries(summary).map(([key, value]) => ({
    'Indicateur': key,
    'Valeur': value
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

  // Generate file name with date
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
  const finalFileName = `${fileName}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, finalFileName);
};

const getTierLabel = (tier: string): string => {
  switch (tier) {
    case 'bronze': return 'Bronze';
    case 'silver': return 'Argent';
    case 'gold': return 'Or';
    default: return tier;
  }
};
