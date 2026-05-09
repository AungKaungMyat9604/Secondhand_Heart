type ReportDialogProps = {
  isOpen: boolean
  title?: string
  reason: string
  setReason: (v: string) => void
  error?: string | null
  busy?: boolean
  onCancel: () => void
  onSubmit: () => void
}

export function ReportDialog({
  isOpen,
  title = 'Report listing',
  reason,
  setReason,
  error,
  busy,
  onCancel,
  onSubmit,
}: ReportDialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="modal fade show"
      role="dialog"
      aria-modal="true"
      style={{ display: 'block', background: 'rgba(2,6,23,0.55)' }}
      onClick={onCancel}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content shadow-soft">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onCancel} />
          </div>
          <div className="modal-body">
            <div className="text-muted small mb-2">
              Tell us what’s wrong. Reports are reviewed by admins.
            </div>
            {error ? <div className="alert alert-danger">{error}</div> : null}
            <label className="form-label" htmlFor="reason">
              Reason
            </label>
            <textarea
              id="reason"
              className="form-control"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this listing is inappropriate…"
            />
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onSubmit} disabled={busy || reason.trim().length < 10}>
              {busy ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

