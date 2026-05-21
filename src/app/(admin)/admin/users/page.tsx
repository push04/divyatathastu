'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface User {
  id: string
  full_name: string
  phone: string | null
  role: 'user' | 'admin' | 'expert'
  is_active: boolean
  created_at: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  expert: 'bg-violet-100 text-violet-700',
  user: 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60',
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase.from('profiles').select('id,full_name,phone,role,is_active,created_at').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleActive(userId: string, active: boolean) {
    const { error } = await supabase.from('profiles').update({ is_active: !active }).eq('id', userId)
    if (error) toast.error('Failed')
    else { toast.success(active ? 'Deactivated' : 'Activated'); setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !active } : u)) }
  }

  async function changeRole(userId: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role: role as 'user' | 'admin' | 'expert' }).eq('id', userId)
    if (error) toast.error('Failed to update role')
    else { toast.success('Role updated'); setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as 'user' | 'admin' | 'expert' } : u)) }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          Users <span className="text-[var(--warm-charcoal)]/40 font-normal">({users.length})</span>
        </h1>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--warm-charcoal)]/40">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-8 pr-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm w-full focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]"
          />
        </div>
      </div>

      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--warm-sand)]/60">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-[var(--warm-sand)]/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--indigo-deep)]">{u.full_name}</p>
                    <p className="text-[var(--warm-charcoal)]/40 text-xs">{u.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u.id, u.is_active)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${u.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60 hover:bg-red-100 hover:text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[u.role] || 'bg-[var(--warm-sand)] text-[var(--warm-charcoal)]/60'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--warm-charcoal)]/40 text-xs">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="text-xs border border-[var(--warm-sand)] rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="expert">expert</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-[40px] text-[var(--warm-charcoal)]/20 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <p className="text-[var(--warm-charcoal)]/40 text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
