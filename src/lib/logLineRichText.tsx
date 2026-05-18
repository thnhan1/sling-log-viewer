import type { ReactNode } from 'react'
import { highlightRawMatches } from './highlightSearch'

/**
 * Sling/AEM-style: bracket groups, HTTP verbs, URL paths, key/value pairs,
 * quoted values, Java classes/exceptions, and operational numbers.
 * Paths only after start-of-string or whitespace — avoids coloring `/1.1` in `HTTP/1.1`.
 */
const RICH_TOKEN_RE =
  /(\[[^\]]+\])|(\b(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b)|((?:https?:\/\/[^\s"'<>]+)|(?:(?:^|(?<=\s))\/[^\s"'<>]+))|(\b[A-Za-z_][\w.-]*=(?:"[^"]*"|'[^']*'|[^\s,;\]\)}]+))|("[^"]*"|'[^']*')|(\b(?:[a-z_]\w*\.)+[A-Z][\w$]*(?:Exception|Error)?\b)|(\b\d+(?:\.\d+)?(?:ms|s|m|h|KB|MB|GB|B|%)?\b)/gi

function baseClass(variant: 'thread' | 'message' | 'cause'): string {
  if (variant === 'message') return 'lv-log-message'
  if (variant === 'cause') return 'lv-log-cause'
  return 'lv-log-thread'
}

function tokenClass(m: RegExpExecArray): string {
  if (m[1]) return 'lv-log-bracket'
  if (m[2]) return 'lv-log-method'
  if (m[3]) return 'lv-log-path'
  if (m[4]) return 'lv-log-kv'
  if (m[5]) return 'lv-log-string'
  if (m[6]) return 'lv-log-exception'
  if (m[7]) return 'lv-log-number'
  return 'lv-log-message'
}

function renderSearchAware(text: string, searchQ: string | undefined): ReactNode {
  return searchQ ? highlightRawMatches(text, searchQ) : text
}

function renderToken(full: string, tc: string, key: string, searchQ: string | undefined): ReactNode {
  if (tc !== 'lv-log-kv') {
    return (
      <span key={key} className={tc}>
        {renderSearchAware(full, searchQ)}
      </span>
    )
  }

  const eq = full.indexOf('=')
  if (eq === -1) {
    return (
      <span key={key} className="lv-log-value">
        {renderSearchAware(full, searchQ)}
      </span>
    )
  }

  const name = full.slice(0, eq)
  const value = full.slice(eq + 1)
  return (
    <span key={key}>
      <span className="lv-log-key">{renderSearchAware(name, searchQ)}</span>
      <span className="lv-log-operator">=</span>
      <span className="lv-log-value">{renderSearchAware(value, searchQ)}</span>
    </span>
  )
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
    parts.push(renderToken(full, tc, `t-${k++}`, sq))
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
