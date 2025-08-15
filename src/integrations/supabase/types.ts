export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      action_history: {
        Row: {
          action_type: string
          admin_comment: string | null
          admin_user_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action_type: string
          admin_comment?: string | null
          admin_user_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action_type?: string
          admin_comment?: string | null
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      admin_actions_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
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
          after_photos: string[] | null
          assigned_at: string | null
          before_photos: string[] | null
          booking_date: string
          check_in_location: string | null
          check_out_location: string | null
          client_id: string
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          custom_duration: number | null
          end_time: string
          flexible_hours: boolean | null
          hourly_rate: number | null
          id: string
          notes: string | null
          provider_id: string
          provider_notes: string | null
          service_id: string
          start_time: string
          started_at: string | null
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          after_photos?: string[] | null
          assigned_at?: string | null
          before_photos?: string[] | null
          booking_date: string
          check_in_location?: string | null
          check_out_location?: string | null
          client_id: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          custom_duration?: number | null
          end_time: string
          flexible_hours?: boolean | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          provider_id: string
          provider_notes?: string | null
          service_id: string
          start_time: string
          started_at?: string | null
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          after_photos?: string[] | null
          assigned_at?: string | null
          before_photos?: string[] | null
          booking_date?: string
          check_in_location?: string | null
          check_out_location?: string | null
          client_id?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          custom_duration?: number | null
          end_time?: string
          flexible_hours?: boolean | null
          hourly_rate?: number | null
          id?: string
          notes?: string | null
          provider_id?: string
          provider_notes?: string | null
          service_id?: string
          start_time?: string
          started_at?: string | null
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
      candidatures_prestataires: {
        Row: {
          created_at: string | null
          id: string
          mission_assignment_id: string
          provider_id: string
          response_time: unknown | null
          response_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mission_assignment_id: string
          provider_id: string
          response_time?: unknown | null
          response_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mission_assignment_id?: string
          provider_id?: string
          response_time?: unknown | null
          response_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_responses_mission_assignment_id_fkey"
            columns: ["mission_assignment_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_responses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          address: string | null
          booking_date: string | null
          cart_id: string
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          quantity: number
          service_id: string
          start_time: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          address?: string | null
          booking_date?: string | null
          cart_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          service_id: string
          start_time?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          address?: string | null
          booking_date?: string | null
          cart_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          service_id?: string
          start_time?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          status: string
          total_estimated: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          total_estimated?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          total_estimated?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          booking_id: string | null
          client_id: string
          created_at: string
          id: string
          last_message_at: string | null
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          booking_id: string
          conversation_id: string | null
          created_at: string
          edited_at: string | null
          file_url: string | null
          id: string
          is_read: boolean
          message: string
          message_type: string
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
          status: string | null
        }
        Insert: {
          booking_id: string
          conversation_id?: string | null
          created_at?: string
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message: string
          message_type?: string
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
          status?: string | null
        }
        Update: {
          booking_id?: string
          conversation_id?: string | null
          created_at?: string
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message?: string
          message_type?: string
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_monthly_activity: {
        Row: {
          client_id: string
          consecutive_months: number
          created_at: string
          id: string
          month: number
          total_hours: number
          updated_at: string
          year: number
        }
        Insert: {
          client_id: string
          consecutive_months?: number
          created_at?: string
          id?: string
          month: number
          total_hours?: number
          updated_at?: string
          year: number
        }
        Update: {
          client_id?: string
          consecutive_months?: number
          created_at?: string
          id?: string
          month?: number
          total_hours?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      client_requests: {
        Row: {
          additional_notes: string | null
          assigned_provider_id: string | null
          budget_range: string | null
          city: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          finished_at: string | null
          form_response_id: string
          id: string
          location: string
          payment_amount: number | null
          payment_method: string | null
          payment_status: string | null
          preferred_date: string | null
          preferred_time: string | null
          service_description: string
          service_type: string
          started_at: string | null
          status: string
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          additional_notes?: string | null
          assigned_provider_id?: string | null
          budget_range?: string | null
          city?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          finished_at?: string | null
          form_response_id: string
          id?: string
          location: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_description: string
          service_type: string
          started_at?: string | null
          status?: string
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          additional_notes?: string | null
          assigned_provider_id?: string | null
          budget_range?: string | null
          city?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          finished_at?: string | null
          form_response_id?: string
          id?: string
          location?: string
          payment_amount?: number | null
          payment_method?: string | null
          payment_status?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          service_description?: string
          service_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: []
      }
      client_rewards: {
        Row: {
          booking_id: string | null
          client_id: string
          created_at: string
          earned_date: string
          expires_at: string
          id: string
          reward_type: string
          status: string
          updated_at: string
          used_date: string | null
          valid_until: string
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          created_at?: string
          earned_date?: string
          expires_at: string
          id?: string
          reward_type?: string
          status?: string
          updated_at?: string
          used_date?: string | null
          valid_until: string
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          created_at?: string
          earned_date?: string
          expires_at?: string
          id?: string
          reward_type?: string
          status?: string
          updated_at?: string
          used_date?: string | null
          valid_until?: string
        }
        Relationships: []
      }
      communications: {
        Row: {
          contenu: string
          created_at: string
          destinataire_email: string | null
          destinataire_id: string | null
          destinataire_phone: string | null
          error_message: string | null
          id: string
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          retry_count: number | null
          sent_at: string | null
          status: string
          sujet: string | null
          template_name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          contenu: string
          created_at?: string
          destinataire_email?: string | null
          destinataire_id?: string | null
          destinataire_phone?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          sujet?: string | null
          template_name?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          contenu?: string
          created_at?: string
          destinataire_email?: string | null
          destinataire_id?: string | null
          destinataire_phone?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          sujet?: string | null
          template_name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_booking_preferences: {
        Row: {
          booking_id: string
          created_at: string
          duration_hours: number
          id: string
          preferred_dates: string[] | null
          preferred_times: string[] | null
          special_requirements: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          duration_hours: number
          id?: string
          preferred_dates?: string[] | null
          preferred_times?: string[] | null
          special_requirements?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          duration_hours?: number
          id?: string
          preferred_dates?: string[] | null
          preferred_times?: string[] | null
          special_requirements?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_booking_preferences_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_requests: {
        Row: {
          additional_notes: string | null
          budget_range: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          delivery_address: string | null
          id: string
          location: string
          pickup_address: string | null
          preferred_date: string | null
          preferred_datetime: string | null
          preferred_time: string | null
          service_description: string
          status: string
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          additional_notes?: string | null
          budget_range?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          location: string
          pickup_address?: string | null
          preferred_date?: string | null
          preferred_datetime?: string | null
          preferred_time?: string | null
          service_description: string
          status?: string
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          additional_notes?: string | null
          budget_range?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          location?: string
          pickup_address?: string | null
          preferred_date?: string | null
          preferred_datetime?: string | null
          preferred_time?: string | null
          service_description?: string
          status?: string
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: []
      }
      internal_conversations: {
        Row: {
          admin_id: string | null
          booking_id: string | null
          client_id: string
          client_request_id: string | null
          created_at: string
          id: string
          job_application_id: string | null
          last_message_at: string | null
          provider_id: string | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          booking_id?: string | null
          client_id: string
          client_request_id?: string | null
          created_at?: string
          id?: string
          job_application_id?: string | null
          last_message_at?: string | null
          provider_id?: string | null
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          booking_id?: string | null
          client_id?: string
          client_request_id?: string | null
          created_at?: string
          id?: string
          job_application_id?: string | null
          last_message_at?: string | null
          provider_id?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_conversations_client_request_id_fkey"
            columns: ["client_request_id"]
            isOneToOne: false
            referencedRelation: "client_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_conversations_job_application_id_fkey"
            columns: ["job_application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean | null
          message_text: string
          message_type: string | null
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_text: string
          message_type?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          message_type?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string | null
          client_id: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          issued_date: string
          notes: string | null
          payment_date: string | null
          service_description: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          client_id: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number: string
          issued_date?: string
          notes?: string | null
          payment_date?: string | null
          service_description?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issued_date?: string
          notes?: string | null
          payment_date?: string | null
          service_description?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          admin_comments: string | null
          admin_notes: string | null
          application_date: string | null
          availability: string
          availability_days: string[] | null
          availability_hours: string | null
          business_name: string | null
          category: string
          certifications: string | null
          city: string | null
          coverage_address: string | null
          coverage_radius: number | null
          created_at: string
          cv_file_url: string | null
          description: string | null
          diploma_urls: string[] | null
          email: string
          experience_years: number | null
          first_name: string
          forfait_rates: Json | null
          has_transport: boolean | null
          hourly_rate: number | null
          id: string
          identity_document_url: string | null
          insurance_document_url: string | null
          last_name: string
          motivation: string
          phone: string
          postal_code: string | null
          profile_photo_url: string | null
          service_categories: string[] | null
          siret_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_comments?: string | null
          admin_notes?: string | null
          application_date?: string | null
          availability: string
          availability_days?: string[] | null
          availability_hours?: string | null
          business_name?: string | null
          category: string
          certifications?: string | null
          city?: string | null
          coverage_address?: string | null
          coverage_radius?: number | null
          created_at?: string
          cv_file_url?: string | null
          description?: string | null
          diploma_urls?: string[] | null
          email: string
          experience_years?: number | null
          first_name: string
          forfait_rates?: Json | null
          has_transport?: boolean | null
          hourly_rate?: number | null
          id?: string
          identity_document_url?: string | null
          insurance_document_url?: string | null
          last_name: string
          motivation: string
          phone: string
          postal_code?: string | null
          profile_photo_url?: string | null
          service_categories?: string[] | null
          siret_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_comments?: string | null
          admin_notes?: string | null
          application_date?: string | null
          availability?: string
          availability_days?: string[] | null
          availability_hours?: string | null
          business_name?: string | null
          category?: string
          certifications?: string | null
          city?: string | null
          coverage_address?: string | null
          coverage_radius?: number | null
          created_at?: string
          cv_file_url?: string | null
          description?: string | null
          diploma_urls?: string[] | null
          email?: string
          experience_years?: number | null
          first_name?: string
          forfait_rates?: Json | null
          has_transport?: boolean | null
          hourly_rate?: number | null
          id?: string
          identity_document_url?: string | null
          insurance_document_url?: string | null
          last_name?: string
          motivation?: string
          phone?: string
          postal_code?: string | null
          profile_photo_url?: string | null
          service_categories?: string[] | null
          siret_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          admin_assignment_time: string | null
          admin_user_id: string | null
          assigned_at: string | null
          assigned_by_admin: boolean | null
          assigned_provider_id: string | null
          assignment_method: string | null
          client_request_id: string
          created_at: string | null
          eligible_providers: string[]
          id: string
          response_deadline: string | null
          responses_received: number | null
          sent_notifications: number | null
        }
        Insert: {
          admin_assignment_time?: string | null
          admin_user_id?: string | null
          assigned_at?: string | null
          assigned_by_admin?: boolean | null
          assigned_provider_id?: string | null
          assignment_method?: string | null
          client_request_id: string
          created_at?: string | null
          eligible_providers: string[]
          id?: string
          response_deadline?: string | null
          responses_received?: number | null
          sent_notifications?: number | null
        }
        Update: {
          admin_assignment_time?: string | null
          admin_user_id?: string | null
          assigned_at?: string | null
          assigned_by_admin?: boolean | null
          assigned_provider_id?: string | null
          assignment_method?: string | null
          client_request_id?: string
          created_at?: string | null
          eligible_providers?: string[]
          id?: string
          response_deadline?: string | null
          responses_received?: number | null
          sent_notifications?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_assignments_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_assignments_client_request_id_fkey"
            columns: ["client_request_id"]
            isOneToOne: false
            referencedRelation: "client_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          content: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          notification_type: string
          sent_at: string | null
          status: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          notification_type: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          admin_notes: string | null
          amount: number
          booking_id: string | null
          cart_id: string | null
          client_id: string
          created_at: string
          currency: string
          id: string
          payment_date: string | null
          payment_method: string
          refund_amount: number | null
          refund_date: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          booking_id?: string | null
          cart_id?: string | null
          client_id: string
          created_at?: string
          currency?: string
          id?: string
          payment_date?: string | null
          payment_method: string
          refund_amount?: number | null
          refund_date?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          booking_id?: string | null
          cart_id?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          id?: string
          payment_date?: string | null
          payment_method?: string
          refund_amount?: number | null
          refund_date?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      prestations_realisees: {
        Row: {
          booking_id: string | null
          client_id: string
          client_request_id: string | null
          created_at: string
          date_prestation: string
          duree_heures: number
          id: string
          location: string
          montant_total: number | null
          notes: string | null
          paid_at: string | null
          provider_id: string
          service_type: string
          statut_paiement: string
          taux_horaire: number
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          client_request_id?: string | null
          created_at?: string
          date_prestation: string
          duree_heures?: number
          id?: string
          location: string
          montant_total?: number | null
          notes?: string | null
          paid_at?: string | null
          provider_id: string
          service_type: string
          statut_paiement?: string
          taux_horaire?: number
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          client_request_id?: string | null
          created_at?: string
          date_prestation?: string
          duree_heures?: number
          id?: string
          location?: string
          montant_total?: number | null
          notes?: string | null
          paid_at?: string | null
          provider_id?: string
          service_type?: string
          statut_paiement?: string
          taux_horaire?: number
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestations_realisees_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestations_realisees_client_request_id_fkey"
            columns: ["client_request_id"]
            isOneToOne: false
            referencedRelation: "client_requests"
            referencedColumns: ["id"]
          },
        ]
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
      provider_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          provider_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          provider_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          provider_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
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
      provider_invoices: {
        Row: {
          amount_brut: number
          amount_net: number
          booking_id: string
          charges_sociales: number | null
          created_at: string
          id: string
          invoice_number: string
          issued_date: string
          payment_date: string | null
          provider_id: string
          sent_date: string | null
          status: string
          tva_amount: number | null
          updated_at: string
        }
        Insert: {
          amount_brut?: number
          amount_net?: number
          booking_id: string
          charges_sociales?: number | null
          created_at?: string
          id?: string
          invoice_number?: string
          issued_date?: string
          payment_date?: string | null
          provider_id: string
          sent_date?: string | null
          status?: string
          tva_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount_brut?: number
          amount_net?: number
          booking_id?: string
          charges_sociales?: number | null
          created_at?: string
          id?: string
          invoice_number?: string
          issued_date?: string
          payment_date?: string | null
          provider_id?: string
          sent_date?: string | null
          status?: string
          tva_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_locations: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          postal_code: string | null
          provider_id: string
          service_radius: number
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          country?: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          postal_code?: string | null
          provider_id: string
          service_radius?: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          postal_code?: string | null
          provider_id?: string
          service_radius?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_locations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
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
      provider_rewards: {
        Row: {
          amount: number
          average_rating: number
          created_at: string
          earned_date: string
          hours_worked: number
          id: string
          missions_count: number
          paid_date: string | null
          provider_id: string
          reward_tier: string
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          amount: number
          average_rating?: number
          created_at?: string
          earned_date?: string
          hours_worked?: number
          id?: string
          missions_count?: number
          paid_date?: string | null
          provider_id: string
          reward_tier: string
          status?: string
          updated_at?: string
          year?: number
        }
        Update: {
          amount?: number
          average_rating?: number
          created_at?: string
          earned_date?: string
          hours_worked?: number
          id?: string
          missions_count?: number
          paid_date?: string | null
          provider_id?: string
          reward_tier?: string
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      provider_services: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          price_override: number | null
          provider_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          price_override?: number | null
          provider_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          price_override?: number | null
          provider_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_status_history: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          id: string
          new_status: string
          old_status: string | null
          provider_id: string
          reason: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          provider_id: string
          reason?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          provider_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_status_history_provider_id_fkey"
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
          adresse_complete: string | null
          business_name: string | null
          created_at: string
          description: string | null
          diploma_document_url: string | null
          forfait_rate: number | null
          hourly_rate: number | null
          hourly_rate_override: number | null
          id: string
          identity_document_url: string | null
          insurance_document_url: string | null
          is_verified: boolean
          last_activity_at: string | null
          last_mission_date: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          mandat_facturation_accepte: boolean | null
          mandat_facturation_date: string | null
          missions_accepted: number | null
          missions_completed: number | null
          missions_this_week: number | null
          monthly_earnings: number | null
          performance_score: number | null
          postal_codes: string[] | null
          profile_photo_url: string | null
          quality_agreement_date: string | null
          quality_agreement_signed: boolean | null
          rating: number | null
          rayon_intervention_km: number | null
          response_time_avg: number | null
          rotation_priority: number | null
          service_zones: string[] | null
          siret_number: string | null
          status: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          work_radius: number | null
          zones_couvertes: string[] | null
        }
        Insert: {
          acceptance_rate?: number | null
          adresse_complete?: string | null
          business_name?: string | null
          created_at?: string
          description?: string | null
          diploma_document_url?: string | null
          forfait_rate?: number | null
          hourly_rate?: number | null
          hourly_rate_override?: number | null
          id?: string
          identity_document_url?: string | null
          insurance_document_url?: string | null
          is_verified?: boolean
          last_activity_at?: string | null
          last_mission_date?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          mandat_facturation_accepte?: boolean | null
          mandat_facturation_date?: string | null
          missions_accepted?: number | null
          missions_completed?: number | null
          missions_this_week?: number | null
          monthly_earnings?: number | null
          performance_score?: number | null
          postal_codes?: string[] | null
          profile_photo_url?: string | null
          quality_agreement_date?: string | null
          quality_agreement_signed?: boolean | null
          rating?: number | null
          rayon_intervention_km?: number | null
          response_time_avg?: number | null
          rotation_priority?: number | null
          service_zones?: string[] | null
          siret_number?: string | null
          status?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          work_radius?: number | null
          zones_couvertes?: string[] | null
        }
        Update: {
          acceptance_rate?: number | null
          adresse_complete?: string | null
          business_name?: string | null
          created_at?: string
          description?: string | null
          diploma_document_url?: string | null
          forfait_rate?: number | null
          hourly_rate?: number | null
          hourly_rate_override?: number | null
          id?: string
          identity_document_url?: string | null
          insurance_document_url?: string | null
          is_verified?: boolean
          last_activity_at?: string | null
          last_mission_date?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          mandat_facturation_accepte?: boolean | null
          mandat_facturation_date?: string | null
          missions_accepted?: number | null
          missions_completed?: number | null
          missions_this_week?: number | null
          monthly_earnings?: number | null
          performance_score?: number | null
          postal_codes?: string[] | null
          profile_photo_url?: string | null
          quality_agreement_date?: string | null
          quality_agreement_signed?: boolean | null
          rating?: number | null
          rayon_intervention_km?: number | null
          response_time_avg?: number | null
          rotation_priority?: number | null
          service_zones?: string[] | null
          siret_number?: string | null
          status?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          work_radius?: number | null
          zones_couvertes?: string[] | null
        }
        Relationships: []
      }
      realtime_notifications: {
        Row: {
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          first_mission_duration: number | null
          id: string
          missions_completed: number | null
          provider_rating: number | null
          referral_code: string
          referred_id: string | null
          referred_type: string | null
          referred_user_email: string | null
          referrer_id: string
          referrer_type: string
          reward_amount: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          first_mission_duration?: number | null
          id?: string
          missions_completed?: number | null
          provider_rating?: number | null
          referral_code: string
          referred_id?: string | null
          referred_type?: string | null
          referred_user_email?: string | null
          referrer_id: string
          referrer_type?: string
          reward_amount?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          first_mission_duration?: number | null
          id?: string
          missions_completed?: number | null
          provider_rating?: number | null
          referral_code?: string
          referred_id?: string | null
          referred_type?: string | null
          referred_user_email?: string | null
          referrer_id?: string
          referrer_type?: string
          reward_amount?: number | null
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          client_id: string
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          provider_id: string
          punctuality_rating: number | null
          quality_rating: number | null
          rating: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          provider_id: string
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          provider_id?: string
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          current_page: string | null
          device_info: Json | null
          id: string
          last_seen: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_page?: string | null
          device_info?: Json | null
          id?: string
          last_seen?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_page?: string | null
          device_info?: Json | null
          id?: string
          last_seen?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zones_geographiques: {
        Row: {
          codes_postaux: string[]
          created_at: string
          id: string
          nom_zone: string
          rayon_km: number | null
          type_zone: string
          updated_at: string
        }
        Insert: {
          codes_postaux?: string[]
          created_at?: string
          id?: string
          nom_zone: string
          rayon_km?: number | null
          type_zone?: string
          updated_at?: string
        }
        Update: {
          codes_postaux?: string[]
          created_at?: string
          id?: string
          nom_zone?: string
          rayon_km?: number | null
          type_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_mission_manually: {
        Args: {
          p_admin_user_id?: string
          p_mission_id: string
          p_provider_id: string
        }
        Returns: boolean
      }
      calculate_cart_total: {
        Args: { cart_id_param: string }
        Returns: number
      }
      calculate_detailed_rating: {
        Args: {
          general_rating: number
          punctuality_rating: number
          quality_rating: number
        }
        Returns: number
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_provider_performance_score: {
        Args: { p_provider_id: string }
        Returns: number
      }
      calculate_provider_reward_tier: {
        Args: {
          p_average_rating: number
          p_hours_worked: number
          p_missions_count: number
          p_months_active: number
          p_provider_id: string
        }
        Returns: string
      }
      check_client_reward_eligibility: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      confirm_booking: {
        Args: { booking_id: string; provider_confirms: boolean }
        Returns: boolean
      }
      create_booking_from_request: {
        Args: { provider_id: string; request_id: string; service_id: string }
        Returns: string
      }
      create_provider_from_application: {
        Args: { application_id: string }
        Returns: string
      }
      create_referral_from_code: {
        Args: {
          p_referral_code: string
          p_referred_email: string
          p_referred_type?: string
        }
        Returns: boolean
      }
      expire_old_carts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      find_eligible_providers: {
        Args: {
          p_location: string
          p_postal_code?: string
          p_requested_date?: string
          p_service_type: string
        }
        Returns: {
          business_name: string
          distance_score: number
          final_priority_score: number
          performance_score: number
          provider_id: string
          rotation_priority: number
        }[]
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_provider_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_matching_providers: {
        Args:
          | {
              p_date_time?: string
              p_limit?: number
              p_location: string
              p_service_type: string
            }
          | { p_limit?: number; p_location: string; p_service_type: string }
        Returns: {
          business_name: string
          location: string
          match_score: number
          provider_id: string
          rating: number
        }[]
      }
      get_reward_amount: {
        Args: { p_tier: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_action: {
        Args: {
          p_action_type: string
          p_admin_comment?: string
          p_entity_id: string
          p_entity_type: string
          p_new_value?: string
          p_old_value?: string
        }
        Returns: string
      }
      mission_checkin: {
        Args: { booking_id: string; location_info?: string; photos?: string[] }
        Returns: boolean
      }
      mission_checkout: {
        Args: {
          booking_id: string
          location_info?: string
          notes?: string
          photos?: string[]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
