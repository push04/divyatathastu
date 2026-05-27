import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('slug') || 'full-tathastu-bundle'
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('name,price,sale_price')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (!data) return NextResponse.json({ price: null, sale_price: null })
  return NextResponse.json({ price: data.price, sale_price: data.sale_price, name: data.name })
}
