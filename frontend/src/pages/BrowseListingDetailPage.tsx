import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getAuthToken, type ApiError } from '../api/client'
import { ImageCarousel } from '../components/ImageCarousel'

type Listing = {
  id: number
  seller_id: number
  seller: { id: number; name: string; avatar_url: string | null } | null
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
  created_at: string
}

type ListingShowResponse = { listing: Listing }
type ListingContactResponse = {
  contact: {
    user_id: number
    name: string
    email: string
    phone: string | null
    address: string | null
    facebook_url: string | null
  } | null
}

export function BrowseListingDetailPage() {
  const { listingId } = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState<ListingContactResponse['contact'] | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  useEffect(() => {
    if (!listingId) return
    setLoading(true)
    setError(null)
    setContact(null)
    setContactError(null)
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
  const authed = Boolean(getAuthToken())

  async function loadContact() {
    if (!listingId) return
    setContactError(null)
    setContactLoading(true)
    try {
      const res = await apiFetch<ListingContactResponse>(`/api/listings/${listingId}/contact`, { auth: true })
      setContact(res.contact)
    } catch (e) {
      setContactError((e as ApiError).message ?? 'Failed to load seller contact')
    } finally {
      setContactLoading(false)
    }
  }

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
            <div className="d-flex flex-wrap gap-3 align-items-center text-muted small mt-2">
              <div className="d-flex align-items-center gap-2">
                {listing.seller?.avatar_url ? (
                  <img
                    src={listing.seller.avatar_url}
                    alt=""
                    width={22}
                    height={22}
                    style={{ borderRadius: 999, objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: 'rgba(15,23,42,0.08)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                    aria-hidden="true"
                  >
                    {(listing.seller?.name?.[0] ?? 'U').toUpperCase()}
                  </span>
                )}
                <span>
                  Posted by <span className="fw-semibold">{listing.seller?.name ?? 'Unknown'}</span>
                </span>
              </div>
              <div>Posted on {new Date(listing.created_at).toLocaleString()}</div>
            </div>
          </div>
          <Link to="/browse" className="btn btn-outline-primary">
            Back to browse
          </Link>
        </div>

        <div className="card shadow-soft overflow-hidden">
          <ImageCarousel id="browseListingImagesCarousel" images={imgs} alt={listing.title} />
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
                      <Link to={`/browse/auctions/${listing.latest_auction.id}`}>View auction</Link>
                    </div>
                  ) : (
                    <div className="small text-muted">This listing can be auctioned by the seller once it is approved and ready.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card bg-light border-0">
                <div className="card-body">
                  <div className="fw-semibold mb-2">Sellings</div>

                  {!authed ? (
                    <div className="alert alert-info small mb-0">
                      Please <Link to="/login">login</Link> to contact the seller.
                    </div>
                  ) : (
                    <>
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void loadContact()}
                          disabled={contactLoading}
                        >
                          {contactLoading ? 'Loading…' : contact ? 'Refresh seller info' : 'Contact seller'}
                        </button>
                      </div>

                      {contactError ? <div className="alert alert-danger small mt-3 mb-0">{contactError}</div> : null}

                      {contact ? (
                        <div className="card sh-glass shadow-sm mt-3">
                          <div className="card-body">
                            <div className="fw-semibold mb-2">Seller info</div>
                            <div className="d-flex flex-column gap-1 small">
                              <div>
                                <span className="text-muted">Name: </span>
                                <span className="fw-semibold">{contact.name}</span>
                              </div>
                              <div>
                                <span className="text-muted">Email: </span>
                                <span>{contact.email}</span>
                              </div>
                              {contact.phone ? (
                                <div>
                                  <span className="text-muted">Phone: </span>
                                  <span>{contact.phone}</span>
                                </div>
                              ) : null}
                              {contact.address ? (
                                <div>
                                  <span className="text-muted">Address: </span>
                                  <span>{contact.address}</span>
                                </div>
                              ) : null}
                              {contact.facebook_url ? (
                                <div>
                                  <span className="text-muted">Facebook: </span>
                                  <a href={contact.facebook_url} target="_blank" rel="noreferrer">
                                    {contact.facebook_url}
                                  </a>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

