import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, type ApiError } from '../api/client'
import { useMe } from '../auth/useMe'
import { ImageCarousel } from '../components/ImageCarousel'

type Listing = {
  id: number
  seller_id: number
  title: string
  description: string | null
  condition: string | null
  location_city: string
  location_region: string
  image_url: string | null
  images?: string[]
  sale_type: 'auction' | 'sellings'
  status: string
  price: string | null
  latest_auction: { id: number; status: string; ends_at: string | null; winner_id: number | null } | null
}

type ListingShowResponse = { listing: Listing }

export function ListingDetailPage() {
  const { me } = useMe()
  const { listingId } = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!listingId) return
    setLoading(true)
    setError(null)
    apiFetch<ListingShowResponse>(`/api/listings/${listingId}`)
      .then((res) => setListing(res.listing))
      .catch((e) => setError((e as ApiError).message ?? 'Failed to load listing'))
      .finally(() => setLoading(false))
  }, [listingId])

  if (loading) return <div className="text-muted">Loading…</div>
  if (error) return <div className="alert alert-danger">{error}</div>
  if (!listing) return <div className="text-muted">Not found.</div>

  const saleTypeLabel = listing.sale_type === 'sellings' ? 'Sellings' : 'Auction'
  const imgs = listing.images && listing.images.length > 0 ? listing.images : listing.image_url ? [listing.image_url] : []

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-9">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div>
            <h1 className="h4 mb-1">{listing.title}</h1>
            <div className="d-flex flex-wrap gap-2">
              <span className={`badge ${listing.sale_type === 'sellings' ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                {saleTypeLabel}
              </span>
              <span className="badge text-bg-light text-dark border">{listing.status}</span>
              {listing.sale_type === 'sellings' && listing.price ? (
                <span className="badge text-bg-success">Price: {listing.price}</span>
              ) : null}
            </div>
          </div>
          <Link to="/browse" className="btn btn-outline-primary">
            Back to browse
          </Link>
        </div>

        <div className="card shadow-soft overflow-hidden">
          <ImageCarousel id="listingImagesCarousel" images={imgs} alt={listing.title} />
          <div className="card-body">
            {listing.condition ? (
              <div className="mb-2">
                <span className="text-muted small">Condition</span>
                <div className="fw-semibold">{listing.condition}</div>
              </div>
            ) : null}

            <div className="mb-3">
              <div className="text-muted small">Item location</div>
              <div className="fw-semibold">
                {listing.location_city}, {listing.location_region}
              </div>
            </div>

            {listing.description ? (
              <div className="mb-3">
                <div className="text-muted small">Description</div>
                <div>{listing.description}</div>
              </div>
            ) : null}

            {listing.sale_type === 'auction' ? (
              <div className="card bg-light border-0">
                <div className="card-body">
                  <div className="fw-semibold mb-1">Auction listing</div>
                  {listing.latest_auction ? (
                    <div className="small text-muted">
                      Latest auction status: <span className="text-uppercase">{listing.latest_auction.status}</span>.{' '}
                      <Link to={`/auctions/${listing.latest_auction.id}`}>View auction</Link>
                    </div>
                  ) : (
                    <div className="small text-muted">
                      This listing can be auctioned by the seller once it is approved and ready.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card bg-light border-0">
                <div className="card-body">
                  <div className="fw-semibold mb-1">Sellings (no in-app payment)</div>
                  <div className="small text-muted">
                    To buy this item, please contact the seller and arrange payment/delivery outside the app.
                  </div>
                  {me && listing.seller_id === me.id && listing.status === 'ready' ? (
                    <div className="alert alert-info small mb-0 mt-3 py-2">
                      After you complete an offline sale, go to{' '}
                      <Link to="/my/listings" className="alert-link">
                        My listings
                      </Link>{' '}
                      and tap <strong>Mark sold</strong> so this item stops showing publicly.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

