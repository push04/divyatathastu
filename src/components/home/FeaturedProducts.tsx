'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import Icon from '@/components/ui/Icon'
import { optimizeImage, imageSrcSet, IMG } from '@/lib/utils/image'
interface Product {
  id: string
  name: string
  description: string | null
  price: number
  sale_price: number | null
  product_type: string | null
  images: any
  slug: string
}

const TYPE_ICON: Record<string, string> = {
  report: 'description', ebook: 'menu_book', consultation: 'support_agent',
  yantra: 'hexagon', gemstone: 'diamond', physical: 'temple_hindu',
  course: 'school', bundle: 'inventory_2', herbal: 'eco',
}

const TYPE_GRADIENT: Record<string, string> = {
  report: 'from-[#1B1233] to-[#2E0C28]',
  ebook: 'from-[#C9992E] to-[#B4231F]',
  consultation: 'from-emerald-600 to-teal-700',
  yantra: 'from-amber-500 to-orange-600',
  gemstone: 'from-blue-500 to-purple-700',
  physical: 'from-[#B4231F] to-rose-700',
  course: 'from-violet-600 to-purple-800',
  bundle: 'from-[#1B1233] to-[#C9992E]',
  herbal: 'from-green-600 to-emerald-800',
}

function getFirstImage(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images) && images.length > 0) {
    const img = images[0]
    if (typeof img === 'string') return img
    if (img?.url) return img.url
  }
  return null
}

export default function FeaturedProducts() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    supabase
      .from('products')
      .select('id,name,description,price,sale_price,product_type,images,slug')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data?.length) setProducts(data) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!products.length) return null

  return (
    <section className="py-16 bg-[var(--kutch-white)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase font-semibold mb-2 text-[var(--terracotta)]" style={{ fontFamily: "var(--font-label)" }}>Sacred Store</p>
          <h2 className="text-3xl font-bold text-[var(--indigo-deep)]" style={{ fontFamily: "var(--font-display)" }}>Featured Products</h2>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">Handpicked sacred items and spiritual tools</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(p => {
            const img = getFirstImage(p.images)
            const grad = TYPE_GRADIENT[p.product_type || 'physical'] || TYPE_GRADIENT.physical
            const icon = TYPE_ICON[p.product_type || 'physical'] || 'storefront'
            const discountPct = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0

            return (
              <Link
                key={p.id}
                href={`/shop`}
                className="card-divine overflow-hidden group flex flex-col hover:shadow-lg transition-all duration-200"
              >
                {/* Image / Placeholder */}
                <div className="relative h-44 overflow-hidden">
                  {img ? (
                    <img src={optimizeImage(img, { width: IMG.card })!} srcSet={imageSrcSet(img, [320, 480, 768])}
                         sizes="(max-width: 640px) 50vw, 300px" loading="lazy" decoding="async"
                         alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
                      <Icon name={icon} size={48} className="text-[var(--text-on-dark-muted)]" />
                    </div>
                  )}
                  {discountPct > 0 && (
                    <div className="absolute top-2 right-2 bg-[var(--terracotta)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      -{discountPct}%
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-semibold text-[var(--indigo-deep)] text-sm leading-snug mb-1 line-clamp-2">{p.name}</p>
                  {p.description && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 flex-1">{p.description}</p>}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-[var(--indigo-deep)]">₹{(p.sale_price ?? p.price).toLocaleString('en-IN')}</span>
                      {p.sale_price && (
                        <span className="text-xs text-[var(--text-muted)] line-through">₹{p.price.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                    <span className="text-xs bg-[var(--warm-sand)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full capitalize">{p.product_type}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/shop" className="btn-divine px-8 py-3 text-sm inline-flex items-center gap-2">
            <Icon name="storefront" size={16} />
            View All Products
          </Link>
        </div>
      </div>
    </section>
  )
}
