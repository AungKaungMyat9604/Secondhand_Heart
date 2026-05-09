import { useEffect, useState } from 'react'
import { apiFetch, apiFetchForm, getAuthToken, type ApiError } from '../api/client'
import { useNavigate } from 'react-router-dom'

type Profile = {
  name: string
  email: string
  phone: string | null
  address: string | null
  facebook_url: string | null
  avatar_url?: string | null
}

type ShowProfileResponse = { profile: Profile }
type UpdateProfileResponse = { profile: Profile }

export function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [savedProfile, setSavedProfile] = useState<Profile | null>(null)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!avatarPreviewUrl) return
    return () => URL.revokeObjectURL(avatarPreviewUrl)
  }, [avatarPreviewUrl])

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login')
      return
    }

    apiFetch<ShowProfileResponse>('/api/profile', { auth: true })
      .then((res) => {
        setProfile(res.profile)
        setSavedProfile(res.profile)
        setPhone(res.profile.phone ?? '')
        setAddress(res.profile.address ?? '')
        setFacebookUrl(res.profile.facebook_url ?? '')
      })
      .catch((e) => {
        const err = e as ApiError
        setError(err.message ?? 'Failed to load profile')
      })
  }, [navigate])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors(null)
    setSuccess(null)
    setSaving(true)
    try {
      const form = new FormData()
      form.append('phone', phone || '')
      form.append('address', address || '')
      form.append('facebook_url', facebookUrl || '')
      if (avatar) form.append('avatar', avatar)

      const res = await apiFetchForm<UpdateProfileResponse>('/api/profile', form, { method: 'PUT', auth: true })
      setProfile(res.profile)
      setSavedProfile(res.profile)
      setSuccess('Saved successfully.')
      setAvatar(null)
      setAvatarPreviewUrl(null)
      window.dispatchEvent(new Event('me_updated'))
    } catch (e) {
      const err = e as ApiError
      setError(err.message ?? 'Failed to save profile')
      setFieldErrors(err.errors ?? null)
    } finally {
      setSaving(false)
    }
  }

  function onReset() {
    if (!savedProfile) return
    setPhone(savedProfile.phone ?? '')
    setAddress(savedProfile.address ?? '')
    setFacebookUrl(savedProfile.facebook_url ?? '')
    setAvatar(null)
    setAvatarPreviewUrl(null)
    setError(null)
    setFieldErrors(null)
    setSuccess(null)
  }

  if (!profile) {
    return <div className="text-muted">Loading profile…</div>
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="mb-3">
          <h1 className="h4 mb-1">Profile & contact info</h1>
          <p className="text-muted mb-0">
          After an auction ends, the seller and winner can view each other’s
          contact info.
          </p>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}

        <div className="card shadow-soft mb-3">
          <div className="card-body">
            <div className="d-flex align-items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  width={44}
                  height={44}
                  style={{ borderRadius: 999, objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: 'rgba(124, 58, 237, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#5b21b6',
                  }}
                  aria-hidden="true"
                >
                  {profile.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <div>
                <div className="fw-semibold">{profile.name}</div>
                <div className="text-muted small">{profile.email}</div>
              </div>
            </div>
          </div>
        </div>

        <form className="card card-body shadow-soft" onSubmit={onSave}>
          <label className="form-label" htmlFor="avatar">
            Profile picture (optional)
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            className={`form-control ${fieldErrors?.avatar ? 'is-invalid' : ''}`}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setAvatar(f)
              if (!f) {
                setAvatarPreviewUrl(null)
                return
              }
              if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
              const url = URL.createObjectURL(f)
              setAvatarPreviewUrl(url)
            }}
          />
          {avatarPreviewUrl ? (
            <div className="mt-2 mb-3">
              <div className="text-muted small mb-1">Preview</div>
              <img
                src={avatarPreviewUrl}
                alt=""
                width={84}
                height={84}
                style={{ borderRadius: 999, objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div className="mb-3" />
          )}
          {fieldErrors?.avatar ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.avatar.join(' ')}</div>
          ) : null}

          <label className="form-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className={`form-control ${fieldErrors?.phone ? 'is-invalid' : ''}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {fieldErrors?.phone ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.phone.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <label className="form-label" htmlFor="address">
            Address
          </label>
          <input
            id="address"
            className={`form-control ${fieldErrors?.address ? 'is-invalid' : ''}`}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {fieldErrors?.address ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.address.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <label className="form-label" htmlFor="facebook">
            Facebook URL
          </label>
          <input
            id="facebook"
            className={`form-control ${fieldErrors?.facebook_url ? 'is-invalid' : ''}`}
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
          />
          {fieldErrors?.facebook_url ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.facebook_url.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <div className="d-flex flex-column flex-sm-row gap-2">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn btn-outline-primary" onClick={onReset} disabled={saving}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

