export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1";
    };
    public: {
        Tables: {
            admin_users: {
                Row: {
                    created_at: string | null;
                    email: string;
                    id: string;
                    password_hash: string;
                };
                Insert: {
                    created_at?: string | null;
                    email: string;
                    id?: string;
                    password_hash: string;
                };
                Update: {
                    created_at?: string | null;
                    email?: string;
                    id?: string;
                    password_hash?: string;
                };
                Relationships: [];
            };
            incident_updates: {
                Row: {
                    created_at: string | null;
                    id: string;
                    incident_id: string;
                    message: string;
                    status: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    incident_id: string;
                    message: string;
                    status?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    incident_id?: string;
                    message?: string;
                    status?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "incident_updates_incident_id_fkey";
                        columns: ["incident_id"];
                        isOneToOne: false;
                        referencedRelation: "incidents";
                        referencedColumns: ["id"];
                    }
                ];
            };
            incidents: {
                Row: {
                    created_at: string | null;
                    description: string | null;
                    id: string;
                    impact: string | null;
                    resolved_at: string | null;
                    service_id: string;
                    started_at: string | null;
                    status: string | null;
                    title: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description?: string | null;
                    id?: string;
                    impact?: string | null;
                    resolved_at?: string | null;
                    service_id: string;
                    started_at?: string | null;
                    status?: string | null;
                    title: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string | null;
                    id?: string;
                    impact?: string | null;
                    resolved_at?: string | null;
                    service_id?: string;
                    started_at?: string | null;
                    status?: string | null;
                    title?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "incidents_service_id_fkey";
                        columns: ["service_id"];
                        isOneToOne: false;
                        referencedRelation: "services";
                        referencedColumns: ["id"];
                    }
                ];
            };
            service_stats: {
                Row: {
                    created_at: string | null;
                    id: string;
                    newest_timestamp: string | null;
                    oldest_timestamp: string | null;
                    service_id: string;
                    stats: Json | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    newest_timestamp?: string | null;
                    oldest_timestamp?: string | null;
                    service_id: string;
                    stats?: Json | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    newest_timestamp?: string | null;
                    oldest_timestamp?: string | null;
                    service_id?: string;
                    stats?: Json | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "service_stats_service_id_fkey";
                        columns: ["service_id"];
                        isOneToOne: true;
                        referencedRelation: "services";
                        referencedColumns: ["id"];
                    }
                ];
            };
            services: {
                Row: {
                    created_at: string | null;
                    description: string | null;
                    domain: string;
                    id: string;
                    is_pinned: boolean | null;
                    name: string;
                    ping_ms: number | null;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description?: string | null;
                    domain: string;
                    id?: string;
                    is_pinned?: boolean | null;
                    name: string;
                    ping_ms?: number | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string | null;
                    domain?: string;
                    id?: string;
                    is_pinned?: boolean | null;
                    name?: string;
                    ping_ms?: number | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
    DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
        : never = never
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
          Row: infer R;
      }
        ? R
        : never
    : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
          Insert: infer I;
      }
        ? I
        : never
    : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
          Update: infer U;
      }
        ? U
        : never
    : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never = never
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
    public: {
        Enums: {},
    },
} as const;
