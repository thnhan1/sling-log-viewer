import type { ReactNode } from 'react'
import { highlightRawMatches } from './highlightSearch'

/**
 * Sling/AEM-style: bracket groups, HTTP verbs, URL paths.
 * Paths only after start-of-string or whitespace — avoids coloring `/1.1` in `HTTP/1.1`.
 */
const RICH_TOKEN_RE =
  /(\[[^\]]+\])|(\b(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b)|((?:^|(?<=\s))\/[^\s]+)/gi

function baseClass(variant: 'thread' | 'message' | 'cause'): string {
  if (variant === 'message') return 'text-lv-text'
  return 'text-lv-muted'
}

function tokenClass(m: RegExpExecArray): string {
  if (m[1]) return 'lv-log-bracket'
  if (m[2]) return 'lv-log-method'
  if (m[3]) return 'lv-log-path'
  return 'text-lv-muted'
}

/**
 * Adds semantic colors for request lines (brackets, GET/POST, paths) in thread/message/cause.
 * When `searchQ` is set, applies highlight inside each span (mark inherits token color).
 */
const MAX_RICH_TOKEN_MATCHES = 500

export function renderRichLogText(
  text: string,
  variant: 'thread' | 'message' | 'cause',
  searchQ?: string,
): ReactNode {
  const s = String(text ?? '')
  if (!s) return null
  const sq = searchQ?.trim()
  const base = baseClass(variant)
  const parts: ReactNode[] = []
  let last = 0
  let k = 0
  const re = new RegExp(RICH_TOKEN_RE.source, RICH_TOKEN_RE.flags)
  let m: RegExpExecArray | null
  let any = false
  let matchCount = 0
  while ((m = re.exec(s)) !== null && matchCount < MAX_RICH_TOKEN_MATCHES) {
    matchCount++
    any = true
    if (m.index > last) {
      const chunk = text.slice(last, m.index)
      parts.push(
        <span key={`d-${k++}`} className={base}>
          {sq ? highlightRawMatches(chunk, sq) : chunk}
        </span>,
      )
    }
    const full = m[0]
    const tc = tokenClass(m)
    parts.push(
      <span key={`t-${k++}`} className={tc}>
        {sq ? highlightRawMatches(full, sq) : full}
      </span>,
    )
    last = m.index + full.length
  }
  if (!any) {
    return <span className={base}>{sq ? highlightRawMatches(s, sq) : s}</span>
  }
  if (last < s.length) {
    const chunk = s.slice(last)
    parts.push(
      <span key={`d-${k++}`} className={base}>
        {sq ? highlightRawMatches(chunk, sq) : chunk}
      </span>,
    )
  }
  return <>{parts}</>
}
