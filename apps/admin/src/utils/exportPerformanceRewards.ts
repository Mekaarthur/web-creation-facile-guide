import ExcelJS from 'exceljs';
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

export const exportPerformanceRewardsToExcel = async (
  rewards: PerformanceReward[],
  fileName: string = 'recompenses_performance'
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();

  // Feuille 1 — Récompenses
  const sheet = workbook.addWorksheet('Récompenses');
  sheet.columns = [
    { header: 'Prestataire',      key: 'prestataire', width: 25 },
    { header: 'Nom',              key: 'nom',         width: 20 },
    { header: 'Palier',           key: 'palier',      width: 10 },
    { header: 'Montant (€)',      key: 'montant',     width: 12 },
    { header: 'Année',            key: 'annee',       width:  8 },
    { header: 'Statut',           key: 'statut',      width: 12 },
    { header: 'Missions',         key: 'missions',    width: 10 },
    { header: 'Heures',           key: 'heures',      width: 10 },
    { header: 'Note moyenne',     key: 'note',        width: 12 },
    { header: 'Date attribution', key: 'date_attr',   width: 15 },
    { header: 'Date paiement',    key: 'date_paie',   width: 15 },
    { header: 'Notes',            key: 'notes',       width: 30 },
  ];

  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.alignment = { horizontal: 'center' };
  });

  rewards.forEach(reward => {
    sheet.addRow({
      prestataire: reward.provider?.business_name ?? 'N/A',
      nom: `${reward.provider?.profiles?.first_name ?? ''} ${reward.provider?.profiles?.last_name ?? ''}`.trim() || 'N/A',
      palier:     getTierLabel(reward.reward_tier),
      montant:    reward.amount.toFixed(2),
      annee:      reward.year,
      statut:     reward.status === 'paid' ? 'Payé' : 'En attente',
      missions:   reward.missions_count,
      heures:     reward.hours_worked.toFixed(1),
      note:       reward.average_rating.toFixed(2),
      date_attr:  format(new Date(reward.earned_date), 'dd/MM/yyyy', { locale: fr }),
      date_paie:  reward.paid_date ? format(new Date(reward.paid_date), 'dd/MM/yyyy', { locale: fr }) : '-',
      notes:      reward.notes ?? '-',
    });
  });

  // Feuille 2 — Résumé
  const summary = workbook.addWorksheet('Résumé');
  summary.columns = [
    { header: 'Indicateur', key: 'indicateur', width: 25 },
    { header: 'Valeur',     key: 'valeur',     width: 20 },
  ];
  summary.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  });

  const paid    = rewards.filter(r => r.status === 'paid');
  const pending = rewards.filter(r => r.status === 'pending');
  const total   = (arr: PerformanceReward[]) =>
    arr.reduce((s, r) => s + r.amount, 0).toFixed(2) + '€';

  [
    ['Total récompenses',  rewards.length],
    ['En attente',         pending.length],
    ['Payées',             paid.length],
    ['Montant total',      total(rewards)],
    ['Montant en attente', total(pending)],
    ['Montant payé',       total(paid)],
    ['Bronze', rewards.filter(r => r.reward_tier === 'bronze').length],
    ['Argent', rewards.filter(r => r.reward_tier === 'silver').length],
    ['Or',     rewards.filter(r => r.reward_tier === 'gold').length],
  ].forEach(([indicateur, valeur]) => summary.addRow({ indicateur, valeur }));

  // Téléchargement
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${timestamp}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

const getTierLabel = (tier: string): string => {
  switch (tier) {
    case 'bronze': return 'Bronze';
    case 'silver': return 'Argent';
    case 'gold':   return 'Or';
    default:       return tier;
  }
};
