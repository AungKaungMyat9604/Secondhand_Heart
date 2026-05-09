import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { setAuthToken } from '../api/client'
import { useMe } from '../auth/useMe'
import { useEffect, useState } from 'react'
import { useNotificationCount } from '../notifications/useNotificationCount'
import { useAuthToken } from '../auth/useAuthToken'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { authed } = useAuthToken()
  const { me } = useMe()
  const { unread } = useNotificationCount()
  const [open, setOpen] = useState(false)
  const [sellOpen, setSellOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const sellActive =
    location.pathname.startsWith('/my/listings') ||
    location.pathname.startsWith('/my/auctions') ||
    location.pathname.startsWith('/listings/new') ||
    location.pathname.startsWith('/auctions/new')

  const adminActive = location.pathname.startsWith('/admin/')

  useEffect(() => {
    setOpen(false)
    setSellOpen(false)
    setAccountOpen(false)
    setAdminOpen(false)
  }, [location.pathname])

  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <span className="fw-semibold">Secondhand</span> Heart
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            aria-controls="mainNavbar"
            aria-expanded={open}
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className={`collapse navbar-collapse ${open ? 'show' : ''}`} id="mainNavbar">
            <ul className="navbar-nav mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/">
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/browse">
                  Browse
                </NavLink>
              </li>
              {authed ? (
                <li className="nav-item dropdown">
                  <button
                    type="button"
                    className={`nav-link dropdown-toggle btn btn-link ${sellActive ? 'active' : ''}`}
                    style={{ textDecoration: 'none' }}
                    aria-expanded={sellOpen}
                    onClick={() => {
                      setSellOpen((v) => !v)
                      setAccountOpen(false)
                      setAdminOpen(false)
                    }}
                  >
                    Sell
                  </button>
                  <ul className={`dropdown-menu ${sellOpen ? 'show' : ''}`}>
                    <li>
                      <NavLink className="dropdown-item" to="/my/listings">
                        My listings
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/my/auctions">
                        My auctions
                      </NavLink>
                    </li>
                  </ul>
                </li>
              ) : null}

              {me?.role === 'admin' ? (
                <li className="nav-item dropdown">
                  <button
                    type="button"
                    className={`nav-link dropdown-toggle btn btn-link ${adminActive ? 'active' : ''}`}
                    style={{ textDecoration: 'none' }}
                    aria-expanded={adminOpen}
                    onClick={() => {
                      setAdminOpen((v) => !v)
                      setSellOpen(false)
                      setAccountOpen(false)
                    }}
                  >
                    Admin
                  </button>
                  <ul className={`dropdown-menu ${adminOpen ? 'show' : ''}`}>
                    <li>
                      <NavLink className="dropdown-item" to="/admin/listings">
                        Listings
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/admin/users">
                        Users
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/admin/auctions">
                        Auctions
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/admin/reports">
                        Reports
                      </NavLink>
                    </li>
                  </ul>
                </li>
              ) : null}
            </ul>

            <div className="ms-auto d-flex gap-2 align-items-center">
              {authed ? (
                <NavLink
                  to="/notifications"
                  className="btn btn-outline-light position-relative"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unread > 0 ? (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unread}
                      <span className="visually-hidden">unread notifications</span>
                    </span>
                  ) : null}
                </NavLink>
              ) : null}

              {authed ? (
                <div className="dropdown">
                  <button
                    type="button"
                    className="btn btn-outline-light dropdown-toggle d-inline-flex align-items-center gap-2"
                    aria-expanded={accountOpen}
                    onClick={() => {
                      setAccountOpen((v) => !v)
                      setSellOpen(false)
                      setAdminOpen(false)
                    }}
                  >
                    {me?.avatar_url ? (
                      <img
                        src={me.avatar_url}
                        alt=""
                        width={22}
                        height={22}
                        style={{ borderRadius: 999, objectFit: 'cover' }}
                      />
                    ) : (
                      <span
                        className="rounded-circle d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: 22,
                          height: 22,
                          background: 'rgba(255,255,255,0.16)',
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                        aria-hidden="true"
                      >
                        {(me?.name?.[0] ?? 'U').toUpperCase()}
                      </span>
                    )}
                    <span className="d-none d-md-inline">{me?.name ?? 'Account'}</span>
                  </button>
                  <ul className={`dropdown-menu dropdown-menu-end ${accountOpen ? 'show' : ''}`}>
                    <li>
                      <NavLink className="dropdown-item" to="/profile">
                        Profile
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/notifications">
                        Notifications {unread > 0 ? `(${unread})` : ''}
                      </NavLink>
                    </li>
                    <li>
                      <NavLink className="dropdown-item" to="/my/activity">
                        My activity
                      </NavLink>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => {
                          setAuthToken(null)
                          navigate('/login')
                        }}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : null}

              {!authed ? (
                <>
                  <NavLink className="btn btn-outline-light" to="/login">
                    Login
                  </NavLink>
                  <NavLink className="btn btn-primary" to="/register">
                    Register
                  </NavLink>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <main className="container flex-grow-1 py-4">
        <Outlet />
      </main>

      <footer className="border-top py-3 bg-white">
        <div className="container d-flex flex-column flex-md-row gap-2 justify-content-between align-items-md-center">
          <div className="text-muted small">Secondhand Heart</div>
          <div className="text-muted small">
            {me ? (
              <>
                Signed in as <span className="fw-semibold">{me.email}</span>
              </>
            ) : (
              'Not signed in'
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

