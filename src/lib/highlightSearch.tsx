import type { ReactNode } from 'react'

/** Highlight search substring in raw text (case-insensitive). */
export function highlightRawMatches(raw: string, q: string): ReactNode {
  const t = q.trim()
  if (!t) return raw
  const lower = raw.toLowerCase()
  const needle = t.toLowerCase()
  const parts: ReactNode[] = []
  let start = 0
  let idx = lower.indexOf(needle, start)
  let k = 0
  while (idx !== -1) {
    if (idx > start) parts.push(<span key={`p-${k++}`}>{raw.slice(start, idx)}</span>)
    parts.push(
      <mark key={`m-${k++}`} className="lv-search-mark">
        {raw.slice(idx, idx + t.length)}
      </mark>,
    )
    start = idx + t.length
    idx = lower.indexOf(needle, start)
  }
  if (start < raw.length) parts.push(<span key={`p-${k++}`}>{raw.slice(start)}</span>)
  return parts.length ? <>{parts}</> : raw
}
