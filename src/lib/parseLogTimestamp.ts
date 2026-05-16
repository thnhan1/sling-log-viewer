/** Parse common log timestamp strings to epoch ms (local timezone). */

function msFromFraction(raw: string | undefined): number {
  if (raw == null || raw === '') return 0
  const head = raw.slice(0, 3).padEnd(3, '0')
  return Math.min(999, parseInt(head, 10))
}

export function parseLogTimestampToMs(timestamp: string): number | null {
  const ts = timestamp.trim()
  let m = ts.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/)
  if (m) {
    const [, d, mon, y, h, min, s, msRaw] = m
    const ms = msFromFraction(msRaw)
    const t = new Date(+y, +mon - 1, +d, +h, +min, +s, ms).getTime()
    return Number.isFinite(t) ? t : null
  }
  m = ts.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:[.,](\d+))?$/)
  if (m) {
    const [, y, mon, d, h, min, s, msRaw] = m
    const ms = msFromFraction(msRaw)
    const t = new Date(+y, +mon - 1, +d, +h, +min, +s, ms).getTime()
    return Number.isFinite(t) ? t : null
  }
  return null
}
