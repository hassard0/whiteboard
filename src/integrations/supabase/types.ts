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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_memory: {
        Row: {
          content: string
          created_at: string
          env_id: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          created_at?: string
          env_id: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          env_id?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: []
      }
      approval_requests: {
        Row: {
          action_summary: string
          auth0_feature: string | null
          created_at: string
          data_summary: Json | null
          decided_at: string | null
          decision: string | null
          env_id: string
          id: string
          tool_id: string
        }
        Insert: {
          action_summary: string
          auth0_feature?: string | null
          created_at?: string
          data_summary?: Json | null
          decided_at?: string | null
          decision?: string | null
          env_id: string
          id?: string
          tool_id: string
        }
        Update: {
          action_summary?: string
          auth0_feature?: string | null
          created_at?: string
          data_summary?: Json | null
          decided_at?: string | null
          decision?: string | null
          env_id?: string
          id?: string
          tool_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          auth0_sub: string | null
          created_at: string
          env_id: string
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          auth0_sub?: string | null
          created_at?: string
          env_id: string
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          auth0_sub?: string | null
          created_at?: string
          env_id?: string
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      demo_environments: {
        Row: {
          auth0_sub: string
          config_overrides: Json | null
          created_at: string
          env_id: string
          env_type: string
          id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          auth0_sub: string
          config_overrides?: Json | null
          created_at?: string
          env_id: string
          env_type?: string
          id?: string
          template_id: string
          updated_at?: string
        }
        Update: {
          auth0_sub?: string
          config_overrides?: Json | null
          created_at?: string
          env_id?: string
          env_type?: string
          id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_environments_auth0_sub_fkey"
            columns: ["auth0_sub"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["auth0_sub"]
          },
          {
            foreignKeyName: "demo_environments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "demo_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_templates: {
        Row: {
          color: string | null
          config: Json
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          color?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth0_sub: string
          created_at: string
          demo_mode: string | null
          email: string | null
          id: string
          name: string | null
          picture: string | null
          updated_at: string
        }
        Insert: {
          auth0_sub: string
          created_at?: string
          demo_mode?: string | null
          email?: string | null
          id?: string
          name?: string | null
          picture?: string | null
          updated_at?: string
        }
        Update: {
          auth0_sub?: string
          created_at?: string
          demo_mode?: string | null
          email?: string | null
          id?: string
          name?: string | null
          picture?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tool_state: {
        Row: {
          created_at: string
          env_id: string
          id: string
          input: Json | null
          output: Json | null
          status: string
          tool_id: string
        }
        Insert: {
          created_at?: string
          env_id: string
          id?: string
          input?: Json | null
          output?: Json | null
          status?: string
          tool_id: string
        }
        Update: {
          created_at?: string
          env_id?: string
          id?: string
          input?: Json | null
          output?: Json | null
          status?: string
          tool_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          auth0_sub: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          auth0_sub: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          auth0_sub?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _auth0_sub: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
