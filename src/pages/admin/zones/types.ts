export interface GeographicZone {
  id: string;
  nom_zone: string;
  type_zone: 'region' | 'ville' | 'metropole' | 'departement' | 'secteur';
  codes_postaux: string[];
  villes_couvertes: string[];
  rayon_km?: number;
  active: boolean;
  statut: 'active' | 'inactive' | 'test';
  description?: string;
  responsable_id?: string;
  provider_count?: number;
  client_count?: number;
  missions_count?: number;
  satisfaction_moyenne?: number;
  ca_total?: number;
  created_at: string;
  updated_at: string;
}

export interface ZoneFormData {
  nom_zone: string;
  codes_postaux: string;
  villes_couvertes: string;
  type_zone: string;
  rayon_km: string;
  statut: string;
  description: string;
  active: boolean;
}
