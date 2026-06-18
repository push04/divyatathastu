'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  slug: string
}

const CATEGORIES = [
  { label: 'All', value: 'all', icon: 'apps' },
  { label: 'Reports', value: 'report', icon: 'description' },
  { label: 'Ebooks', value: 'ebook', icon: 'menu_book' },
  { label: 'Consultation', value: 'consultation', icon: 'support_agent' },
  { label: 'Yantras', value: 'yantra', icon: 'hexagon' },
  { label: 'Gemstones', value: 'gemstone', icon: 'diamond' },
  { label: 'Puja Items', value: 'physical', icon: 'temple_hindu' },
  { label: 'Herbal', value: 'herbal', icon: 'eco' },
  { label: 'Bundles', value: 'bundle', icon: 'auto_awesome' },
]

const TYPE_ICON: Record<string, string> = {
  report: 'description', ebook: 'menu_book', consultation: 'support_agent',
  yantra: 'hexagon', gemstone: 'diamond', physical: 'temple_hindu',
  course: 'school', bundle: 'auto_awesome', herbal: 'eco',
}

const TYPE_GRADIENT: Record<string, string> = {
  report: 'from-[#2F2A44] to-[#460B2F]',
  ebook: 'from-[#B9986B] to-[#C67D53]',
  consultation: 'from-emerald-600 to-teal-700',
  yantra: 'from-amber-500 to-orange-600',
  gemstone: 'from-blue-500 to-purple-700',
  physical: 'from-[#C67D53] to-rose-700',
  course: 'from-violet-600 to-purple-800',
  bundle: 'from-[#2F2A44] to-[#B9986B]',
  herbal: 'from-green-600 to-emerald-800',
}

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low → High', value: 'price_asc' },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Newest', value: 'newest' },
]

function getImageUrl(images: any): string | null {
  if (!images) return null
  if (Array.isArray(images) && images.length > 0) {
    const img = images[0]
    if (typeof img === 'string') return img
    if (img?.url) return img.url
  }
  return null
}

