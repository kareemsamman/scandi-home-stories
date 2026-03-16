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
          id: string
          last_name: string
          notes: string | null
          order_number: string
          phone: string
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
          id?: string
          last_name?: string
          notes?: string | null
          order_number: string
          phone?: string
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
          id?: string
          last_name?: string
          notes?: string | null
          order_number?: string
          phone?: string
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
          description: string | null
          id: string
          length: string | null
          locale: string
          long_description: string | null
          name: string
          product_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          length?: string | null
          locale: string
          long_description?: string | null
          name?: string
          product_id: string
        }
        Update: {
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
          sizes: Json | null
          sku: string | null
          slug: string
          sort_order: number | null
          sub_category_id: string | null
          type: string
          updated_at: string | null
          use_color_groups: boolean | null
        }
        Insert: {
          category_id?: string | null
          colors?: Json | null
          created_at?: string | null
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
          sizes?: Json | null
          sku?: string | null
          slug: string
          sort_order?: number | null
          sub_category_id?: string | null
          type?: string
          updated_at?: string | null
          use_color_groups?: boolean | null
        }
        Update: {
          category_id?: string | null
          colors?: Json | null
          created_at?: string | null
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
          sizes?: Json | null
          sku?: string | null
          slug?: string
          sort_order?: number | null
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
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
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
          name_ar: string
          name_he: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name_ar?: string
          name_he?: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
