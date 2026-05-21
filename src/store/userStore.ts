import { create } from 'zustand'

interface Profile {
  id: string
  email?: string
  full_name?: string
  phone?: string
  role?: string
  plan?: string
  avatar_url?: string
}

interface UserState {
  user: any | null
  profile: Profile | null
  loading: boolean
  setUser: (user: any) => void
  setProfile: (profile: Profile) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ user: null, profile: null, loading: false }),
}))
