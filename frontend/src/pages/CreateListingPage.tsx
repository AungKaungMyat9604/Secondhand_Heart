import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetchForm, getAuthToken, type ApiError } from '../api/client'
import { DropdownSelect } from '../components/DropdownSelect'

type CreateListingResponse = {
  listing: { id: number; title: string; is_approved: boolean }
}

export function CreateListingPage() {
  const navigate = useNavigate()
  const authed = useMemo(() => Boolean(getAuthToken()), [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationRegion, setLocationRegion] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])

  useEffect(() => {
    if (images.length === 0) {
      setImagePreviewUrls([])
      return
    }
    const urls = images.map((f) => URL.createObjectURL(f))
    setImagePreviewUrls(urls)
    return () => {
      for (const u of urls) URL.revokeObjectURL(u)
    }
  }, [images])
  const [saleType, setSaleType] = useState<'auction' | 'sellings'>('auction')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors(null)
    setSaving(true)
    try {
      const form = new FormData()
      form.append('title', title)
      if (description) form.append('description', description)
      if (condition) form.append('condition', condition)
      form.append('location_city', locationCity)
      form.append('location_region', locationRegion)
      for (const file of images) form.append('images[]', file)
      form.append('sale_type', saleType)
      if (saleType === 'sellings' && price) form.append('price', price)

      await apiFetchForm<CreateListingResponse>('/api/listings', form, { auth: true })
      navigate('/my/listings')
    } catch (e) {
      const err = e as ApiError
      setError(err.message ?? 'Failed to create listing')
      setFieldErrors(err.errors ?? null)
    } finally {
      setSaving(false)
    }
  }

  function onReset() {
    setTitle('')
    setDescription('')
    setCondition('')
    setLocationCity('')
    setLocationRegion('')
    setImages([])
    setSaleType('auction')
    setPrice('')
    setError(null)
    setFieldErrors(null)
  }

  if (!authed) {
    return (
      <div className="row justify-content-center">
        <div className="col-12 col-lg-7">
          <div className="card shadow-soft">
            <div className="card-body">
              <div className="fw-semibold mb-1">Login required</div>
              <div className="text-muted small mb-3">
                You need to be logged in to create a listing.
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/login" className="btn btn-primary">
                  Go to login
                </Link>
                <Link to="/browse" className="btn btn-outline-primary">
                  Back to browse
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div>
            <h1 className="h4 mb-1">Create listing</h1>
            <div className="text-muted small">
              New listings start as <b>pending approval</b>.
            </div>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-primary" onClick={onReset} disabled={saving}>
              Reset
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/my/listings')} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
        {error ? <div className="alert alert-danger">{error}</div> : null}

        <form className="card card-body shadow-soft" onSubmit={onSubmit}>
          <label className="form-label" htmlFor="sale_type">
            Sale type
          </label>
          <DropdownSelect<'auction' | 'sellings'>
            value={saleType}
            options={[
              { value: 'auction', label: 'Auction' },
              { value: 'sellings', label: 'Sellings' },
            ]}
            onChange={(v) => {
              const next = v === 'sellings' ? 'sellings' : 'auction'
              setSaleType(next)
              if (next === 'auction') setPrice('')
            }}
            searchable={false}
            buttonClassName={fieldErrors?.sale_type ? 'is-invalid' : undefined}
          />
          {fieldErrors?.sale_type ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.sale_type.join(' ')}</div>
          ) : (
            <div className="text-muted small mb-3">
              Choose <b>Sellings</b> for a fixed price, or <b>Auction</b> to run a bidding auction later.
            </div>
          )}

          {saleType === 'sellings' ? (
            <>
              <label className="form-label" htmlFor="price">
                Price
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                className={`form-control ${fieldErrors?.price ? 'is-invalid' : ''}`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 15000"
                required
              />
              {fieldErrors?.price ? (
                <div className="invalid-feedback d-block mb-3">{fieldErrors.price.join(' ')}</div>
              ) : (
                <div className="text-muted small mb-3">Payment happens outside the app (cash/bank transfer, etc.).</div>
              )}
            </>
          ) : null}

          <label className="form-label" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className={`form-control ${fieldErrors?.title ? 'is-invalid' : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {fieldErrors?.title ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.title.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <label className="form-label" htmlFor="condition">
            Condition
          </label>
          <input
            id="condition"
            className={`form-control ${fieldErrors?.condition ? 'is-invalid' : ''}`}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g. Like new / Used / Box damaged"
          />
          {fieldErrors?.condition ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.condition.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="location_city">
                Item location (city)
              </label>
              <input
                id="location_city"
                className={`form-control ${fieldErrors?.location_city ? 'is-invalid' : ''}`}
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. Yangon"
                required
              />
              {fieldErrors?.location_city ? (
                <div className="invalid-feedback d-block">{fieldErrors.location_city.join(' ')}</div>
              ) : null}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="location_region">
                Item location (region/state)
              </label>
              <input
                id="location_region"
                className={`form-control ${fieldErrors?.location_region ? 'is-invalid' : ''}`}
                value={locationRegion}
                onChange={(e) => setLocationRegion(e.target.value)}
                placeholder="e.g. Yangon Region"
                required
              />
              {fieldErrors?.location_region ? (
                <div className="invalid-feedback d-block">{fieldErrors.location_region.join(' ')}</div>
              ) : null}
            </div>
          </div>
          <div className="mb-3" />

          <label className="form-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className={`form-control ${fieldErrors?.description ? 'is-invalid' : ''}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          {fieldErrors?.description ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.description.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <label className="form-label" htmlFor="images">
            Images (optional)
          </label>
          <input
            id="images"
            className={`form-control ${fieldErrors?.images ? 'is-invalid' : ''}`}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />
          {imagePreviewUrls.length > 0 ? (
            <div className="mt-2">
              <div className="text-muted small mb-1">Preview</div>
              <div className="row g-2">
                {imagePreviewUrls.map((u, idx) => (
                  <div key={u} className="col-6 col-md-4">
                    <div className="position-relative">
                      <img src={u} alt="" className="rounded border w-100" style={{ height: 120, objectFit: 'cover' }} />
                      <button
                        type="button"
                        className="btn btn-sm btn-dark position-absolute top-0 end-0 m-1"
                        title="Remove"
                        onClick={() => setImages((p) => p.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {fieldErrors?.images ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.images.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create'}
          </button>
          <div className="text-muted small mt-2">You can edit or delete your listing later.</div>
        </form>
      </div>
    </div>
  )
}