export default function ShopPage() {
  const supabase = createClient()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('category')
      return p && CATEGORIES.some(c => c.value === p) ? p : 'all'
    }
    return 'all'
  })
  const [sort, setSort] = useState('featured')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Map<string, number>>(new Map())
  const [cartOpen, setCartOpen] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [authModal, setAuthModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)

  useEffect(() => {
    async function load() {
      // Read localStorage synchronously before any async work
      const stored = localStorage.getItem('dt_cart')
      if (stored) {
        try { setCart(new Map(JSON.parse(stored))) } catch {}
      }
      // Parallelize both network calls - halves load time
      const [productsRes, authRes] = await Promise.all([
        supabase
          .from('products')
          .select('id,name,description,price,sale_price,product_type,images,stock_count,is_active,slug')
          .eq('is_active', true),
        supabase.auth.getUser(),
      ])
      if (productsRes.data) setProducts(productsRes.data)
      setUser(authRes.data.user)
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function saveCart(m: Map<string, number>) {
    setCart(m)
    localStorage.setItem('dt_cart', JSON.stringify([...m]))
  }

  async function addToCart(p: Product) {
    if (!user) {
      setPendingProduct(p)
      setAuthModal(true)
      return
    }
    setAddingId(p.id)
    const m = new Map(cart)
    m.set(p.id, (m.get(p.id) || 0) + 1)
    saveCart(m)
    toast.success(`${p.name} added to cart!`, { duration: 2000 })
    setTimeout(() => setAddingId(null), 700)
  }

  function removeOne(id: string) {
    const m = new Map(cart)
    if ((m.get(id) || 0) > 1) m.set(id, m.get(id)! - 1)
    else m.delete(id)
    saveCart(m)
  }

  function clearItem(id: string) {
    const m = new Map(cart)
    m.delete(id)
    saveCart(m)
  }

  let displayed = products.filter(p => {
    if (category !== 'all' && p.product_type !== category) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false
    }
    return true
  })

  if (sort === 'price_asc') displayed = [...displayed].sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price))
  else if (sort === 'price_desc') displayed = [...displayed].sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price))
  else if (sort === 'newest') displayed = [...displayed].reverse()

  const cartItems = [...cart.entries()]
    .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
    .filter(x => x.product) as { product: Product; qty: number }[]

  const cartCount = [...cart.values()].reduce((a, b) => a + b, 0)
  const cartTotal = cartItems.reduce((s, { product: p, qty }) => s + (p.sale_price ?? p.price) * qty, 0)

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'var(--kutch-white)' }}>
      {/* Hero skeleton */}
      <div className="h-40" style={{ background: 'linear-gradient(135deg, var(--indigo-deep) 0%, #460B2F 100%)' }} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category chips skeleton */}
        <div className="flex gap-2 mb-5 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full animate-pulse flex-shrink-0" style={{ background: 'rgba(47,42,68,0.08)' }} />
          ))}
        </div>
        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--warm-sand)' }}>
              <div className="h-44 animate-pulse" style={{ background: 'rgba(47,42,68,0.06)' }} />
              <div className="p-4 space-y-2">
                <div className="h-4 rounded-lg animate-pulse" style={{ background: 'rgba(47,42,68,0.06)' }} />
                <div className="h-3 rounded-lg animate-pulse w-3/4" style={{ background: 'rgba(47,42,68,0.04)' }} />
                <div className="h-3 rounded-lg animate-pulse w-1/2" style={{ background: 'rgba(47,42,68,0.04)' }} />
                <div className="h-9 rounded-xl animate-pulse mt-3" style={{ background: 'rgba(47,42,68,0.06)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--kutch-white)' }}>

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden px-6 py-10" style={{ background: 'linear-gradient(135deg, var(--indigo-deep) 0%, #460B2F 100%)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='white' stroke-width='0.6'/%3E%3C/svg%3E")` }} />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/5 text-[160px] font-bold select-none" style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>ॐ</div>

          <div className="relative max-w-5xl mx-auto">
            <p className="text-xs tracking-widest uppercase font-semibold mb-2" style={{ color: 'var(--saffron)', fontFamily: "'Sora', sans-serif" }}>Sacred Store</p>
            <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>MahaTathastu Shop</h1>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>Authentic puja items · Yantras · Gemstones · Spiritual reports</p>

            <div className="relative max-w-md">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: 'rgba(255,255,255,0.35)' }}>search</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products, yantras, gemstones..."
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; e.target.style.borderColor = 'rgba(255,255,255,0.35)' }}
                onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Cart icon */}
          <button onClick={() => setCartOpen(true)} className="absolute top-5 right-5 relative p-2.5 rounded-xl transition-all" style={{ background: 'rgba(255,255,255,0.1)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
            <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--terracotta)' }}>{cartCount}</span>
            )}
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* ── Category + Sort row ── */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
                  style={category === c.value
                    ? { background: 'var(--indigo-deep)', color: 'white', boxShadow: '0 2px 8px rgba(47,42,68,0.25)' }
                    : { background: 'white', color: 'rgba(61,52,80,0.6)', border: '1px solid var(--warm-sand)' }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg focus:outline-none flex-shrink-0"
              style={{ border: '1px solid var(--warm-sand)', background: 'white', color: 'var(--warm-charcoal)' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <p className="text-xs mb-4" style={{ color: 'rgba(61,52,80,0.4)', fontFamily: "'Sora', sans-serif" }}>
            {displayed.length} product{displayed.length !== 1 ? 's' : ''}{category !== 'all' ? ` in ${CATEGORIES.find(c => c.value === category)?.label}` : ''}{search ? ` for "${search}"` : ''}
          </p>

          {/* ── Product Grid ── */}
          {displayed.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-[64px] block mb-4" style={{ color: 'var(--warm-sand)', fontVariationSettings: "'FILL' 1" }}>storefront</span>
              <p style={{ color: 'rgba(61,52,80,0.4)' }}>No products found{search ? ` for "${search}"` : ''}</p>
              {search && <button onClick={() => setSearch('')} className="mt-3 text-sm font-medium" style={{ color: 'var(--terracotta)' }}>Clear search</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayed.map(p => {
                const qty = cart.get(p.id) || 0
                const discount = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0
                const typeKey = p.product_type || 'report'
                const imgUrl = getImageUrl(p.images)
                const isAdding = addingId === p.id
                const isOos = p.stock_count === 0
                const isLowStock = p.stock_count > 0 && p.stock_count !== -1 && p.stock_count <= 5

                return (
                  <div key={p.id} className="group bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
                    style={{ border: '1px solid var(--warm-sand)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(47,42,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(47,42,68,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = 'var(--warm-sand)' }}>

                    {/* Image */}
                    <div className="relative h-44 overflow-hidden cursor-pointer" onClick={() => setSelected(p)}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${TYPE_GRADIENT[typeKey] || TYPE_GRADIENT.report} flex items-center justify-center group-hover:scale-105 transition-transform duration-500`}>
                          <span className="material-symbols-outlined text-white/80 text-[52px]" style={{ fontVariationSettings: "'FILL' 1" }}>{TYPE_ICON[typeKey] || 'storefront'}</span>
                        </div>
                      )}

                      {discount > 0 && !isOos && (
                        <div className="absolute top-2.5 left-2.5 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--terracotta)' }}>{discount}% OFF</div>
                      )}
                      {isOos && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full">Out of Stock</span>
                        </div>
                      )}
                      {isLowStock && !isOos && (
                        <div className="absolute top-2.5 right-2.5 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.9)', color: '#78350F' }}>Only {p.stock_count} left</div>
                      )}

                      <div className="absolute bottom-2 left-2">
                        <span className="text-xs backdrop-blur-sm px-2 py-0.5 rounded-full capitalize" style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.85)' }}>{typeKey.replace('_', ' ')}</span>
                      </div>
                      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--terracotta)' }}>zoom_in</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-base leading-snug mb-1 line-clamp-2 cursor-pointer transition-colors"
                        style={{ color: 'var(--indigo-deep)', fontFamily: "'Playfair Display', serif" }}
                        onClick={() => setSelected(p)}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--terracotta)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--indigo-deep)')}>
                        {p.name}
                      </h3>
                      <p className="text-xs mb-3 flex-1 line-clamp-2" style={{ color: 'rgba(61,52,80,0.5)' }}>{p.description}</p>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base font-bold" style={{ color: 'var(--indigo-deep)' }}>
                          ₹{(p.sale_price ?? p.price).toLocaleString('en-IN')}
                        </span>
                        {p.sale_price && (
                          <span className="text-xs line-through" style={{ color: 'rgba(61,52,80,0.35)' }}>₹{p.price.toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      {isOos ? (
                        <button disabled className="w-full py-2 rounded-xl text-sm cursor-not-allowed" style={{ background: 'var(--warm-sand)', color: 'rgba(61,52,80,0.3)' }}>Out of Stock</button>
                      ) : qty === 0 ? (
                        <button onClick={() => addToCart(p)}
                          className="w-full py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                          style={isAdding
                            ? { background: '#10b981', color: 'white', transform: 'scale(0.97)' }
                            : { background: 'var(--indigo-deep)', color: 'white' }}>
                          {isAdding ? '✓ Added!' : 'Add to Cart'}
                        </button>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl p-1" style={{ background: 'var(--warm-sand)', border: '1px solid rgba(240,226,217,0.8)' }}>
                          <button onClick={() => removeOne(p.id)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center transition-all"
                            style={{ color: 'var(--indigo-deep)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--terracotta)'; e.currentTarget.style.color = 'white' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--indigo-deep)' }}>
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                          </button>
                          <span className="font-bold text-sm" style={{ color: 'var(--indigo-deep)' }}>{qty}</span>
                          <button onClick={() => addToCart(p)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center transition-all"
                            style={{ color: 'var(--indigo-deep)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--terracotta)'; e.currentTarget.style.color = 'white' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--indigo-deep)' }}>
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--warm-sand)' }}>
              <h2 className="font-bold flex items-center gap-2 text-lg" style={{ color: 'var(--indigo-deep)', fontFamily: "'Playfair Display', serif" }}>
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1", color: 'var(--terracotta)' }}>shopping_cart</span>
                Your Cart
                {cartCount > 0 && <span className="text-sm font-normal ml-1" style={{ color: 'rgba(61,52,80,0.4)' }}>({cartCount} item{cartCount !== 1 ? 's' : ''})</span>}
              </h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'rgba(61,52,80,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--warm-sand)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <span className="material-symbols-outlined text-[64px]" style={{ color: 'var(--warm-sand)', fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                  <p style={{ color: 'rgba(61,52,80,0.4)', fontFamily: "'DM Sans', sans-serif" }}>Your cart is empty</p>
                  <button onClick={() => setCartOpen(false)} className="text-sm font-semibold" style={{ color: 'var(--terracotta)' }}>Continue Shopping</button>
                </div>
              ) : cartItems.map(({ product: p, qty }) => {
                const imgUrl = getImageUrl(p.images)
                const typeKey = p.product_type || 'report'
                return (
                  <div key={p.id} className="flex gap-3 p-3 rounded-xl" style={{ border: '1px solid var(--warm-sand)', background: 'var(--kutch-white)' }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={p.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${TYPE_GRADIENT[typeKey] || TYPE_GRADIENT.report} flex items-center justify-center flex-shrink-0`}>
                        <span className="material-symbols-outlined text-[22px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{TYPE_ICON[typeKey]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--indigo-deep)' }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(61,52,80,0.5)' }}>₹{(p.sale_price ?? p.price).toLocaleString('en-IN')} × {qty}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--terracotta)' }}>₹{((p.sale_price ?? p.price) * qty).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <button onClick={() => clearItem(p.id)} style={{ color: 'rgba(61,52,80,0.3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(61,52,80,0.3)')}>
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => removeOne(p.id)} className="w-6 h-6 rounded-md flex items-center justify-center transition-all text-[14px]"
                          style={{ background: 'var(--warm-sand)', color: 'var(--indigo-deep)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--terracotta)'; e.currentTarget.style.color = 'white' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--warm-sand)'; e.currentTarget.style.color = 'var(--indigo-deep)' }}>
                          <span className="material-symbols-outlined text-[14px]">remove</span>
                        </button>
                        <span className="w-5 text-center text-sm font-bold" style={{ color: 'var(--indigo-deep)' }}>{qty}</span>
                        <button onClick={() => addToCart(p)} className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
                          style={{ background: 'var(--warm-sand)', color: 'var(--indigo-deep)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--terracotta)'; e.currentTarget.style.color = 'white' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--warm-sand)'; e.currentTarget.style.color = 'var(--indigo-deep)' }}>
                          <span className="material-symbols-outlined text-[14px]">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--warm-sand)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--warm-charcoal)' }}>Subtotal</span>
                  <span className="text-xl font-bold" style={{ color: 'var(--indigo-deep)', fontFamily: "'Playfair Display', serif" }}>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(61,52,80,0.4)' }}>Taxes & shipping calculated at checkout</p>
                <Link href="/shop/checkout" onClick={() => setCartOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-98"
                  style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #460B2F)' }}>
                  Proceed to Checkout
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Product Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col">
            {/* Image */}
            <div className="relative h-56 flex-shrink-0">
              {getImageUrl(selected.images) ? (
                <img src={getImageUrl(selected.images)!} alt={selected.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${TYPE_GRADIENT[selected.product_type || 'report'] || TYPE_GRADIENT.report} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-white/80 text-[72px]" style={{ fontVariationSettings: "'FILL' 1" }}>{TYPE_ICON[selected.product_type || 'report']}</span>
                </div>
              )}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white transition-all hover:bg-black/60">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              {selected.sale_price && (
                <div className="absolute top-3 left-3 text-sm font-bold px-2.5 py-1 rounded-full text-white" style={{ background: 'var(--terracotta)' }}>
                  {Math.round((1 - selected.sale_price / selected.price) * 100)}% OFF
                </div>
              )}
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize inline-block mb-2" style={{ background: 'var(--warm-sand)', color: 'rgba(61,52,80,0.6)' }}>
                    {selected.product_type?.replace(/_/g, ' ')}
                  </span>
                  <h2 className="text-xl font-bold leading-snug" style={{ color: 'var(--indigo-deep)', fontFamily: "'Playfair Display', serif" }}>{selected.name}</h2>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold" style={{ color: 'var(--indigo-deep)', fontFamily: "'Playfair Display', serif" }}>
                    ₹{(selected.sale_price ?? selected.price).toLocaleString('en-IN')}
                  </p>
                  {selected.sale_price && (
                    <p className="text-sm line-through" style={{ color: 'rgba(61,52,80,0.35)' }}>₹{selected.price.toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: 'rgba(61,52,80,0.7)' }}>{selected.description || 'No description available.'}</p>

              {selected.stock_count !== -1 && selected.stock_count > 0 && selected.stock_count <= 5 && (
                <p className="text-xs font-semibold mt-4 flex items-center gap-1.5" style={{ color: '#d97706' }}>
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  Only {selected.stock_count} left in stock - order soon!
                </p>
              )}
            </div>

            <div className="p-4" style={{ borderTop: '1px solid var(--warm-sand)' }}>
              {selected.stock_count === 0 ? (
                <button disabled className="w-full py-3 rounded-xl text-sm cursor-not-allowed" style={{ background: 'var(--warm-sand)', color: 'rgba(61,52,80,0.3)' }}>Out of Stock</button>
              ) : (
                <button onClick={() => { addToCart(selected); setSelected(null) }}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-98"
                  style={{ background: 'linear-gradient(135deg, var(--terracotta), #C67D53)' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_shopping_cart</span>
                  Add to Cart - ₹{(selected.sale_price ?? selected.price).toLocaleString('en-IN')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Cart Bar ── */}
      {/* Auth Modal - shown when unauthenticated user tries to add to cart */}
      {authModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, var(--indigo-deep) 0%, #460B2F 100%)' }}>
              <div className="text-5xl mb-2" style={{ color: 'rgba(212,160,67,0.3)', fontFamily: "'Playfair Display', serif" }}>ॐ</div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Sign in to continue</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {pendingProduct ? `Add "${pendingProduct.name}" to your cart` : 'Please sign in to shop'}
              </p>
            </div>
            <div className="p-6 space-y-3">
              <Link
                href={`/login?redirect=/shop`}
                className="block w-full text-center py-3 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--terracotta)' }}
                onClick={() => setAuthModal(false)}
              >
                Sign In
              </Link>
              <Link
                href={`/register?redirect=/shop`}
                className="block w-full text-center py-3 rounded-xl font-semibold text-sm border transition-colors hover:bg-[var(--warm-sand)]/40"
                style={{ color: 'var(--indigo-deep)', borderColor: 'var(--outline-variant, #D8D0C8)' }}
                onClick={() => setAuthModal(false)}
              >
                Create Free Account
              </Link>
              <button
                onClick={() => { setAuthModal(false); setPendingProduct(null) }}
                className="block w-full text-center py-2 text-xs font-medium"
                style={{ color: 'rgba(28,30,74,0.4)' }}
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm">
          <button onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 w-full px-5 py-3.5 rounded-2xl text-white font-semibold shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--indigo-deep), #460B2F)' }}>
            <span className="relative flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--terracotta)' }}>{cartCount}</span>
            </span>
            <span className="flex-1 text-left text-sm">{cartCount} item{cartCount !== 1 ? 's' : ''} · ₹{cartTotal.toLocaleString('en-IN')}</span>
            <span className="text-sm flex items-center gap-1 opacity-80">
              View Cart
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </span>
          </button>
        </div>
      )}
    </>
  )
}
