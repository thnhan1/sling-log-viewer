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
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-clear-title"
    >
      <div className="max-w-sm rounded-xl glass-modal border border-[rgba(255,255,255,0.08)] shadow-2xl p-5">
        <h2 id="confirm-clear-title" className="mb-2 text-ui font-semibold text-text">
          Clear log file
        </h2>
        <p className="mb-4 text-ui text-text leading-relaxed">
          Truncate <strong>{selectedFile}</strong> on disk? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn-macos"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-macos btn-macos--danger"
            onClick={onConfirm}
          >
            Clear file
          </button>
        </div>
      </div>
    </div>
  )
}
