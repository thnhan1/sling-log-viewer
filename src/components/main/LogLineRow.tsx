import type { ParsedLogLine } from '@shared/types'
import { isBookmarked, type LogBookmark } from '../../lib/bookmarks'
import { renderRichLogText } from '../../lib/logLineRichText'
import { IconStar, IconStarFill } from '../../ui/icons'

export function LogLineRow({
  selectedFile,
  row,
  displayIndex,
  isSearchHit,
  isActiveSearchLine,
  bookmarks,
  onToggleLineBookmark,
}: {
  selectedFile: string
  row: ParsedLogLine
  displayIndex: number
  isSearchHit: boolean
  isActiveSearchLine: boolean
  bookmarks: LogBookmark[]
  onToggleLineBookmark: (fileName: string, raw: string) => void
}) {
  const threadNeedsBrackets = Boolean(row.thread && !row.thread.trimStart().startsWith('['))
  const fallbackUnknown = row.level === 'UNKNOWN' && !row.timestamp && !row.thread && !row.bundleOrClass
  const bm = isBookmarked(bookmarks, selectedFile, row.raw)

  return (
    <div
      data-log-index={displayIndex}
      className={`group flex items-start transition-colors ${
        isActiveSearchLine
          ? 'lv-search-row-active'
          : isSearchHit
            ? 'lv-search-row-hit'
            : 'hover:bg-surface-hover'
      }`}
    >
      {/* Line number gutter */}
      <span className="w-12 shrink-0 select-none pr-3 text-right font-mono text-[11px] leading-[22px] tabular-nums text-line-num">
        {displayIndex + 1}
      </span>

      {/* Bookmark toggle */}
      <button
        type="button"
        className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded transition-opacity ${
          bm
            ? 'text-warning opacity-100'
            : 'text-tertiary opacity-0 group-hover:opacity-100 hover:text-text'
        }`}
        title={bm ? 'Remove bookmark' : 'Bookmark'}
        aria-label={bm ? 'Remove bookmark' : 'Bookmark line'}
        onClick={() => onToggleLineBookmark(selectedFile, row.raw)}
      >
        {bm ? <IconStarFill size={12} /> : <IconStar size={12} />}
      </button>

      {/* Log line content */}
      <div className="min-w-0 max-w-full flex-1 whitespace-pre-wrap break-words pl-1.5 leading-[22px] text-mono [overflow-wrap:anywhere]">
        {fallbackUnknown ? (
          renderRichLogText(row.message, 'message')
        ) : (
          <>
            {row.timestamp && <span className="lv-log-timestamp">{row.timestamp} </span>}
            <span className={`lv-level lv-level--${row.level}`}>{row.level}</span>
            {row.thread && (
              <>
                {threadNeedsBrackets ? (
                  <>
                    <span className="lv-log-bracket"> [</span>
                    {renderRichLogText(row.thread, 'thread')}
                    <span className="lv-log-bracket">]</span>
                  </>
                ) : (
                  <>
                    {' '}
                    {renderRichLogText(row.thread, 'thread')}
                  </>
                )}
              </>
            )}
            {row.bundleOrClass && (
              <>
                <span className="lv-log-bracket"> [</span>
                <span className="lv-log-fqcn">{row.bundleOrClass}</span>
                <span className="lv-log-bracket">]</span>
              </>
            )}{' '}
            {renderRichLogText(row.message, 'message')}
            {row.cause && (
              <div className="mt-0.5 border-l border-border-strong pl-3 font-mono text-[11px] leading-[20px] text-secondary">
                {renderRichLogText(row.cause, 'cause')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
