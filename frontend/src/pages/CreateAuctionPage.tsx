import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, getAuthToken, type ApiError } from '../api/client'
import { DropdownSelect } from '../components/DropdownSelect'

type Listing = {
  id: number
  title: string
  is_approved: boolean
  sale_type: 'auction' | 'sellings'
  status: string
}

type Paginated<T> = { data: T[] }

type CreateAuctionResponse = {
  auction: { id: number }
}

export function CreateAuctionPage() {
  const navigate = useNavigate()
  const authed = useMemo(() => Boolean(getAuthToken()), [])

  const [listings, setListings] = useState<Listing[]>([])
  const [listingId, setListingId] = useState<number | ''>('')
  const [endsAtLocal, setEndsAtLocal] = useState('')
  const [startingBid, setStartingBid] = useState('0')
  const [minIncrement, setMinIncrement] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authed) return
    // Only show listings that can actually be auctioned (matches backend checks).
    apiFetch<Paginated<Listing>>('/api/my/listings?sale_type=auction&status=ready&per_page=100', { auth: true })
      .then((res) => setListings(res.data))
      .catch(() => {})
  }, [authed])

  function onReset() {
    setListingId('')
    setEndsAtLocal('')
    setStartingBid('0')
    setMinIncrement('0')
    setError(null)
    setFieldErrors(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors(null)
    setSaving(true)
    try {
      // The datetime-local value is interpreted as local time.
      // We convert it to a UTC ISO string for the API.
      const endsAtIso = new Date(endsAtLocal).toISOString()
      const res = await apiFetch<CreateAuctionResponse>('/api/auctions', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          listing_id: listingId,
          ends_at: endsAtIso,
          starting_bid: Number(startingBid),
          min_increment: Number(minIncrement),
        }),
      })
      navigate(`/my/auctions/${res.auction.id}`)
    } catch (e) {
      const err = e as ApiError
      setError(err.message ?? 'Failed to create auction')
      setFieldErrors(err.errors ?? null)
    } finally {
      setSaving(false)
    }
  }

  if (!authed) {
    return (
      <div className="card shadow-soft">
        <div className="card-body">
          <div className="fw-semibold mb-1">Login required</div>
          <div className="text-muted small mb-3">You need to be logged in to create an auction.</div>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/login" className="btn btn-primary">
              Go to login
            </Link>
            <Link to="/auctions" className="btn btn-outline-primary">
              Browse auctions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const approvedListings = listings.filter((l) => l.is_approved)
  const approvedOptions = approvedListings.map((l) => ({ value: l.id, label: l.title }))

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div>
            <h1 className="h4 mb-1">Create auction</h1>
            <div className="text-muted small">Choose an approved listing and set your rules.</div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-primary" onClick={onReset} disabled={saving}>
              Reset
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/my/auctions')} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <form className="card card-body shadow-soft" onSubmit={onSubmit}>
          <label className="form-label" htmlFor="listing">
            Approved listing
          </label>
          <div>
            <DropdownSelect<number>
              value={listingId}
              options={approvedOptions}
              placeholder="Select a listing…"
              onChange={(v) => setListingId(v ? Number(v) : '')}
              searchable
              searchPlaceholder="Search listings…"
              buttonClassName={fieldErrors?.listing_id ? 'is-invalid' : undefined}
              disabled={approvedListings.length === 0}
            />
            {fieldErrors?.listing_id ? (
              <div className="invalid-feedback d-block">{fieldErrors.listing_id.join(' ')}</div>
            ) : null}
          </div>
          {approvedListings.length === 0 ? (
            <div className="text-muted small mt-2">
              You don’t have any approved listings yet. Ask an admin to approve your listing.
            </div>
          ) : null}

          <hr />

          <label className="form-label" htmlFor="endsAt">
            Auction end time
          </label>
          <div className="row g-2">
            <div className="col-12">
              <input
                id="endsAt"
                type="datetime-local"
                className={`form-control ${fieldErrors?.ends_at ? 'is-invalid' : ''}`}
                value={endsAtLocal}
                onChange={(e) => setEndsAtLocal(e.target.value)}
                required
              />
              <div className="text-muted small mt-1">
                Pick a time in your local timezone. We’ll convert it to UTC (ISO) when submitting.
              </div>
            </div>
          </div>
          {fieldErrors?.ends_at ? <div className="invalid-feedback d-block">{fieldErrors.ends_at.join(' ')}</div> : null}

          <div className="row g-3 mt-1">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="startingBid">
                Starting bid
              </label>
              <input
                id="startingBid"
                className={`form-control ${fieldErrors?.starting_bid ? 'is-invalid' : ''}`}
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                inputMode="decimal"
                required
              />
              {fieldErrors?.starting_bid ? (
                <div className="invalid-feedback d-block">{fieldErrors.starting_bid.join(' ')}</div>
              ) : null}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="minIncrement">
                Minimum increment
              </label>
              <input
                id="minIncrement"
                className={`form-control ${fieldErrors?.min_increment ? 'is-invalid' : ''}`}
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                inputMode="decimal"
                required
              />
              {fieldErrors?.min_increment ? (
                <div className="invalid-feedback d-block">{fieldErrors.min_increment.join(' ')}</div>
              ) : null}
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
            <button className="btn btn-primary" disabled={saving || approvedListings.length === 0}>
              {saving ? 'Creating…' : 'Create auction'}
            </button>
            <Link to="/my/listings" className="btn btn-outline-primary">
              View my listings
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

