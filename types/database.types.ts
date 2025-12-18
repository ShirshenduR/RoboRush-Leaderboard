export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          team_name: string
          score: number
          status: 'active' | 'inactive' | 'disqualified'
          created_at: string
          updated_at: string
          last_score_update: string | null
        }
        Insert: {
          id?: string
          team_name: string
          score?: number
          status?: 'active' | 'inactive' | 'disqualified'
          created_at?: string
          updated_at?: string
          last_score_update?: string | null
        }
        Update: {
          id?: string
          team_name?: string
          score?: number
          status?: 'active' | 'inactive' | 'disqualified'
          created_at?: string
          updated_at?: string
          last_score_update?: string | null
        }
      }
      admins: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: 'super_admin' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          role?: 'super_admin' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          role?: 'super_admin' | 'admin'
          created_at?: string
        }
      }
      score_history: {
        Row: {
          id: string
          team_id: string
          old_score: number
          new_score: number
          changed_by: string
          changed_at: string
          reason: string | null
        }
        Insert: {
          id?: string
          team_id: string
          old_score: number
          new_score: number
          changed_by: string
          changed_at?: string
          reason?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          old_score?: number
          new_score?: number
          changed_by?: string
          changed_at?: string
          reason?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      team_status: 'active' | 'inactive' | 'disqualified'
      admin_role: 'super_admin' | 'admin'
    }
  }
}
