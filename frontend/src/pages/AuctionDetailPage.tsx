import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, getAuthToken, type ApiError } from '../api/client'
import { ImageCarousel } from '../components/ImageCarousel'

type Auction = {
  id: number
  listing: { id: number; title: string; image_url: string | null; images?: string[] } | null
  starts_at: string | null
  ends_at: string
  status: 'scheduled' | 'active' | 'ended'
  min_increment: string
  current_highest_bid: string | null
}

type AuctionShowResponse = { auction: Auction }
type Bid = { id: number; bidder_id: number; amount: string; created_at: string }
type BidIndexResponse = { bids: Bid[] }
type ContactResponse =
  | { message?: string; role?: 'seller' | 'winner'; contact: null }
  | {
      role: 'seller' | 'winner'
      contact: {
        user_id: number
        name: string
        email: string
        phone: string | null
        address: string | null
        facebook_url: string | null
      }
    }

export function AuctionDetailPage() {
  const { auctionId } = useParams()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [bidAmount, setBidAmount] = useState('')
  const [placing, setPlacing] = useState(false)
  const [bidError, setBidError] = useState<string | null>(null)
  const authed = useMemo(() => Boolean(getAuthToken()), [])
  const [contact, setContact] = useState<ContactResponse | null>(null)

  useEffect(() => {
    if (!auctionId) return
    apiFetch<AuctionShowResponse>(`/api/auctions/${auctionId}`)
      .then((res) => setAuction(res.auction))
      .catch((e) => {
        const err = e as ApiError
        setError(err.message ?? 'Failed to load auction')
      })
  }, [auctionId])

  useEffect(() => {
    if (!auctionId) return
    apiFetch<BidIndexResponse>(`/api/auctions/${auctionId}/bids`)
      .then((res) => setBids(res.bids))
      .catch(() => {})
  }, [auctionId])

  useEffect(() => {
    if (!auctionId) return
    if (!auction || auction.status !== 'active') return

    const interval = window.setInterval(() => {
      Promise.all([
        apiFetch<AuctionShowResponse>(`/api/auctions/${auctionId}`),
        apiFetch<BidIndexResponse>(`/api/auctions/${auctionId}/bids`),
      ])
        .then(([a, b]) => {
          setAuction(a.auction)
          setBids(b.bids)
        })
        .catch(() => {})
    }, 3000)

    return () => window.clearInterval(interval)
  }, [auctionId, auction])

  useEffect(() => {
    if (!auctionId) return
    if (!authed) return
    if (!auction || auction.status !== 'ended') return

    apiFetch<ContactResponse>(`/api/auctions/${auctionId}/contact`, { auth: true })
      .then((res) => setContact(res))
      .catch(() => {})
  }, [auctionId, auction, authed])

  async function placeBid(e: React.FormEvent) {
    e.preventDefault()
    if (!auctionId) return
    setBidError(null)
    setPlacing(true)
    try {
      await apiFetch(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ amount: Number(bidAmount) }),
      })

      const [a, b] = await Promise.all([
        apiFetch<AuctionShowResponse>(`/api/auctions/${auctionId}`),
        apiFetch<BidIndexResponse>(`/api/auctions/${auctionId}/bids`),
      ])
      setAuction(a.auction)
      setBids(b.bids)
      setBidAmount('')
    } catch (e) {
      const err = e as any
      const msg = err?.message ?? 'Failed to place bid'
      if (err?.code === 'BID_TOO_LOW') {
        setBidError(`${msg} (min required: ${err.min_required})`)
      } else {
        setBidError(msg)
      }
    } finally {
      setPlacing(false)
    }
  }

  if (error) return <div className="alert alert-danger">{error}</div>
  if (!auction) return <div className="text-muted">Loading…</div>

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-7">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div>
            <h1 className="h4 mb-1">{auction.listing?.title ?? 'Auction'}</h1>
            <div className="text-muted small">
              Ends: {new Date(auction.ends_at).toLocaleString()}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-secondary text-uppercase">{auction.status}</span>
          </div>
        </div>

        {(() => {
          const imgs =
            auction.listing?.images && auction.listing.images.length > 0
              ? auction.listing.images
              : auction.listing?.image_url
                ? [auction.listing.image_url]
                : []
          if (imgs.length === 0) return null
          return <ImageCarousel id={`auctionImagesCarousel-${auction.id}`} images={imgs} alt={auction.listing?.title ?? 'Auction'} />
        })()}
      </div>

      <div className="col-12 col-lg-5">
        <div className="card shadow-soft sh-sticky-lg">
          <div className="card-body">
            <div className="fw-semibold mb-2">Bidding</div>
            {bidError ? <div className="alert alert-danger">{bidError}</div> : null}
            <div className="d-flex justify-content-between">
              <div className="text-muted small">Min increment</div>
              <div>{auction.min_increment}</div>
            </div>
            <div className="d-flex justify-content-between">
              <div className="text-muted small">Current highest</div>
              <div>{auction.current_highest_bid ?? '—'}</div>
            </div>

            <hr />

            {!authed ? (
              <div className="text-muted small">Login to place a bid.</div>
            ) : auction.status !== 'active' ? (
              <div className="text-muted small">Bidding is not available while auction is {auction.status}.</div>
            ) : (
              <form onSubmit={placeBid}>
                <label className="form-label" htmlFor="amount">
                  Your bid amount
                </label>
                <input
                  id="amount"
                  className="form-control mb-2"
                  inputMode="decimal"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  required
                />
                <button className="btn btn-primary w-100" disabled={placing}>
                  {placing ? 'Placing…' : 'Place bid'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="card mt-3">
          <div className="card-body">
            <div className="fw-semibold mb-2">Bid history</div>
            {bids.length === 0 ? (
              <div className="text-muted small">No bids yet.</div>
            ) : (
              <div className="list-group list-group-flush">
                {bids.map((b) => (
                  <div key={b.id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between">
                      <div>{b.amount}</div>
                      <div className="text-muted small">
                        {new Date(b.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {authed && auction.status === 'ended' ? (
          <div className="card mt-3">
            <div className="card-body">
              <div className="fw-semibold mb-2">Contact exchange</div>
              {!contact ? (
                <div className="text-muted small">Loading contact…</div>
              ) : contact.contact === null ? (
                <div className="text-muted small">{contact.message ?? 'No contact available.'}</div>
              ) : (
                <div className="small">
                  <div className="fw-semibold">{contact.contact.name}</div>
                  <div>Email: {contact.contact.email}</div>
                  <div>Phone: {contact.contact.phone ?? '—'}</div>
                  <div>Address: {contact.contact.address ?? '—'}</div>
                  <div>
                    Facebook:{' '}
                    {contact.contact.facebook_url ? (
                      <a href={contact.contact.facebook_url} target="_blank">
                        {contact.contact.facebook_url}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

