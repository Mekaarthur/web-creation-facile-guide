export interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  postal_code: string;
  profile_photo_url: string;
  business_name: string;
  description: string;
  siret_number: string;
  mandat_facturation_accepte: boolean;
  service_categories: string[];
  hourly_rate: number;
  availability_days: string[];
  availability_hours: string;
  availability_time_slots: { day: string; start: string; end: string }[];
  coverage_address: string;
  coverage_radius: number;
  intervention_zones: string[];
  other_intervention_zone: string;
  transportation_mode: string;
  identity_document_url: string;
  diploma_urls: string[];
  insurance_document_url: string;
  experience_years: number;
  has_transport: boolean;
  certifications: string;
  motivation: string;
}

export const INITIAL_FORM_DATA: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: '',
  postal_code: '',
  profile_photo_url: '',
  business_name: '',
  description: '',
  siret_number: '',
  mandat_facturation_accepte: false,
  service_categories: [],
  hourly_rate: 0,
  availability_days: [],
  availability_hours: '09h00 - 18h00',
  availability_time_slots: [],
  coverage_address: '',
  coverage_radius: 20,
  intervention_zones: [],
  other_intervention_zone: '',
  transportation_mode: '',
  identity_document_url: '',
  diploma_urls: [],
  insurance_document_url: '',
  experience_years: 0,
  has_transport: false,
  certifications: '',
  motivation: '',
};
