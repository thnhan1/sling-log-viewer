export function LogViewerEmptyState({ selected }: { selected: boolean }) {
  if (selected) return null

  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-ui-xl font-semibold text-text">
        No log file open
      </p>
      <p className="max-w-sm text-ui leading-relaxed text-muted">
        Set a log folder and click a <span className="text-text font-medium">.log</span> file in the sidebar to open it in a new tab.
      </p>
    </div>
  )
}
