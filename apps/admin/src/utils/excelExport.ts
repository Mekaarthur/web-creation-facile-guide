import ExcelJS from 'exceljs';

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

export const exportToExcel = async ({
  filename,
  sheetName,
  columns,
  data,
  title,
  subtitle,
}: ExcelExportOptions): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  columns.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = col.width ?? 15;
  });

  if (title) {
    const titleRow = worksheet.addRow([title]);
    titleRow.getCell(1).font = { bold: true, size: 16 };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, columns.length);

    if (subtitle) {
      const subtitleRow = worksheet.addRow([subtitle]);
      subtitleRow.getCell(1).alignment = { horizontal: 'center' };
      worksheet.mergeCells(subtitleRow.number, 1, subtitleRow.number, columns.length);
    }
    worksheet.addRow([]);
  }

  const headerRow = worksheet.addRow(columns.map(col => col.header));
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    cell.alignment = { horizontal: 'center' };
  });

  data.forEach(row => {
    worksheet.addRow(
      columns.map(col => {
        const value = row[col.key];
        return col.format ? col.format(value) : value;
      })
    );
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};

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
  boolean: (value: any) => (value ? 'Oui' : 'Non'),
  status: (value: string) => {
    const statusMap: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
      active: 'Actif',
      inactive: 'Inactif',
    };
    return statusMap[value] || value;
  },
};
