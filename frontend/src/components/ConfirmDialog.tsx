type ConfirmDialogProps = {
  title: string
  body: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'danger' | 'primary'
  isOpen: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  body,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  isOpen,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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
          <div className="modal-body text-muted">{body}</div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
              {cancelText}
            </button>
            <button
              type="button"
              className={confirmVariant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? 'Working…' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

