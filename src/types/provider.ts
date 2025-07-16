export interface ProviderAvailability {
  id: string;
  provider_id: string;
  day_of_week: number; // 0 = Dimanche, 1 = Lundi, etc.
  start_time: string; // Format HH:MM
  end_time: string; // Format HH:MM
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderDocument {
  id: string;
  provider_id: string;
  document_type: 'insurance' | 'certification' | 'identity' | 'other';
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_verified: boolean;
  uploaded_at: string;
  verified_at?: string;
  verified_by?: string;
}

export interface Provider {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  hourly_rate: number | null;
  rating: number | null;
  location: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  siret_number?: string | null;
  total_earnings?: number;
  monthly_earnings?: number;
  missions_accepted?: number;
  missions_completed?: number;
  acceptance_rate?: number;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  provider_availability?: ProviderAvailability[];
  provider_documents?: ProviderDocument[];
  provider_services?: {
    service_id: string;
    price_override: number | null;
  }[];
  distance?: number;
}

export interface ProviderNotification {
  id: string;
  provider_id: string;
  booking_id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id?: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired';
  reward_amount: number;
  created_at: string;
  completed_at?: string;
  expires_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchingFilters {
  serviceId?: string;
  serviceType?: string;
  location?: string;
  urgency?: string;
  maxDistance?: number;
  minRating?: number;
  maxPrice?: number;
  dateTime?: Date;
}