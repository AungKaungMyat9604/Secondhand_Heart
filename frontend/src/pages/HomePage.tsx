import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, getAuthToken, type ApiError } from '../api/client'

type Stats = {
  total_users: number
  total_active_listings: number
  total_now_selling_listings: number
  total_now_in_auction_listings: number
  total_directly_sold_listings: number
  total_auction_completed_listings: number
}

export function HomePage() {
  const authed = useMemo(() => Boolean(getAuthToken()), [])
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ stats: Stats }>('/api/stats')
      .then((r) => setStats(r.stats))
      .catch((e) => setError((e as ApiError).message ?? 'Failed to load stats'))
  }, [])

  function StatCard({ label, value, help }: { label: string; value: number | null; help?: string }) {
    return (
      <div className="card sh-glass shadow-sm h-100">
        <div className="card-body">
          <div className="text-muted small">{label}</div>
          <div className="fs-1 fw-bold mb-0 sh-stat-number">{value === null ? '—' : value.toLocaleString()}</div>
          {help ? <div className="text-muted small">{help}</div> : null}
        </div>
      </div>
    )
  }

  function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
    return (
      <div className="card sh-glass shadow-sm h-100">
        <div className="card-body d-flex gap-3">
          <div className="sh-icon-pill flex-shrink-0" aria-hidden="true">
            <span className="fw-bold">{icon}</span>
          </div>
          <div>
            <div className="fw-semibold mb-1">{title}</div>
            <div className="text-muted small">{desc}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card shadow-soft sh-hero border-0">
          <div className="card-body p-4 p-lg-5">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge text-bg-light text-dark border">Marketplace</span>
                  <span className="badge text-bg-light text-dark border">Auctions</span>
                  <span className="badge text-bg-light text-dark border">Sellings</span>
                </div>
                <h1 className="display-6 fw-bold mb-2">Secondhand Heart</h1>
                <div className="text-muted">Browse, bid, and sell with a clean approval-first marketplace.</div>
              </div>
              {!authed ? (
                <div className="d-flex flex-wrap gap-2">
                  <Link className="btn btn-primary" to="/register">
                    Register
                  </Link>
                  <Link className="btn btn-outline-primary" to="/login">
                    Login
                  </Link>
                  <Link className="btn btn-outline-secondary" to="/browse">
                    Browse
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  <Link className="btn btn-primary" to="/browse">
                    Browse marketplace
                  </Link>
                  <Link className="btn btn-outline-primary" to="/my/listings">
                    My listings
                  </Link>
                </div>
              )}
            </div>

            {!authed ? (
              <div className="mt-4">
                <div className="card sh-glass shadow-sm border-0">
                  <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                    <div>
                      <div className="fw-semibold">Create an account to unlock everything</div>
                      <div className="text-muted small">
                        Sell items, create auctions, bid, and track your activity. Use the buttons above to get started.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="row g-3 mt-4">
              <div className="col-12 col-md-6 col-lg-4">
                <FeatureCard title="Sellings" icon="S" desc="Fixed-price items with clean listing details and photos." />
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <FeatureCard title="Auctions" icon="A" desc="Bid and track auction status with live updates while active." />
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <FeatureCard title="Trust + control" icon="T" desc="Approval-first listings and seller-controlled sold status keeps Browse clean." />
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <FeatureCard title="Your dashboard" icon="D" desc="Manage listings, edit them, and monitor auctions and results." />
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <FeatureCard title="Notifications" icon="N" desc="Get alerts when you’re outbid or when an auction ends." />
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <FeatureCard title="Multi-image listings" icon="P" desc="Upload multiple photos and view them in a detail-page slider." />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <div className="fw-semibold">Marketplace activity</div>
          <div className="text-muted small">Live snapshot</div>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="row g-3">
          <div className="col-6 col-lg-4">
            <StatCard label="Total users" value={stats ? stats.total_users : null} />
          </div>
          <div className="col-6 col-lg-4">
            <StatCard label="Active listings" value={stats ? stats.total_active_listings : null} help="Approved + ready" />
          </div>
          <div className="col-6 col-lg-4">
            <StatCard label="Now selling" value={stats ? stats.total_now_selling_listings : null} help="Sellings + ready" />
          </div>

          <div className="col-6 col-lg-4">
            <StatCard label="In auction" value={stats ? stats.total_now_in_auction_listings : null} help="Auction listings + in_auction" />
          </div>
          <div className="col-6 col-lg-4">
            <StatCard label="Directly sold" value={stats ? stats.total_directly_sold_listings : null} help="Sellings + sold" />
          </div>
          <div className="col-6 col-lg-4">
            <StatCard label="Auction completed" value={stats ? stats.total_auction_completed_listings : null} help="Ended + has bids" />
          </div>
        </div>
      </div>
    </div>
  )
}

