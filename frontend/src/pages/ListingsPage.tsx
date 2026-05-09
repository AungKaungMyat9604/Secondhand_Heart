import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, type ApiError } from '../api/client'
import { ReportDialog } from '../components/ReportDialog'
import { useAuthToken } from '../auth/useAuthToken'

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
}

type Paginated<T> = {
  data: T[]
}

export function ListingsPage() {
  const { authed } = useAuthToken()
  const [listings, setListings] = useState<Listing[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportId, setReportId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportBusy, setReportBusy] = useState(false)

  useEffect(() => {
    apiFetch<Paginated<Listing>>('/api/listings')
      .then((res) => setListings(res.data))
      .catch((e) => {
        const err = e as ApiError
        setError(err.message ?? 'Failed to load listings')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">All listings</h1>
          <div className="text-muted small">All public items (advanced filters are on Browse).</div>
        </div>
        {authed ? (
          <Link to="/listings/new" className="btn btn-primary">
            Create listing
          </Link>
        ) : (
          <div className="text-muted small">Login to create a listing.</div>
        )}
      </div>

      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="row g-3">
        {listings.map((l) => (
          <div key={l.id} className="col-12 col-md-6 col-lg-4">
            <Link to={`/listings/${l.id}`} className="text-decoration-none">
              <div className="card h-100">
                {l.image_url ? (
                  <img src={l.image_url} className="card-img-top sh-aspect-16x9" alt={l.title} />
                ) : null}
                <div className="card-body">
                  <div className="d-flex justify-content-between gap-2">
                    <div className="fw-semibold text-body">{l.title}</div>
                    <span className="badge text-bg-secondary align-self-start">{l.condition ?? '—'}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <span className={`badge ${l.sale_type === 'sellings' ? 'text-bg-primary' : 'text-bg-secondary'}`}>
                      {l.sale_type === 'sellings' ? 'sellings' : 'auction'}
                    </span>
                    {l.sale_type === 'sellings' && l.price ? (
                      <span className="badge text-bg-success">Price: {l.price}</span>
                    ) : null}
                  </div>
                  {l.description ? <p className="mt-2 mb-0 small text-muted sh-line-clamp-2">{l.description}</p> : null}
                </div>
              </div>
            </Link>
            <div className="d-flex justify-content-end mt-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setReportId(l.id)
                  setReportReason('')
                  setReportError(null)
                }}
                disabled={!authed}
                title={!authed ? 'Login to report listings' : 'Report listing'}
              >
                Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && listings.length === 0 ? (
        <div className="card shadow-soft mt-3">
          <div className="card-body">
            <div className="fw-semibold">No approved listings yet</div>
            <div className="text-muted small">
              Sellers can create listings, then an admin approves them before they appear here.
            </div>
          </div>
        </div>
      ) : null}

      <ReportDialog
        isOpen={reportId !== null}
        reason={reportReason}
        setReason={setReportReason}
        error={reportError}
        busy={reportBusy}
        onCancel={() => setReportId(null)}
        onSubmit={async () => {
          if (reportId === null) return
          setReportBusy(true)
          setReportError(null)
          try {
            await apiFetch(`/api/listings/${reportId}/reports`, {
              method: 'POST',
              auth: true,
              body: JSON.stringify({ reason: reportReason }),
            })
            setReportId(null)
          } catch (e) {
            const err = e as ApiError
            setReportError(err.message ?? 'Failed to submit report')
          } finally {
            setReportBusy(false)
          }
        }}
      />
    </div>
  )
}

