export interface ReferralReward {
  id: string;
  referrer_provider_id: string;
  referred_provider_id: string;
  referral_id: string;
  reward_type: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  referrer?: {
    business_name: string;
    profiles: { first_name: string; last_name: string };
  };
  referred?: { business_name: string };
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: string;
  hours_completed: number;
  first_reward_paid: boolean;
  loyalty_bonus_paid: boolean;
  created_at: string;
  referrer?: {
    business_name: string;
    profiles: { first_name: string; last_name: string };
  };
  referred?: { business_name: string };
}

export interface SuperAmbassador {
  id: string;
  business_name: string;
  is_super_ambassador: boolean;
  ambassador_badge_earned_at: string;
  yearly_referrals_count: number;
  profiles: { first_name: string; last_name: string };
}

export interface PerformanceReward {
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
    profiles: { first_name: string; last_name: string };
  };
}

export interface EligibleProvider {
  provider_id: string;
  business_name: string;
  tier: string;
  amount: number;
  missions_count: number;
  hours_worked: number;
  average_rating: number;
  months_active: number;
  reward_created: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  pendingAmount: number;
  paidAmount: number;
  totalAmbassadors: number;
  validatedReferrals: number;
  loyaltyReferrals: number;
  pendingPerformanceRewards: number;
  pendingPerformanceAmount: number;
  paidPerformanceAmount: number;
  bronzeCount: number;
  silverCount: number;
  goldCount: number;
}
