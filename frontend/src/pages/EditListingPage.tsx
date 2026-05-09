import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiFetch, apiFetchForm, type ApiError } from '../api/client'
import { useAuthToken } from '../auth/useAuthToken'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DropdownSelect } from '../components/DropdownSelect'

type Listing = {
  id: number
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
}

type ListingResponse = { listing: Listing }

export function EditListingPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuthToken()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [status, setStatus] = useState<string>('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationRegion, setLocationRegion] = useState('')
  const [saleType, setSaleType] = useState<'auction' | 'sellings'>('auction')
  const [price, setPrice] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const saleLocked = status === 'in_auction' || status === 'auction_ended'

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

  useEffect(() => {
    if (!token || !listingId) return
    setLoading(true)
    setError(null)
    apiFetch<ListingResponse>(`/api/my/listings/${listingId}`, { auth: true })
      .then((res) => {
        const l = res.listing
        setStatus(l.status)
        setTitle(l.title)
        setDescription(l.description ?? '')
        setCondition(l.condition ?? '')
        setLocationCity(l.location_city ?? '')
        setLocationRegion(l.location_region ?? '')
        setSaleType(l.sale_type)
        setPrice(l.price ?? '')
        setExistingImages(l.images && l.images.length > 0 ? l.images : l.image_url ? [l.image_url] : [])
      })
      .catch((e) => setError((e as ApiError).message ?? 'Failed to load listing'))
      .finally(() => setLoading(false))
  }, [token, listingId])

  if (!token) {
    return (
      <div className="card shadow-soft">
        <div className="card-body">
          <div className="fw-semibold mb-1">Login required</div>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="text-muted">Loading…</div>
  if (error) return <div className="alert alert-danger">{error}</div>
  if (status === 'sold') {
    return (
      <div className="card shadow-soft">
        <div className="card-body">
          <div className="fw-semibold mb-2">This listing is sold</div>
          <div className="text-muted small mb-3">Sold listings cannot be edited.</div>
          <Link to="/my/listings" className="btn btn-primary">
            Back to my listings
          </Link>
        </div>
      </div>
    )
  }

  async function doSave() {
    if (!listingId) return
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
      if (!saleLocked) {
        form.append('sale_type', saleType)
        if (saleType === 'sellings') form.append('price', price)
      }
      for (const file of images) form.append('images[]', file)

      await apiFetchForm<ListingResponse>(`/api/listings/${listingId}`, form, {
        auth: true,
        method: 'PUT',
      })
      navigate('/my/listings')
    } catch (err) {
      const e = err as ApiError
      setError(e.message ?? 'Failed to save')
      setFieldErrors(e.errors ?? null)
    } finally {
      setSaving(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setConfirmOpen(true)
  }

  return (
    <>
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
            <div>
              <h1 className="h4 mb-1">Edit listing</h1>
              <div className="text-muted small">
                Saving changes will re-submit this listing for admin approval (status becomes{' '}
                <span className="fw-semibold">pending_approval</span>).
              </div>
            </div>
            <div className="d-flex gap-2">
              <Link to="/my/listings" className="btn btn-outline-secondary">
                Cancel
              </Link>
            </div>
          </div>

          {saleLocked ? (
            <div className="alert alert-warning small mb-3">
              This listing is in an auction flow. Editing is disabled until the auction ends and is resolved.
            </div>
          ) : null}

          {error ? <div className="alert alert-danger">{error}</div> : null}

          <form className="card card-body shadow-soft" onSubmit={onSubmit}>
          <label className="form-label" htmlFor="sale_type_edit">
            Sale type
          </label>
          <DropdownSelect<'auction' | 'sellings'>
            value={saleType}
            options={[
              { value: 'auction', label: 'Auction' },
              { value: 'sellings', label: 'Sellings' },
            ]}
            disabled={saleLocked}
            searchable={false}
            buttonClassName={fieldErrors?.sale_type ? 'is-invalid' : undefined}
            onChange={(v) => {
              const next = v === 'sellings' ? 'sellings' : 'auction'
              setSaleType(next)
              if (next === 'auction') setPrice('')
            }}
          />
          {fieldErrors?.sale_type ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.sale_type.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          {saleType === 'sellings' ? (
            <>
              <label className="form-label" htmlFor="price_edit">
                Price
              </label>
              <input
                id="price_edit"
                type="number"
                min="0"
                step="0.01"
                className={`form-control ${fieldErrors?.price ? 'is-invalid' : ''}`}
                value={price}
                disabled={saleLocked}
                onChange={(e) => setPrice(e.target.value)}
                required={!saleLocked}
              />
              {fieldErrors?.price ? (
                <div className="invalid-feedback d-block mb-3">{fieldErrors.price.join(' ')}</div>
              ) : (
                <div className="mb-3" />
              )}
            </>
          ) : null}

          <label className="form-label" htmlFor="title_edit">
            Title
          </label>
          <input
            id="title_edit"
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

          <label className="form-label" htmlFor="condition_edit">
            Condition
          </label>
          <input
            id="condition_edit"
            className={`form-control ${fieldErrors?.condition ? 'is-invalid' : ''}`}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
          {fieldErrors?.condition ? (
            <div className="invalid-feedback d-block mb-3">{fieldErrors.condition.join(' ')}</div>
          ) : (
            <div className="mb-3" />
          )}

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="location_city_edit">
                Item location (city)
              </label>
              <input
                id="location_city_edit"
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
              <label className="form-label" htmlFor="location_region_edit">
                Item location (region/state)
              </label>
              <input
                id="location_region_edit"
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

          <label className="form-label" htmlFor="description_edit">
            Description
          </label>
          <textarea
            id="description_edit"
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

          <label className="form-label" htmlFor="images_edit">
            Replace images (optional)
          </label>
          <input
            id="images_edit"
            type="file"
            accept="image/*"
            multiple
            className={`form-control ${fieldErrors?.images ? 'is-invalid' : ''}`}
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />
          {imagePreviewUrls.length > 0 ? (
            <div className="mt-2">
              <div className="text-muted small mb-1">New images preview</div>
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
              <div className="text-muted small mt-2">Saving will replace all existing images.</div>
            </div>
          ) : existingImages.length > 0 ? (
            <div className="mt-2">
              <div className="text-muted small mb-1">Current images</div>
              <div className="row g-2">
                {existingImages.map((u) => (
                  <div key={u} className="col-6 col-md-4">
                    <img src={u} alt="" className="rounded border w-100" style={{ height: 120, objectFit: 'cover' }} />
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

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Save changes and re-submit for approval?"
        body="Editing a listing will change its status back to pending approval, and it will be hidden from public Browse until an admin approves it again."
        confirmText="Yes, save changes"
        confirmVariant="primary"
        busy={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false)
          await doSave()
        }}
      />
    </>
  )
}
