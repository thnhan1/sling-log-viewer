import type { LogBookmark } from '../../lib/bookmarks'

export function LogFilterBar({
  viewQuickFilter,
  setViewQuickFilter,
  onEnterSearchNext,
  onEnterSearchPrev,
  searchQ,
  searchHitCount,
  matchOrdinalInput,
  setMatchOrdinalInput,
  onCommitMatchOrdinal,
  onMatchOrdinalFocus,
  onMatchOrdinalBlur,
  onMatchOrdinalEnter,
  timeFromStr,
  setTimeFromStr,
  timeToStr,
  setTimeToStr,
  onClearTime,
  onJumpToTop,
  bookmarksOpen,
  onToggleBookmarksOpen,
  fileBookmarks,
  onJumpToRawLine,
  onRemoveBookmark,
}: {
  viewQuickFilter: string
  setViewQuickFilter: (v: string) => void
  onEnterSearchNext: () => void
  onEnterSearchPrev: () => void
  searchQ: string
  searchHitCount: number
  matchOrdinalInput: string
  setMatchOrdinalInput: (v: string) => void
  onCommitMatchOrdinal: () => void
  onMatchOrdinalFocus: () => void
  onMatchOrdinalBlur: () => void
  onMatchOrdinalEnter: () => void
  timeFromStr: string
  setTimeFromStr: (v: string) => void
  timeToStr: string
  setTimeToStr: (v: string) => void
  onClearTime: () => void
  onJumpToTop: () => void
  bookmarksOpen: boolean
  onToggleBookmarksOpen: () => void
  fileBookmarks: LogBookmark[]
  onJumpToRawLine: (raw: string) => void
  onRemoveBookmark: (id: string) => void
}) {
  const hasTimeFilter = Boolean(timeFromStr || timeToStr)
  return (
    <div className="shrink-0 border-b border-border bg-bg px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-1">
          <input
            className="input-macos w-[180px]"
            placeholder="Find in log..."
            value={viewQuickFilter}
            onChange={(e) => setViewQuickFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (e.shiftKey) onEnterSearchPrev()
                else onEnterSearchNext()
              }
            }}
            aria-label="Search in log view"
          />
          <button
            type="button"
            className="btn-macos text-ui-sm"
            disabled={!searchQ || searchHitCount === 0}
            onClick={onEnterSearchPrev}
            title="Previous match (Shift+Enter)"
          >
            ◂
          </button>
          <button
            type="button"
            className="btn-macos text-ui-sm"
            disabled={!searchQ || searchHitCount === 0}
            onClick={onEnterSearchNext}
            title="Next match (Enter)"
          >
            ▸
          </button>
          {searchQ && (
            <span className="inline-flex items-center gap-1 text-ui-sm tabular-nums text-muted ml-1">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={searchHitCount === 0}
                className="input-macos w-10 text-center tabular-nums"
                value={matchOrdinalInput}
                onChange={(e) => setMatchOrdinalInput(e.target.value.replace(/\D/g, ''))}
                onFocus={onMatchOrdinalFocus}
                onBlur={() => {
                  onMatchOrdinalBlur()
                  onCommitMatchOrdinal()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onMatchOrdinalEnter()
                    ;(e.target as HTMLInputElement).blur()
                  }
                }}
                title="Match #"
                aria-label="Jump to match number"
              />
              <span className="shrink-0">/ {searchHitCount}</span>
            </span>
          )}
        </div>

        <span className="divider-macos" />

        {/* Time range */}
        <input
          type="datetime-local"
          className="input-macos w-[170px]"
          value={timeFromStr}
          onChange={(e) => setTimeFromStr(e.target.value)}
          title="From time"
        />
        <span className="text-ui-sm text-muted">to</span>
        <input
          type="datetime-local"
          className="input-macos w-[170px]"
          value={timeToStr}
          onChange={(e) => setTimeToStr(e.target.value)}
          title="To time"
        />
        {hasTimeFilter && (
          <button type="button" className="btn-macos text-ui-sm" onClick={onClearTime} title="Clear time range">
            Clear time
          </button>
        )}

        <span className="divider-macos" />

        <button type="button" className="btn-macos text-ui-sm" onClick={onJumpToTop} title="Scroll to top">
          Top
        </button>
        <button type="button" className="btn-macos text-ui-sm" onClick={onToggleBookmarksOpen} title="Toggle bookmarks">
          {fileBookmarks.length > 0 ? `Bookmarks (${fileBookmarks.length})` : 'Bookmarks'}
        </button>
      </div>

      {bookmarksOpen && (
        <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] p-2 text-ui">
          {fileBookmarks.length === 0 ? (
            <p className="text-muted">No bookmarks yet. Hover a log line and click the star to save it.</p>
          ) : (
            <ul className="space-y-1">
              {fileBookmarks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-[rgba(255,255,255,0.05)] bg-bg px-3 py-1.5"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left text-text text-ui font-mono truncate hover:text-accent transition-colors"
                    onClick={() => onJumpToRawLine(b.raw)}
                    title="Scroll to line"
                  >
                    {b.raw}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 text-muted hover:text-error text-ui leading-none w-5 h-5 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                    onClick={() => onRemoveBookmark(b.id)}
                    aria-label="Remove bookmark"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
