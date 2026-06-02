import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Download } from 'lucide-react';

interface PerformanceRewardFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  tierFilter: string;
  setTierFilter: (value: string) => void;
  yearFilter: string;
  setYearFilter: (value: string) => void;
  onExport: () => void;
  years: number[];
}

const PerformanceRewardFilters: React.FC<PerformanceRewardFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  tierFilter,
  setTierFilter,
  yearFilter,
  setYearFilter,
  onExport,
  years
}) => {
  const hasFilters = searchTerm || statusFilter !== 'all' || tierFilter !== 'all' || yearFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTierFilter('all');
    setYearFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un prestataire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
          </SelectContent>
        </Select>

        {/* Tier Filter */}
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Palier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les paliers</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
            <SelectItem value="silver">Argent</SelectItem>
            <SelectItem value="gold">Or</SelectItem>
          </SelectContent>
        </Select>

        {/* Year Filter */}
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}

        {/* Export Button */}
        <Button
          onClick={onExport}
          variant="outline"
          className="gap-2 ml-auto"
        >
          <Download className="h-4 w-4" />
          Exporter Excel
        </Button>
      </div>
    </div>
  );
};

export default PerformanceRewardFilters;
