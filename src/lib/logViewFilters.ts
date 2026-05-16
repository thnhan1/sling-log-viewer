import type { ParsedLogLine } from '@shared/types'
import { parseLogTimestampToMs } from './parseLogTimestamp'

/** Time range only; substring search is handled in the UI (highlight + jump). */
export function applyLogViewFilters(
  rows: ParsedLogLine[],
  opts: { fromMs: number | null; toMs: number | null },
): ParsedLogLine[] {
  let out = rows
  const hasRange = opts.fromMs !== null || opts.toMs !== null
  if (hasRange) {
    out = out.filter((r) => {
      if (!r.timestamp) return false
      const t = parseLogTimestampToMs(r.timestamp)
      if (t === null) return false
      if (opts.fromMs !== null && t < opts.fromMs) return false
      if (opts.toMs !== null && t > opts.toMs) return false
      return true
    })
  }
  return out
}
