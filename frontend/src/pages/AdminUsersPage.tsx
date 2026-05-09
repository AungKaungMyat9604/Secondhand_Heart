import { useEffect, useState } from 'react'
import { apiFetch, type ApiError } from '../api/client'
import { useMe } from '../auth/useMe'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DropdownSelect } from '../components/DropdownSelect'
import { Pagination } from '../components/Pagination'

type UserRow = {
  id: number
  name: string
  email: string
  role: 'user' | 'admin'
  is_banned: boolean
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type Paginated<T> = { data: T[]; meta: Meta }

export function AdminUsersPage() {
  const { me } = useMe()
  const [users, setUsers] = useState<UserRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<null | { user: UserRow; action: 'ban' | 'unban' | 'makeAdmin' | 'makeUser' }>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<'all' | 'admin' | 'user'>('all')
  const [banned, setBanned] = useState<'all' | '1' | '0'>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(30)
  const [meta, setMeta] = useState<Meta | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(perPage))
      if (query.trim()) params.set('q', query.trim())
      if (role !== 'all') params.set('role', role)
      if (banned !== 'all') params.set('banned', banned)

      const res = await apiFetch<Paginated<UserRow>>(`/api/admin/users?${params.toString()}`, { auth: true })
      setUsers(res.data)
      setMeta(res.meta)
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [page, perPage, role, banned])

  useEffect(() => {
    setPage(1)
  }, [perPage, role, banned])

  if (me && me.role !== 'admin') {
    return <div className="alert alert-warning">Admin access required.</div>
  }

  const roleOptions = [
    { value: 'all' as const, label: 'All roles' },
    { value: 'admin' as const, label: 'Admin' },
    { value: 'user' as const, label: 'User' },
  ]

  const statusOptions = [
    { value: 'all' as const, label: 'All status' },
    { value: '0' as const, label: 'Active' },
    { value: '1' as const, label: 'Banned' },
  ]

  async function perform() {
    if (!confirm) return
    setBusy(true)
    try {
      if (confirm.action === 'ban' || confirm.action === 'unban') {
        await apiFetch(`/api/admin/users/${confirm.user.id}/ban`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify({ is_banned: confirm.action === 'ban' }),
        })
      } else {
        await apiFetch(`/api/admin/users/${confirm.user.id}/role`, {
          method: 'PUT',
          auth: true,
          body: JSON.stringify({ role: confirm.action === 'makeAdmin' ? 'admin' : 'user' }),
        })
      }
      await load()
    } catch (e) {
      setError((e as ApiError).message ?? 'Action failed')
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">Admin: users</h1>
          <div className="text-muted small">Manage roles and ban status.</div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <input
            className="form-control"
            style={{ minWidth: 220 }}
            placeholder="Search name/email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
                void load()
              }
            }}
          />
          <div style={{ width: 180 }}>
            <DropdownSelect<'all' | 'admin' | 'user'>
              value={role}
              options={roleOptions}
              onChange={(v) => setRole(v === '' ? 'all' : v)}
              searchable={false}
            />
          </div>
          <div style={{ width: 180 }}>
            <DropdownSelect<'all' | '1' | '0'>
              value={banned}
              options={statusOptions}
              onChange={(v) => setBanned(v === '' ? 'all' : v)}
              searchable={false}
            />
          </div>
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              setPage(1)
              void load()
            }}
            disabled={loading}
          >
            Search
          </button>
        </div>
      </div>

      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className="badge text-bg-secondary">{u.role}</span>
                </td>
                <td>{u.is_banned ? <span className="badge text-bg-danger">banned</span> : <span className="badge text-bg-success">active</span>}</td>
                <td className="text-end">
                  <div className="d-inline-flex gap-2">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setConfirm({ user: u, action: u.role === 'admin' ? 'makeUser' : 'makeAdmin' })}
                    >
                      {u.role === 'admin' ? 'Make user' : 'Make admin'}
                    </button>
                    <button
                      className={`btn btn-sm ${u.is_banned ? 'btn-outline-success' : 'btn-outline-danger'}`}
                      onClick={() => setConfirm({ user: u, action: u.is_banned ? 'unban' : 'ban' })}
                    >
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        meta={meta}
        className="mt-3"
        perPage={perPage}
        onPerPageChange={(n) => {
          setPage(1)
          setPerPage(n)
        }}
        onPageChange={(p) => setPage(p)}
      />

      <ConfirmDialog
        isOpen={confirm !== null}
        title="Confirm action"
        body={
          confirm
            ? `${confirm.action} for ${confirm.user.email}?`
            : ''
        }
        confirmText="Confirm"
        confirmVariant={confirm?.action === 'ban' ? 'danger' : 'primary'}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void perform()}
      />
    </div>
  )
}

