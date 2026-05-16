import { formatBytes } from '../../ui/logViewerUi'

export function LogHeaderBar({
  sidebarOpen,
  onToggleSidebar,
  selectedFile,
  fileSize,
  displayLineCount,
  totalLineCount,
  filteredLineCount,
  hasSidebarFiltersEffect,
  searchQ,
  searchHitCount,
  truncated,
  stickToBottom,
  onOpenSettings,
  onJumpLatest,
  onClearView,
  onRequestClearFile,
  onRefresh,
}: {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  selectedFile: string | null
  fileSize: number
  displayLineCount: number
  totalLineCount: number
  filteredLineCount: number
  hasSidebarFiltersEffect: boolean
  searchQ: string
  searchHitCount: number
  truncated: boolean
  stickToBottom: boolean
  onOpenSettings: () => void
  onJumpLatest: () => void
  onClearView: () => void
  onRequestClearFile: () => void
  onRefresh: () => void
}) {
  return (
    <header className="flex shrink-0 items-center gap-2 glass-toolbar border-b border-border px-3 py-1.5">
      {/* Sidebar toggle */}
      <button
        type="button"
        className="btn-macos shrink-0 flex items-center gap-1"
        onClick={onToggleSidebar}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        aria-expanded={sidebarOpen}
      >
        <span className="text-[10px]">{sidebarOpen ? '◀' : '▶'}</span>
        <span className="text-[11px]">Sidebar</span>
      </button>

      <span className="divider-macos" />

      <div className="flex-1" />

      {selectedFile && (
        <>
          <span className="text-[11px] text-muted tabular-nums">
            {formatBytes(fileSize)} · {displayLineCount.toLocaleString()}/{totalLineCount.toLocaleString()}
            {hasSidebarFiltersEffect && ` · ${filteredLineCount.toLocaleString()} filtered`}
            {searchQ && searchHitCount > 0 && ` · ${searchHitCount} hits`}
            {truncated && ' · tail'}
          </span>

          <span className="divider-macos" />

          {!stickToBottom && (
            <button type="button" className="btn-macos" onClick={onJumpLatest} title="Jump to latest">
              Bottom
            </button>
          )}
          <button type="button" className="btn-macos" onClick={onClearView} title="Clear view">
            Clear view
          </button>
          <button
            type="button"
            className="btn-macos btn-macos--danger"
            onClick={onRequestClearFile}
            title="Clear file on disk"
          >
            Clear file
          </button>
          <button type="button" className="btn-macos" onClick={onRefresh} title="Refresh">
            Refresh
          </button>

          <span className="divider-macos" />
        </>
      )}

      <button type="button" className="btn-macos" onClick={onOpenSettings} title="Settings">
        {selectedFile ? '⚙' : 'Settings'}
      </button>
    </header>
  )
}
