import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, type ApiError } from '../api/client'
import { Pagination } from '../components/Pagination'

type Listing = {
  id: number
  title: string
  description: string | null
  condition: string | null
  image_url: string | null
  seller: { id: number; name: string; avatar_url: string | null } | null
  sale_type: 'auction' | 'sellings'
  status: string
  price: string | null
  created_at: string
}

type Auction = {
  id: number
  listing: { id: number; title: string; image_url: string | null } | null
  starts_at: string | null
  ends_at: string
  status: 'scheduled' | 'active' | 'ended'
  min_increment: string
  current_highest_bid: string | null
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type Paginated<T> = { data: T[]; meta: Meta }

export function BrowsePage() {
  const [tab, setTab] = useState<'sellings' | 'auctions'>('sellings')
  const [query, setQuery] = useState('')

  const [listings, setListings] = useState<Listing[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [buyNowPage, setBuyNowPage] = useState(1)
  const [auctionPage, setAuctionPage] = useState(1)
  const [buyNowPerPage, setBuyNowPerPage] = useState(20)
  const [auctionPerPage, setAuctionPerPage] = useState(20)
  const [buyNowMeta, setBuyNowMeta] = useState<Meta | null>(null)
  const [auctionMeta, setAuctionMeta] = useState<Meta | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set('q', query.trim())
    if (tab === 'sellings') {
      const lp = new URLSearchParams()
      lp.set('page', String(buyNowPage))
      lp.set('per_page', String(buyNowPerPage))
      lp.set('sale_type', 'sellings')
      if (query.trim()) lp.set('q', query.trim())
      apiFetch<Paginated<Listing>>(`/api/listings?${lp.toString()}`)
        .then((l) => {
          setListings(l.data)
          setBuyNowMeta(l.meta)
        })
        .catch((e) => setError((e as ApiError).message ?? 'Failed to load browse'))
        .finally(() => setLoading(false))
    } else {
      const ap = new URLSearchParams()
      ap.set('page', String(auctionPage))
      ap.set('per_page', String(auctionPerPage))
      if (query.trim()) ap.set('q', query.trim())
      apiFetch<Paginated<Auction>>(`/api/auctions?${ap.toString()}`)
        .then((a) => {
          setAuctions(a.data)
          setAuctionMeta(a.meta)
        })
        .catch((e) => setError((e as ApiError).message ?? 'Failed to load browse'))
        .finally(() => setLoading(false))
    }
    void params
  }, [tab, buyNowPage, buyNowPerPage, auctionPage, auctionPerPage])

  useEffect(() => {
    setBuyNowPage(1)
    setAuctionPage(1)
  }, [tab])

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">Browse</h1>
          <div className="text-muted small">Sellings (fixed price) and auctions (bidding) in one place.</div>
        </div>
        <div className="d-flex gap-2">
          <input
            className="form-control"
            style={{ minWidth: 260 }}
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="btn btn-outline-primary"
            onClick={() => {
              if (tab === 'sellings') setBuyNowPage(1)
              else setAuctionPage(1)
              setLoading(true)
              setError(null)
              const lp = new URLSearchParams()
              if (tab === 'sellings') {
                lp.set('page', '1')
                lp.set('sale_type', 'sellings')
              } else {
                lp.set('page', '1')
              }
              if (query.trim()) lp.set('q', query.trim())
              const url = tab === 'sellings' ? `/api/listings?${lp.toString()}` : `/api/auctions?${lp.toString()}`
              apiFetch<any>(url)
                .then((res) => {
                  if (tab === 'sellings') {
                    setListings(res.data)
                    setBuyNowMeta(res.meta)
                  } else {
                    setAuctions(res.data)
                    setAuctionMeta(res.meta)
                  }
                })
                .catch((e) => setError((e as ApiError).message ?? 'Failed to load browse'))
                .finally(() => setLoading(false))
            }}
            disabled={loading}
          >
            Search
          </button>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className={`btn btn-sm ${tab === 'sellings' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setTab('sellings')}
        >
          Sellings
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'auctions' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setTab('auctions')}
        >
          Auctions
        </button>
      </div>

      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      {tab === 'sellings' ? (
        <>
          <div className="row g-3">
            {listings.map((l) => (
              <div key={l.id} className="col-12 col-md-6 col-lg-4">
                <Link to={`/browse/listings/${l.id}`} className="text-decoration-none">
                  <div className="card h-100">
                    {l.image_url ? <img src={l.image_url} className="card-img-top sh-aspect-16x9" alt={l.title} /> : null}
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="fw-semibold text-body">{l.title}</div>
                        {l.price ? <span className="badge text-bg-success">Price: {l.price}</span> : null}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          {l.seller?.avatar_url ? (
                            <img
                              src={l.seller.avatar_url}
                              alt=""
                              width={18}
                              height={18}
                              style={{ borderRadius: 999, objectFit: 'cover' }}
                            />
                          ) : (
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 999,
                                background: 'rgba(15,23,42,0.08)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                              aria-hidden="true"
                            >
                              {(l.seller?.name?.[0] ?? 'U').toUpperCase()}
                            </span>
                          )}
                          <span>By {l.seller?.name ?? 'Unknown'}</span>
                        </div>
                        <div className="text-muted small">Posted {new Date(l.created_at).toLocaleString()}</div>
                      </div>
                      {l.description ? <div className="text-muted small mt-2 sh-line-clamp-2">{l.description}</div> : null}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          {!loading && listings.length === 0 ? (
            <div className="card shadow-soft">
              <div className="card-body">
                <div className="fw-semibold">No sellings items</div>
                <div className="text-muted small">Try switching to Auctions or clearing your search.</div>
              </div>
            </div>
          ) : null}
          <Pagination
            meta={buyNowMeta}
            className="mt-3"
            perPage={buyNowPerPage}
            onPerPageChange={(n) => {
              setBuyNowPage(1)
              setBuyNowPerPage(n)
            }}
            onPageChange={(p) => setBuyNowPage(p)}
          />
        </>
      ) : (
        <>
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
                        <div className="fw-semibold text-body">{a.listing?.title ?? 'Auction'}</div>
                        <span className="badge text-bg-secondary text-uppercase">{a.status}</span>
                      </div>
                      <div className="text-muted small mt-2">Ends: {new Date(a.ends_at).toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          {!loading && auctions.length === 0 ? (
            <div className="card shadow-soft">
              <div className="card-body">
                <div className="fw-semibold">No auctions</div>
                <div className="text-muted small">Try switching to Sellings or clearing your search.</div>
              </div>
            </div>
          ) : null}
          <Pagination
            meta={auctionMeta}
            className="mt-3"
            perPage={auctionPerPage}
            onPerPageChange={(n) => {
              setAuctionPage(1)
              setAuctionPerPage(n)
            }}
            onPageChange={(p) => setAuctionPage(p)}
          />
        </>
      )}
    </div>
  )
}

