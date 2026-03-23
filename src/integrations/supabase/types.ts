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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description_ar: string | null
          description_he: string | null
          hero_image: string | null
          id: string
          image: string | null
          name_ar: string
          name_he: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          description_he?: string | null
          hero_image?: string | null
          id?: string
          image?: string | null
          name_ar?: string
          name_he?: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          description_he?: string | null
          hero_image?: string | null
          id?: string
          image?: string | null
          name_ar?: string
          name_he?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      category_translations: {
        Row: {
          category_id: string
          description: string | null
          id: string
          locale: string
          name: string
        }
        Insert: {
          category_id: string
          description?: string | null
          id?: string
          locale: string
          name?: string
        }
        Update: {
          category_id?: string
          description?: string | null
          id?: string
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      color_groups: {
        Row: {
          colors: Json | null
          id: string
          name_ar: string
          name_he: string
          sort_order: number | null
        }
        Insert: {
          colors?: Json | null
          id: string
          name_ar?: string
          name_he?: string
          sort_order?: number | null
        }
        Update: {
          colors?: Json | null
          id?: string
          name_ar?: string
          name_he?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          locale: string | null
          message: string
          name: string
          phone: string | null
          sms_sent: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          locale?: string | null
          message: string
          name: string
          phone?: string | null
          sms_sent?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          locale?: string | null
          message?: string
          name?: string
          phone?: string | null
          sms_sent?: boolean | null
        }
        Relationships: []
      }
      coupon_uses: {
        Row: {
          coupon_id: string | null
          discount_amount: number | null
          id: string
          order_number: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          discount_amount?: number | null
          id?: string
          order_number?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          discount_amount?: number | null
          id?: string
          order_number?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          admin_only: boolean | null
          allowed_phones: string[] | null
          category_ids: string[] | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_uses: number | null
          max_uses_per_user: number
          min_order_amount: number
          product_ids: string[] | null
          type: string
          updated_at: string | null
          uses: number
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          admin_only?: boolean | null
          allowed_phones?: string[] | null
          category_ids?: string[] | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number
          min_order_amount?: number
          product_ids?: string[] | null
          type?: string
          updated_at?: string | null
          uses?: number
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Update: {
          admin_only?: boolean | null
          allowed_phones?: string[] | null
          category_ids?: string[] | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number
          min_order_amount?: number
          product_ids?: string[] | null
          type?: string
          updated_at?: string | null
          uses?: number
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      hero_slide_translations: {
        Row: {
          cta: string | null
          hero_slide_id: string
          id: string
          locale: string
          subtitle: string | null
          title: string | null
        }
        Insert: {
          cta?: string | null
          hero_slide_id: string
          id?: string
          locale: string
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          cta?: string | null
          hero_slide_id?: string
          id?: string
          locale?: string
          subtitle?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hero_slide_translations_hero_slide_id_fkey"
            columns: ["hero_slide_id"]
            isOneToOne: false
            referencedRelation: "hero_slides"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          created_at: string | null
          cta_ar: string | null
          cta_he: string | null
          id: string
          image: string
          is_active: boolean | null
          link: string | null
          sort_order: number | null
          subtitle_ar: string | null
          subtitle_he: string | null
          title_ar: string
          title_he: string
        }
        Insert: {
          created_at?: string | null
          cta_ar?: string | null
          cta_he?: string | null
          id?: string
          image?: string
          is_active?: boolean | null
          link?: string | null
          sort_order?: number | null
          subtitle_ar?: string | null
          subtitle_he?: string | null
          title_ar?: string
          title_he?: string
        }
        Update: {
          created_at?: string | null
          cta_ar?: string | null
          cta_he?: string | null
          id?: string
          image?: string
          is_active?: boolean | null
          link?: string | null
          sort_order?: number | null
          subtitle_ar?: string | null
          subtitle_he?: string | null
          title_ar?: string
          title_he?: string
        }
        Relationships: []
      }
      home_content: {
        Row: {
          data: Json
          id: string
          locale: string
          section: string
          updated_at: string | null
        }
        Insert: {
          data?: Json
          id?: string
          locale: string
          section: string
          updated_at?: string | null
        }
        Update: {
          data?: Json
          id?: string
          locale?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          low_stock_threshold: number | null
          product_id: string
          stock_quantity: number | null
          updated_at: string | null
          variation_key: string | null
        }
        Insert: {
          id?: string
          low_stock_threshold?: number | null
          product_id: string
          stock_quantity?: number | null
          updated_at?: string | null
          variation_key?: string | null
        }
        Update: {
          id?: string
          low_stock_threshold?: number | null
          product_id?: string
          stock_quantity?: number | null
          updated_at?: string | null
          variation_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_subscribers: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          locale: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          locale?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          locale?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color_hex: string | null
          color_name: string | null
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          size: string | null
        }
        Insert: {
          color_hex?: string | null
          color_name?: string | null
          id?: string
          order_id: string
          price?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
        }
        Update: {
          color_hex?: string | null
          color_name?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          apartment: string | null
          city: string
          created_at: string | null
          discount_amount: number | null
          discount_code: string | null
          email: string
          first_name: string
          house_number: string | null
          id: string
          last_name: string
          locale: string | null
          marketing_opt_in: boolean | null
          notes: string | null
          order_number: string
          payment_status: string
          payment_token: string | null
          phone: string
          receipt_url: string | null
          shipping_cost: number | null
          status: string
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string
          apartment?: string | null
          city?: string
          created_at?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          email?: string
          first_name?: string
          house_number?: string | null
          id?: string
          last_name?: string
          locale?: string | null
          marketing_opt_in?: boolean | null
          notes?: string | null
          order_number: string
          payment_status?: string
          payment_token?: string | null
          phone?: string
          receipt_url?: string | null
          shipping_cost?: number | null
          status?: string
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          apartment?: string | null
          city?: string
          created_at?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          email?: string
          first_name?: string
          house_number?: string | null
          id?: string
          last_name?: string
          locale?: string | null
          marketing_opt_in?: boolean | null
          notes?: string | null
          order_number?: string
          payment_status?: string
          payment_token?: string | null
          phone?: string
          receipt_url?: string | null
          shipping_cost?: number | null
          status?: string
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      page_translations: {
        Row: {
          id: string
          locale: string
          page_id: string
          sections: Json | null
          seo_description: string | null
          seo_title: string | null
          title: string | null
        }
        Insert: {
          id?: string
          locale: string
          page_id: string
          sections?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          title?: string | null
        }
        Update: {
          id?: string
          locale?: string
          page_id?: string
          sections?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_translations_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          id: string
          slug: string
          sort_order: number | null
          status: string | null
          template: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          slug: string
          sort_order?: number | null
          status?: string | null
          template?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          slug?: string
          sort_order?: number | null
          status?: string | null
          template?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_translations: {
        Row: {
          content_html: string | null
          description: string | null
          id: string
          length: string | null
          locale: string
          long_description: string | null
          name: string
          product_id: string
        }
        Insert: {
          content_html?: string | null
          description?: string | null
          id?: string
          length?: string | null
          locale: string
          long_description?: string | null
          name?: string
          product_id: string
        }
        Update: {
          content_html?: string | null
          description?: string | null
          id?: string
          length?: string | null
          locale?: string
          long_description?: string | null
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          colors: Json | null
          created_at: string | null
          custom_color_groups: Json | null
          custom_color_prices: Json | null
          custom_colors_enabled: boolean | null
          description_ar: string | null
          description_he: string | null
          dimensions: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_new: boolean | null
          length_ar: string | null
          length_he: string | null
          long_description_ar: string | null
          long_description_he: string | null
          materials: string | null
          max_quantity: number | null
          name: string
          price: number
          product_details: Json | null
          sizes: Json | null
          sku: string | null
          slug: string
          sort_order: number | null
          status: string
          sub_category_id: string | null
          type: string
          updated_at: string | null
          use_color_groups: boolean | null
        }
        Insert: {
          category_id?: string | null
          colors?: Json | null
          created_at?: string | null
          custom_color_groups?: Json | null
          custom_color_prices?: Json | null
          custom_colors_enabled?: boolean | null
          description_ar?: string | null
          description_he?: string | null
          dimensions?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          length_ar?: string | null
          length_he?: string | null
          long_description_ar?: string | null
          long_description_he?: string | null
          materials?: string | null
          max_quantity?: number | null
          name: string
          price?: number
          product_details?: Json | null
          sizes?: Json | null
          sku?: string | null
          slug: string
          sort_order?: number | null
          status?: string
          sub_category_id?: string | null
          type?: string
          updated_at?: string | null
          use_color_groups?: boolean | null
        }
        Update: {
          category_id?: string | null
          colors?: Json | null
          created_at?: string | null
          custom_color_groups?: Json | null
          custom_color_prices?: Json | null
          custom_colors_enabled?: boolean | null
          description_ar?: string | null
          description_he?: string | null
          dimensions?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_new?: boolean | null
          length_ar?: string | null
          length_he?: string | null
          long_description_ar?: string | null
          long_description_he?: string | null
          materials?: string | null
          max_quantity?: number | null
          name?: string
          price?: number
          product_details?: Json | null
          sizes?: Json | null
          sku?: string | null
          slug?: string
          sort_order?: number | null
          status?: string
          sub_category_id?: string | null
          type?: string
          updated_at?: string | null
          use_color_groups?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          needs_password: boolean | null
          phone: string | null
          registration_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          needs_password?: boolean | null
          phone?: string | null
          registration_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          needs_password?: boolean | null
          phone?: string | null
          registration_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_carts: {
        Row: {
          cart_items: Json
          coupon_code: string | null
          created_at: string | null
          created_by: string | null
          id: string
          token: string
        }
        Insert: {
          cart_items: Json
          coupon_code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          token?: string
        }
        Update: {
          cart_items?: Json
          coupon_code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          token?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_key: string
          id: string
          updated_at: string | null
          value_ar: Json | null
          value_he: Json | null
        }
        Insert: {
          content_key: string
          id?: string
          updated_at?: string | null
          value_ar?: Json | null
          value_he?: Json | null
        }
        Update: {
          content_key?: string
          id?: string
          updated_at?: string | null
          value_ar?: Json | null
          value_he?: Json | null
        }
        Relationships: []
      }
      sub_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          image: string | null
          name_ar: string
          name_he: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          image?: string | null
          name_ar?: string
          name_he?: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          image?: string | null
          name_ar?: string
          name_he?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_category_translations: {
        Row: {
          id: string
          locale: string
          name: string
          sub_category_id: string
        }
        Insert: {
          id?: string
          locale: string
          name?: string
          sub_category_id: string
        }
        Update: {
          id?: string
          locale?: string
          name?: string
          sub_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_category_translations_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          apartment: string | null
          city: string
          created_at: string | null
          first_name: string
          house_number: string
          id: string
          is_default: boolean
          last_name: string
          phone: string
          street: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          apartment?: string | null
          city?: string
          created_at?: string | null
          first_name?: string
          house_number?: string
          id?: string
          is_default?: boolean
          last_name?: string
          phone?: string
          street?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          apartment?: string | null
          city?: string
          created_at?: string | null
          first_name?: string
          house_number?: string
          id?: string
          is_default?: boolean
          last_name?: string
          phone?: string
          street?: string
          updated_at?: string | null
          user_id?: string
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
      [_ in never]: never
    }
    Functions: {
      get_invoice_order: { Args: { order_id: string }; Returns: Json }
      get_order_by_token: {
        Args: { p_order_id: string; p_token: string }
        Returns: Json
      }
      get_order_owner_hint: { Args: { p_order_id: string }; Returns: Json }
      get_shared_cart_by_token: { Args: { p_token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_coupon_by_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "worker" | "customer"
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
      app_role: ["admin", "worker", "customer"],
    },
  },
} as const
