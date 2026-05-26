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

const EMPTY_CREATE = { email: '', password: '', full_name: '', phone: '', role: 'user' }

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [creating, setCreating] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('id,full_name,phone,role,is_active,created_at')
      .order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleActive(userId: string, active: boolean) {
    const { error } = await supabase.from('profiles').update({ is_active: !active }).eq('id', userId)
    if (error) toast.error('Failed')
    else {
      toast.success(active ? 'Deactivated' : 'Activated')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !active } : u))
    }
  }

  async function changeRole(userId: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role: role as User['role'] }).eq('id', userId)
    if (error) toast.error('Failed to update role')
    else {
      toast.success('Role updated')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as User['role'] } : u))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      toast.error('Email, password, and name are required')
      return
    }
    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setCreating(true)
    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Failed to create user')
    } else {
      toast.success('User created successfully!')
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
      await load()
    }
    setCreating(false)
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]'

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-3xl animate-spin-slow text-[var(--terracotta)]">ॐ</div></div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--indigo-deep)] flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          Users <span className="text-[var(--warm-charcoal)]/40 font-normal">({users.length})</span>
        </h1>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-56">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--warm-charcoal)]/40">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-8 pr-3 py-2 rounded-lg border border-[var(--warm-sand)] text-sm w-full focus:outline-none focus:border-[var(--saffron)] bg-white text-[var(--warm-charcoal)]"
            />
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-divine px-4 py-2 text-sm inline-flex items-center gap-1 whitespace-nowrap">
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Create User
          </button>
        </div>
      </div>

      <div className="card-divine overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--warm-sand)]/40 border-b border-[var(--warm-sand)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--warm-charcoal)]/60 text-xs uppercase tracking-wide">Change Role</th>
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

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--warm-sand)]">
              <h2 className="font-bold text-[var(--indigo-deep)] text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                Create New User
              </h2>
              <button onClick={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE) }} className="text-[var(--warm-charcoal)]/40 hover:text-[var(--warm-charcoal)] p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Full Name *</label>
                <input type="text" value={createForm.full_name} onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls} placeholder="Ramesh Sharma" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Email Address *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="user@example.com" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Password *</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} className={inputCls} placeholder="Min 6 characters" required minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Phone</label>
                <input type="tel" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--warm-charcoal)]/60 mb-1 uppercase tracking-wide">Role / Designation</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
                  <option value="user">User (regular member)</option>
                  <option value="expert">Expert (astrologer / consultant)</option>
                  <option value="admin">Admin (full access)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE) }} className="flex-1 px-4 py-2 rounded-xl border border-[var(--warm-sand)] text-sm font-medium text-[var(--warm-charcoal)]/60 hover:bg-[var(--warm-sand)]/40 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 btn-divine px-4 py-2 text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">{creating ? 'hourglass_empty' : 'person_add'}</span>
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
