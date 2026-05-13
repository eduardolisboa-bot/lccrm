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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          client_id: string | null
          created_at: string
          data_atividade: string
          descricao: string | null
          id: string
          opportunity_id: string | null
          tipo_atividade: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data_atividade?: string
          descricao?: string | null
          id?: string
          opportunity_id?: string | null
          tipo_atividade?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data_atividade?: string
          descricao?: string | null
          id?: string
          opportunity_id?: string | null
          tipo_atividade?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          parceiro_id: string | null
          patrimonio_estimado: number | null
          responsavel_id: string | null
          telefone: string | null
          tipo_cliente: Database["public"]["Enums"]["client_tipo"]
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          parceiro_id?: string | null
          patrimonio_estimado?: number | null
          responsavel_id?: string | null
          telefone?: string | null
          tipo_cliente?: Database["public"]["Enums"]["client_tipo"]
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          parceiro_id?: string | null
          patrimonio_estimado?: number | null
          responsavel_id?: string | null
          telefone?: string | null
          tipo_cliente?: Database["public"]["Enums"]["client_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "clients_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_proxima_acao: string | null
          etapa_id: string | null
          id: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["opp_origem"]
          parceiro_id: string | null
          produto_interesse: string | null
          proxima_acao: string | null
          responsavel_id: string | null
          status_documentacao: string
          temperatura: Database["public"]["Enums"]["temperatura"]
          titulo: string
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_proxima_acao?: string | null
          etapa_id?: string | null
          id?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["opp_origem"]
          parceiro_id?: string | null
          produto_interesse?: string | null
          proxima_acao?: string | null
          responsavel_id?: string | null
          status_documentacao?: string
          temperatura?: Database["public"]["Enums"]["temperatura"]
          titulo: string
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_proxima_acao?: string | null
          etapa_id?: string | null
          id?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["opp_origem"]
          parceiro_id?: string | null
          produto_interesse?: string | null
          proxima_acao?: string | null
          responsavel_id?: string | null
          status_documentacao?: string
          temperatura?: Database["public"]["Enums"]["temperatura"]
          titulo?: string
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          comissao: number | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          responsavel_id: string | null
          status: Database["public"]["Enums"]["entity_status"]
          telefone: string | null
          tipo: Database["public"]["Enums"]["partner_tipo"]
        }
        Insert: {
          comissao?: number | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["partner_tipo"]
        }
        Update: {
          comissao?: number | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["partner_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "partners_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          ativa: boolean
          cor: string
          created_at: string
          id: string
          nome: string
          ordem: number
          tipo: Database["public"]["Enums"]["stage_tipo"]
        }
        Insert: {
          ativa?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome: string
          ordem: number
          tipo?: Database["public"]["Enums"]["stage_tipo"]
        }
        Update: {
          ativa?: boolean
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["stage_tipo"]
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          parceiro_id: string | null
          status: string
          tipo_usuario: Database["public"]["Enums"]["user_tipo"]
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          parceiro_id?: string | null
          status?: string
          tipo_usuario?: Database["public"]["Enums"]["user_tipo"]
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          parceiro_id?: string | null
          status?: string
          tipo_usuario?: Database["public"]["Enums"]["user_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_parceiro_fk"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_parceiro: { Args: { _auth_user: string }; Returns: string }
      get_user_profile_id: { Args: { _auth_user: string }; Returns: string }
      get_user_tipo: {
        Args: { _auth_user: string }
        Returns: Database["public"]["Enums"]["user_tipo"]
      }
    }
    Enums: {
      client_tipo: "direto" | "parceiro"
      entity_status: "ativo" | "inativo" | "em_negociacao"
      opp_origem: "direto" | "parceiro"
      partner_tipo:
        | "assessor"
        | "advogado"
        | "contador"
        | "empresario"
        | "influenciador"
        | "family_office"
        | "outro"
      stage_tipo: "aberta" | "ganha" | "perdida" | "pausada"
      temperatura: "frio" | "morno" | "quente"
      user_tipo: "master" | "interno" | "parceiro"
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
      client_tipo: ["direto", "parceiro"],
      entity_status: ["ativo", "inativo", "em_negociacao"],
      opp_origem: ["direto", "parceiro"],
      partner_tipo: [
        "assessor",
        "advogado",
        "contador",
        "empresario",
        "influenciador",
        "family_office",
        "outro",
      ],
      stage_tipo: ["aberta", "ganha", "perdida", "pausada"],
      temperatura: ["frio", "morno", "quente"],
      user_tipo: ["master", "interno", "parceiro"],
    },
  },
} as const
