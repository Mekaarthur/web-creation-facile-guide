export interface UserProfile {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface AdminActionLog {
  id: string;
  admin_user_id: string;
  entity_id: string;
  action_type: string;
  description: string;
  created_at: string;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  admin_email?: string;
  target_email?: string;
}
