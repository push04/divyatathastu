'use client'

import { useEffect, useState } from 'react'

interface BundlePrice {
  price: number | null
  sale_price: number | null
  name: string | null
  loading: boolean
}

export function useBundlePrice(slug = 'full-tathastu-bundle'): BundlePrice {
  const [state, setState] = useState<BundlePrice>({ price: null, sale_price: null, name: null, loading: true })

  useEffect(() => {
    fetch(`/api/product-price?slug=${slug}`)
      .then(r => r.json())
      .then(d => setState({ price: d.price, sale_price: d.sale_price, name: d.name, loading: false }))
      .catch(() => setState({ price: null, sale_price: null, name: null, loading: false }))
  }, [slug])

  return state
}
