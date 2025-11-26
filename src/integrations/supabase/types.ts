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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address_line1: string
          address_line2: string | null
          billing_cycle: string
          billing_email: string
          city: string
          connectivity_type: Database["public"]["Enums"]["connectivity_type"]
          country: string
          created_at: string
          created_by_user_id: string
          device_limit: number | null
          end_date: string
          id: string
          name: string
          notes: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          postcode: string
          price_per_device: number
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string | null
          slug: string
          start_date: string
          status: Database["public"]["Enums"]["company_status"]
          term_months: number
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          billing_cycle?: string
          billing_email: string
          city: string
          connectivity_type: Database["public"]["Enums"]["connectivity_type"]
          country: string
          created_at?: string
          created_by_user_id: string
          device_limit?: number | null
          end_date: string
          id?: string
          name: string
          notes?: string | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          postcode: string
          price_per_device: number
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone?: string | null
          slug: string
          start_date: string
          status?: Database["public"]["Enums"]["company_status"]
          term_months: number
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          billing_cycle?: string
          billing_email?: string
          city?: string
          connectivity_type?: Database["public"]["Enums"]["connectivity_type"]
          country?: string
          created_at?: string
          created_by_user_id?: string
          device_limit?: number | null
          end_date?: string
          id?: string
          name?: string
          notes?: string | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          postcode?: string
          price_per_device?: number
          primary_contact_email?: string
          primary_contact_name?: string
          primary_contact_phone?: string | null
          slug?: string
          start_date?: string
          status?: Database["public"]["Enums"]["company_status"]
          term_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          admin_pin: string | null
          auth_token: string | null
          company_id: string | null
          created_at: string
          device_code: string | null
          id: string
          last_seen_at: string | null
          name: string
          pairing_qr_token: string | null
          playlist_id: string | null
          status: string | null
          user_id: string
          venue_id: string | null
        }
        Insert: {
          admin_pin?: string | null
          auth_token?: string | null
          company_id?: string | null
          created_at?: string
          device_code?: string | null
          id?: string
          last_seen_at?: string | null
          name: string
          pairing_qr_token?: string | null
          playlist_id?: string | null
          status?: string | null
          user_id: string
          venue_id?: string | null
        }
        Update: {
          admin_pin?: string | null
          auth_token?: string | null
          company_id?: string | null
          created_at?: string
          device_code?: string | null
          id?: string
          last_seen_at?: string | null
          name?: string
          pairing_qr_token?: string | null
          playlist_id?: string | null
          status?: string | null
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_videos: {
        Row: {
          created_at: string
          id: string
          order_index: number
          playlist_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          playlist_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          playlist_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          source: string | null
          title: string
          user_id: string
          video_url: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          source?: string | null
          title: string
          user_id: string
          video_url: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          source?: string | null
          title?: string
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_device_code: { Args: never; Returns: string }
      generate_secure_token: { Args: never; Returns: string }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      company_status: "pending" | "active" | "expired" | "suspended"
      connectivity_type: "wifi" | "cyberyard_anywhere"
      plan_type: "wifi" | "anywhere"
      user_role: "super_admin" | "company_admin" | "company_user"
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
      company_status: ["pending", "active", "expired", "suspended"],
      connectivity_type: ["wifi", "cyberyard_anywhere"],
      plan_type: ["wifi", "anywhere"],
      user_role: ["super_admin", "company_admin", "company_user"],
    },
  },
} as const
