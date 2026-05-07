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
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          id: string
          meta: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_secrets: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
          type: string
          url: string | null
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          type: string
          url?: string | null
          value: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          type?: string
          url?: string | null
          value?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          categories: string[] | null
          code: string
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_amount: number | null
          per_user_limit: number | null
          product_ids: string[] | null
          total_usage_limit: number | null
          user_email: string | null
          valid_from: string | null
        }
        Insert: {
          categories?: string[] | null
          code: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          product_ids?: string[] | null
          total_usage_limit?: number | null
          user_email?: string | null
          valid_from?: string | null
        }
        Update: {
          categories?: string[] | null
          code?: string
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          product_ids?: string[] | null
          total_usage_limit?: number | null
          user_email?: string | null
          valid_from?: string | null
        }
        Relationships: []
      }
      custom_orders: {
        Row: {
          admin_notes: string | null
          calling_number: string | null
          created_at: string
          delivery_date: string | null
          email: string
          extra_notes: string | null
          id: string
          name: string
          order_id: string | null
          product_id: string | null
          project_details: string
          reference_images: Json | null
          status: Database["public"]["Enums"]["custom_status"]
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          admin_notes?: string | null
          calling_number?: string | null
          created_at?: string
          delivery_date?: string | null
          email: string
          extra_notes?: string | null
          id?: string
          name: string
          order_id?: string | null
          product_id?: string | null
          project_details: string
          reference_images?: Json | null
          status?: Database["public"]["Enums"]["custom_status"]
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          admin_notes?: string | null
          calling_number?: string | null
          created_at?: string
          delivery_date?: string | null
          email?: string
          extra_notes?: string | null
          id?: string
          name?: string
          order_id?: string | null
          product_id?: string | null
          project_details?: string
          reference_images?: Json | null
          status?: Database["public"]["Enums"]["custom_status"]
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean
          message: string
          target: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message: string
          target?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message?: string
          target?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          coupon_discount: number
          coupon_id: string | null
          created_at: string
          delivered_at: string | null
          delivery_url: string | null
          id: string
          order_type: Database["public"]["Enums"]["order_type"]
          paid_at: string | null
          payment_method: string | null
          product_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          upi_info: string | null
          user_id: string
          wallet_used: number
        }
        Insert: {
          amount: number
          coupon_discount?: number
          coupon_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_url?: string | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          paid_at?: string | null
          payment_method?: string | null
          product_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          upi_info?: string | null
          user_id: string
          wallet_used?: number
        }
        Update: {
          amount?: number
          coupon_discount?: number
          coupon_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_url?: string | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          paid_at?: string | null
          payment_method?: string | null
          product_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          upi_info?: string | null
          user_id?: string
          wallet_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          banner_image: string | null
          category: string | null
          created_at: string
          customizable_enabled: boolean
          customization_price: number | null
          discount_price: number | null
          dual_button_mode: boolean
          full_description: string | null
          gallery_images: Json
          id: string
          instant_delivery_enabled: boolean
          instant_delivery_url: string | null
          is_active: boolean
          is_best_selling: boolean
          is_featured: boolean
          name: string
          primary_button_label: string | null
          regular_price: number
          secondary_button_label: string | null
          short_description: string | null
          slug: string
          source_code_price: number | null
          tags: string[] | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          banner_image?: string | null
          category?: string | null
          created_at?: string
          customizable_enabled?: boolean
          customization_price?: number | null
          discount_price?: number | null
          dual_button_mode?: boolean
          full_description?: string | null
          gallery_images?: Json
          id?: string
          instant_delivery_enabled?: boolean
          instant_delivery_url?: string | null
          is_active?: boolean
          is_best_selling?: boolean
          is_featured?: boolean
          name: string
          primary_button_label?: string | null
          regular_price?: number
          secondary_button_label?: string | null
          short_description?: string | null
          slug: string
          source_code_price?: number | null
          tags?: string[] | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          banner_image?: string | null
          category?: string | null
          created_at?: string
          customizable_enabled?: boolean
          customization_price?: number | null
          discount_price?: number | null
          dual_button_mode?: boolean
          full_description?: string | null
          gallery_images?: Json
          id?: string
          instant_delivery_enabled?: boolean
          instant_delivery_url?: string | null
          is_active?: boolean
          is_best_selling?: boolean
          is_featured?: boolean
          name?: string
          primary_button_label?: string | null
          regular_price?: number
          secondary_button_label?: string | null
          short_description?: string | null
          slug?: string
          source_code_price?: number | null
          tags?: string[] | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          calling_number: string | null
          created_at: string
          email: string
          first_name: string | null
          found_from: string | null
          id: string
          instagram_username: string | null
          last_login_at: string | null
          last_name: string | null
          optional_number: string | null
          signup_at: string
          telegram_username: string | null
          total_orders: number
          total_spent: number
          updated_at: string
          wallet_balance: number
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          calling_number?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          found_from?: string | null
          id: string
          instagram_username?: string | null
          last_login_at?: string | null
          last_name?: string | null
          optional_number?: string | null
          signup_at?: string
          telegram_username?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          wallet_balance?: number
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          calling_number?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          found_from?: string | null
          id?: string
          instagram_username?: string | null
          last_login_at?: string | null
          last_name?: string | null
          optional_number?: string | null
          signup_at?: string
          telegram_username?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
          wallet_balance?: number
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean
          product_id: string | null
          rating: number
          review_text: string
          user_avatar: string | null
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string | null
          rating: number
          review_text: string
          user_avatar?: string | null
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string | null
          rating?: number
          review_text?: string
          user_avatar?: string | null
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          permissions: Json
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          note: string | null
          order_id: string | null
          product_id: string | null
          razorpay_payment_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string | null
          product_id?: string | null
          razorpay_payment_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string | null
          product_id?: string | null
          razorpay_payment_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      website_settings: {
        Row: {
          default_theme: string
          description: string | null
          id: number
          logo_url: string | null
          maintenance_mode: boolean
          site_name: string
          social_links: Json
          support_email: string
          tagline: string
          updated_at: string
        }
        Insert: {
          default_theme?: string
          description?: string | null
          id?: number
          logo_url?: string | null
          maintenance_mode?: boolean
          site_name?: string
          social_links?: Json
          support_email?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          default_theme?: string
          description?: string | null
          id?: number
          logo_url?: string | null
          maintenance_mode?: boolean
          site_name?: string
          social_links?: Json
          support_email?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_admin_permission: {
        Args: { _perm: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      custom_status:
        | "submitted"
        | "reviewed"
        | "in_progress"
        | "completed"
        | "delivered"
      discount_type: "fixed" | "percentage"
      order_status: "pending" | "paid" | "delivered" | "failed" | "refunded"
      order_type: "source_code" | "customization"
      wallet_tx_type:
        | "credit_topup"
        | "credit_admin"
        | "debit_purchase"
        | "debit_admin"
        | "refund"
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
      custom_status: [
        "submitted",
        "reviewed",
        "in_progress",
        "completed",
        "delivered",
      ],
      discount_type: ["fixed", "percentage"],
      order_status: ["pending", "paid", "delivered", "failed", "refunded"],
      order_type: ["source_code", "customization"],
      wallet_tx_type: [
        "credit_topup",
        "credit_admin",
        "debit_purchase",
        "debit_admin",
        "refund",
      ],
    },
  },
} as const
