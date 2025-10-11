import * as XLSX from 'xlsx';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: (value: any) => any;
}

interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
}

export const exportToExcel = ({
  filename,
  sheetName,
  columns,
  data,
  title,
  subtitle
}: ExcelExportOptions) => {
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // Préparer les données avec les headers
  const headers = columns.map(col => col.header);
  
  // Formater les données selon les colonnes
  const formattedData = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      return col.format ? col.format(value) : value;
    })
  );

  // Créer la feuille avec titre si fourni
  let worksheetData: any[][] = [];
  let startRow = 0;

  if (title) {
    worksheetData.push([title]);
    startRow++;
    if (subtitle) {
      worksheetData.push([subtitle]);
      startRow++;
    }
    worksheetData.push([]); // Ligne vide
    startRow++;
  }

  worksheetData.push(headers);
  worksheetData.push(...formattedData);

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Styliser le titre
  if (title) {
    ws['A1'] = { 
      v: title, 
      t: 's',
      s: {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center' }
      }
    };
  }

  // Définir les largeurs de colonnes
  ws['!cols'] = columns.map(col => ({ 
    wch: col.width || 15 
  }));

  // Styliser les headers (ligne après le titre)
  const headerRow = startRow + 1;
  columns.forEach((_, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow - 1, c: idx });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "4F46E5" } },
        alignment: { horizontal: 'center' }
      };
    }
  });

  // Fusionner les cellules du titre
  if (title) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }
    ];
    if (subtitle) {
      ws['!merges'].push(
        { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }
      );
    }
  }

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Générer le fichier
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Helpers de formatage courants
export const formatters = {
  date: (value: any) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('fr-FR');
  },
  
  dateTime: (value: any) => {
    if (!value) return '';
    return new Date(value).toLocaleString('fr-FR');
  },
  
  currency: (value: any) => {
    if (value === null || value === undefined) return '';
    return `${parseFloat(value).toFixed(2)}€`;
  },
  
  percentage: (value: any) => {
    if (value === null || value === undefined) return '';
    return `${parseFloat(value).toFixed(1)}%`;
  },
  
  boolean: (value: any) => {
    return value ? 'Oui' : 'Non';
  },
  
  status: (value: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmé',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'active': 'Actif',
      'inactive': 'Inactif'
    };
    return statusMap[value] || value;
  }
};
