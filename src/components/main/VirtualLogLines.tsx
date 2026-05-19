import { useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ParsedLogLine } from '@shared/types'
import type { LogBookmark } from '../../lib/bookmarks'
import { LogLineRow } from './LogLineRow'

export function VirtualLogLines({
  scrollEl,
  selectedFile,
  displayLines,
  filteredLines,
  lineIndexByRow,
  searchQ,
  searchQLower,
  searchMatchLineIndices,
  searchMatchActive,
  bookmarks,
  onToggleLineBookmark,
  onScrollToIndexReady,
}: {
  scrollEl: HTMLDivElement | null
  selectedFile: string | null
  displayLines: ParsedLogLine[]
  filteredLines: ParsedLogLine[]
  lineIndexByRow: Map<ParsedLogLine, number>
  searchQ: string
  searchQLower: string
  searchMatchLineIndices: number[]
  searchMatchActive: number
  bookmarks: LogBookmark[]
  onToggleLineBookmark: (raw: string) => void
  onScrollToIndexReady: (fn: ((index: number, align?: 'center' | 'end') => void) | null) => void
}) {
  void lineIndexByRow
  const count = selectedFile ? displayLines.length : 0

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollEl,
    estimateSize: () => 20,
    overscan: 18,
  })

  const items = virtualizer.getVirtualItems()

  const measureVisibleRows = useCallback(() => {
    if (!scrollEl) return
    scrollEl.querySelectorAll<HTMLElement>('[data-index]').forEach((node) => {
      virtualizer.measureElement(node)
    })
  }, [scrollEl, virtualizer])

  useEffect(() => {
    const frame = window.requestAnimationFrame(measureVisibleRows)
    return () => window.cancelAnimationFrame(frame)
  }, [displayLines, searchQ, selectedFile, measureVisibleRows])

  useEffect(() => {
    if (!scrollEl || typeof ResizeObserver === 'undefined') return
    let frame = 0
    const ro = new ResizeObserver(() => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(measureVisibleRows)
    })
    ro.observe(scrollEl)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [measureVisibleRows, scrollEl])

  useEffect(() => {
    if (!scrollEl || !selectedFile) {
      onScrollToIndexReady(null)
      return
    }
    onScrollToIndexReady((index, align = 'center') => {
      virtualizer.scrollToIndex(index, { align, behavior: 'smooth' })
    })
    return () => onScrollToIndexReady(null)
  }, [onScrollToIndexReady, scrollEl, selectedFile, virtualizer])

  if (!selectedFile) return null

  if (filteredLines.length === 0 || displayLines.length === 0) {
    if (filteredLines.length === 0) {
      return <p className="text-muted px-2 py-4 text-mono">No lines match filters (or file is empty).</p>
    }
    return (
      <p className="text-muted px-2 py-4 text-mono">
        No lines in this time range. Adjust From/To or sidebar filters.
      </p>
    )
  }

  return (
    <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
      {items.map((it) => {
        const row = displayLines[it.index]
        if (!row) return null
        const isSearchHit = Boolean(searchQ && row.raw.toLowerCase().includes(searchQLower))
        const isActiveSearchLine =
          searchQ && searchMatchLineIndices.length > 0 && searchMatchLineIndices[searchMatchActive] === it.index
        return (
          <div
            key={it.key}
            data-index={it.index}
            data-log-index={it.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${it.start}px)`,
            }}
          >
            <LogLineRow
              selectedFile={selectedFile}
              row={row}
              displayIndex={it.index}
              isSearchHit={isSearchHit}
              isActiveSearchLine={Boolean(isActiveSearchLine)}
              bookmarks={bookmarks}
              onToggleLineBookmark={onToggleLineBookmark}
            />
          </div>
        )
      })}
    </div>
  )
}
