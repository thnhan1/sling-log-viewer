import type { LogLevel, ParsedLogLine } from '@shared/types'
import { parseLogLine } from './logPatterns'
import { parseLogTimestampToMs } from './parseLogTimestamp'

export type { LogLevel, ParsedLogLine }

/**
 * @deprecated Prefer `parseLogLine(raw)` from `./logPatterns`.
 */
export function parseAemLine(raw: string): ParsedLogLine {
  return parseLogLine(raw)
}

export function parseAemText(text: string): ParsedLogLine[] {
  if (!text) return []
  const lines = text.split('\n')
  const out: ParsedLogLine[] = []
  for (const line of lines) {
    if (line.length === 0 && out.length === 0) continue
    out.push(parseLogLine(line))
  }
  return out
}

/** @deprecated Use `parseLogTimestampToMs` from `./parseLogTimestamp`. */
export function parseAemTimestampToMs(timestamp: string): number | null {
  return parseLogTimestampToMs(timestamp)
}

export { parseLogLine } from './logPatterns'
export { parseLogTimestampToMs } from './parseLogTimestamp'
