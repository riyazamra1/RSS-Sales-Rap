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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          address: string
          app_name: string
          brand_color: string
          company_name: string
          created_at: string
          credit_warnings_enabled: boolean
          currency: string
          email: string
          id: string
          invoice_prefix: string
          logo_url: string | null
          low_stock_threshold: number
          offline_mode_enabled: boolean
          phone: string
          reps_can_see_purchase_price: boolean
          require_signup_approval: boolean
          sheets_auto_sync_minutes: number
          sheets_customers_tab: string
          sheets_enabled: boolean
          sheets_orders_tab: string
          sheets_payments_tab: string
          sheets_products_tab: string
          sheets_spreadsheet_id: string
          singleton: boolean
          tagline: string
          tax_number: string
          updated_at: string
          updated_by: string | null
          website: string
          whatsapp: string
        }
        Insert: {
          address?: string
          app_name?: string
          brand_color?: string
          company_name?: string
          created_at?: string
          credit_warnings_enabled?: boolean
          currency?: string
          email?: string
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          low_stock_threshold?: number
          offline_mode_enabled?: boolean
          phone?: string
          reps_can_see_purchase_price?: boolean
          require_signup_approval?: boolean
          sheets_auto_sync_minutes?: number
          sheets_customers_tab?: string
          sheets_enabled?: boolean
          sheets_orders_tab?: string
          sheets_payments_tab?: string
          sheets_products_tab?: string
          sheets_spreadsheet_id?: string
          singleton?: boolean
          tagline?: string
          tax_number?: string
          updated_at?: string
          updated_by?: string | null
          website?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          app_name?: string
          brand_color?: string
          company_name?: string
          created_at?: string
          credit_warnings_enabled?: boolean
          currency?: string
          email?: string
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          low_stock_threshold?: number
          offline_mode_enabled?: boolean
          phone?: string
          reps_can_see_purchase_price?: boolean
          require_signup_approval?: boolean
          sheets_auto_sync_minutes?: number
          sheets_customers_tab?: string
          sheets_enabled?: boolean
          sheets_orders_tab?: string
          sheets_payments_tab?: string
          sheets_products_tab?: string
          sheets_spreadsheet_id?: string
          singleton?: boolean
          tagline?: string
          tax_number?: string
          updated_at?: string
          updated_by?: string | null
          website?: string
          whatsapp?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          area: string | null
          category: string
          contact_person: string
          created_at: string
          created_by: string
          credit_limit: number
          id: string
          note: string | null
          phone: string
          shop_name: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          category?: string
          contact_person?: string
          created_at?: string
          created_by: string
          credit_limit?: number
          id?: string
          note?: string | null
          phone?: string
          shop_name: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          category?: string
          contact_person?: string
          created_at?: string
          created_by?: string
          credit_limit?: number
          id?: string
          note?: string | null
          phone?: string
          shop_name?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          amount: number
          collected_by: string
          created_at: string
          customer_id: string
          customer_name: string
          id: string
          invoice_no: string | null
          method: string
          note: string | null
          paid_at: string
          receipt_no: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          collected_by: string
          created_at?: string
          customer_id: string
          customer_name: string
          id?: string
          invoice_no?: string | null
          method?: string
          note?: string | null
          paid_at?: string
          receipt_no?: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          collected_by?: string
          created_at?: string
          customer_id?: string
          customer_name?: string
          id?: string
          invoice_no?: string | null
          method?: string
          note?: string | null
          paid_at?: string
          receipt_no?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_costs: {
        Row: {
          created_at: string
          product_id: string
          purchase_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          product_id: string
          purchase_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          product_id?: string
          purchase_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          min_stock: number
          model: string
          name: string
          sales_price: number
          sku: string
          stock: number
          supplier: string | null
          unit: string
          updated_at: string
          warranty: string | null
          wholesale_price: number
        }
        Insert: {
          barcode?: string | null
          brand?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          model?: string
          name: string
          sales_price?: number
          sku: string
          stock?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
          warranty?: string | null
          wholesale_price?: number
        }
        Update: {
          barcode?: string | null
          brand?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock?: number
          model?: string
          name?: string
          sales_price?: number
          sku?: string
          stock?: number
          supplier?: string | null
          unit?: string
          updated_at?: string
          warranty?: string | null
          wholesale_price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          employee_id: string | null
          full_name: string
          id: string
          phone: string | null
          status: string
          territory: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id: string
          phone?: string | null
          status?: string
          territory?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          employee_id?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          territory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      app_branding: {
        Row: {
          app_name: string | null
          brand_color: string | null
          company_name: string | null
          currency: string | null
          id: string | null
          logo_url: string | null
          tagline: string | null
        }
        Insert: {
          app_name?: string | null
          brand_color?: string | null
          company_name?: string | null
          currency?: string | null
          id?: string | null
          logo_url?: string | null
          tagline?: string | null
        }
        Update: {
          app_name?: string | null
          brand_color?: string | null
          company_name?: string | null
          currency?: string | null
          id?: string | null
          logo_url?: string | null
          tagline?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_app_branding: {
        Args: never
        Returns: {
          app_name: string
          brand_color: string
          company_name: string
          currency: string
          id: string
          logo_url: string
          tagline: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "sales_rep" | "accountant"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "sales_rep", "accountant"],
    },
  },
} as const
