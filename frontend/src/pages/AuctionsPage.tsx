import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, type ApiError } from '../api/client'

type Auction = {
  id: number
  listing: { id: number; title: string; image_url: string | null } | null
  starts_at: string | null
  ends_at: string
  status: 'scheduled' | 'active' | 'ended'
  min_increment: string
  current_highest_bid: string | null
}

type AuctionIndexResponse = {
  data: Auction[]
}

export function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<AuctionIndexResponse>('/api/auctions')
      .then((res) => setAuctions(res.data))
      .catch((e) => {
        const err = e as ApiError
        setError(err.message ?? 'Failed to load auctions')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-3">
        <h1 className="h4 mb-1">Auctions</h1>
        <div className="text-muted small">Browse active and scheduled auctions.</div>
      </div>

      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-3">
        {auctions.map((a) => (
          <div key={a.id} className="col-12 col-md-6 col-lg-4">
            <Link className="text-decoration-none" to={`/browse/auctions/${a.id}`}>
              <div className="card h-100 shadow-sm">
                {a.listing?.image_url ? (
                  <img
                    src={a.listing.image_url}
                    className="card-img-top"
                    alt={a.listing.title}
                    style={{ objectFit: 'cover', height: 180 }}
                  />
                ) : null}
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="fw-semibold">
                      {a.listing?.title ?? 'Auction'}
                    </div>
                    <span className="badge text-bg-secondary text-uppercase">
                      {a.status}
                    </span>
                  </div>
                  <div className="text-muted small mt-2">
                    Ends: {new Date(a.ends_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {!loading && auctions.length === 0 ? (
        <div className="card shadow-soft mt-3">
          <div className="card-body">
            <div className="fw-semibold">No auctions yet</div>
            <div className="text-muted small">
              Create an auction from an approved listing (seller flow UI can be expanded next).
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

