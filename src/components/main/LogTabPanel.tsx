import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LogLevel, ParsedLogLine } from '@shared/types'
import {
  bookmarksForFile,
  type LogBookmark,
} from '../../lib/bookmarks'
import { useLogStream } from '../../hooks/useLogStream'
import { applyLogViewFilters } from '../../lib/logViewFilters'
import { LogFilterBar } from './LogFilterBar'
import { VirtualLogLines } from './VirtualLogLines'
import { StatusBar } from './StatusBar'
import { formatBytes } from '../../ui/logViewerUi'

function filterLines(rows: ParsedLogLine[], levelsOff: Set<LogLevel>): ParsedLogLine[] {
  return rows.filter((row) => !levelsOff.has(row.level))
}

const btnCls =
  'btn-macos text-ui-sm'

export function LogTabPanel({
  file,
  active,
  refreshKey,
  levelsOff,
  bookmarks,
  onToggleLineBookmark,
  onRemoveBookmark,
  onRequestClearFile,
  onOpenSettings,
}: {
  file: string
  active: boolean
  refreshKey: number
  levelsOff: Set<LogLevel>
  bookmarks: LogBookmark[]
  onToggleLineBookmark: (raw: string) => void
  onRemoveBookmark: (id: string) => void
  onRequestClearFile: () => void
  onOpenSettings: () => void
}) {
  const { lines, truncated, error, fileSize, reloadTail, clearViewOnly } = useLogStream(file)

  // Reload when parent triggers refresh (e.g. after file clear)
  const prevRefreshKey = useRef(refreshKey)
  useEffect(() => {
    if (refreshKey !== prevRefreshKey.current) {
      prevRefreshKey.current = refreshKey
      void reloadTail()
    }
  }, [refreshKey, reloadTail])

  const [viewQuickFilter, setViewQuickFilter] = useState('')
  const [timeFromStr, setTimeFromStr] = useState('')
  const [timeToStr, setTimeToStr] = useState('')

  const timeFromMs = useMemo(() => {
    if (!timeFromStr.trim()) return null
    const t = new Date(timeFromStr).getTime()
    return Number.isFinite(t) ? t : null
  }, [timeFromStr])

  const timeToMs = useMemo(() => {
    if (!timeToStr.trim()) return null
    const t = new Date(timeToStr).getTime()
    return Number.isFinite(t) ? t : null
  }, [timeToStr])

  const filtered = useMemo(() => filterLines(lines, levelsOff), [lines, levelsOff])

  const displayLines = useMemo(
    () =>
      applyLogViewFilters(filtered, {
        fromMs: timeFromMs,
        toMs: timeToMs,
      }),
    [filtered, timeFromMs, timeToMs],
  )

  const searchQ = viewQuickFilter.trim()
  const searchQLower = searchQ.toLowerCase()

  const searchMatchLineIndices = useMemo(() => {
    if (!searchQ) return [] as number[]
    const out: number[] = []
    for (let i = 0; i < displayLines.length; i++) {
      if (displayLines[i].raw.toLowerCase().includes(searchQLower)) out.push(i)
    }
    return out
  }, [displayLines, searchQ, searchQLower])

  const [searchMatchActive, setSearchMatchActive] = useState(0)

  useEffect(() => {
    setSearchMatchActive(0)
  }, [searchQ])

  useEffect(() => {
    setSearchMatchActive((a) => {
      if (searchMatchLineIndices.length === 0) return 0
      return Math.min(a, searchMatchLineIndices.length - 1)
    })
  }, [searchMatchLineIndices.length])

  const searchMatchLineIndicesRef = useRef(searchMatchLineIndices)
  searchMatchLineIndicesRef.current = searchMatchLineIndices

  const searchMatchActiveRef = useRef(searchMatchActive)
  searchMatchActiveRef.current = searchMatchActive

  const [matchOrdinalInput, setMatchOrdinalInput] = useState('')
  const matchOrdinalFocusedRef = useRef(false)

  useEffect(() => {
    if (matchOrdinalFocusedRef.current) return
    if (searchMatchLineIndices.length === 0) {
      setMatchOrdinalInput('')
      return
    }
    setMatchOrdinalInput(String(searchMatchActive + 1))
  }, [searchMatchActive, searchMatchLineIndices.length])

  const commitMatchOrdinal = useCallback(() => {
    const n = searchMatchLineIndicesRef.current.length
    if (n === 0) return
    const raw = matchOrdinalInput.trim()
    if (raw === '') {
      setMatchOrdinalInput(String(searchMatchActiveRef.current + 1))
      return
    }
    const v = parseInt(raw, 10)
    if (!Number.isFinite(v)) {
      setMatchOrdinalInput(String(searchMatchActiveRef.current + 1))
      return
    }
    const clamped = Math.min(Math.max(1, v), n)
    setSearchMatchActive(clamped - 1)
    setMatchOrdinalInput(String(clamped))
  }, [matchOrdinalInput])

  const goSearchNext = useCallback(() => {
    setSearchMatchActive((a) => {
      const n = searchMatchLineIndicesRef.current.length
      if (n === 0) return 0
      return (a + 1) % n
    })
  }, [])

  const goSearchPrev = useCallback(() => {
    setSearchMatchActive((a) => {
      const n = searchMatchLineIndicesRef.current.length
      if (n === 0) return 0
      return (a - 1 + n) % n
    })
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const [stickToBottom, setStickToBottom] = useState(true)
  const scrollToIndexRef = useRef<((index: number, align?: 'center' | 'end') => void) | null>(null)

  const scrollToDisplayIndex = useCallback(
    (idx: number, align: 'center' | 'end' = 'center') => {
      if (idx < 0) return
      if (scrollToIndexRef.current) {
        scrollToIndexRef.current(idx, align)
        return
      }
      const container = scrollRef.current
      if (!container) return
      const el = container.querySelector(`[data-log-index="${idx}"]`) as HTMLElement | null
      if (!el) return
      setStickToBottom(false)
      requestAnimationFrame(() => {
        const c = container.getBoundingClientRect()
        const r = el.getBoundingClientRect()
        const delta = r.top + r.height / 2 - (c.top + c.height / 2)
        const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
        const nextTop = Math.min(maxScroll, Math.max(0, container.scrollTop + delta))
        container.scrollTo({ top: nextTop, behavior: 'smooth' })
      })
    },
    [],
  )

  const activeHitDisplayIndex = useMemo(() => {
    if (!searchQ || searchMatchLineIndices.length === 0) return -1
    const idx = searchMatchLineIndices[searchMatchActive]
    return idx === undefined ? -1 : idx
  }, [searchQ, searchMatchLineIndices, searchMatchActive])

  useEffect(() => {
    if (activeHitDisplayIndex < 0) return
    scrollToDisplayIndex(activeHitDisplayIndex, 'center')
  }, [activeHitDisplayIndex, scrollToDisplayIndex])

  const fileBookmarks = useMemo(
    () => bookmarksForFile(file, bookmarks),
    [file, bookmarks],
  )

  const [bookmarksOpen, setBookmarksOpen] = useState(false)

  const jumpToTop = useCallback(() => {
    setStickToBottom(false)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const jumpToRawLine = useCallback(
    (raw: string) => {
      const idxVisible = displayLines.findIndex((r) => r.raw === raw)
      if (idxVisible >= 0) {
        scrollToDisplayIndex(idxVisible, 'center')
        return
      }
      if (!filtered.some((r) => r.raw === raw)) return
      setViewQuickFilter('')
      setTimeFromStr('')
      setTimeToStr('')
      // After clearing filters the pending scroll will fire via the filtered→displayLines chain.
      // For simplicity, just do it in a microtask.
      queueMicrotask(() => {
        const idx = displayLines.findIndex((r) => r.raw === raw)
        if (idx >= 0) scrollToDisplayIndex(idx, 'center')
      })
    },
    [displayLines, filtered, scrollToDisplayIndex],
  )

  const jumpLatest = useCallback(() => {
    setStickToBottom(true)
    const last = displayLines.length - 1
    if (last >= 0 && scrollToIndexRef.current) {
      scrollToIndexRef.current(last, 'end')
      return
    }
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [displayLines.length])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    setStickToBottom(dist < 64)
  }, [])

  useEffect(() => {
    if (!stickToBottom) return
    const last = displayLines.length - 1
    if (last < 0) return
    if (scrollToIndexRef.current) {
      scrollToIndexRef.current(last, 'end')
      return
    }
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [displayLines.length, stickToBottom])

  const hasSidebarFiltersEffect = filtered.length !== lines.length

  return (
    <div
      style={{ display: active ? undefined : 'none' }}
      className="flex flex-col flex-1 min-h-0 min-w-0"
    >
      {/* Per-tab header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-bg px-3 py-1 h-[28px]">
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <span className="text-ui-sm text-muted mr-1">
            {formatBytes(fileSize)} · {displayLines.length.toLocaleString()}/{lines.length.toLocaleString()}
            {hasSidebarFiltersEffect && ` · ${filtered.length.toLocaleString()} filtered`}
            {searchQ && searchMatchLineIndices.length > 0 && ` · ${searchMatchLineIndices.length} hits`}
            {truncated && ' · tail'}
          </span>
          {!stickToBottom && (
            <button type="button" className={btnCls} onClick={jumpLatest} title="Jump to latest">
              Bottom
            </button>
          )}
          <button type="button" className={btnCls} onClick={clearViewOnly} title="Clear view">
            Clear view
          </button>
          <button
            type="button"
            className={`${btnCls} btn-macos--danger`}
            onClick={onRequestClearFile}
            title="Clear file on disk"
          >
            Clear file
          </button>
          <button type="button" className={btnCls} onClick={() => void reloadTail()} title="Refresh">
            Refresh
          </button>
          <span className="divider-macos" />
          <button type="button" className={btnCls} onClick={onOpenSettings} title="Settings">
            ⚙
          </button>
        </div>
      </header>

      {error && (
        <div className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,159,10,0.08)] px-4 py-1.5 text-ui text-warning">
          {error}
        </div>
      )}

      <LogFilterBar
        viewQuickFilter={viewQuickFilter}
        setViewQuickFilter={setViewQuickFilter}
        onEnterSearchNext={goSearchNext}
        onEnterSearchPrev={goSearchPrev}
        searchQ={searchQ}
        searchHitCount={searchMatchLineIndices.length}
        matchOrdinalInput={matchOrdinalInput}
        setMatchOrdinalInput={setMatchOrdinalInput}
        onCommitMatchOrdinal={commitMatchOrdinal}
        onMatchOrdinalFocus={() => {
          matchOrdinalFocusedRef.current = true
        }}
        onMatchOrdinalBlur={() => {
          matchOrdinalFocusedRef.current = false
        }}
        onMatchOrdinalEnter={() => {
          matchOrdinalFocusedRef.current = false
        }}
        timeFromStr={timeFromStr}
        setTimeFromStr={setTimeFromStr}
        timeToStr={timeToStr}
        setTimeToStr={setTimeToStr}
        onClearTime={() => {
          setTimeFromStr('')
          setTimeToStr('')
        }}
        onJumpToTop={jumpToTop}
        bookmarksOpen={bookmarksOpen}
        onToggleBookmarksOpen={() => setBookmarksOpen((o) => !o)}
        fileBookmarks={fileBookmarks}
        onJumpToRawLine={jumpToRawLine}
        onRemoveBookmark={onRemoveBookmark}
      />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="font-mono text-mono flex-1 overflow-auto bg-bg"
      >
        <VirtualLogLines
          scrollEl={scrollRef.current}
          selectedFile={file}
          displayLines={displayLines}
          filteredLines={filtered}
          lineIndexByRow={new Map()}
          searchQ={searchQ}
          searchQLower={searchQLower}
          searchMatchLineIndices={searchMatchLineIndices}
          searchMatchActive={searchMatchActive}
          bookmarks={bookmarks}
          onToggleLineBookmark={onToggleLineBookmark}
          onScrollToIndexReady={(fn) => {
            scrollToIndexRef.current = fn
          }}
        />
      </div>

      <StatusBar
        selectedFile={file}
        fileSize={fileSize}
        lineCount={displayLines.length}
      />
    </div>
  )
}
