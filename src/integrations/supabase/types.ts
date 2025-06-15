export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_agent_configs: {
        Row: {
          auto_voting_enabled: boolean | null
          confidence_threshold: number | null
          created_at: string | null
          daisy_automation_level: string | null
          daisy_enabled: boolean | null
          ethra_verbosity: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_voting_enabled?: boolean | null
          confidence_threshold?: number | null
          created_at?: string | null
          daisy_automation_level?: string | null
          daisy_enabled?: boolean | null
          ethra_verbosity?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_voting_enabled?: boolean | null
          confidence_threshold?: number | null
          created_at?: string | null
          daisy_automation_level?: string | null
          daisy_enabled?: boolean | null
          ethra_verbosity?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dao_memberships: {
        Row: {
          dao_id: string | null
          id: string
          joined_at: string | null
          role: Database["public"]["Enums"]["dao_member_role"] | null
          user_id: string | null
        }
        Insert: {
          dao_id?: string | null
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["dao_member_role"] | null
          user_id?: string | null
        }
        Update: {
          dao_id?: string | null
          id?: string
          joined_at?: string | null
          role?: Database["public"]["Enums"]["dao_member_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      daos: {
        Row: {
          created_at: string | null
          creator_id: string | null
          description: string | null
          governor_address: string | null
          id: string
          is_active: boolean | null
          member_count: number | null
          name: string
          proposal_count: number | null
          timelock_address: string | null
          token_address: string | null
          treasury_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          governor_address?: string | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          name: string
          proposal_count?: number | null
          timelock_address?: string | null
          token_address?: string | null
          treasury_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          governor_address?: string | null
          id?: string
          is_active?: boolean | null
          member_count?: number | null
          name?: string
          proposal_count?: number | null
          timelock_address?: string | null
          token_address?: string | null
          treasury_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      identity_verifications: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          document_url: string | null
          email: string
          full_name: string
          id: string
          nft_token_id: number | null
          nft_transaction_hash: string | null
          rejection_reason: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
          verification_hash: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          document_url?: string | null
          email: string
          full_name: string
          id?: string
          nft_token_id?: number | null
          nft_transaction_hash?: string | null
          rejection_reason?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
          verification_hash?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          document_url?: string | null
          email?: string
          full_name?: string
          id?: string
          nft_token_id?: number | null
          nft_transaction_hash?: string | null
          rejection_reason?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
          verification_hash?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          ai_summaries: boolean | null
          created_at: string | null
          email: boolean | null
          id: string
          proposal_alerts: boolean | null
          updated_at: string | null
          user_id: string | null
          voting_reminders: boolean | null
        }
        Insert: {
          ai_summaries?: boolean | null
          created_at?: string | null
          email?: boolean | null
          id?: string
          proposal_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          voting_reminders?: boolean | null
        }
        Update: {
          ai_summaries?: boolean | null
          created_at?: string | null
          email?: boolean | null
          id?: string
          proposal_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          voting_reminders?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          identity_nft_id: number | null
          is_verified: boolean | null
          soulbound_nft_token_id: number | null
          updated_at: string | null
          verification_completed_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          wallet_address: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          identity_nft_id?: number | null
          is_verified?: boolean | null
          soulbound_nft_token_id?: number | null
          updated_at?: string | null
          verification_completed_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          wallet_address?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          identity_nft_id?: number | null
          is_verified?: boolean | null
          soulbound_nft_token_id?: number | null
          updated_at?: string | null
          verification_completed_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      proposal_ai_analysis: {
        Row: {
          complexity_score: number | null
          confidence_score: number | null
          created_at: string | null
          id: string
          predicted_outcome: string | null
          proposal_id: string | null
          reasoning: string | null
          risk_score: number | null
          summary: string | null
          tags: string[] | null
        }
        Insert: {
          complexity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          predicted_outcome?: string | null
          proposal_id?: string | null
          reasoning?: string | null
          risk_score?: number | null
          summary?: string | null
          tags?: string[] | null
        }
        Update: {
          complexity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          predicted_outcome?: string | null
          proposal_id?: string | null
          reasoning?: string | null
          risk_score?: number | null
          summary?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          blockchain_proposal_id: string | null
          category: string | null
          created_at: string | null
          creator_id: string | null
          dao_id: string | null
          deadline: string | null
          description: string | null
          id: string
          quorum: number | null
          status: Database["public"]["Enums"]["proposal_status"] | null
          title: string
          total_votes: number | null
          updated_at: string | null
          votes_against: number | null
          votes_for: number | null
        }
        Insert: {
          blockchain_proposal_id?: string | null
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          dao_id?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          quorum?: number | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          title: string
          total_votes?: number | null
          updated_at?: string | null
          votes_against?: number | null
          votes_for?: number | null
        }
        Update: {
          blockchain_proposal_id?: string | null
          category?: string | null
          created_at?: string | null
          creator_id?: string | null
          dao_id?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          quorum?: number | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          title?: string
          total_votes?: number | null
          updated_at?: string | null
          votes_against?: number | null
          votes_for?: number | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          automated: boolean | null
          dao_id: string | null
          id: string
          proposal_id: string | null
          timestamp: string | null
          user_id: string | null
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          automated?: boolean | null
          dao_id?: string | null
          id?: string
          proposal_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          vote: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          automated?: boolean | null
          dao_id?: string | null
          id?: string
          proposal_id?: string | null
          timestamp?: string | null
          user_id?: string | null
          vote?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_user_verified: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      dao_member_role: "admin" | "member" | "moderator"
      document_type: "passport" | "drivers_license" | "national_id"
      proposal_status: "active" | "passed" | "failed" | "pending"
      verification_status: "pending" | "in_progress" | "verified" | "rejected"
      vote_type: "for" | "against" | "abstain"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dao_member_role: ["admin", "member", "moderator"],
      document_type: ["passport", "drivers_license", "national_id"],
      proposal_status: ["active", "passed", "failed", "pending"],
      verification_status: ["pending", "in_progress", "verified", "rejected"],
      vote_type: ["for", "against", "abstain"],
    },
  },
} as const
