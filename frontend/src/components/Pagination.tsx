type Meta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

import { DropdownSelect } from './DropdownSelect'

export function Pagination({
  meta,
  onPageChange,
  perPage,
  onPerPageChange,
  perPageOptions,
  className,
}: {
  meta: Meta | null
  onPageChange: (page: number) => void
  perPage: number
  onPerPageChange: (perPage: number) => void
  perPageOptions?: number[]
  className?: string
}) {
  if (!meta) return null

  const canPrev = meta.current_page > 1
  const canNext = meta.current_page < meta.last_page
  const options = perPageOptions ?? [10, 20, 30, 50, 100]
  const sizeOptions = options.map((n) => ({ value: n, label: `${n} / page` }))

  return (
    <div className={`d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 ${className ?? ''}`}>
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={!canPrev}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          Prev
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={!canNext}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Next
        </button>
        <div className="text-muted small">
          Page <span className="fw-semibold">{meta.current_page}</span> / <span className="fw-semibold">{meta.last_page}</span> •{' '}
          <span className="fw-semibold">{meta.total}</span> total
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 justify-content-md-end">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Page</span>
          <input
            className="form-control form-control-sm"
            style={{ width: 84 }}
            inputMode="numeric"
            value={String(meta.current_page)}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, '')
              const n = raw ? Number(raw) : 1
              const clamped = Math.max(1, Math.min(meta.last_page, n))
              onPageChange(clamped)
            }}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Size</span>
          <div style={{ width: 130 }}>
            <DropdownSelect<number>
              size="sm"
              value={perPage}
              options={sizeOptions}
              onChange={(v) => onPerPageChange(Number(v))}
              buttonClassName="btn-outline-secondary"
              searchable={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

