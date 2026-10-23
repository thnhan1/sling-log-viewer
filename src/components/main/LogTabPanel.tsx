import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import { IconArrowDownToLine } from '../../ui/icons'

export interface TabActions {
  reload: () => void
  clearView: () => void
}

function filterLines(rows: ParsedLogLine[], levelsOff: Set<LogLevel>): ParsedLogLine[] {
  return rows.filter((row) => !levelsOff.has(row.level))
}

export function LogTabPanel({
  file,
  active,
  refreshKey,
  levelsOff,
  onToggleLevel,
  bookmarks,
  onToggleLineBookmark,
  onRemoveBookmark,
  onRegisterActions,
}: {
  file: string
  active: boolean
  refreshKey: number
  levelsOff: Set<LogLevel>
  onToggleLevel: (l: LogLevel) => void
  bookmarks: LogBookmark[]
  onToggleLineBookmark: (fileName: string, raw: string) => void
  onRemoveBookmark: (id: string) => void
  onRegisterActions: (file: string, actions: TabActions | null) => void
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

  // Expose the active tab's actions to the app chrome.
  useEffect(() => {
    onRegisterActions(file, {
      reload: () => void reloadTail(),
      clearView: () => void clearViewOnly(),
    })
    return () => onRegisterActions(file, null)
  }, [file, reloadTail, clearViewOnly, onRegisterActions])

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

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const setScrollContainer = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node
    setScrollEl(node)
  }, [])
  const [stickToBottom, setStickToBottom] = useState(true)
  const stickToBottomRef = useRef(stickToBottom)
  stickToBottomRef.current = stickToBottom
  const scrollingProgrammaticallyRef = useRef(false)
  const scrollToIndexRef = useRef<((index: number, align?: 'center' | 'end') => void) | null>(null)

  const scrollToDisplayIndex = useCallback(
    (idx: number, align: 'center' | 'end' = 'center') => {
      if (idx < 0) return
      setStickToBottom(false)
      scrollingProgrammaticallyRef.current = true
      if (scrollToIndexRef.current) {
        scrollToIndexRef.current(idx, align)
        requestAnimationFrame(() => {
          scrollingProgrammaticallyRef.current = false
        })
        return
      }
      const container = scrollRef.current
      if (!container) {
        scrollingProgrammaticallyRef.current = false
        return
      }
      const el = container.querySelector(`[data-log-index="${idx}"]`) as HTMLElement | null
      if (!el) {
        scrollingProgrammaticallyRef.current = false
        return
      }
      requestAnimationFrame(() => {
        const c = container.getBoundingClientRect()
        const r = el.getBoundingClientRect()
        const delta = r.top + r.height / 2 - (c.top + c.height / 2)
        const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight)
        const nextTop = Math.min(maxScroll, Math.max(0, container.scrollTop + delta))
        container.scrollTo({ top: nextTop, behavior: 'smooth' })
        requestAnimationFrame(() => {
          scrollingProgrammaticallyRef.current = false
        })
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
  const toggleBookmarks = useCallback(() => setBookmarksOpen((o) => !o), [])

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
      queueMicrotask(() => {
        const idx = displayLines.findIndex((r) => r.raw === raw)
        if (idx >= 0) scrollToDisplayIndex(idx, 'center')
      })
    },
    [displayLines, filtered, scrollToDisplayIndex],
  )

  const scrollToBottomNow = useCallback(() => {
    if (scrollToIndexRef.current) {
      const lastIdx = displayLines.length - 1
      if (lastIdx >= 0) {
        scrollToIndexRef.current(lastIdx, 'end')
        return
      }
    }
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [displayLines.length])

  // Phase 1: scroll synchronously before paint (useLayoutEffect)
  const prevLenRef = useRef(displayLines.length)
  useLayoutEffect(() => {
    if (!stickToBottomRef.current) return
    if (displayLines.length === 0) return
    scrollingProgrammaticallyRef.current = true
    scrollToBottomNow()
    prevLenRef.current = displayLines.length
  }, [displayLines.length, scrollToBottomNow])

  // Phase 2: re-scroll after virtualizer measurements settle (async height changes)
  useEffect(() => {
    if (!stickToBottomRef.current) return
    if (displayLines.length === 0) return
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      if (cancelled || !stickToBottomRef.current) return
      setTimeout(() => {
        if (cancelled || !stickToBottomRef.current) return
        scrollingProgrammaticallyRef.current = true
        scrollToBottomNow()
        requestAnimationFrame(() => {
          scrollingProgrammaticallyRef.current = false
        })
      }, 50)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [displayLines.length, scrollToBottomNow])

  const jumpLatest = useCallback(() => {
    setStickToBottom(true)
    scrollingProgrammaticallyRef.current = true
    scrollToBottomNow()
    requestAnimationFrame(() => {
      scrollingProgrammaticallyRef.current = false
    })
  }, [scrollToBottomNow])

  const onScroll = useCallback(() => {
    if (scrollingProgrammaticallyRef.current) return
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    setStickToBottom(dist < 64)
  }, [])

  return (
    <div
      style={{ display: active ? undefined : 'none' }}
      className="relative flex min-h-0 min-w-0 flex-1 flex-col"
    >
      {error && <div className="error-banner">{error}</div>}

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
        levelsOff={levelsOff}
        onToggleLevel={onToggleLevel}
        bookmarksOpen={bookmarksOpen}
        onToggleBookmarksOpen={toggleBookmarks}
        fileBookmarks={fileBookmarks}
        onJumpToRawLine={jumpToRawLine}
        onRemoveBookmark={onRemoveBookmark}
      />

      <div
        ref={setScrollContainer}
        onScroll={onScroll}
        className="flex-1 overflow-auto bg-bg font-mono text-mono"
      >
        <VirtualLogLines
          scrollEl={scrollEl}
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

      {!stickToBottom && (
        <button type="button" className="jump-pill" onClick={jumpLatest}>
          Jump to latest
          <IconArrowDownToLine size={13} />
        </button>
      )}

      <StatusBar
        selectedFile={file}
        fileSize={fileSize}
        lineCount={displayLines.length}
        totalLineCount={lines.length}
        filteredLineCount={filtered.length}
        truncated={truncated}
        searchHitCount={searchMatchLineIndices.length}
      />
    </div>
  )
}
