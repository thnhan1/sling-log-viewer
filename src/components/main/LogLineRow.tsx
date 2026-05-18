import type { ParsedLogLine } from '@shared/types'
import { isBookmarked, type LogBookmark } from '../../lib/bookmarks'
import { renderRichLogText } from '../../lib/logLineRichText'
import { LEVEL_CLASS } from '../../ui/logViewerUi'

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
  onToggleLineBookmark: (raw: string) => void
}) {
  const threadNeedsBrackets = Boolean(row.thread && !row.thread.trimStart().startsWith('['))
  const fallbackUnknown = row.level === 'UNKNOWN' && !row.timestamp && !row.thread && !row.bundleOrClass
  const bm = isBookmarked(bookmarks, selectedFile, row.raw)

  return (
    <div
      data-log-index={displayIndex}
      className={`flex items-start transition-colors ${
        isActiveSearchLine
          ? 'lv-search-row-active'
          : isSearchHit
            ? 'lv-search-row-hit'
            : 'hover:bg-[rgba(255,255,255,0.02)]'
      }`}
    >
      {/* Line number gutter */}
      <span className="shrink-0 w-[56px] text-right pr-4 text-line-num select-none text-mono-sm leading-[20px] tabular-nums">
        {displayIndex + 1}
      </span>

      {/* Bookmark toggle */}
      <button
        type="button"
        className={`shrink-0 w-5 text-center text-mono-sm leading-[20px] transition-all ${
          bm ? 'text-warning opacity-100' : 'text-transparent opacity-0'
        } hover:scale-110`}
        title={bm ? 'Remove bookmark' : 'Bookmark'}
        onClick={() => onToggleLineBookmark(row.raw)}
      >
        {bm ? '★' : '☆'}
      </button>

      {/* Log line content */}
      <div className="min-w-0 flex-1 whitespace-pre-wrap break-all leading-[20px] text-mono">
        {fallbackUnknown ? (
          renderRichLogText(row.message, 'message')
        ) : (
          <>
            {row.timestamp && <span className="lv-log-timestamp">{row.timestamp} </span>}
            <span className={LEVEL_CLASS[row.level]}>*{row.level}*</span>
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
              <div className="mt-0.5 border-l-2 border-accent pl-3 font-mono text-mono-sm opacity-90">
                {renderRichLogText(row.cause, 'cause')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
