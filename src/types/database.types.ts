export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ReportType = 'astrology' | 'astro_vastu' | 'shakti_chakra' | 'numerology' |
  'mobile_number' | 'psychology' | 'prakriti' | 'yantra_colour' | 'dmit' |
  'colour_therapy' | 'child_development' | 'mantra_chanting' | 'mantra_writing' | 'full_tathastu'

export type ReportStatus = 'pending' | 'processing' | 'generated' | 'reviewed' | 'delivered'
export type ProductType = 'report' | 'ebook' | 'consultation' | 'yantra' | 'gemstone' | 'course' | 'bundle' | 'physical' | 'herbal'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'refunded' | 'cancelled'
export type EventType = 'webinar' | 'puja' | 'workshop' | 'yatra' | 'satsang' | 'consultation_camp' | 'pilgrimage' | 'other' | 'online' | 'offline'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          whatsapp_number: string | null
          avatar_url: string | null
          role: 'user' | 'admin' | 'expert'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          whatsapp_number?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'expert'
          is_active?: boolean
        }
        Update: {
          full_name?: string
          phone?: string | null
          whatsapp_number?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'expert'
          is_active?: boolean
        }
        Relationships: []
      }
      families: {
        Row: {
          id: string
          owner_id: string | null
          family_name: string | null
          plan_type: 'free' | 'basic' | 'tathastu' | 'divine'
          plan_expires_at: string | null
          created_at: string
        }
        Insert: {
          owner_id?: string | null
          family_name?: string | null
          plan_type?: 'free' | 'basic' | 'tathastu' | 'divine'
          plan_expires_at?: string | null
        }
        Update: {
          owner_id?: string | null
          family_name?: string | null
          plan_type?: 'free' | 'basic' | 'tathastu' | 'divine'
          plan_expires_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'families_owner_id_fkey'; columns: ['owner_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      family_members: {
        Row: {
          id: string
          family_id: string | null
          profile_id: string | null
          relation: string
          full_name: string
          date_of_birth: string
          time_of_birth: string | null
          place_of_birth: string
          birth_latitude: number | null
          birth_longitude: number | null
          birth_timezone: string | null
          gender: 'male' | 'female' | 'other' | null
          mobile_number: string | null
          created_at: string
        }
        Insert: {
          family_id?: string | null
          profile_id?: string | null
          relation: string
          full_name: string
          date_of_birth: string
          time_of_birth?: string | null
          place_of_birth: string
          birth_latitude?: number | null
          birth_longitude?: number | null
          birth_timezone?: string | null
          gender?: 'male' | 'female' | 'other' | null
          mobile_number?: string | null
        }
        Update: {
          family_id?: string | null
          profile_id?: string | null
          relation?: string
          full_name?: string
          date_of_birth?: string
          time_of_birth?: string | null
          place_of_birth?: string
          birth_latitude?: number | null
          birth_longitude?: number | null
          birth_timezone?: string | null
          gender?: 'male' | 'female' | 'other' | null
          mobile_number?: string | null
        }
        Relationships: [
          { foreignKeyName: 'family_members_family_id_fkey'; columns: ['family_id']; isOneToOne: false; referencedRelation: 'families'; referencedColumns: ['id'] }
        ]
      }
      reports: {
        Row: {
          id: string
          family_member_id: string | null
          family_id: string | null
          report_type: ReportType
          status: ReportStatus
          raw_data: Json | null
          ai_analysis: Json | null
          report_content: Json | null
          pdf_url: string | null
          generated_by: 'auto' | 'expert' | 'hybrid'
          reviewed_by: string | null
          expert_notes: string | null
          admin_notes: string | null
          order_id: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          family_member_id?: string | null
          family_id?: string | null
          report_type: ReportType
          status?: ReportStatus
          raw_data?: Json | null
          ai_analysis?: Json | null
          report_content?: Json | null
          pdf_url?: string | null
          generated_by?: 'auto' | 'expert' | 'hybrid'
          reviewed_by?: string | null
          expert_notes?: string | null
          admin_notes?: string | null
          order_id?: string | null
          is_public?: boolean
        }
        Update: {
          family_member_id?: string | null
          family_id?: string | null
          report_type?: ReportType
          status?: ReportStatus
          raw_data?: Json | null
          ai_analysis?: Json | null
          report_content?: Json | null
          pdf_url?: string | null
          generated_by?: 'auto' | 'expert' | 'hybrid'
          reviewed_by?: string | null
          expert_notes?: string | null
          admin_notes?: string | null
          order_id?: string | null
          is_public?: boolean
        }
        Relationships: [
          { foreignKeyName: 'reports_family_member_id_fkey'; columns: ['family_member_id']; isOneToOne: false; referencedRelation: 'family_members'; referencedColumns: ['id'] }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          product_type: ProductType | null
          price: number
          sale_price: number | null
          currency: string
          images: Json
          report_types: Json
          ebook_id: string | null
          ebook_file_url: string | null
          ebook_download_limit: number
          physical: boolean
          is_active: boolean
          is_featured: boolean
          stock_count: number
          meta_title: string | null
          meta_description: string | null
          created_at: string
        }
        Insert: {
          name: string
          slug: string
          description?: string | null
          product_type?: ProductType | null
          price: number
          sale_price?: number | null
          currency?: string
          images?: Json
          report_types?: Json
          ebook_id?: string | null
          ebook_file_url?: string | null
          ebook_download_limit?: number
          physical?: boolean
          is_active?: boolean
          is_featured?: boolean
          stock_count?: number
          meta_title?: string | null
          meta_description?: string | null
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          product_type?: ProductType | null
          price?: number
          sale_price?: number | null
          currency?: string
          images?: Json
          report_types?: Json
          ebook_id?: string | null
          ebook_file_url?: string | null
          ebook_download_limit?: number
          physical?: boolean
          is_active?: boolean
          is_featured?: boolean
          stock_count?: number
          meta_title?: string | null
          meta_description?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          family_id: string | null
          order_number: string
          items: Json
          subtotal: number | null
          discount: number
          coupon_code: string | null
          total: number
          currency: string
          status: OrderStatus
          tracking_number: string | null
          notes: string | null
          payment_method: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          billing_address: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          family_id?: string | null
          order_number: string
          items: Json
          subtotal?: number | null
          discount?: number
          coupon_code?: string | null
          total: number
          currency?: string
          status?: OrderStatus
          tracking_number?: string | null
          notes?: string | null
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          billing_address?: Json | null
        }
        Update: {
          user_id?: string | null
          family_id?: string | null
          order_number?: string
          items?: Json
          subtotal?: number | null
          discount?: number
          coupon_code?: string | null
          total?: number
          currency?: string
          status?: OrderStatus
          tracking_number?: string | null
          notes?: string | null
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          billing_address?: Json | null
        }
        Relationships: [
          { foreignKeyName: 'orders_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      ebooks: {
        Row: {
          id: string
          title: string
          slug: string
          author: string | null
          description: string | null
          cover_image_url: string | null
          preview_pages: number
          file_url: string
          price: number
          language: string
          tags: Json
          is_active: boolean
          meta_title: string | null
          meta_description: string | null
          created_at: string
        }
        Insert: {
          title: string
          slug: string
          author?: string | null
          description?: string | null
          cover_image_url?: string | null
          preview_pages?: number
          file_url: string
          price: number
          language?: string
          tags?: Json
          is_active?: boolean
          meta_title?: string | null
          meta_description?: string | null
        }
        Update: {
          title?: string
          slug?: string
          author?: string | null
          description?: string | null
          cover_image_url?: string | null
          preview_pages?: number
          file_url?: string
          price?: number
          language?: string
          tags?: Json
          is_active?: boolean
          meta_title?: string | null
          meta_description?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          type: string
          start_datetime: string
          end_datetime: string | null
          start_date: string | null
          start_time: string | null
          duration_minutes: number | null
          location: string | null
          meeting_link: string | null
          cover_image_url: string | null
          max_attendees: number | null
          max_participants: number | null
          current_participants: number
          price: number
          is_free: boolean
          is_published: boolean
          category: string | null
          host: string | null
          requirements: string | null
          includes: Json | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          title: string
          slug?: string
          description?: string | null
          type?: string
          start_datetime: string
          end_datetime?: string | null
          start_date?: string | null
          start_time?: string | null
          duration_minutes?: number | null
          location?: string | null
          meeting_link?: string | null
          cover_image_url?: string | null
          max_attendees?: number | null
          max_participants?: number | null
          current_participants?: number
          price?: number
          is_free?: boolean
          is_published?: boolean
          category?: string | null
          host?: string | null
          requirements?: string | null
          includes?: Json | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          slug?: string
          description?: string | null
          type?: string
          start_datetime?: string
          end_datetime?: string | null
          start_date?: string | null
          start_time?: string | null
          duration_minutes?: number | null
          location?: string | null
          meeting_link?: string | null
          cover_image_url?: string | null
          max_attendees?: number | null
          max_participants?: number | null
          current_participants?: number
          price?: number
          is_free?: boolean
          is_published?: boolean
          category?: string | null
          host?: string | null
          requirements?: string | null
          includes?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          content: string | null
          excerpt: string | null
          cover_image_url: string | null
          author_id: string | null
          category: string | null
          tags: Json
          is_published: boolean
          published_at: string | null
          read_time: number | null
          meta_title: string | null
          meta_description: string | null
          schema_markup: Json | null
          created_at: string
        }
        Insert: {
          title: string
          slug: string
          content?: string | null
          excerpt?: string | null
          cover_image_url?: string | null
          author_id?: string | null
          category?: string | null
          tags?: Json
          is_published?: boolean
          published_at?: string | null
          read_time?: number | null
          meta_title?: string | null
          meta_description?: string | null
          schema_markup?: Json | null
        }
        Update: {
          title?: string
          slug?: string
          content?: string | null
          excerpt?: string | null
          cover_image_url?: string | null
          author_id?: string | null
          category?: string | null
          tags?: Json
          is_published?: boolean
          published_at?: string | null
          read_time?: number | null
          meta_title?: string | null
          meta_description?: string | null
          schema_markup?: Json | null
        }
        Relationships: []
      }
      handwritten_report_requests: {
        Row: {
          id: string
          user_id: string | null
          family_member_id: string | null
          report_type: string
          description: string | null
          status: string
          file_url: string | null
          file_name: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          family_member_id?: string | null
          report_type?: string
          description?: string | null
          status?: string
          file_url?: string | null
          file_name?: string | null
          admin_notes?: string | null
        }
        Update: {
          user_id?: string | null
          family_member_id?: string | null
          report_type?: string
          description?: string | null
          status?: string
          file_url?: string | null
          file_name?: string | null
          admin_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'hrr_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'hrr_family_member_id_fkey'; columns: ['family_member_id']; isOneToOne: false; referencedRelation: 'family_members'; referencedColumns: ['id'] }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          body: string | null
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          user_id?: string | null
          type: string
          title: string
          body?: string | null
          data?: Json | null
          is_read?: boolean
        }
        Update: {
          user_id?: string | null
          type?: string
          title?: string
          body?: string | null
          data?: Json | null
          is_read?: boolean
        }
        Relationships: [
          { foreignKeyName: 'notifications_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      mail_threads: {
        Row: {
          id: string
          subject: string
          user_id: string | null
          expert_id: string | null
          thread_type: string
          report_id: string | null
          status: string
          last_message_at: string
          created_at: string
        }
        Insert: {
          subject: string
          user_id?: string | null
          expert_id?: string | null
          thread_type?: string
          report_id?: string | null
          status?: string
        }
        Update: {
          subject?: string
          user_id?: string | null
          expert_id?: string | null
          thread_type?: string
          report_id?: string | null
          status?: string
          last_message_at?: string
        }
        Relationships: []
      }
      mail_messages: {
        Row: {
          id: string
          thread_id: string | null
          sender_id: string | null
          content: string
          attachments: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          thread_id?: string | null
          sender_id?: string | null
          content: string
          attachments?: Json
          is_read?: boolean
        }
        Update: {
          thread_id?: string | null
          sender_id?: string | null
          content?: string
          attachments?: Json
          is_read?: boolean
        }
        Relationships: []
      }
      saved_mandirs: {
        Row: {
          id: string
          user_id: string | null
          google_place_id: string
          mandir_name: string | null
          city: string | null
          state: string | null
          notes: string | null
          lat: number | null
          lng: number | null
          saved_at: string
        }
        Insert: {
          user_id?: string | null
          google_place_id: string
          mandir_name?: string | null
          city?: string | null
          state?: string | null
          notes?: string | null
          lat?: number | null
          lng?: number | null
        }
        Update: {
          user_id?: string | null
          google_place_id?: string
          mandir_name?: string | null
          city?: string | null
          state?: string | null
          notes?: string | null
          lat?: number | null
          lng?: number | null
        }
        Relationships: []
      }
      carts: {
        Row: {
          id: string
          user_id: string | null
          items: Json
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          items?: Json
        }
        Update: {
          user_id?: string | null
          items?: Json
        }
        Relationships: []
      }
      kundli_cache: {
        Row: {
          id: string
          family_member_id: string | null
          kundli_data: Json
          panchang_data: Json | null
          navamsha_data: Json | null
          dasha_data: Json | null
          cached_at: string
          expires_at: string | null
        }
        Insert: {
          family_member_id?: string | null
          kundli_data: Json
          panchang_data?: Json | null
          navamsha_data?: Json | null
          dasha_data?: Json | null
          expires_at?: string | null
        }
        Update: {
          family_member_id?: string | null
          kundli_data?: Json
          panchang_data?: Json | null
          navamsha_data?: Json | null
          dasha_data?: Json | null
          expires_at?: string | null
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          id: string
          user_id: string | null
          title: string
          start_city: string | null
          duration_days: number | null
          mandirs: Json
          schedule: Json | null
          estimated_cost: number | null
          travel_mode: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          user_id?: string | null
          title: string
          start_city?: string | null
          duration_days?: number | null
          mandirs: Json
          schedule?: Json | null
          estimated_cost?: number | null
          travel_mode?: string
          is_public?: boolean
        }
        Update: {
          user_id?: string | null
          title?: string
          start_city?: string | null
          duration_days?: number | null
          mandirs?: Json
          schedule?: Json | null
          estimated_cost?: number | null
          travel_mode?: string
          is_public?: boolean
        }
        Relationships: []
      }
      consultation_slots: {
        Row: {
          id: string
          expert_id: string | null
          date: string
          start_time: string
          end_time: string
          is_booked: boolean
          is_blocked: boolean
          created_at: string
        }
        Insert: {
          expert_id?: string | null
          date: string
          start_time: string
          end_time: string
          is_booked?: boolean
          is_blocked?: boolean
        }
        Update: {
          expert_id?: string | null
          date?: string
          start_time?: string
          end_time?: string
          is_booked?: boolean
          is_blocked?: boolean
        }
        Relationships: []
      }
      consultation_bookings: {
        Row: {
          id: string
          slot_id: string | null
          user_id: string | null
          family_member_id: string | null
          report_id: string | null
          meeting_link: string | null
          status: string
          notes: string | null
          order_id: string | null
          booked_at: string
        }
        Insert: {
          slot_id?: string | null
          user_id?: string | null
          family_member_id?: string | null
          report_id?: string | null
          meeting_link?: string | null
          status?: string
          notes?: string | null
          order_id?: string | null
        }
        Update: {
          slot_id?: string | null
          user_id?: string | null
          family_member_id?: string | null
          report_id?: string | null
          meeting_link?: string | null
          status?: string
          notes?: string | null
          order_id?: string | null
        }
        Relationships: []
      }
      ebook_purchases: {
        Row: {
          id: string
          user_id: string | null
          ebook_id: string | null
          order_id: string | null
          download_count: number
          max_downloads: number
          purchased_at: string
        }
        Insert: {
          user_id?: string | null
          ebook_id?: string | null
          order_id?: string | null
          download_count?: number
          max_downloads?: number
        }
        Update: {
          user_id?: string | null
          ebook_id?: string | null
          order_id?: string | null
          download_count?: number
          max_downloads?: number
        }
        Relationships: [
          { foreignKeyName: 'ebook_purchases_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'ebook_purchases_ebook_id_fkey'; columns: ['ebook_id']; isOneToOne: false; referencedRelation: 'ebooks'; referencedColumns: ['id'] }
        ]
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'flat' | null
          discount_value: number | null
          min_order_amount: number
          max_uses: number | null
          used_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          code: string
          discount_type?: 'percentage' | 'flat' | null
          discount_value?: number | null
          min_order_amount?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          code?: string
          discount_type?: 'percentage' | 'flat' | null
          discount_value?: number | null
          min_order_amount?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
