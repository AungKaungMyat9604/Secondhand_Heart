import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, getAuthToken, type ApiError } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Pagination } from '../components/Pagination'

type NotificationRow = {
  id: number
  type: string
  data: {
    auction_id?: number
    listing_id?: number
    listing_title?: string | null
    sale_type?: 'auction' | 'sellings' | string | null
    new_amount?: string | null
    current_highest_bid?: string | null
    winning_amount?: string | null
    winner_id?: number | null
    winner_name?: string | null
    seller_id?: number | null
    seller_name?: string | null
    has_bids?: boolean
  }
  read_at: string | null
  created_at: string
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type Paginated<T> = { data: T[]; meta: Meta }

function formatMoney(amount: string | null | undefined) {
  if (!amount) return null
  const n = Number(amount)
  if (!Number.isFinite(n)) return amount
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [markAllOpen, setMarkAllOpen] = useState(false)
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
      if (filter === 'unread') params.set('unread', '1')
      const res = await apiFetch<Paginated<NotificationRow>>(`/api/notifications?${params.toString()}`, { auth: true })
      setItems(res.data)
      setMeta(res.meta)
    } catch (e) {
      setError((e as ApiError).message ?? 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!getAuthToken()) return
    void load()
  }, [page, perPage, filter])

  if (!getAuthToken()) {
    return (
      <div className="card shadow-soft">
        <div className="card-body">
          <div className="fw-semibold mb-1">Login required</div>
          <div className="text-muted small mb-3">Login to view your notifications.</div>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  async function markRead(id: number) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST', auth: true, body: JSON.stringify({ read: true }) })
    await load()
    window.dispatchEvent(new Event('notifications_updated'))
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">Notifications</h1>
          <div className="text-muted small">Outbid and auction-end updates.</div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <div className="btn-group" role="group" aria-label="Filter">
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setPage(1)
                setFilter('all')
              }}
            >
              All
            </button>
            <button
              className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setPage(1)
                setFilter('unread')
              }}
            >
              Unread
            </button>
          </div>
          <button className="btn btn-outline-secondary" onClick={() => setMarkAllOpen(true)} disabled={loading || items.every((n) => n.read_at)}>
            Mark all read
          </button>
          <button className="btn btn-outline-primary" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="list-group">
        {items.map((n) => (
          <div
            key={n.id}
            className={`list-group-item d-flex justify-content-between align-items-start gap-3 ${n.read_at ? '' : 'border border-2'}`}
          >
            <div className="flex-grow-1">
              {(() => {
                const auctionId = n.data?.auction_id
                const listingTitle = n.data?.listing_title ?? null
                const ts = new Date(n.created_at).toLocaleString()

                if (n.type === 'outbid') {
                  const newAmount = formatMoney(n.data?.new_amount)
                  return (
                    <>
                      <div className="fw-semibold">You were outbid</div>
                      <div className="text-muted small">
                        {listingTitle ? (
                          <span>
                            Listing: <span className="fw-semibold">{listingTitle}</span>
                          </span>
                        ) : null}
                      </div>
                      {newAmount ? (
                        <div className="small mt-1">
                          New highest bid: <span className="fw-semibold">{newAmount}</span>
                        </div>
                      ) : null}
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                        {auctionId ? (
                          <Link className="btn btn-sm btn-outline-primary" to={`/browse/auctions/${auctionId}`}>
                            View auction
                          </Link>
                        ) : null}
                        <span className="text-muted small">{ts}</span>
                      </div>
                    </>
                  )
                }

                if (n.type === 'auction_ended_winner') {
                  const winningAmount = formatMoney(n.data?.winning_amount)
                  return (
                    <>
                      <div className="fw-semibold">You won the auction</div>
                      {listingTitle ? <div className="text-muted small">Listing: <span className="fw-semibold">{listingTitle}</span></div> : null}
                      {winningAmount ? (
                        <div className="small mt-1">
                          Winning bid: <span className="fw-semibold">{winningAmount}</span>
                        </div>
                      ) : null}
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                        {auctionId ? (
                          <Link className="btn btn-sm btn-outline-primary" to={`/browse/auctions/${auctionId}`}>
                            View auction
                          </Link>
                        ) : null}
                        <span className="text-muted small">{ts}</span>
                      </div>
                    </>
                  )
                }

                if (n.type === 'auction_ended_seller') {
                  const hasBids = Boolean(n.data?.has_bids)
                  const winnerName = n.data?.winner_name ?? null
                  const winningAmount = formatMoney(n.data?.winning_amount)
                  return (
                    <>
                      <div className="fw-semibold">
                        {hasBids ? 'Your auction ended' : 'Auction ended with no bids'}
                      </div>
                      {listingTitle ? <div className="text-muted small">Listing: <span className="fw-semibold">{listingTitle}</span></div> : null}
                      {hasBids ? (
                        <div className="small mt-1">
                          {winnerName ? (
                            <span>
                              Winner: <span className="fw-semibold">{winnerName}</span>
                            </span>
                          ) : null}
                          {winnerName && winningAmount ? <span> • </span> : null}
                          {winningAmount ? (
                            <span>
                              Winning bid: <span className="fw-semibold">{winningAmount}</span>
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="small mt-1 text-muted">
                          You can create a new auction for this listing anytime.
                        </div>
                      )}
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                        {auctionId ? (
                          <Link className="btn btn-sm btn-outline-primary" to={`/browse/auctions/${auctionId}`}>
                            View auction
                          </Link>
                        ) : null}
                        <Link className="btn btn-sm btn-outline-secondary" to="/my/auctions">
                          Go to my auctions
                        </Link>
                        <span className="text-muted small">{ts}</span>
                      </div>
                    </>
                  )
                }

                if (n.type === 'listing_approved') {
                  const listingId = n.data?.listing_id
                  const title = listingTitle ?? (listingId ? `Listing #${listingId}` : 'Listing')
                  return (
                    <>
                      <div className="fw-semibold">Listing approved</div>
                      <div className="text-muted small">
                        Your listing <span className="fw-semibold">{title}</span> is now visible on Browse.
                      </div>
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                        {listingId ? (
                          <Link className="btn btn-sm btn-outline-primary" to={`/browse/listings/${listingId}`}>
                            View listing
                          </Link>
                        ) : null}
                        <Link className="btn btn-sm btn-outline-secondary" to="/my/listings">
                          Go to my listings
                        </Link>
                        <span className="text-muted small">{ts}</span>
                      </div>
                    </>
                  )
                }

                if (n.type === 'listing_pending_approval') {
                  const listingId = n.data?.listing_id
                  const sellerName = n.data?.seller_name ?? null
                  const title = listingTitle ?? (listingId ? `Listing #${listingId}` : 'Listing')
                  return (
                    <>
                      <div className="fw-semibold">New listing pending approval</div>
                      <div className="text-muted small">
                        {sellerName ? (
                          <>
                            Seller: <span className="fw-semibold">{sellerName}</span> •{' '}
                          </>
                        ) : null}
                        <span className="fw-semibold">{title}</span>
                      </div>
                      <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
                        <Link className="btn btn-sm btn-outline-primary" to="/admin/listings">
                          Open admin listings
                        </Link>
                        <span className="text-muted small">{ts}</span>
                      </div>
                    </>
                  )
                }

                // Fallback (should not happen once data is cleaned)
                return (
                  <>
                    <div className="fw-semibold">{n.type.replaceAll('_', ' ')}</div>
                    {auctionId ? (
                      <div className="text-muted small">
                        Auction: <Link to={`/browse/auctions/${auctionId}`}>View</Link>
                      </div>
                    ) : null}
                    <div className="text-muted small">{ts}</div>
                  </>
                )
              })()}
            </div>
            {!n.read_at ? (
              <button className="btn btn-outline-secondary btn-sm" onClick={() => void markRead(n.id)}>
                Mark read
              </button>
            ) : (
              <span className="badge text-bg-secondary">read</span>
            )}
          </div>
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <div className="card shadow-soft mt-3">
          <div className="card-body">
            <div className="fw-semibold">No notifications</div>
            <div className="text-muted small">When you’re outbid or an auction ends, you’ll see it here.</div>
          </div>
        </div>
      ) : null}

      <Pagination
        meta={meta}
        className="mt-3"
        perPage={perPage}
        perPageOptions={[10, 20, 30, 50, 100]}
        onPerPageChange={(n) => {
          setPage(1)
          setPerPage(n)
        }}
        onPageChange={(p) => setPage(p)}
      />

      <ConfirmDialog
        isOpen={markAllOpen}
        title="Mark all as read?"
        body="This will mark all current notifications as read."
        confirmText="Mark all read"
        confirmVariant="primary"
        busy={loading}
        onCancel={() => setMarkAllOpen(false)}
        onConfirm={async () => {
          setMarkAllOpen(false)
          const unread = items.filter((n) => !n.read_at)
          for (const n of unread) {
            // sequential is fine for MVP simplicity
            // eslint-disable-next-line no-await-in-loop
            await apiFetch(`/api/notifications/${n.id}/read`, { method: 'POST', auth: true, body: JSON.stringify({ read: true }) })
          }
          await load()
          window.dispatchEvent(new Event('notifications_updated'))
        }}
      />
    </div>
  )
}

