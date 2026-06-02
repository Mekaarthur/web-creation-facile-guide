export interface PlatformSettings {
  general: {
    site_name: string;
    site_description: string;
    contact_email: string;
    default_language: string;
    timezone: string;
    maintenance_mode: boolean;
  };
  payments: {
    stripe_enabled: boolean;
    commission_rate: number;
    minimum_payout: number;
    auto_payout: boolean;
    currency: string;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    admin_alerts: boolean;
  };
  security: {
    require_email_verification: boolean;
    two_factor_auth: boolean;
    session_timeout: number;
    password_min_length: number;
  };
  business: {
    auto_assignment: boolean;
    max_providers_per_request: number;
    request_timeout_hours: number;
    rating_required: boolean;
  };
  qualification: {
    legal_status_required: boolean;
    identity_verification: boolean;
    insurance_required: boolean;
    diploma_required_regulated: boolean;
    initial_selection_enabled: boolean;
    background_check_required: boolean;
    minimum_experience_years: number;
  };
  matching: {
    geographic_zone_priority: boolean;
    availability_check_enabled: boolean;
    service_type_matching: boolean;
    provider_choice_enabled: boolean;
    max_distance_km: number;
    response_timeout_hours: number;
    rating_weight: number;
    distance_weight: number;
    availability_weight: number;
  };
  validation: {
    auto_validation_enabled: boolean;
    manual_review_required: boolean;
    validation_timeout_days: number;
    rejected_reapplication_days: number;
  };
  client_rules: {
    minimum_age: number;
    cgu_acceptance_required: boolean;
    send_creation_notification: boolean;
    minimum_duration_hours: number;
    platform_only_booking: boolean;
    preauthorization_at_booking: boolean;
    charge_after_completion: boolean;
    free_cancellation_hours: number;
    first_booking_exception: boolean;
    modification_deadline_hours: number;
    no_show_timeout_minutes: number;
  };
}

export interface SettingsTabProps {
  settings: PlatformSettings;
  updateSetting: (category: keyof PlatformSettings, key: string, value: any) => void;
}
