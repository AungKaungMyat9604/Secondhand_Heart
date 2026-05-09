import { useState } from 'react'
import { apiFetch, setAuthToken, type ApiError } from '../api/client'
import { useNavigate } from 'react-router-dom'

type LoginResponse = {
  token: string
  user: { id: number; name: string; email: string }
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<{ kind: 'success' | 'info' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors(null)
    setVerifyStatus(null)
    setNeedsVerification(false)
    setLoading(true)
    try {
      const res = await apiFetch<LoginResponse>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setAuthToken(res.token)
      navigate('/profile')
    } catch (e) {
      const err = e as ApiError
      setError(err.message ?? 'Login failed')
      setFieldErrors(err.errors ?? null)
      if ((err.message ?? '').toLowerCase().includes('email not verified')) {
        setNeedsVerification(true)
      }
    } finally {
      setLoading(false)
    }
  }

  async function resendVerification() {
    if (!email) return
    setVerifyStatus(null)
    setResendLoading(true)
    try {
      await apiFetch<{ message: string }>('/api/email/verification/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setVerifyStatus({ kind: 'info', message: 'We sent a new verification code. Please check your email (and spam).' })
      setNeedsVerification(true)
    } catch (e) {
      const err = e as ApiError
      setVerifyStatus({ kind: 'error', message: err.message ?? 'Failed to resend verification code.' })
    } finally {
      setResendLoading(false)
    }
  }

  async function verifyEmail() {
    if (!email || verifyCode.length !== 6) return
    setVerifyStatus(null)
    setVerifyLoading(true)
    try {
      await apiFetch<{ message: string }>('/api/email/verification/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code: verifyCode }),
      })
      // Clear the previous login error and show success.
      setError(null)
      setFieldErrors(null)
      setVerifyStatus({ kind: 'success', message: 'Email verified successfully. You can login now.' })
      setNeedsVerification(false)
      setVerifyCode('')
    } catch (e) {
      const err = e as ApiError
      setVerifyStatus({ kind: 'error', message: err.message ?? 'Invalid code.' })
      setNeedsVerification(true)
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-5">
        <div className="text-center mb-3">
          <div className="badge text-bg-secondary mb-2">Welcome back</div>
          <h1 className="h4 mb-0">Login</h1>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        {needsVerification ? (
          <div className="alert alert-warning">
            <div className="fw-semibold mb-1">Email not verified</div>
            <div className="small text-muted mb-3">
              Please verify your email to continue. We can resend a code, then you can enter it below.
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <button type="button" className="btn btn-outline-primary" onClick={resendVerification} disabled={resendLoading}>
                {resendLoading ? 'Sending…' : 'Resend code'}
              </button>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-12 col-sm">
                <label className="form-label" htmlFor="verifyCode">
                  Verification code (6 digits)
                </label>
                <input
                  id="verifyCode"
                  className="form-control"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                />
              </div>
              <div className="col-12 col-sm-auto">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={verifyEmail}
                  disabled={verifyLoading || verifyCode.length !== 6}
                >
                  {verifyLoading ? 'Verifying…' : 'Verify'}
                </button>
              </div>
            </div>

            {verifyStatus ? (
              <div
                className={`alert mt-3 mb-0 ${
                  verifyStatus.kind === 'success'
                    ? 'alert-success'
                    : verifyStatus.kind === 'error'
                      ? 'alert-danger'
                      : 'alert-info'
                }`}
              >
                {verifyStatus.message}
              </div>
            ) : null}
          </div>
        ) : null}
        <form className="card card-body shadow-soft" onSubmit={onSubmit}>
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={`form-control ${fieldErrors?.email ? 'is-invalid' : ''}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldErrors?.email ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.email.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={`form-control ${fieldErrors?.password ? 'is-invalid' : ''}`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {fieldErrors?.password ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.password.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

