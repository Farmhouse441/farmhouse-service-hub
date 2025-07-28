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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      line_items: {
        Row: {
          created_at: string
          description: string
          hourly_rate: number
          hours: number
          id: string
          ticket_id: string
          total_amount: number | null
        }
        Insert: {
          created_at?: string
          description: string
          hourly_rate: number
          hours: number
          id?: string
          ticket_id: string
          total_amount?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          hourly_rate?: number
          hours?: number
          id?: string
          ticket_id?: string
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_change_from_additional_info_requested: boolean
          can_change_from_approved_not_paid: boolean
          can_change_from_approved_paid: boolean
          can_change_from_declined: boolean
          can_change_from_draft: boolean
          can_change_from_submitted: boolean
          can_change_to_additional_info_requested: boolean
          can_change_to_approved_not_paid: boolean
          can_change_to_approved_paid: boolean
          can_change_to_declined: boolean
          can_change_to_draft: boolean
          can_change_to_submitted: boolean
          can_create_service_ticket: boolean
          can_delete_additional_info_requested: boolean
          can_delete_approved_not_paid: boolean
          can_delete_approved_paid: boolean
          can_delete_declined: boolean
          can_delete_draft: boolean
          can_delete_submitted: boolean
          can_edit_all_tickets: boolean
          can_edit_own_tickets: boolean
          can_view_all_tickets: boolean
          can_view_own_tickets: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_change_from_additional_info_requested?: boolean
          can_change_from_approved_not_paid?: boolean
          can_change_from_approved_paid?: boolean
          can_change_from_declined?: boolean
          can_change_from_draft?: boolean
          can_change_from_submitted?: boolean
          can_change_to_additional_info_requested?: boolean
          can_change_to_approved_not_paid?: boolean
          can_change_to_approved_paid?: boolean
          can_change_to_declined?: boolean
          can_change_to_draft?: boolean
          can_change_to_submitted?: boolean
          can_create_service_ticket?: boolean
          can_delete_additional_info_requested?: boolean
          can_delete_approved_not_paid?: boolean
          can_delete_approved_paid?: boolean
          can_delete_declined?: boolean
          can_delete_draft?: boolean
          can_delete_submitted?: boolean
          can_edit_all_tickets?: boolean
          can_edit_own_tickets?: boolean
          can_view_all_tickets?: boolean
          can_view_own_tickets?: boolean
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_change_from_additional_info_requested?: boolean
          can_change_from_approved_not_paid?: boolean
          can_change_from_approved_paid?: boolean
          can_change_from_declined?: boolean
          can_change_from_draft?: boolean
          can_change_from_submitted?: boolean
          can_change_to_additional_info_requested?: boolean
          can_change_to_approved_not_paid?: boolean
          can_change_to_approved_paid?: boolean
          can_change_to_declined?: boolean
          can_change_to_draft?: boolean
          can_change_to_submitted?: boolean
          can_create_service_ticket?: boolean
          can_delete_additional_info_requested?: boolean
          can_delete_approved_not_paid?: boolean
          can_delete_approved_paid?: boolean
          can_delete_declined?: boolean
          can_delete_draft?: boolean
          can_delete_submitted?: boolean
          can_edit_all_tickets?: boolean
          can_edit_own_tickets?: boolean
          can_view_all_tickets?: boolean
          can_view_own_tickets?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      service_tickets: {
        Row: {
          admin_notes: string | null
          after_photos: string[] | null
          before_photos: string[] | null
          created_at: string
          description: string | null
          id: string
          invoice_file: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          total_amount: number | null
          updated_at: string
          user_id: string
          work_end_date: string
          work_start_date: string
        }
        Insert: {
          admin_notes?: string | null
          after_photos?: string[] | null
          before_photos?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_file?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
          work_end_date: string
          work_start_date: string
        }
        Update: {
          admin_notes?: string | null
          after_photos?: string[] | null
          before_photos?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_file?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          work_end_date?: string
          work_start_date?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      user_can_change_ticket_status: {
        Args: {
          _user_id: string
          _from_status: Database["public"]["Enums"]["ticket_status"]
          _to_status: Database["public"]["Enums"]["ticket_status"]
        }
        Returns: boolean
      }
      user_can_delete_ticket_by_status: {
        Args: {
          _user_id: string
          _status: Database["public"]["Enums"]["ticket_status"]
        }
        Returns: boolean
      }
      user_has_permission: {
        Args: { _user_id: string; _permission: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      ticket_status:
        | "draft"
        | "submitted"
        | "additional_info_requested"
        | "approved_not_paid"
        | "approved_paid"
        | "declined"
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
      app_role: ["admin", "user"],
      ticket_status: [
        "draft",
        "submitted",
        "additional_info_requested",
        "approved_not_paid",
        "approved_paid",
        "declined",
      ],
    },
  },
} as const
