import { useEffect, useState } from 'react'
import { apiFetch, type ApiError } from '../api/client'
import { useMe } from '../auth/useMe'
import { DropdownSelect } from '../components/DropdownSelect'
import { Pagination } from '../components/Pagination'

type AuctionRow = {
  id: number
  status: string
  ends_at: string
  bid_count: number
  listing: { id: number; title: string } | null
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type Paginated<T> = { data: T[]; meta: Meta }
type BidRow = {
  id: number
  bidder_id: number
  bidder_name?: string | null
  bidder_email?: string | null
  amount: string
  created_at: string
}

export function AdminAuctionsPage() {
  const { me } = useMe()
  const [items, setItems] = useState<AuctionRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [bidsFor, setBidsFor] = useState<null | { auction: AuctionRow; bids: BidRow[] }>(null)
  const [bidsLoading, setBidsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'scheduled' | 'active' | 'ended'>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(30)
  const [meta, setMeta] = useState<Meta | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(perPage))
    if (query.trim()) params.set('q', query.trim())
    if (status !== 'all') params.set('status', status)
    apiFetch<Paginated<AuctionRow>>(`/api/admin/auctions?${params.toString()}`, { auth: true })
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .catch((e) => setError((e as ApiError).message ?? 'Failed to load auctions'))
      .finally(() => setLoading(false))
  }, [page, perPage, status])

  useEffect(() => {
    setPage(1)
  }, [perPage, status])

  if (me && me.role !== 'admin') {
    return <div className="alert alert-warning">Admin access required.</div>
  }

  const statusOptions = [
    { value: 'all' as const, label: 'All status' },
    { value: 'scheduled' as const, label: 'Scheduled' },
    { value: 'active' as const, label: 'Active' },
    { value: 'ended' as const, label: 'Ended' },
  ]

  async function openBids(a: AuctionRow) {
    setBidsLoading(true)
    setError(null)
    try {
      const res = await apiFetch<Paginated<BidRow>>(`/api/admin/auctions/${a.id}/bids`, { auth: true })
      setBidsFor({ auction: a, bids: res.data })
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load bids')
    } finally {
      setBidsLoading(false)
    }
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">Admin: auctions</h1>
          <div className="text-muted small">Basic monitoring: bid counts and status.</div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <input
            className="form-control"
            style={{ minWidth: 220 }}
            placeholder="Search listing title…"
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
                apiFetch<Paginated<AuctionRow>>(`/api/admin/auctions?${params.toString()}`, { auth: true })
                  .then((res) => {
                    setItems(res.data)
                    setMeta(res.meta)
                  })
                  .catch((err) => setError((err as ApiError).message ?? 'Failed to load auctions'))
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
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              setPage(1)
              setLoading(true)
              setError(null)
              const params = new URLSearchParams()
              params.set('page', '1')
              if (query.trim()) params.set('q', query.trim())
              if (status !== 'all') params.set('status', status)
              apiFetch<Paginated<AuctionRow>>(`/api/admin/auctions?${params.toString()}`, { auth: true })
                .then((res) => {
                  setItems(res.data)
                  setMeta(res.meta)
                })
                .catch((err) => setError((err as ApiError).message ?? 'Failed to load auctions'))
                .finally(() => setLoading(false))
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
              <th>Listing</th>
              <th>Status</th>
              <th>Ends</th>
              <th className="text-end">Bids</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.listing?.title ?? '—'}</td>
                <td>
                  <span className="badge text-bg-secondary text-uppercase">{a.status}</span>
                </td>
                <td>{a.ends_at ? new Date(a.ends_at).toLocaleString() : '—'}</td>
                <td className="text-end">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => void openBids(a)} disabled={bidsLoading}>
                    View bids ({a.bid_count})
                  </button>
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

      {bidsFor ? (
        <div
          className="modal fade show"
          role="dialog"
          aria-modal="true"
          style={{ display: 'block', background: 'rgba(2,6,23,0.55)' }}
          onClick={() => setBidsFor(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-soft">
              <div className="modal-header">
                <h5 className="modal-title">Bids</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setBidsFor(null)} />
              </div>
              <div className="modal-body">
                {bidsFor.bids.length === 0 ? (
                  <div className="text-muted">No bids yet.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Bidder</th>
                          <th className="text-end">Amount</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bidsFor.bids.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <div className="fw-semibold">{b.bidder_name ?? `User #${b.bidder_id}`}</div>
                              {b.bidder_email ? <div className="text-muted small">{b.bidder_email}</div> : null}
                            </td>
                            <td className="text-end">{b.amount}</td>
                            <td>{new Date(b.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setBidsFor(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

