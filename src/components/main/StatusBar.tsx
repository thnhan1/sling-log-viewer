import { formatBytes } from '../../ui/logViewerUi'

export function StatusBar({
  selectedFile,
  fileSize,
  lineCount,
}: {
  selectedFile: string | null
  fileSize: number
  lineCount: number
}) {
  return (
    <footer className="flex shrink-0 items-center h-[26px] bg-statusbar border-t border-[rgba(255,255,255,0.06)] px-3 text-ui-sm text-muted select-none">
      <div className="flex items-center gap-3 min-w-0">
        {selectedFile ? (
          <>
            <span>UTF-8</span>
            <span className="w-px h-3 bg-[rgba(255,255,255,0.07)]" />
            <span className="truncate">{selectedFile}</span>
            <span className="w-px h-3 bg-[rgba(255,255,255,0.07)]" />
            <span>{lineCount.toLocaleString()} lines</span>
            <span className="w-px h-3 bg-[rgba(255,255,255,0.07)]" />
            <span>{formatBytes(fileSize)}</span>
          </>
        ) : (
          <span>No file selected</span>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <span className="text-ui-xs text-accent font-medium">● Tail</span>
      </div>
    </footer>
  )
}
