import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, type ApiError } from '../api/client'
import { useAuthToken } from '../auth/useAuthToken'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DropdownSelect } from '../components/DropdownSelect'
import { Pagination } from '../components/Pagination'

type Listing = {
  id: number
  title: string
  description: string | null
  condition: string | null
  image_url: string | null
  is_approved: boolean
  sale_type: 'auction' | 'sellings'
  status: string
  price: string | null
  latest_auction: { id: number; status: string; ends_at: string | null; winner_id: number | null } | null
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type Paginated<T> = { data: T[]; meta: Meta }

export function MyListingsPage() {
  const { token } = useAuthToken()
  const [items, setItems] = useState<Listing[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [buyNowSoldConfirmId, setBuyNowSoldConfirmId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [saleType, setSaleType] = useState<'all' | 'auction' | 'sellings'>('all')
  const [status, setStatus] = useState<'all' | string>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [meta, setMeta] = useState<Meta | null>(null)

  async function load() {
    if (!token) return
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(perPage))
    if (query.trim()) params.set('q', query.trim())
    if (saleType !== 'all') params.set('sale_type', saleType)
    if (status !== 'all') params.set('status', status)
    try {
      const res = await apiFetch<Paginated<Listing>>(`/api/my/listings?${params.toString()}`, { auth: true })
      setItems(res.data)
      setMeta(res.meta)
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    void load()
  }, [token, page, perPage, saleType, status])

  useEffect(() => {
    setPage(1)
  }, [perPage, saleType, status])

  if (!token) {
    return (
      <div className="card shadow-soft">
        <div className="card-body">
          <div className="fw-semibold mb-1">Login required</div>
          <div className="text-muted small mb-3">You need to login to view your listings.</div>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  const saleTypeOptions = [
    { value: 'all' as const, label: 'All types' },
    { value: 'sellings' as const, label: 'Sellings' },
    { value: 'auction' as const, label: 'Auction' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All status' },
    { value: 'pending_approval', label: 'Pending approval' },
    { value: 'ready', label: 'Ready' },
    { value: 'in_auction', label: 'In auction' },
    { value: 'auction_ended', label: 'Auction ended' },
    { value: 'sold', label: 'Sold' },
    { value: 'removed', label: 'Removed' },
  ]

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">My listings</h1>
          <div className="text-muted small">Track approval status and prepare auctions.</div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <input
            className="form-control"
            style={{ minWidth: 220 }}
            placeholder="Search listings…"
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
            <DropdownSelect<'all' | 'auction' | 'sellings'>
              value={saleType}
              options={saleTypeOptions}
              onChange={(v) => setSaleType(v === '' ? 'all' : v)}
              searchable={false}
            />
          </div>
          <div style={{ width: 210 }}>
            <DropdownSelect<string>
              value={status}
              options={statusOptions}
              onChange={(v) => setStatus(v || 'all')}
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
          <Link to="/listings/new" className="btn btn-primary">
            New listing
          </Link>
        </div>
      </div>

      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {actionError ? <div className="alert alert-danger">{actionError}</div> : null}

      <div className="row g-3">
        {items.map((l) => (
          <div key={l.id} className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              <Link to={`/my/listings/${l.id}`} className="text-decoration-none text-body">
                {l.image_url ? <img src={l.image_url} className="card-img-top sh-aspect-16x9" alt={l.title} /> : null}
                <div className="card-body pb-2">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="fw-semibold text-body">{l.title}</div>
                    <span
                      className={`badge ${
                        l.status === 'ready'
                          ? 'text-bg-success'
                          : l.status === 'sold'
                            ? 'text-bg-dark'
                            : l.status === 'auction_ended'
                              ? 'text-bg-warning'
                              : 'text-bg-secondary'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  {l.description ? (
                    <div className="text-muted small mt-2 sh-line-clamp-2">{l.description}</div>
                  ) : null}

                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <span className={`badge ${l.sale_type === 'sellings' ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                      {l.sale_type === 'sellings' ? 'sellings' : 'auction'}
                    </span>
                    {l.sale_type === 'sellings' && l.price ? (
                      <span className="badge text-bg-success">Price: {l.price}</span>
                    ) : null}
                  </div>
                </div>
              </Link>

              <div className="card-footer bg-transparent border-0 pt-0 d-flex flex-column gap-2">
                <div className="d-flex flex-wrap gap-2">
                  <Link to={`/my/listings/${l.id}/edit`} className="btn btn-sm btn-outline-primary">
                    Edit
                  </Link>
                  {l.is_approved ? (
                    <Link to={`/browse/listings/${l.id}`} className="btn btn-sm btn-outline-secondary">
                      View public page
                    </Link>
                  ) : (
                    <span className="small text-muted align-self-center">Public page after approval</span>
                  )}
                </div>

                {l.sale_type === 'sellings' && l.status === 'ready' ? (
                  <div className="d-flex flex-column gap-2">
                    <div className="small text-muted">
                      Sold this item outside the app? Mark it sold so it disappears from public listings.
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-success align-self-start"
                      disabled={busyId === l.id}
                      onClick={() => setBuyNowSoldConfirmId(l.id)}
                    >
                      Mark sold
                    </button>
                  </div>
                ) : null}

                {l.status === 'auction_ended' ? (
                  <div className="d-flex flex-column gap-2">
                    <div className="small text-muted">
                      Auction ended. Confirm whether this item has been sold (payment is outside the app).
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        disabled={busyId === l.id}
                        onClick={async () => {
                          setBusyId(l.id)
                          setActionError(null)
                          try {
                            await apiFetch(`/api/listings/${l.id}/confirm-sold`, {
                              method: 'POST',
                              auth: true,
                              body: JSON.stringify({ sold: true }),
                            })
                            await load()
                          } catch (e) {
                            setActionError((e as ApiError).message ?? 'Failed to update listing')
                          } finally {
                            setBusyId(null)
                          }
                        }}
                      >
                        Mark sold
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={busyId === l.id}
                        onClick={async () => {
                          setBusyId(l.id)
                          setActionError(null)
                          try {
                            await apiFetch(`/api/listings/${l.id}/confirm-sold`, {
                              method: 'POST',
                              auth: true,
                              body: JSON.stringify({ sold: false }),
                            })
                            await load()
                          } catch (e) {
                            setActionError((e as ApiError).message ?? 'Failed to update listing')
                          } finally {
                            setBusyId(null)
                          }
                        }}
                      >
                        Not sold (relist)
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <div className="card shadow-soft">
          <div className="card-body">
            <div className="fw-semibold">No listings yet</div>
            <div className="text-muted small">Create a listing to start selling.</div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={buyNowSoldConfirmId !== null}
        title="Mark sellings listing as sold?"
        body="This hides the listing from public browse. Payment is outside the app — use this after you have agreed a sale with a buyer."
        confirmText="Mark sold"
        confirmVariant="primary"
        busy={buyNowSoldConfirmId !== null && busyId === buyNowSoldConfirmId}
        onCancel={() => setBuyNowSoldConfirmId(null)}
        onConfirm={async () => {
          if (buyNowSoldConfirmId === null) return
          const id = buyNowSoldConfirmId
          setBusyId(id)
          setActionError(null)
          try {
            await apiFetch(`/api/listings/${id}/mark-buy-now-sold`, {
              method: 'POST',
              auth: true,
            })
            await load()
            setBuyNowSoldConfirmId(null)
          } catch (e) {
            setActionError((e as ApiError).message ?? 'Failed to update listing')
          } finally {
            setBusyId(null)
          }
        }}
      />

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

