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
          affected_records_count: number | null
          created_at: string
          data_exported: boolean | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          is_gdpr_related: boolean | null
          new_data: Json | null
          old_data: Json | null
          request_metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          affected_records_count?: number | null
          created_at?: string
          data_exported?: boolean | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          is_gdpr_related?: boolean | null
          new_data?: Json | null
          old_data?: Json | null
          request_metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          affected_records_count?: number | null
          created_at?: string
          data_exported?: boolean | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          is_gdpr_related?: boolean | null
          new_data?: Json | null
          old_data?: Json | null
          request_metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      attestations: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          file_url: string | null
          id: string
          month: number | null
          service_type: string
          type: string
          updated_at: string
          year: number
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          month?: number | null
          service_type: string
          type: string
          updated_at?: string
          year: number
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          month?: number | null
          service_type?: string
          type?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      binomes: {
        Row: {
          backup_provider_id: string
          client_id: string
          compatibility_score: number | null
          created_at: string
          dissolution_reason: string | null
          dissolved_at: string | null
          failed_missions: number | null
          id: string
          last_mission_date: string | null
          missions_count: number | null
          notes: string | null
          primary_provider_id: string
          status: string
          successful_missions: number | null
          updated_at: string
        }
        Insert: {
          backup_provider_id: string
          client_id: string
          compatibility_score?: number | null
          created_at?: string
          dissolution_reason?: string | null
          dissolved_at?: string | null
          failed_missions?: number | null
          id?: string
          last_mission_date?: string | null
          missions_count?: number | null
          notes?: string | null
          primary_provider_id: string
          status?: string
          successful_missions?: number | null
          updated_at?: string
        }
        Update: {
          backup_provider_id?: string
          client_id?: string
          compatibility_score?: number | null
          created_at?: string
          dissolution_reason?: string | null
          dissolved_at?: string | null
          failed_missions?: number | null
          id?: string
          last_mission_date?: string | null
          missions_count?: number | null
          notes?: string | null
          primary_provider_id?: string
          status?: string
          successful_missions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "binomes_backup_provider_id_fkey"
            columns: ["backup_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binomes_backup_provider_id_fkey"
            columns: ["backup_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binomes_primary_provider_id_fkey"
            columns: ["primary_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binomes_primary_provider_id_fkey"
            columns: ["primary_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      binomes_history: {
        Row: {
          action_type: string
          binome_id: string
          created_at: string
          id: string
          new_data: Json | null
          notes: string | null
          old_data: Json | null
          performed_by: string
        }
        Insert: {
          action_type: string
          binome_id: string
          created_at?: string
          id?: string
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          performed_by: string
        }
        Update: {
          action_type?: string
          binome_id?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          notes?: string | null
          old_data?: Json | null
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "binomes_history_binome_id_fkey"
            columns: ["binome_id"]
            isOneToOne: false
            referencedRelation: "binomes"
            referencedColumns: ["id"]
          },
        ]
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
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
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
          reminder_sent: string | null
          review_request_sent: string | null
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
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
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
          reminder_sent?: string | null
          review_request_sent?: string | null
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
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
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
          reminder_sent?: string | null
          review_request_sent?: string | null
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
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
          {
            foreignKeyName: "provider_responses_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
      chatbot_conversations: {
        Row: {
          created_at: string
          escalated_at: string | null
          escalated_to_human: boolean | null
          id: string
          ip_address: unknown | null
          resolved_at: string | null
          status: string
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_phone: string | null
          user_type: string
        }
        Insert: {
          created_at?: string
          escalated_at?: string | null
          escalated_to_human?: boolean | null
          id?: string
          ip_address?: unknown | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_phone?: string | null
          user_type?: string
        }
        Update: {
          created_at?: string
          escalated_at?: string | null
          escalated_to_human?: boolean | null
          id?: string
          ip_address?: unknown | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_phone?: string | null
          user_type?: string
        }
        Relationships: []
      }
      chatbot_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message_text: string
          message_type: string | null
          metadata: Json | null
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message_text: string
          message_type?: string | null
          metadata?: Json | null
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message_text?: string
          message_type?: string | null
          metadata?: Json | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chatbot_conversations"
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
        Relationships: [
          {
            foreignKeyName: "client_requests_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_requests_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
        ]
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
      complaints: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          booking_id: string | null
          client_id: string
          complaint_type: string
          created_at: string
          description: string
          id: string
          priority: string
          provider_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          response_time_hours: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          booking_id?: string | null
          client_id: string
          complaint_type: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          provider_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          response_time_hours?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          booking_id?: string | null
          client_id?: string
          complaint_type?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          provider_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          response_time_hours?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          additional_details: string | null
          created_at: string
          id: string
          report_category: string
          report_reason: string
          reported_by: string
          reported_content_id: string
          reported_content_type: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          additional_details?: string | null
          created_at?: string
          id?: string
          report_category?: string
          report_reason: string
          reported_by: string
          reported_content_id: string
          reported_content_type: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          additional_details?: string | null
          created_at?: string
          id?: string
          report_category?: string
          report_reason?: string
          reported_by?: string
          reported_content_id?: string
          reported_content_type?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      counter_proposals: {
        Row: {
          client_response: string | null
          created_at: string
          expires_at: string | null
          id: string
          original_booking_id: string
          proposed_date: string
          proposed_price: number | null
          proposed_time: string
          provider_id: string
          reason: string | null
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_response?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          original_booking_id: string
          proposed_date: string
          proposed_price?: number | null
          proposed_time: string
          provider_id: string
          reason?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_response?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          original_booking_id?: string
          proposed_date?: string
          proposed_price?: number | null
          proposed_time?: string
          provider_id?: string
          reason?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_proposals_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_proposals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counter_proposals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
        ]
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
      emergency_assignments: {
        Row: {
          accepted_at: string | null
          auto_assigned: boolean | null
          created_at: string
          id: string
          original_booking_id: string
          reason: string
          replacement_provider_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          auto_assigned?: boolean | null
          created_at?: string
          id?: string
          original_booking_id: string
          reason: string
          replacement_provider_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          auto_assigned?: boolean | null
          created_at?: string
          id?: string
          original_booking_id?: string
          reason?: string
          replacement_provider_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_assignments_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_assignments_replacement_provider_id_fkey"
            columns: ["replacement_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_assignments_replacement_provider_id_fkey"
            columns: ["replacement_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_knowledge_base: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          keywords: string[] | null
          priority: number | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          provider_payment: number
          service_category: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          provider_payment: number
          service_category: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          provider_payment?: number
          service_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          booking_id: string
          client_id: string
          client_paid_at: string | null
          client_price: number
          company_commission: number
          created_at: string
          id: string
          payment_status: string
          provider_id: string
          provider_paid_at: string | null
          provider_payment: number
          service_category: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          client_id: string
          client_paid_at?: string | null
          client_price: number
          company_commission: number
          created_at?: string
          id?: string
          payment_status?: string
          provider_id: string
          provider_paid_at?: string | null
          provider_payment: number
          service_category: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          client_paid_at?: string | null
          client_price?: number
          company_commission?: number
          created_at?: string
          id?: string
          payment_status?: string
          provider_id?: string
          provider_paid_at?: string | null
          provider_payment?: number
          service_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
          type: string | null
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
          type?: string | null
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
          type?: string | null
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
      mediations: {
        Row: {
          assigned_to: string | null
          binome_id: string
          created_at: string
          id: string
          priority: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          binome_id: string
          created_at?: string
          id?: string
          priority?: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          binome_id?: string
          created_at?: string
          id?: string
          priority?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mediations_binome_id_fkey"
            columns: ["binome_id"]
            isOneToOne: false
            referencedRelation: "binomes"
            referencedColumns: ["id"]
          },
        ]
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
          expires_at: string | null
          id: string
          match_score: number | null
          priority: number
          responded_at: string | null
          response_deadline: string | null
          response_notes: string | null
          responses_received: number | null
          sent_notifications: number | null
          status: string
          updated_at: string
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
          expires_at?: string | null
          id?: string
          match_score?: number | null
          priority?: number
          responded_at?: string | null
          response_deadline?: string | null
          response_notes?: string | null
          responses_received?: number | null
          sent_notifications?: number | null
          status?: string
          updated_at?: string
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
          expires_at?: string | null
          id?: string
          match_score?: number | null
          priority?: number
          responded_at?: string | null
          response_deadline?: string | null
          response_notes?: string | null
          responses_received?: number | null
          sent_notifications?: number | null
          status?: string
          updated_at?: string
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
            foreignKeyName: "mission_assignments_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
      moderation_stats: {
        Row: {
          created_at: string
          id: string
          open_reports: number | null
          pending_reviews: number | null
          stat_date: string
          suspended_users: number | null
          updated_at: string
          weekly_actions: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          open_reports?: number | null
          pending_reviews?: number | null
          stat_date?: string
          suspended_users?: number | null
          updated_at?: string
          weekly_actions?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          open_reports?: number | null
          pending_reviews?: number | null
          stat_date?: string
          suspended_users?: number | null
          updated_at?: string
          weekly_actions?: number | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          clicked_at: string | null
          content: string
          created_at: string
          delivered_at: string | null
          email_id: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          notification_type: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          content: string
          created_at?: string
          delivered_at?: string | null
          email_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          notification_type: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          content?: string
          created_at?: string
          delivered_at?: string | null
          email_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          user_email?: string | null
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
      nps_surveys: {
        Row: {
          booking_id: string | null
          category: string
          client_id: string
          created_at: string
          feedback: string | null
          follow_up_sent: boolean | null
          id: string
          score: number
          survey_date: string
        }
        Insert: {
          booking_id?: string | null
          category: string
          client_id: string
          created_at?: string
          feedback?: string | null
          follow_up_sent?: boolean | null
          id?: string
          score: number
          survey_date?: string
        }
        Update: {
          booking_id?: string | null
          category?: string
          client_id?: string
          created_at?: string
          feedback?: string | null
          follow_up_sent?: boolean | null
          id?: string
          score?: number
          survey_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "nps_surveys_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
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
      platform_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      platform_stats_access: {
        Row: {
          access_time: string | null
          access_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          access_time?: string | null
          access_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          access_time?: string | null
          access_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
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
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_access_audit: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_request_id: string
          id: string
          ip_address: unknown | null
          provider_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_request_id: string
          id?: string
          ip_address?: unknown | null
          provider_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_request_id?: string
          id?: string
          ip_address?: unknown | null
          provider_id?: string
          user_agent?: string | null
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
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_compensations: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          provider_id: string
          reason: string
          status: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          provider_id: string
          reason: string
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          provider_id?: string
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_compensations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_compensations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_compensations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
          {
            foreignKeyName: "provider_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_identity_verifications: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          notes: string | null
          provider_id: string
          verification_date: string
          verification_method: string
          verified: boolean
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          notes?: string | null
          provider_id: string
          verification_date?: string
          verification_method: string
          verified?: boolean
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          provider_id?: string
          verification_date?: string
          verification_method?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "provider_identity_verifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_identity_verifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
          {
            foreignKeyName: "provider_invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
          {
            foreignKeyName: "provider_locations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers_public_view"
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
          {
            foreignKeyName: "provider_notifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_penalties: {
        Row: {
          amount: number
          applied_at: string | null
          booking_id: string | null
          created_at: string
          id: string
          penalty_type: string
          provider_id: string
          reason: string | null
          status: string
        }
        Insert: {
          amount?: number
          applied_at?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          penalty_type: string
          provider_id: string
          reason?: string | null
          status?: string
        }
        Update: {
          amount?: number
          applied_at?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          penalty_type?: string
          provider_id?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_penalties_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_penalties_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_penalties_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
          {
            foreignKeyName: "provider_status_history_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public_view"
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
          formation_completed: boolean | null
          formation_completed_at: string | null
          formation_date: string | null
          formation_score: number | null
          hourly_rate: number | null
          hourly_rate_override: number | null
          id: string
          identity_document_url: string | null
          identity_verified: boolean | null
          identity_verified_at: string | null
          identity_verified_by: string | null
          insurance_document_url: string | null
          is_verified: boolean
          last_activity_at: string | null
          last_mission_date: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          mandat_facturation_accepte: boolean | null
          mandat_facturation_date: string | null
          mandat_signature_data: string | null
          mandat_signature_date: string | null
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
          formation_completed?: boolean | null
          formation_completed_at?: string | null
          formation_date?: string | null
          formation_score?: number | null
          hourly_rate?: number | null
          hourly_rate_override?: number | null
          id?: string
          identity_document_url?: string | null
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          insurance_document_url?: string | null
          is_verified?: boolean
          last_activity_at?: string | null
          last_mission_date?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          mandat_facturation_accepte?: boolean | null
          mandat_facturation_date?: string | null
          mandat_signature_data?: string | null
          mandat_signature_date?: string | null
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
          formation_completed?: boolean | null
          formation_completed_at?: string | null
          formation_date?: string | null
          formation_score?: number | null
          hourly_rate?: number | null
          hourly_rate_override?: number | null
          id?: string
          identity_document_url?: string | null
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          insurance_document_url?: string | null
          is_verified?: boolean
          last_activity_at?: string | null
          last_mission_date?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          mandat_facturation_accepte?: boolean | null
          mandat_facturation_date?: string | null
          mandat_signature_data?: string | null
          mandat_signature_date?: string | null
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
      rate_limit_tracking: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          last_attempt_at: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          last_attempt_at?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          last_attempt_at?: string | null
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
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          record_id: string | null
          session_info: Json | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          session_info?: Json | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          session_info?: Json | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_function_audit: {
        Row: {
          called_at: string | null
          called_by: string | null
          error_message: string | null
          function_name: string
          id: string
          parameters: Json | null
          success: boolean | null
        }
        Insert: {
          called_at?: string | null
          called_by?: string | null
          error_message?: string | null
          function_name: string
          id?: string
          parameters?: Json | null
          success?: boolean | null
        }
        Update: {
          called_at?: string | null
          called_by?: string | null
          error_message?: string | null
          function_name?: string
          id?: string
          parameters?: Json | null
          success?: boolean | null
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
      support_tickets: {
        Row: {
          assigned_to: string | null
          conversation_id: string | null
          created_at: string
          description: string
          id: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string
          user_email: string
          user_phone: string | null
        }
        Insert: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_email: string
          user_phone?: string | null
        }
        Update: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_email?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chatbot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          updated_at?: string | null
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
          active: boolean
          codes_postaux: string[]
          created_at: string
          id: string
          nom_zone: string
          rayon_km: number | null
          type_zone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          codes_postaux?: string[]
          created_at?: string
          id?: string
          nom_zone: string
          rayon_km?: number | null
          type_zone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
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
      admin_dashboard_stats: {
        Row: {
          active_carts_7d: number | null
          active_providers: number | null
          avg_rating_30d: number | null
          bookings_last_30d: number | null
          completed_bookings_30d: number | null
          open_complaints: number | null
          revenue_30d: number | null
        }
        Relationships: []
      }
      complaint_statistics: {
        Row: {
          avg_response_time_hours: number | null
          complaints_last_30_days: number | null
          complaints_last_7_days: number | null
          in_progress_complaints: number | null
          new_complaints: number | null
          rejected_complaints: number | null
          resolved_complaints: number | null
          total_complaints: number | null
          urgent_complaints: number | null
        }
        Relationships: []
      }
      conversations_with_details: {
        Row: {
          admin_id: string | null
          admin_name: string | null
          booking_id: string | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_request_id: string | null
          created_at: string | null
          id: string | null
          job_application_id: string | null
          last_message_at: string | null
          provider_id: string | null
          provider_name: string | null
          status: string | null
          subject: string | null
          type: string | null
          updated_at: string | null
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
      providers_public_view: {
        Row: {
          business_name: string | null
          description: string | null
          id: string | null
          is_verified: boolean | null
          location: string | null
          profile_photo_url: string | null
          rating: number | null
          status: string | null
        }
        Insert: {
          business_name?: string | null
          description?: never
          id?: string | null
          is_verified?: boolean | null
          location?: never
          profile_photo_url?: never
          rating?: number | null
          status?: string | null
        }
        Update: {
          business_name?: string | null
          description?: never
          id?: string | null
          is_verified?: boolean | null
          location?: never
          profile_photo_url?: never
          rating?: number | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_binome_performance: {
        Args: { p_binome_id: string }
        Returns: Json
      }
      assign_mission_manually: {
        Args: {
          p_admin_user_id?: string
          p_mission_id: string
          p_provider_id: string
        }
        Returns: boolean
      }
      bulk_assign_missions: {
        Args: { p_mission_ids: string[] }
        Returns: {
          error_message: string
          mission_id: string
          success: boolean
        }[]
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
      calculate_financial_breakdown: {
        Args: { p_client_price: number; p_service_category: string }
        Returns: {
          company_commission: number
          provider_payment: number
        }[]
      }
      calculate_moderation_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      change_backup_provider: {
        Args: { p_binome_id: string; p_new_backup_provider_id: string }
        Returns: boolean
      }
      check_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_client_reward_eligibility: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      check_mission_timeouts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      cleanup_abandoned_conversations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_data: {
        Args: { cleanup_type: string }
        Returns: number
      }
      cleanup_old_security_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      confirm_booking: {
        Args: { booking_id: string; provider_confirms: boolean }
        Returns: boolean
      }
      confirm_payment_manually: {
        Args: { p_notes?: string; p_payment_id: string }
        Returns: Json
      }
      create_binome: {
        Args: {
          p_backup_provider_id: string
          p_client_id: string
          p_notes?: string
          p_primary_provider_id: string
        }
        Returns: string
      }
      create_booking_from_request: {
        Args: { provider_id: string; request_id: string; service_id: string }
        Returns: string
      }
      create_internal_conversation: {
        Args: {
          p_admin_id?: string
          p_client_id: string
          p_initial_message?: string
          p_provider_id?: string
          p_subject?: string
        }
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
      current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      detect_abandoned_carts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      detect_inactive_providers: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      detect_payment_failures: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      dissolve_binome: {
        Args: { p_binome_id: string; p_reason: string }
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
      get_binome_history: {
        Args: { p_binome_id: string }
        Returns: {
          action_type: string
          created_at: string
          id: string
          new_data: Json
          notes: string
          old_data: Json
          performed_by: string
        }[]
      }
      get_current_user_role: {
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
      get_platform_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_profile_display_info: {
        Args: { p_user_id: string }
        Returns: {
          display_avatar_url: string
          display_first_name: string
          display_last_name: string
          id: string
          user_id: string
        }[]
      }
      get_provider_display_info: {
        Args: { p_provider_id: string }
        Returns: {
          business_name: string
          description: string
          id: string
          location: string
          price_range: string
          rating: number
        }[]
      }
      get_public_provider_info: {
        Args: { p_provider_id: string }
        Returns: {
          business_name: string
          description: string
          id: string
          is_verified: boolean
          location: string
          missions_completed: number
          profile_photo_url: string
          rating: number
        }[]
      }
      get_reward_amount: {
        Args: { p_tier: string }
        Returns: number
      }
      get_safe_platform_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_service_categories: number
          monthly_completed_bookings: number
          platform_average_rating: number
          verified_providers: number
        }[]
      }
      get_unread_messages_count: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initiate_mediation: {
        Args: { p_binome_id: string; p_priority?: string; p_reason: string }
        Returns: string
      }
      is_platform_admin: {
        Args: Record<PropertyKey, never>
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
      log_bulk_deletion: {
        Args: {
          p_entity_ids: string[]
          p_entity_type: string
          p_is_soft_delete?: boolean
          p_reason: string
        }
        Returns: string
      }
      log_gdpr_export: {
        Args: {
          p_entity_ids: string[]
          p_entity_type: string
          p_export_format?: string
          p_reason?: string
        }
        Returns: string
      }
      log_provider_view_access: {
        Args: {
          p_ip_address?: unknown
          p_query_type?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: {
          action_name: string
          additional_data?: Json
          resource_id?: string
          resource_type: string
        }
        Returns: undefined
      }
      mark_binome_resolved: {
        Args: { p_binome_id: string; p_resolution_notes?: string }
        Returns: boolean
      }
      match_providers_for_client: {
        Args: {
          p_client_id: string
          p_location?: string
          p_service_type?: string
        }
        Returns: {
          backup_provider_id: string
          compatibility_score: number
          primary_provider_id: string
          reasoning: string
        }[]
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
      recruit_backup_provider: {
        Args: { p_binome_id: string }
        Returns: boolean
      }
      redistribute_binome_missions: {
        Args: { p_binome_id: string }
        Returns: number
      }
      reset_mission_queue: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      retry_failed_payment: {
        Args: { p_payment_id: string }
        Returns: Json
      }
      run_system_diagnostics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      user_has_permission: {
        Args: { permission_type: string }
        Returns: boolean
      }
      validate_cart_manually: {
        Args: { p_admin_notes?: string; p_cart_id: string }
        Returns: Json
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
