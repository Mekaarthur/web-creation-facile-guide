export interface Provider {
  id: string;
  user_id: string;
  business_name: string;
  status: string;
  created_at: string;
  is_verified?: boolean;
  rating?: number;
  description?: string;
  location?: string;
  profiles?: { first_name: string; last_name: string; avatar_url?: string } | null;
  bookings?: any[];
  reviews?: any[];
  documents?: any[];
}

export interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  availability: string;
  motivation: string;
  experience_years: number | null;
  certifications: string | null;
  has_transport: boolean;
  cv_file_url: string | null;
  identity_document_url: string | null;
  criminal_record_url: string | null;
  criminal_record_date: string | null;
  siren_number: string | null;
  rib_iban_url: string | null;
  certifications_url: string | null;
  documents_complete: boolean | null;
  status: string;
  admin_comments: string | null;
  created_at: string;
  updated_at: string;
  business_name?: string;
  hourly_rate?: number;
  city?: string;
  postal_code?: string;
  description?: string;
}
