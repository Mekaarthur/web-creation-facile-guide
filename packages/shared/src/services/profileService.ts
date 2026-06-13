import { supabase } from "../integrations/supabase/client";

class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: unknown) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone, address")
      .eq("user_id", userId)
      .single();
    // PGRST116 = row not found — not an error, just return null
    if (error && error.code !== "PGRST116") {
      throw new ServiceError("Erreur lors du chargement du profil", error.code, error);
    }
    return data;
  },
};
