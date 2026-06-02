import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToExcel, formatters } from "@/utils/excelExport";
import { useToast } from "@/hooks/use-toast";

interface ExcelExportButtonProps {
  data: any[];
  filename: string;
  sheetName: string;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
}

export const ExcelExportButton = ({
  data,
  filename,
  sheetName,
  title,
  subtitle,
  disabled
}: ExcelExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Il n'y a pas de données à exporter",
        variant: "destructive"
      });
      return;
    }

    try {
      // Déterminer les colonnes automatiquement à partir du premier élément
      const columns = Object.keys(data[0]).map(key => ({
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        key,
        width: 20,
        format: getFormatter(key)
      }));

      exportToExcel({
        filename,
        sheetName,
        columns,
        data,
        title,
        subtitle
      });

      toast({
        title: "Export réussi",
        description: `Le fichier ${filename}.xlsx a été téléchargé`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      variant="outline"
      size="sm"
    >
      <Download className="h-4 w-4 mr-2" />
      Export Excel
    </Button>
  );
};

// Helper pour déterminer le formateur approprié selon le nom du champ
const getFormatter = (key: string) => {
  if (key.includes('date') || key.includes('at')) {
    return formatters.dateTime;
  }
  if (key.includes('price') || key.includes('amount') || key.includes('payment')) {
    return formatters.currency;
  }
  if (key.includes('rating') || key.includes('score')) {
    return (val: any) => val ? `${val}/5` : '';
  }
  if (key === 'status') {
    return formatters.status;
  }
  if (typeof key === 'boolean') {
    return formatters.boolean;
  }
  return undefined;
};
