import { useState } from 'react'
import { apiFetch, type ApiError } from '../api/client'
import { useNavigate } from 'react-router-dom'

type RegisterResponse = {
  user: { id: number; name: string; email: string }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors(null)
    setLoading(true)
    try {
      await apiFetch<RegisterResponse>('/api/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      })
      navigate('/login')
    } catch (e) {
      const err = e as ApiError
      setError(err.message ?? 'Registration failed')
      setFieldErrors(err.errors ?? null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-5">
        <div className="text-center mb-3">
          <div className="badge text-bg-secondary mb-2">Create your account</div>
          <h1 className="h4 mb-0">Register</h1>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}
        <form className="card card-body shadow-soft" onSubmit={onSubmit}>
          <label className="form-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className={`form-control ${fieldErrors?.name ? 'is-invalid' : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {fieldErrors?.name ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.name.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

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
            Password (min 8)
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
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

