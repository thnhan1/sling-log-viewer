import { IconAlert } from '../../ui/icons'

export function ConfirmClearModal({
  open,
  selectedFile,
  onCancel,
  onConfirm,
}: {
  open: boolean
  selectedFile: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-clear-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="modal-panel w-full max-w-[380px] p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-danger">
            <IconAlert size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-clear-title" className="text-[15px] font-medium text-text">
              Clear {selectedFile}?
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              This truncates the file on disk and cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Clear file
          </button>
        </div>
      </div>
    </div>
  )
}
