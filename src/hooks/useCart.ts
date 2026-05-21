'use client'

import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

export function useCart() {
  const store = useCartStore()

  function addToCart(item: { id: string; name: string; price: number; image_emoji?: string; category?: string }) {
    store.addItem(item)
    toast.success(`${item.name} added to cart`)
  }

  function removeFromCart(id: string, name?: string) {
    store.removeItem(id)
    if (name) toast.success(`${name} removed`)
  }

  return {
    items: store.items,
    total: store.total(),
    count: store.count(),
    addToCart,
    removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
  }
}
