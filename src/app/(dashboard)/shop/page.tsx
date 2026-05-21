'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  sale_price: number | null
  product_type: string | null
  images: any
  stock_count: number
  is_active: boolean
}

const CATEGORIES = ['All', 'Report', 'Ebook', 'Consultation', 'Service', 'Physical']

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [cart, setCart] = useState<Map<string, number>>(new Map())
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('products').select('*').eq('is_active', true).order('created_at')
      if (data) setProducts(data)

      // Load cart from localStorage
      const stored = localStorage.getItem('dt_cart')
      if (stored) setCart(new Map(JSON.parse(stored)))
      setLoading(false)
    }
    load()
  }, [])

  function saveCart(newCart: Map<string, number>) {
    setCart(newCart)
    localStorage.setItem('dt_cart', JSON.stringify([...newCart]))
  }

  function addToCart(product: Product) {
    const newCart = new Map(cart)
    newCart.set(product.id, (newCart.get(product.id) || 0) + 1)
    saveCart(newCart)
    toast.success(`${product.name} added to cart!`)
  }

  function removeFromCart(id: string) {
    const newCart = new Map(cart)
    if ((newCart.get(id) || 0) > 1) newCart.set(id, (newCart.get(id) || 1) - 1)
    else newCart.delete(id)
    saveCart(newCart)
  }

  const filtered = filter === 'All' ? products : products.filter(p => p.product_type?.toLowerCase() === filter.toLowerCase())
  const cartCount = [...cart.values()].reduce((a, b) => a + b, 0)
  const cartTotal = products.reduce((sum, p) => sum + (cart.get(p.id) || 0) * (p.sale_price ?? p.price), 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow">ॐ</div></div>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            Sacred Shop
          </h1>
          <p className="text-sm text-[var(--warm-charcoal)]/60 mt-0.5">Reports, consultations & spiritual products</p>
        </div>
        {cartCount > 0 && (
          <Link href="/shop/checkout" className="relative btn-divine text-sm px-4 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
            Cart
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{cartCount}</span>
          </Link>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${filter === c ? 'bg-[var(--indigo-deep)] text-white' : 'bg-white border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:border-[var(--indigo-deep)]'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => {
          const qty = cart.get(p.id) || 0
          const discount = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0

          return (
            <div key={p.id} className="card-divine overflow-hidden flex flex-col">
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-[var(--indigo-deep)] to-[var(--plum)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[56px] text-white/80" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {p.product_type === 'report' ? 'description' : p.product_type === 'ebook' ? 'menu_book' : p.product_type === 'consultation' ? 'support_agent' : p.product_type === 'course' ? 'auto_awesome' : 'storefront'}
                </span>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-[var(--indigo-deep)] text-sm leading-snug">{p.name}</h3>
                  {discount > 0 && <span className="text-xs bg-[var(--terracotta)] text-white px-2 py-0.5 rounded-full flex-shrink-0">{discount}% off</span>}
                </div>

                <p className="text-xs text-[var(--warm-charcoal)]/60 mb-3 flex-1 line-clamp-2">{p.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-[var(--indigo-deep)]">₹{(p.sale_price ?? p.price).toLocaleString('en-IN')}</span>
                  {p.sale_price && <span className="text-sm text-[var(--warm-charcoal)]/40 line-through">₹{p.price.toLocaleString('en-IN')}</span>}
                </div>

                {p.stock_count === 0 ? (
                  <button disabled className="w-full py-2 rounded-lg bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/30 text-sm cursor-not-allowed">Out of Stock</button>
                ) : qty === 0 ? (
                  <button onClick={() => addToCart(p)} className="btn-divine w-full py-2 text-sm">Add to Cart</button>
                ) : (
                  <div className="flex items-center justify-between bg-[var(--warm-sand)] rounded-lg p-1">
                    <button onClick={() => removeFromCart(p.id)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[var(--indigo-deep)] hover:bg-[var(--terracotta)] hover:text-white transition-all"><span className="material-symbols-outlined text-[18px]">remove</span></button>
                    <span className="font-bold text-[var(--indigo-deep)]">{qty}</span>
                    <button onClick={() => addToCart(p)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[var(--indigo-deep)] hover:bg-[var(--terracotta)] hover:text-white transition-all"><span className="material-symbols-outlined text-[18px]">add</span></button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Link href="/shop/checkout" className="flex items-center gap-3 bg-[var(--indigo-deep)] text-white px-6 py-3 rounded-2xl shadow-2xl hover:bg-[var(--indigo-deep)]/90 transition-all">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
            <span className="font-bold">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            <span className="text-white/60">·</span>
            <span className="font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
            <span className="text-sm flex items-center gap-1">Checkout <span className="material-symbols-outlined text-[16px]">arrow_forward</span></span>
          </Link>
        </div>
      )}
    </div>
  )
}
