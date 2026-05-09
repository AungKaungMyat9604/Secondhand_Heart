import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, getAuthToken, type ApiError } from '../api/client'
import { Pagination } from '../components/Pagination'

type MyBidRow = {
  auction_id: number
  listing: { id: number; title: string } | null
  status: string
  is_winner?: boolean
  ends_at: string
  your_latest_bid: { id: number; amount: string; created_at: string }
}

type MyWinRow = {
  auction_id: number
  listing: { id: number; title: string; image_url: string | null } | null
  ends_at: string
}

export function MyActivityPage() {
  const [tab, setTab] = useState<'bids' | 'wins'>('bids')
  const [bids, setBids] = useState<MyBidRow[]>([])
  const [wins, setWins] = useState<MyWinRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [meta, setMeta] = useState<any>(null)

  useEffect(() => {
    if (!getAuthToken()) return
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(perPage))
    if (query.trim()) params.set('q', query.trim())
    const req =
      tab === 'bids'
        ? apiFetch<{ data: MyBidRow[]; meta: any }>(`/api/my/bids?${params.toString()}`, { auth: true }).then((r) => {
            setBids(r.data)
            setMeta(r.meta)
          })
        : apiFetch<{ data: MyWinRow[]; meta: any }>(`/api/my/wins?${params.toString()}`, { auth: true }).then((r) => {
            setWins(r.data)
            setMeta(r.meta)
          })

    req.catch((e) => setError((e as ApiError).message ?? 'Failed to load')).finally(() => setLoading(false))
  }, [tab, page, perPage])

  useEffect(() => {
    setPage(1)
  }, [tab, perPage])

  if (!getAuthToken()) {
    return (
      <div className="card shadow-soft">
        <div className="card-body">
          <div className="fw-semibold mb-1">Login required</div>
          <div className="text-muted small mb-3">Login to see your bids and wins.</div>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">My activity</h1>
          <div className="text-muted small">Track your bids and auction wins.</div>
        </div>
        <div className="d-flex gap-2">
          <input
            className="form-control"
            style={{ minWidth: 240 }}
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
              }
            }}
          />
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              setPage(1)
            }}
            disabled={loading}
          >
            Search
          </button>
        </div>
      </div>

      <div className="btn-group mb-3" role="tablist">
        <button className={`btn ${tab === 'bids' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('bids')}>
          My bids
        </button>
        <button className={`btn ${tab === 'wins' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('wins')}>
          My wins
        </button>
      </div>

      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      {tab === 'bids' ? (
        <div className="list-group">
          {bids.map((r) => (
            <Link key={r.auction_id} to={`/browse/auctions/${r.auction_id}`} className="list-group-item list-group-item-action">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div className="fw-semibold">{r.listing?.title ?? 'Auction'}</div>
                  <div className="text-muted small">
                    Latest bid: {r.your_latest_bid.amount} • Ends: {new Date(r.ends_at).toLocaleString()}
                  </div>
                </div>
                <div className="d-flex flex-column align-items-end gap-1">
                  {r.is_winner ? <span className="badge text-bg-success">Won</span> : null}
                  <span className="badge text-bg-secondary text-uppercase">{r.status}</span>
                </div>
              </div>
            </Link>
          ))}
          {!loading && bids.length === 0 ? (
            <div className="card shadow-soft">
              <div className="card-body">
                <div className="fw-semibold">No bids yet</div>
                <div className="text-muted small">Browse auctions and place your first bid.</div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="row g-3">
          {wins.map((w) => (
            <div key={w.auction_id} className="col-12 col-md-6 col-lg-4">
              <Link to={`/browse/auctions/${w.auction_id}`} className="text-decoration-none">
                <div className="card h-100 shadow-sm">
                  {w.listing?.image_url ? (
                    <img src={w.listing.image_url} className="card-img-top sh-aspect-16x9" alt={w.listing.title} />
                  ) : null}
                  <div className="card-body">
                    <div className="fw-semibold">{w.listing?.title ?? 'Auction'}</div>
                    <div className="text-muted small mt-2">Ended: {new Date(w.ends_at).toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
          {!loading && wins.length === 0 ? (
            <div className="card shadow-soft">
              <div className="card-body">
                <div className="fw-semibold">No wins yet</div>
                <div className="text-muted small">When you win an auction, it will show here.</div>
              </div>
            </div>
          ) : null}
        </div>
      )}

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

