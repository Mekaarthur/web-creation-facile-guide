export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      booking_slots: {
        Row: {
          booking_date: string
          booking_id: string
          created_at: string
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          booking_date: string
          booking_id: string
          created_at?: string
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          booking_date?: string
          booking_id?: string
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_slots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          booking_date: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          provider_id: string
          service_id: string
          start_time: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          booking_date: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          provider_id: string
          service_id: string
          start_time: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          booking_date?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          provider_id?: string
          service_id?: string
          start_time?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requests: {
        Row: {
          additional_notes: string | null
          assigned_provider_id: string | null
          budget_range: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          form_response_id: string
          id: string
          location: string
          preferred_date: string | null
          preferred_time: string | null
          service_description: string
          service_type: string
          status: string
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          additional_notes?: string | null
          assigned_provider_id?: string | null
          budget_range?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          form_response_id: string
          id?: string
          location: string
          preferred_date?: string | null
          preferred_time?: string | null
          service_description: string
          service_type: string
          status?: string
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          additional_notes?: string | null
          assigned_provider_id?: string | null
          budget_range?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          form_response_id?: string
          id?: string
          location?: string
          preferred_date?: string | null
          preferred_time?: string | null
          service_description?: string
          service_type?: string
          status?: string
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          provider_id: string
          status: string
          updated_at: string
          upload_date: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          provider_id: string
          status?: string
          updated_at?: string
          upload_date?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          provider_id?: string
          status?: string
          updated_at?: string
          upload_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          provider_id: string
          title: string
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          provider_id: string
          title: string
          type?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          provider_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_notifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          acceptance_rate: number | null
          business_name: string | null
          created_at: string
          description: string | null
          hourly_rate: number | null
          id: string
          is_verified: boolean
          location: string | null
          missions_accepted: number | null
          missions_completed: number | null
          monthly_earnings: number | null
          rating: number | null
          siret_number: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acceptance_rate?: number | null
          business_name?: string | null
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean
          location?: string | null
          missions_accepted?: number | null
          missions_completed?: number | null
          monthly_earnings?: number | null
          rating?: number | null
          siret_number?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acceptance_rate?: number | null
          business_name?: string | null
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean
          location?: string | null
          missions_accepted?: number | null
          missions_completed?: number | null
          monthly_earnings?: number | null
          rating?: number | null
          siret_number?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_amount: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          status?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_per_hour: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_per_hour: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_per_hour?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
