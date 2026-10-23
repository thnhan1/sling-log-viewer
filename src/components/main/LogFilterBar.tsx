import { useEffect, useRef } from 'react'
import type { LogLevel } from '@shared/types'
import type { LogBookmark } from '../../lib/bookmarks'
import { LEVELS } from '../../ui/logViewerUi'
import { DateTimeInput } from './DateTimeInput'
import {
  IconArrowDown,
  IconArrowUp,
  IconBookmark,
  IconSearch,
  IconX,
} from '../../ui/icons'

function isMacPlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
}

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
  levelsOff,
  onToggleLevel,
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
  levelsOff: Set<LogLevel>
  onToggleLevel: (l: LogLevel) => void
  bookmarksOpen: boolean
  onToggleBookmarksOpen: () => void
  fileBookmarks: LogBookmark[]
  onJumpToRawLine: (raw: string) => void
  onRemoveBookmark: (id: string) => void
}) {
  const hasTimeFilter = Boolean(timeFromStr || timeToStr)
  const bookmarksRef = useRef<HTMLDivElement>(null)
  const mod = isMacPlatform() ? '⌘' : 'Ctrl'

  useEffect(() => {
    if (!bookmarksOpen) return
    const onDown = (e: MouseEvent) => {
      if (bookmarksRef.current && !bookmarksRef.current.contains(e.target as Node)) {
        onToggleBookmarksOpen()
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onToggleBookmarksOpen()
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [bookmarksOpen, onToggleBookmarksOpen])

  return (
    <div className="command-bar">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 basis-[220px] max-w-[380px]">
          <IconSearch
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"
          />
          <input
            id="log-search"
            className="field h-7 pl-8 pr-14"
            placeholder="Search logs…"
            value={viewQuickFilter}
            onChange={(e) => setViewQuickFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (e.shiftKey) onEnterSearchPrev()
                else onEnterSearchNext()
              }
            }}
            aria-label="Search logs"
            spellCheck={false}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
            <kbd className="kbd">{mod}</kbd>
            <kbd className="kbd">F</kbd>
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="icon-btn h-7 w-7"
            disabled={!searchQ || searchHitCount === 0}
            onClick={onEnterSearchPrev}
            title="Previous match (Shift+Enter)"
            aria-label="Previous match"
          >
            <IconArrowUp size={14} />
          </button>
          <button
            type="button"
            className="icon-btn h-7 w-7"
            disabled={!searchQ || searchHitCount === 0}
            onClick={onEnterSearchNext}
            title="Next match (Enter)"
            aria-label="Next match"
          >
            <IconArrowDown size={14} />
          </button>
        </div>

        {searchQ && (
          <span className="flex items-center gap-1 text-[11px] tabular-nums text-tertiary">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              disabled={searchHitCount === 0}
              className="field h-6 w-10 px-1 text-center text-[11px] tabular-nums"
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
              title="Match number"
              aria-label="Jump to match number"
            />
            <span className="shrink-0">/ {searchHitCount}</span>
          </span>
        )}

        <span className="divider hidden md:block" />

        {/* Levels */}
        <div className="flex flex-wrap items-center gap-0.5" role="group" aria-label="Filter by log level">
          {LEVELS.map((l) => {
            const on = !levelsOff.has(l)
            return (
              <button
                key={l}
                type="button"
                onClick={() => onToggleLevel(l)}
                className={`level-toggle level-toggle--${l} ${on ? 'is-on' : 'is-off'}`}
                aria-pressed={on}
                title={`${on ? 'Hide' : 'Show'} ${l}`}
              >
                <span className={`level-dot level-dot--${l}`} />
                {l}
              </button>
            )
          })}
        </div>

        <span className="divider hidden xl:block" />

        {/* Time range */}
        <div className="hidden items-center gap-1.5 xl:flex">
          <DateTimeInput value={timeFromStr} onChange={setTimeFromStr} placeholder="From time…" />
          <span className="text-[11px] text-tertiary">to</span>
          <DateTimeInput value={timeToStr} onChange={setTimeToStr} placeholder="To time…" />
          {hasTimeFilter && (
            <button
              type="button"
              className="icon-btn h-7 w-7"
              onClick={onClearTime}
              title="Clear time range"
              aria-label="Clear time range"
            >
              <IconX size={13} />
            </button>
          )}
        </div>

        {/* Bookmarks */}
        <div ref={bookmarksRef} className="relative ml-auto">
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${bookmarksOpen ? 'is-active' : ''}`}
            onClick={onToggleBookmarksOpen}
            title="Bookmarks"
            aria-expanded={bookmarksOpen}
          >
            <IconBookmark size={13} />
            <span className="tabular-nums">{fileBookmarks.length > 0 ? fileBookmarks.length : ''}</span>
          </button>

          {bookmarksOpen && (
            <div className="popover absolute right-0 top-full z-50 mt-2 w-[min(420px,calc(100vw-24px))] p-2">
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="label">Bookmarks</span>
                <span className="text-[10px] tabular-nums text-tertiary">{fileBookmarks.length}</span>
              </div>
              {fileBookmarks.length === 0 ? (
                <p className="px-2 py-4 text-[12px] leading-relaxed text-tertiary">
                  No bookmarks yet. Hover a log line and click the star to save it.
                </p>
              ) : (
                <ul className="max-h-[280px] space-y-0.5 overflow-y-auto">
                  {fileBookmarks.map((b) => (
                    <li key={b.id} className="group flex items-start gap-1 rounded-md hover:bg-surface-hover">
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate px-2 py-1.5 text-left font-mono text-[11px] text-secondary transition-colors hover:text-text"
                        onClick={() => onJumpToRawLine(b.raw)}
                        title="Scroll to line"
                      >
                        {b.raw}
                      </button>
                      <button
                        type="button"
                        className="icon-btn mt-0.5 h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => onRemoveBookmark(b.id)}
                        aria-label="Remove bookmark"
                      >
                        <IconX size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
