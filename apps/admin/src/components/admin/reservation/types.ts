export interface Reservation {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string | null;
  total_price: number;
  hourly_rate: number | null;
  status: string;
  created_at: string;
  client_id: string;
  provider_id: string | null;
  service_id: string;
  notes?: string | null;
  cancellation_reason?: string | null;
  services: {
    name: string;
    category: string;
    base_price?: number;
  } | null;
  client_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  provider_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface FinancialTransaction {
  id: string;
  payment_status: string;
  client_paid_at: string | null;
  provider_paid_at: string | null;
  client_price: number;
  provider_payment: number;
  company_commission: number;
}

export interface Financials {
  hourlyRate: number;
  duration: number;
  commissionPerHour: number;
  providerPerHour: number;
  totalClient: number;
  totalProvider: number;
  totalCommission: number;
  commissionPercentage: string;
}
