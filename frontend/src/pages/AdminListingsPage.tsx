import { useEffect, useState } from 'react'
import { apiFetch, type ApiError } from '../api/client'
import { useMe } from '../auth/useMe'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DropdownSelect } from '../components/DropdownSelect'
import { Pagination } from '../components/Pagination'
import { ImageCarousel } from '../components/ImageCarousel'

type Listing = {
  id: number
  seller_id: number
  title: string
  description?: string | null
  condition?: string | null
  location_city?: string | null
  location_region?: string | null
  image_url: string | null
  images?: string[]
  is_approved: boolean
  status: string
  sale_type: 'auction' | 'sellings'
  price: string | null
  created_at: string | null
  deleted_at: string | null
  seller: { id: number; name: string; avatar_url: string | null } | null
}

type Meta = { current_page: number; last_page: number; per_page: number; total: number }
type IndexResponse<T> = { data: T[]; meta: Meta }

export function AdminListingsPage() {
  const { me } = useMe()
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [items, setItems] = useState<Listing[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [removeId, setRemoveId] = useState<number | null>(null)
  const [edit, setEdit] = useState<null | { id: number; title: string }>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Listing | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [saleType, setSaleType] = useState<'all' | 'auction' | 'sellings'>('all')
  const [status, setStatus] = useState<'all' | string>('all')
  const [removed, setRemoved] = useState<'all' | '0' | 'only'>('all')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [meta, setMeta] = useState<Meta | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set('filter', filter)
    params.set('page', String(page))
    params.set('per_page', String(perPage))
    if (query.trim()) params.set('q', query.trim())
    if (saleType !== 'all') params.set('sale_type', saleType)
    if (status !== 'all') params.set('status', status)
    if (removed === '0') params.set('removed', '0')
    if (removed === 'only') params.set('removed', 'only')

    apiFetch<IndexResponse<Listing>>(`/api/admin/listings?${params.toString()}`, { auth: true })
      .then((res) => {
        setItems(res.data)
        setMeta(res.meta)
      })
      .catch((e) => {
        const err = e as ApiError
        setError(err.message ?? 'Failed to load listings')
      })
      .finally(() => setLoading(false))
  }, [filter, page, perPage, saleType, status, removed])

  useEffect(() => {
    setPage(1)
  }, [filter, perPage, saleType, status, removed])

  function openEdit(l: Listing) {
    setEdit({ id: l.id, title: l.title })
    setEditTitle(l.title)
    setEditError(null)
  }

  async function openDetails(id: number) {
    setDetailId(id)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const res = await apiFetch<{ listing: Listing }>(`/api/admin/listings/${id}`, { auth: true })
      setDetail(res.listing)
    } catch (e) {
      const err = e as ApiError
      setDetailError(err.message ?? 'Failed to load listing details')
    } finally {
      setDetailLoading(false)
    }
  }

  async function saveEdit() {
    if (!edit) return
    setWorkingId(edit.id)
    setEditError(null)
    try {
      await apiFetch(`/api/admin/listings/${edit.id}`, {
        method: 'PUT',
        auth: true,
        body: JSON.stringify({ title: editTitle }),
      })
      setItems((p) => p.map((x) => (x.id === edit.id ? { ...x, title: editTitle } : x)))
      setEdit(null)
    } catch (e) {
      const err = e as ApiError
      setEditError(err.message ?? 'Edit failed')
    } finally {
      setWorkingId(null)
    }
  }

  async function approve(id: number) {
    setWorkingId(id)
    try {
      await apiFetch(`/api/admin/listings/${id}/approve`, { method: 'PUT', auth: true })
      if (filter === 'pending') {
        setItems((p) => p.filter((x) => x.id !== id))
      } else {
        setItems((p) => p.map((x) => (x.id === id ? { ...x, is_approved: true, status: 'ready' } : x)))
      }
    } catch (e) {
      const err = e as ApiError
      setError(err.message ?? 'Approve failed')
    } finally {
      setWorkingId(null)
    }
  }

  async function remove(id: number) {
    setWorkingId(id)
    try {
      await apiFetch(`/api/admin/listings/${id}`, { method: 'DELETE', auth: true })
      if (filter === 'pending') {
        setItems((p) => p.filter((x) => x.id !== id))
      } else {
        setItems((p) => p.map((x) => (x.id === id ? { ...x, status: 'removed', deleted_at: new Date().toISOString() } : x)))
      }
    } catch (e) {
      const err = e as ApiError
      setError(err.message ?? 'Remove failed')
    } finally {
      setWorkingId(null)
    }
  }

  if (me && me.role !== 'admin') {
    return <div className="alert alert-warning">Admin access required.</div>
  }

  const saleTypeOptions = [
    { value: 'all' as const, label: 'All types' },
    { value: 'sellings' as const, label: 'Sellings' },
    { value: 'auction' as const, label: 'Auction' },
  ]

  const statusOptions = [
    { value: 'all', label: 'All status' },
    { value: 'pending_approval', label: 'Pending approval' },
    { value: 'ready', label: 'Ready' },
    { value: 'in_auction', label: 'In auction' },
    { value: 'auction_ended', label: 'Auction ended' },
    { value: 'sold', label: 'Sold' },
    { value: 'removed', label: 'Removed' },
  ]

  const removedOptions = [
    { value: 'all' as const, label: 'All (incl removed)' },
    { value: '0' as const, label: 'Not removed' },
    { value: 'only' as const, label: 'Removed only' },
  ]

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h4 mb-1">Admin: listings</h1>
          <div className="text-muted small">Review, approve, edit, remove, and inspect listing details.</div>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
          <input
            className="form-control"
            style={{ minWidth: 220 }}
            placeholder="Search title/description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
              }
            }}
          />
          <div style={{ width: 170 }}>
            <DropdownSelect<'all' | 'auction' | 'sellings'>
              value={saleType}
              options={saleTypeOptions}
              onChange={(v) => setSaleType(v === '' ? 'all' : v)}
              searchable={false}
            />
          </div>
          <div style={{ width: 210 }}>
            <DropdownSelect<string>
              value={status}
              options={statusOptions}
              onChange={(v) => setStatus(v || 'all')}
              searchable={false}
            />
          </div>
          <div style={{ width: 200 }}>
            <DropdownSelect<'all' | '0' | 'only'>
              value={removed}
              options={removedOptions}
              onChange={(v) => setRemoved(v === '' ? 'all' : v)}
              searchable={false}
            />
          </div>
          <div className="btn-group" role="group" aria-label="Filter">
            <button type="button" className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('all')}>
              All
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
          </div>
        </div>
      </div>
      {loading ? <div className="text-muted">Loading…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="list-group">
        {items.map((l) => (
          <div
            key={l.id}
            className="list-group-item d-flex justify-content-between align-items-center"
            style={{ background: 'rgba(255,255,255,0.7)' }}
          >
            <div>
              <div className="fw-semibold">{l.title}</div>
              <div className="text-muted small d-flex flex-wrap gap-2">
                {l.seller ? <span>• By {l.seller.name}</span> : null}
                {l.location_city && l.location_region ? <span>• {l.location_city}, {l.location_region}</span> : null}
                {l.created_at ? <span>• {new Date(l.created_at).toLocaleString()}</span> : null}
                {l.deleted_at ? <span className="text-danger">• removed</span> : null}
              </div>
            </div>
            <div className="d-flex gap-2">
              {(() => {
                const isRemoved = l.deleted_at !== null
                const isPendingApproval = l.status === 'pending_approval' && l.is_approved === false
                const isEditLocked = l.status === 'in_auction' || l.status === 'auction_ended' || l.status === 'sold'

                const detailsDisabled = workingId === l.id

                const approveDisabled = workingId === l.id || isRemoved || !isPendingApproval
                const approveTitle = isRemoved
                  ? 'Removed listings cannot be approved.'
                  : !isPendingApproval
                    ? 'Only pending listings can be approved.'
                    : 'Approve listing'

                const editDisabled = workingId === l.id || isRemoved || isEditLocked
                const editTitle = isRemoved
                  ? 'Removed listings cannot be edited.'
                  : isEditLocked
                    ? 'Editing is disabled while an auction is running/ended or after sold.'
                    : 'Edit listing'

                const removeDisabled = workingId === l.id || isRemoved
                const removeTitle = isRemoved ? 'Already removed.' : 'Remove listing'

                return (
                  <>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => void openDetails(l.id)}
                      disabled={detailsDisabled}
                      title="View details"
                    >
                      Details
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => openEdit(l)}
                      disabled={editDisabled}
                      title={editTitle}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => (approveDisabled ? null : setConfirmId(l.id))}
                      disabled={approveDisabled}
                      title={approveTitle}
                    >
                      {workingId === l.id ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => (removeDisabled ? null : setRemoveId(l.id))}
                      disabled={removeDisabled}
                      title={removeTitle}
                    >
                      Remove
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        ))}
      </div>

      {edit ? (
        <div
          className="modal fade show"
          role="dialog"
          aria-modal="true"
          style={{ display: 'block', background: 'rgba(2,6,23,0.55)' }}
          onClick={() => setEdit(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-soft">
              <div className="modal-header">
                <h5 className="modal-title">Edit listing</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setEdit(null)} />
              </div>
              <div className="modal-body">
                {editError ? <div className="alert alert-danger">{editError}</div> : null}
                <label className="form-label" htmlFor="editTitle">
                  Title
                </label>
                <input
                  id="editTitle"
                  className="form-control"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setEdit(null)} disabled={workingId === edit.id}>
                  Cancel
                </button>
                <button className="btn btn-outline-primary" onClick={() => setEditTitle(edit.title)} disabled={workingId === edit.id}>
                  Reset
                </button>
                <button className="btn btn-primary" onClick={() => void saveEdit()} disabled={workingId === edit.id}>
                  {workingId === edit.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detailId !== null ? (
        <div
          className="modal fade show"
          role="dialog"
          aria-modal="true"
          style={{ display: 'block', background: 'rgba(2,6,23,0.55)' }}
          onClick={() => setDetailId(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-soft">
              <div className="modal-header">
                <h5 className="modal-title">Listing details</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setDetailId(null)} />
              </div>
              <div className="modal-body">
                {detailLoading ? <div className="text-muted">Loading…</div> : null}
                {detailError ? <div className="alert alert-danger">{detailError}</div> : null}
                {detail ? (
                  <div className="row g-3">
                    <div className="col-12 col-lg-5">
                      {(() => {
                        const imgs =
                          detail.images && detail.images.length > 0 ? detail.images : detail.image_url ? [detail.image_url] : []
                        if (imgs.length === 0) return <div className="text-muted small">No image.</div>
                        return <ImageCarousel id="adminListingImagesCarousel" images={imgs} alt={detail.title} maxHeight={320} rounded />
                      })()}
                    </div>
                    <div className="col-12 col-lg-7">
                      <div className="fw-semibold mb-1">{detail.title}</div>
                      <div className="text-muted small mb-2">Listing</div>

                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className={`badge ${detail.is_approved ? 'text-bg-success' : 'text-bg-secondary'}`}>
                          {detail.is_approved ? 'approved' : 'pending'}
                        </span>
                        <span className="badge text-bg-light text-dark border">{detail.status}</span>
                        <span className="badge text-bg-secondary">{detail.sale_type}</span>
                        {detail.sale_type === 'sellings' && detail.price ? (
                          <span className="badge text-bg-success">Price: {detail.price}</span>
                        ) : null}
                        {detail.deleted_at ? <span className="badge text-bg-danger">removed</span> : null}
                      </div>

                      <div className="small">
                        <div className="text-muted">Seller</div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          {detail.seller?.avatar_url ? (
                            <img
                              src={detail.seller.avatar_url}
                              alt=""
                              width={26}
                              height={26}
                              style={{ borderRadius: 999, objectFit: 'cover' }}
                            />
                          ) : (
                            <span
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 999,
                                background: 'rgba(15,23,42,0.08)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                              aria-hidden="true"
                            >
                              {(detail.seller?.name?.[0] ?? 'U').toUpperCase()}
                            </span>
                          )}
                          <div>{detail.seller?.name ?? 'Unknown user'}</div>
                        </div>

                        <div className="text-muted">Created</div>
                        <div className="mb-2">{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</div>

                        <div className="text-muted">Item location</div>
                        <div className="mb-2">
                          {detail.location_city && detail.location_region ? `${detail.location_city}, ${detail.location_region}` : '—'}
                        </div>

                        <div className="text-muted">Removed</div>
                        <div>{detail.deleted_at ? new Date(detail.deleted_at).toLocaleString() : '—'}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setDetailId(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        title="Approve listing?"
        body="Approving will make this listing visible publicly. You can still remove it later as an admin."
        confirmText="Approve"
        confirmVariant="primary"
        isOpen={confirmId !== null}
        busy={confirmId !== null && workingId === confirmId}
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId === null) return
          const id = confirmId
          setConfirmId(null)
          void approve(id)
        }}
      />

      <ConfirmDialog
        title="Remove listing?"
        body="This will delete the listing. This action cannot be undone."
        confirmText="Remove"
        confirmVariant="danger"
        isOpen={removeId !== null}
        busy={removeId !== null && workingId === removeId}
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId === null) return
          const id = removeId
          setRemoveId(null)
          void remove(id)
        }}
      />

      {!loading && items.length === 0 ? (
        <div className="card shadow-soft mt-3">
          <div className="card-body">
            <div className="fw-semibold">All caught up</div>
            <div className="text-muted small">
              {filter === 'pending' ? 'No pending listings right now.' : 'No listings found.'}
            </div>
          </div>
        </div>
      ) : null}

      <Pagination
        meta={meta}
        className="mt-3"
        perPage={perPage}
        onPerPageChange={(n) => {
          setPage(1)
          setPerPage(n)
        }}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  )
}

