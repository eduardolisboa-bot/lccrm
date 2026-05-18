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
          data_agendada: string | null
          data_atividade: string
          descricao: string | null
          duracao_minutos: number | null
          google_event_id: string | null
          horario_agendado: string | null
          id: string
          lembrete_minutos: number | null
          opportunity_id: string | null
          parceiro_id: string | null
          prioridade: string | null
          recorrencia: string | null
          responsavel_id: string | null
          status_atividade: string | null
          tipo_atividade: string | null
          titulo: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data_agendada?: string | null
          data_atividade?: string
          descricao?: string | null
          duracao_minutos?: number | null
          google_event_id?: string | null
          horario_agendado?: string | null
          id?: string
          lembrete_minutos?: number | null
          opportunity_id?: string | null
          parceiro_id?: string | null
          prioridade?: string | null
          recorrencia?: string | null
          responsavel_id?: string | null
          status_atividade?: string | null
          tipo_atividade?: string | null
          titulo?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data_agendada?: string | null
          data_atividade?: string
          descricao?: string | null
          duracao_minutos?: number | null
          google_event_id?: string | null
          horario_agendado?: string | null
          id?: string
          lembrete_minutos?: number | null
          opportunity_id?: string | null
          parceiro_id?: string | null
          prioridade?: string | null
          recorrencia?: string | null
          responsavel_id?: string | null
          status_atividade?: string | null
          tipo_atividade?: string | null
          titulo?: string | null
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
            foreignKeyName: "activities_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          categoria: string | null
          client_id: string
          created_at: string
          id: string
          nome: string
          opportunity_id: string | null
          parceiro_id: string | null
          storage_path: string
          tamanho_bytes: number | null
          tipo_mime: string | null
          uploaded_by: string | null
        }
        Insert: {
          categoria?: string | null
          client_id: string
          created_at?: string
          id?: string
          nome: string
          opportunity_id?: string | null
          parceiro_id?: string | null
          storage_path: string
          tamanho_bytes?: number | null
          tipo_mime?: string | null
          uploaded_by?: string | null
        }
        Update: {
          categoria?: string | null
          client_id?: string
          created_at?: string
          id?: string
          nome?: string
          opportunity_id?: string | null
          parceiro_id?: string | null
          storage_path?: string
          tamanho_bytes?: number | null
          tipo_mime?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_duplicates: {
        Row: {
          campos_conflitantes: Json | null
          client_a_id: string
          client_b_id: string
          created_at: string
          fundido_por: string | null
          id: string
          ignorado_por: string | null
          log_fusao: Json | null
          motivo: string
          similaridade: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          campos_conflitantes?: Json | null
          client_a_id: string
          client_b_id: string
          created_at?: string
          fundido_por?: string | null
          id?: string
          ignorado_por?: string | null
          log_fusao?: Json | null
          motivo: string
          similaridade?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          campos_conflitantes?: Json | null
          client_a_id?: string
          client_b_id?: string
          created_at?: string
          fundido_por?: string | null
          id?: string
          ignorado_por?: string | null
          log_fusao?: Json | null
          motivo?: string
          similaridade?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_duplicates_client_a_id_fkey"
            columns: ["client_a_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_duplicates_client_b_id_fkey"
            columns: ["client_b_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_duplicates_fundido_por_fkey"
            columns: ["fundido_por"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_duplicates_ignorado_por_fkey"
            columns: ["ignorado_por"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_status_history: {
        Row: {
          alterado_por: string | null
          client_id: string
          created_at: string
          id: string
          observacao: string | null
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          alterado_por?: string | null
          client_id: string
          created_at?: string
          id?: string
          observacao?: string | null
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          alterado_por?: string | null
          client_id?: string
          created_at?: string
          id?: string
          observacao?: string | null
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_status_history_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_status_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tags: {
        Row: {
          aplicada_por: string | null
          client_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          aplicada_por?: string | null
          client_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          aplicada_por?: string | null
          client_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tags_aplicada_por_fkey"
            columns: ["aplicada_por"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cidade: string | null
          cnae: string | null
          cpf_cnpj: string | null
          created_at: string
          data_abertura: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          nome_fantasia: string | null
          parceiro_id: string | null
          patrimonio_estimado: number | null
          razao_social: string | null
          responsavel_id: string | null
          situacao_cadastral: string | null
          status: string | null
          telefone: string | null
          telefone_whatsapp: string | null
          tipo_cliente: Database["public"]["Enums"]["client_tipo"]
        }
        Insert: {
          cidade?: string | null
          cnae?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_abertura?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          nome_fantasia?: string | null
          parceiro_id?: string | null
          patrimonio_estimado?: number | null
          razao_social?: string | null
          responsavel_id?: string | null
          situacao_cadastral?: string | null
          status?: string | null
          telefone?: string | null
          telefone_whatsapp?: string | null
          tipo_cliente?: Database["public"]["Enums"]["client_tipo"]
        }
        Update: {
          cidade?: string | null
          cnae?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_abertura?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          nome_fantasia?: string | null
          parceiro_id?: string | null
          patrimonio_estimado?: number | null
          razao_social?: string | null
          responsavel_id?: string | null
          situacao_cadastral?: string | null
          status?: string | null
          telefone?: string | null
          telefone_whatsapp?: string | null
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
      funnel_goals: {
        Row: {
          created_at: string
          funnel_id: string
          id: string
          mes: string
          updated_at: string
          valor_meta: number
        }
        Insert: {
          created_at?: string
          funnel_id: string
          id?: string
          mes: string
          updated_at?: string
          valor_meta?: number
        }
        Update: {
          created_at?: string
          funnel_id?: string
          id?: string
          mes?: string
          updated_at?: string
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "funnel_goals_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_proxima_acao: string | null
          etapa_id: string | null
          funnel_id: string
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
          funnel_id: string
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
          funnel_id?: string
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
            foreignKeyName: "opportunities_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
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
      partner_tags: {
        Row: {
          aplicada_por: string | null
          created_at: string
          id: string
          partner_id: string
          tag_id: string
        }
        Insert: {
          aplicada_por?: string | null
          created_at?: string
          id?: string
          partner_id: string
          tag_id: string
        }
        Update: {
          aplicada_por?: string | null
          created_at?: string
          id?: string
          partner_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_tags_aplicada_por_fkey"
            columns: ["aplicada_por"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_tags_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
          funnel_id: string
          id: string
          nome: string
          ordem: number
          percentual_progresso: number | null
          probabilidade_fechamento: number | null
          sla_dias: number | null
          tipo: Database["public"]["Enums"]["stage_tipo"]
        }
        Insert: {
          ativa?: boolean
          cor?: string
          created_at?: string
          funnel_id: string
          id?: string
          nome: string
          ordem: number
          percentual_progresso?: number | null
          probabilidade_fechamento?: number | null
          sla_dias?: number | null
          tipo?: Database["public"]["Enums"]["stage_tipo"]
        }
        Update: {
          ativa?: boolean
          cor?: string
          created_at?: string
          funnel_id?: string
          id?: string
          nome?: string
          ordem?: number
          percentual_progresso?: number | null
          probabilidade_fechamento?: number | null
          sla_dias?: number | null
          tipo?: Database["public"]["Enums"]["stage_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_goals: {
        Row: {
          created_at: string
          id: string
          mes: string
          stage_id: string
          updated_at: string
          valor_meta: number
        }
        Insert: {
          created_at?: string
          id?: string
          mes: string
          stage_id: string
          updated_at?: string
          valor_meta?: number
        }
        Update: {
          created_at?: string
          id?: string
          mes?: string
          stage_id?: string
          updated_at?: string
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "stage_goals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          ativa: boolean | null
          categoria: string | null
          cor: string
          created_at: string
          id: string
          nome: string
          tipo: string | null
        }
        Insert: {
          ativa?: boolean | null
          categoria?: string | null
          cor?: string
          created_at?: string
          id?: string
          nome: string
          tipo?: string | null
        }
        Update: {
          ativa?: boolean | null
          categoria?: string | null
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          tipo?: string | null
        }
        Relationships: []
      }
      user_calendar_settings: {
        Row: {
          created_at: string
          google_calendar_id: string | null
          google_refresh_token: string | null
          id: string
          sync_mode: string | null
          ultima_sincronizacao: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          id?: string
          sync_mode?: string | null
          ultima_sincronizacao?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          id?: string
          sync_mode?: string | null
          ultima_sincronizacao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendar_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_funnel_access: {
        Row: {
          created_at: string
          funnel_id: string
          id: string
          user_profile_id: string
        }
        Insert: {
          created_at?: string
          funnel_id: string
          id?: string
          user_profile_id: string
        }
        Update: {
          created_at?: string
          funnel_id?: string
          id?: string
          user_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_funnel_access_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_funnel_access_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_can_access_funnel: {
        Args: { _auth_user: string; _funnel_id: string }
        Returns: boolean
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
