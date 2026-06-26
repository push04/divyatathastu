'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ServiceCategory =
  | 'gyanampeetham' | 'vastu_painting' | 'sadhana'
  | 'mahaganpati' | 'puja_ritual' | 'ardra_jalam'
  | 'ayurveda' | 'course'

export interface ServiceItem {
  id: string
  category: ServiceCategory
  title: string
  subtitle?: string
  description?: string
  long_description?: string
  price?: number
  original_price?: number
  currency: string
  duration?: string
  level?: string
  image_url?: string
  video_url?: string
  instructor_name?: string
  instructor_bio?: string
  is_featured: boolean
  is_active: boolean
  is_bookable: boolean
  is_live: boolean
  max_participants: number
  tags: string[]
  badge_text?: string
  badge_color?: string
  metadata: Record<string, any>
  display_order: number
  created_at: string
  updated_at: string
}

export function useServiceItems(category?: ServiceCategory, onlyActive = true) {
  const [items, setItems] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), [])

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = (supabase as any).from('service_items').select('*').order('display_order')
      if (category) q = q.eq('category', category)
      if (onlyActive) q = q.eq('is_active', true)
      const { data, error: err } = await q
      if (err) {
        setError(err.message)
      } else {
        setItems((data ?? []) as ServiceItem[])
      }
    } catch (err: any) {
      console.error('[useServiceItems] fetch error:', err)
      setError(err?.message || 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }, [supabase, category, onlyActive])

  useEffect(() => { fetch() }, [fetch])
  return { items, loading, error, refetch: fetch }
}

export function useAllServiceItems() {
  return useServiceItems(undefined, false)
}
