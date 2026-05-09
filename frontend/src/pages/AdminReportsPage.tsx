import { useEffect, useState } from 'react'
import { apiFetch, type ApiError } from '../api/client'
import { useMe } from '../auth/useMe'
import { DropdownSelect } from '../components/DropdownSelect'
import { Pagination } from '../components/Pagination'

type ReportRow = {
  id: number
  listing_id: number
  reporter_id: number
  reason: string
  status: 'open' | 'resolved'
  admin_notes: string | null
  created_at: string
  listing?: { id: number; title: string } | null
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type Paginated<T> = { data: T[]; meta: Meta }

export function AdminReportsPage() {
  const { me } = useMe()
  const [items, setItems] = useState<ReportRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolveId, setResolveId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'open' | 'resolved'>('all')
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
      if (status !== 'all') params.set('status', status)
      const res = await apiFetch<Paginated<ReportRow>>(`/api/admin/reports?${params.toString()}`, { auth: true })
      setItems(res.data)
      setMeta(res.meta)
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [page, perPage, status])

  useEffect(() => {
    setPage(1)
  }, [perPage, status])

  if (me && me.role !== 'admin') {
    return <div className="alert alert-warning">Admin access required.</div>
  }

  const statusOptions = [
    { value: 'all' as const, label: 'All' },
    { value: 'open' as const, label: 'Open' },
    { value: 'resolved' as const, label: 'Resolved' },
  ]

  async function resolve() {
    if (resolveId === null) return
    setBusy(true)
    setError(null)
    try {
      await apiFetch(`/api/admin/reports/${resolveId}/resolve`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({ admin_notes: notes || null }),
      })
      setResolveId(null)
      setNotes('')
      await load()
    } catch (e) {
      setError((e as ApiError).message ?? 'Resolve failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">Admin: reports</h1>
          <div className="text-muted small">Review and resolve inappropriate listing reports.</div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <input
            className="form-control"
            style={{ minWidth: 220 }}
            placeholder="Search reason/listing…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
                void load()
              }
            }}
          />
          <div style={{ width: 190 }}>
            <DropdownSelect<'all' | 'open' | 'resolved'>
              value={status}
              options={statusOptions}
              onChange={(v) => setStatus(v === '' ? 'all' : v)}
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

      <div className="list-group">
        {items.map((r) => (
          <div key={r.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <div className="fw-semibold">
                  Report for {r.listing?.title ?? 'a listing'}
                </div>
                <div className="text-muted small">
                  {new Date(r.created_at).toLocaleString()}
                </div>
                <div className="mt-2">{r.reason}</div>
                {r.status === 'resolved' ? (
                  <div className="mt-2 text-muted small">
                    Resolved {r.admin_notes ? `• Notes: ${r.admin_notes}` : ''}
                  </div>
                ) : null}
              </div>
              <div className="text-end">
                <span className={`badge ${r.status === 'open' ? 'text-bg-warning' : 'text-bg-success'}`}>
                  {r.status}
                </span>
                {r.status === 'open' ? (
                  <div className="mt-2">
                    <button className="btn btn-sm btn-primary" onClick={() => setResolveId(r.id)}>
                      Resolve
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <div className="card shadow-soft mt-3">
          <div className="card-body">
            <div className="fw-semibold">No reports</div>
            <div className="text-muted small">User-submitted reports will show up here.</div>
          </div>
        </div>
      ) : null}

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

      {resolveId !== null ? (
        <div
          className="modal fade show"
          role="dialog"
          aria-modal="true"
          style={{ display: 'block', background: 'rgba(2,6,23,0.55)' }}
          onClick={() => (!busy ? setResolveId(null) : null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-soft">
              <div className="modal-header">
                <h5 className="modal-title">Resolve report</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setResolveId(null)} disabled={busy} />
              </div>
              <div className="modal-body">
                <label className="form-label" htmlFor="notes">
                  Admin notes (optional)
                </label>
                <textarea id="notes" className="form-control" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setResolveId(null)} disabled={busy}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => void resolve()} disabled={busy}>
                  {busy ? 'Resolving…' : 'Resolve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

