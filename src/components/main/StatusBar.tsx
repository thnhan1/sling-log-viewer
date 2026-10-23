import { formatBytes } from '../../ui/logViewerUi'

export function StatusBar({
  selectedFile,
  fileSize,
  lineCount,
  totalLineCount,
  filteredLineCount,
  truncated,
  searchHitCount,
}: {
  selectedFile: string | null
  fileSize: number
  lineCount: number
  totalLineCount: number
  filteredLineCount: number
  truncated: boolean
  searchHitCount: number
}) {
  const hasSidebarFiltersEffect = filteredLineCount !== totalLineCount
  return (
    <footer className="flex h-[22px] shrink-0 select-none items-center border-t border-border bg-surface px-3 text-[11px] text-tertiary">
      <div className="flex min-w-0 items-center gap-2">
        {selectedFile ? (
          <>
            <span className="truncate text-secondary">{selectedFile}</span>
            <span className="text-tertiary">·</span>
            <span className="whitespace-nowrap tabular-nums">
              {hasSidebarFiltersEffect
                ? `${lineCount.toLocaleString()} / ${totalLineCount.toLocaleString()}`
                : lineCount.toLocaleString()}{' '}
              lines
            </span>
            <span className="text-tertiary">·</span>
            <span className="whitespace-nowrap tabular-nums">{formatBytes(fileSize)}</span>
            <span className="hidden text-tertiary sm:inline">·</span>
            <span className="hidden sm:inline">UTF-8</span>
            {searchHitCount > 0 && (
              <>
                <span className="text-tertiary">·</span>
                <span className="whitespace-nowrap tabular-nums">{searchHitCount} hits</span>
              </>
            )}
            {truncated && (
              <>
                <span className="text-tertiary">·</span>
                <span>tail</span>
              </>
            )}
          </>
        ) : (
          <span>No file selected</span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-debug" />
        <span className="text-[10px] uppercase tracking-[0.08em]">Live</span>
      </div>
    </footer>
  )
}
