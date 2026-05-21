import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_emoji?: string
  category?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(i => i.id === item.id)
        if (existing) {
          set(s => ({ items: s.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }))
        } else {
          set(s => ({ items: [...s.items, { ...item, quantity: 1 }] }))
        }
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set(s => ({ items: s.items.filter(i => i.id !== id) }))
        } else {
          set(s => ({ items: s.items.map(i => i.id === id ? { ...i, quantity } : i) }))
        }
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    { name: 'divya-cart' }
  )
)
