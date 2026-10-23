import { IconLogo } from '../../ui/icons'

export function LogViewerEmptyState({
  onChooseFolder,
  onConnect,
}: {
  onChooseFolder: () => void
  onConnect: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-raised">
        <IconLogo size={24} className="text-text" />
      </div>
      <h1 className="text-[24px] font-medium tracking-[-0.02em] text-text">Open a log to begin</h1>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
        Choose a folder of <span className="text-text">.log</span> files, or connect to an AEM
        instance to stream logs remotely.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-primary" onClick={onChooseFolder}>
          Choose folder
        </button>
        <button type="button" className="btn btn-ghost" onClick={onConnect}>
          Connect to AEM
        </button>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-tertiary">
        <span className="flex items-center gap-1.5">
          <kbd className="kbd">Ctrl</kbd>
          <kbd className="kbd">B</kbd>
          sidebar
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="kbd">Ctrl</kbd>
          <kbd className="kbd">F</kbd>
          search
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="kbd">Alt</kbd>
          <kbd className="kbd">↑</kbd>
          <kbd className="kbd">↓</kbd>
          tabs
        </span>
      </div>
    </div>
  )
}
