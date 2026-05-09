import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, getAuthToken, type ApiError } from '../api/client'
import { DropdownSelect } from '../components/DropdownSelect'
import { Pagination } from '../components/Pagination'

type Auction = {
  id: number
  listing: { id: number; title: string; image_url: string | null } | null
  starts_at: string | null
  ends_at: string
  status: 'scheduled' | 'active' | 'ended'
  starting_bid: string
  min_increment: string
  current_highest_bid: string
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type IndexResponse = { data: Auction[]; meta: Meta }

export function MyAuctionsPage() {
  const [items, setItems] = useState<Auction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'scheduled' | 'active' | 'ended'>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [meta, setMeta] = useState<Meta | null>(null)

  useEffect(() => {
    if (!getAuthToken()) return
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(perPage))
    if (query.trim()) params.set('q', query.trim())
    if (status !== 'all') params.set('status', status)
    apiFetch<IndexResponse>(`/api/my/auctions?${params.toString()}`, { auth: true })
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .catch((e) => setError((e as ApiError).message ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }, [page, perPage, status])

  useEffect(() => {
    setPage(1)
  }, [perPage, status])

  if (!getAuthToken()) {
    return (
      <div className="card shadow-soft">
        <div className="card-body">
          <div className="fw-semibold mb-1">Login required</div>
          <div className="text-muted small mb-3">You need to login to view your auctions.</div>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  const statusOptions = [
    { value: 'all' as const, label: 'All status' },
    { value: 'scheduled' as const, label: 'Scheduled' },
    { value: 'active' as const, label: 'Active' },
    { value: 'ended' as const, label: 'Ended' },
  ]

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">My auctions</h1>
          <div className="text-muted small">Monitor bids and results for your auctions.</div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <input
            className="form-control"
            style={{ minWidth: 220 }}
            placeholder="Search auctions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
                setLoading(true)
                setError(null)
                const params = new URLSearchParams()
                params.set('page', '1')
                if (query.trim()) params.set('q', query.trim())
                if (status !== 'all') params.set('status', status)
                apiFetch<IndexResponse>(`/api/my/auctions?${params.toString()}`, { auth: true })
                  .then((res) => {
                    setItems(res.data)
                    setMeta(res.meta)
                  })
                  .catch((err) => setError((err as ApiError).message ?? 'Failed to load'))
                  .finally(() => setLoading(false))
              }
            }}
          />
          <div style={{ width: 190 }}>
            <DropdownSelect<'all' | 'scheduled' | 'active' | 'ended'>
              value={status}
              options={statusOptions}
              onChange={(v) => setStatus(v === '' ? 'all' : v)}
              searchable={false}
            />
          </div>
          <Link to="/auctions/new" className="btn btn-primary">
            Create auction
          </Link>
        </div>
      </div>

      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-3">
        {items.map((a) => (
          <div key={a.id} className="col-12 col-md-6 col-lg-4">
            <Link to={`/my/auctions/${a.id}`} className="text-decoration-none">
              <div className="card h-100 shadow-sm">
                {a.listing?.image_url ? (
                  <img src={a.listing.image_url} className="card-img-top sh-aspect-16x9" alt={a.listing.title} />
                ) : null}
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="fw-semibold">{a.listing?.title ?? 'Auction'}</div>
                    <span className="badge text-bg-secondary text-uppercase">{a.status}</span>
                  </div>
                  <div className="text-muted small mt-2">Ends: {new Date(a.ends_at).toLocaleString()}</div>
                  <div className="mt-2 small">
                    <div className="d-flex justify-content-between">
                      <div className="text-muted">Current</div>
                      <div>{a.current_highest_bid}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <div className="card shadow-soft">
          <div className="card-body">
            <div className="fw-semibold">No auctions yet</div>
            <div className="text-muted small">Create an auction from an approved listing.</div>
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
    </div>
  )
}

