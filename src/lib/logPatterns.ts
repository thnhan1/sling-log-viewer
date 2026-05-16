import type { LogLevel, ParsedLogLine } from '@shared/types'

const LEVELS = new Set(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'])

function normalizeLevel(s: string): LogLevel {
  const u = s.toUpperCase()
  if (u === 'WARNING' || u === 'WARN') return 'WARN'
  if (u === 'FATAL' || u === 'SEVERE') return 'ERROR'
  if (u === 'CONFIG' || u === 'FINE') return 'DEBUG'
  if (u === 'FINER' || u === 'FINEST') return 'TRACE'
  return LEVELS.has(u) ? (u as LogLevel) : 'UNKNOWN'
}

function unknownLine(originalRaw: string): ParsedLogLine {
  return { raw: originalRaw, level: 'UNKNOWN', message: originalRaw }
}

function splitCauseMessage(message: string): { message: string; cause?: string } {
  const idx = message.search(/\bCaused by\b/i)
  if (idx === -1) return { message }
  const head = message.slice(0, idx).trimEnd()
  const cause = message.slice(idx).trim()
  return { message: head || message.slice(0, idx).trimEnd(), cause }
}

/** Strips stray *CATEGORY* before the real timestamp (Sling / custom appenders). */
export function stripLeadingStarLevelPrefix(s: string): string {
  return s.replace(
    /^(?:\*[A-Z][A-Z0-9]*\*\s+)+(?=\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2})/i,
    '',
  )
}

function bracketFields(
  inner: string,
  rest: string,
): { thread?: string; bundleOrClass?: string; message: string } {
  const parts = rest.trim()
  const classInBracket = inner.includes('.') && /^[\w.$]+$/.test(inner.trim())
  if (classInBracket) {
    return { bundleOrClass: inner.trim(), message: parts }
  }
  if (inner.trim()) {
    const classInRest = parts.match(/^([\w$.]+)\s+([\s\S]*)$/)
    if (classInRest && classInRest[1].includes('.')) {
      return {
        thread: inner.trim(),
        bundleOrClass: classInRest[1],
        message: classInRest[2] ?? '',
      }
    }
    return { thread: inner.trim(), message: parts }
  }
  return { message: parts }
}

const RE_EU_BRACKET_TO_LOGGER =
  /^(\d{1,2}\.\d{1,2}\.\d{4}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+\*?([A-Z][A-Z0-9]*)\*?\s+\[(.+)\]\s+([\w$.]+)(?:\s+(\d+))?\s+(.*)$/i

const RE_EU_SIMPLE =
  /^(\d{1,2}\.\d{1,2}\.\d{4}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+\*?([A-Z][A-Z0-9]*)\*?\s+\[([^\]]*)\]\s*(.*)$/i

const RE_EU_NO_BRACKET =
  /^(\d{1,2}\.\d{1,2}\.\d{4}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+\*?([A-Z][A-Z0-9]*)\*?\s+([\w$.][\w$.]*)\s+(.*)$/i

const RE_ISO_BRACKET_TO_LOGGER =
  /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\s+\*?([A-Z][A-Z0-9]*)\*?\s+\[(.+)\]\s+([\w$.]+)(?:\s+(\d+))?\s+(.*)$/i

const RE_ISO_SIMPLE =
  /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\s+\*?([A-Z][A-Z0-9]*)\*?\s+\[([^\]]*)\]\s*(.*)$/i

const RE_ISO_NO_BRACKET =
  /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\s+\*?([A-Z][A-Z0-9]*)\*?\s+([\w$.][\w$.]*)\s+(.*)$/i

const RE_LEVEL_FIRST_EU_BRACKET =
  /^\*?([A-Z][A-Z0-9]*)\*?\s+(\d{1,2}\.\d{1,2}\.\d{4}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+\[(.+)\]\s+([\w$.]+)(?:\s+(\d+))?\s+(.*)$/i

const RE_LEVEL_FIRST_EU_SIMPLE =
  /^\*?([A-Z][A-Z0-9]*)\*?\s+(\d{1,2}\.\d{1,2}\.\d{4}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+\[([^\]]*)\]\s*(.*)$/i

const RE_LOG4J =
  /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\s+\[([^\]]*)\]\s+([A-Z][A-Z0-9]*)\s+([\w$.]+)\s*(?:[-–—]\s*)?(.*)$/i

const RE_LOG4J_LEVEL_FIRST =
  /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\s+([A-Z][A-Z0-9]*)\s+\[([^\]]*)\]\s+([\w$.]+)\s*(?:[-–—]\s*)?(.*)$/i

const RE_MINIMAL = /^\*([A-Z][A-Z0-9]*)\*\s*(.*)$/i
const RE_MINIMAL_PLAIN =
  /^(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|SEVERE|CONFIG|FINE|FINER|FINEST)\s+(.*)$/i

function fixDoubleBracketThread(trimmed: string, threadRaw: string): string {
  let t = threadRaw.trim()
  if (!t || t.startsWith('[[')) return t
  const classic = /\*[A-Z][A-Z0-9]*\*\s+\[\[/i.test(trimmed)
  const levelFirst = /\*[A-Z][A-Z0-9]*\*[^[\r\n]*\[\[/i.test(trimmed)
  if ((classic || levelFirst) && t.startsWith('[')) {
    t = '[' + t
  }
  return t
}

function parseBracketToLogger(
  m: RegExpMatchArray,
  originalRaw: string,
  trimmedForMatch: string,
): ParsedLogLine {
  const [, timestamp, level, threadRaw, bundleOrClass, optNum, messageRest] = m
  const thread = fixDoubleBracketThread(trimmedForMatch, threadRaw)
  let message =
    optNum != null && optNum !== ''
      ? `${optNum} ${messageRest.trim()}`
      : messageRest.trim()
  const sp = splitCauseMessage(message)
  message = sp.message
  const cause = sp.cause
  const line: ParsedLogLine = {
    raw: originalRaw,
    timestamp,
    level: normalizeLevel(level),
    thread: thread.trim() || undefined,
    bundleOrClass,
    message,
  }
  if (cause) line.cause = cause
  return line
}

function parseLevelFirstBracketToLogger(
  m: RegExpMatchArray,
  originalRaw: string,
  trimmedForMatch: string,
): ParsedLogLine {
  const [, level, timestamp, threadRaw, bundleOrClass, optNum, messageRest] = m
  const thread = fixDoubleBracketThread(trimmedForMatch, threadRaw)
  let message =
    optNum != null && optNum !== ''
      ? `${optNum} ${messageRest.trim()}`
      : messageRest.trim()
  const sp = splitCauseMessage(message)
  message = sp.message
  const cause = sp.cause
  const line: ParsedLogLine = {
    raw: originalRaw,
    timestamp,
    level: normalizeLevel(level),
    thread: thread.trim() || undefined,
    bundleOrClass,
    message,
  }
  if (cause) line.cause = cause
  return line
}

function parseBracketSimple(m: RegExpMatchArray, originalRaw: string): ParsedLogLine {
  const [, timestamp, level, bracket, rest] = m
  const levelNorm = normalizeLevel(level)
  const { thread, bundleOrClass, message: msg } = bracketFields(bracket, rest)
  const sp = splitCauseMessage(msg)
  const line: ParsedLogLine = {
    raw: originalRaw,
    timestamp,
    level: levelNorm,
    thread,
    bundleOrClass,
    message: sp.message,
  }
  if (sp.cause) line.cause = sp.cause
  return line
}

function parseNoBracket(m: RegExpMatchArray, originalRaw: string): ParsedLogLine {
  const [, timestamp, level, bundleOrClass, rest] = m
  const sp = splitCauseMessage(rest.trim())
  const line: ParsedLogLine = {
    raw: originalRaw,
    timestamp,
    level: normalizeLevel(level),
    bundleOrClass,
    message: sp.message,
  }
  if (sp.cause) line.cause = sp.cause
  return line
}

function parseLog4jThreadFirst(m: RegExpMatchArray, originalRaw: string): ParsedLogLine {
  const [, timestamp, thread, level, bundleOrClass, message] = m
  const sp = splitCauseMessage(message.trim())
  return {
    raw: originalRaw,
    timestamp,
    level: normalizeLevel(level),
    thread: thread.trim() || undefined,
    bundleOrClass,
    message: sp.message,
    ...(sp.cause ? { cause: sp.cause } : {}),
  }
}

function parseLog4jLevelFirst(m: RegExpMatchArray, originalRaw: string): ParsedLogLine {
  const [, timestamp, level, thread, bundleOrClass, message] = m
  const sp = splitCauseMessage(message.trim())
  return {
    raw: originalRaw,
    timestamp,
    level: normalizeLevel(level),
    thread: thread.trim() || undefined,
    bundleOrClass,
    message: sp.message,
    ...(sp.cause ? { cause: sp.cause } : {}),
  }
}

function parseLevelFirstEuSimple(m: RegExpMatchArray, originalRaw: string): ParsedLogLine {
  const [, level, timestamp, bracket, rest] = m
  const levelNorm = normalizeLevel(level)
  const { thread, bundleOrClass, message } = bracketFields(bracket, rest)
  const sp = splitCauseMessage(message)
  return {
    raw: originalRaw,
    timestamp,
    level: levelNorm,
    thread,
    bundleOrClass,
    message: sp.message,
    ...(sp.cause ? { cause: sp.cause } : {}),
  }
}

function parseMinimal(forParse: string, originalRaw: string): ParsedLogLine | null {
  const mPlain = forParse.match(RE_MINIMAL_PLAIN)
  if (mPlain) {
    const [, level, message] = mPlain
    return {
      raw: originalRaw,
      level: normalizeLevel(level),
      message: message.trim(),
    }
  }
  const mAst = forParse.match(RE_MINIMAL)
  if (!mAst) return null
  const [, level, message] = mAst
  return {
    raw: originalRaw,
    level: normalizeLevel(level),
    message: message.trim(),
  }
}

/**
 * Single Sling/AEM-oriented parser: European + ISO dates, nested request brackets, Log4j layouts, then minimal lines.
 * No user-facing pattern switch — tuning happens in Sling OSGi config.
 */
function parseSlingLine(forParse: string, originalRaw: string): ParsedLogLine {
  let m: RegExpMatchArray | null

  m = forParse.match(RE_EU_BRACKET_TO_LOGGER)
  if (m) return parseBracketToLogger(m, originalRaw, forParse)
  m = forParse.match(RE_EU_SIMPLE)
  if (m) return parseBracketSimple(m, originalRaw)
  m = forParse.match(RE_EU_NO_BRACKET)
  if (m) return parseNoBracket(m, originalRaw)

  m = forParse.match(RE_LEVEL_FIRST_EU_BRACKET)
  if (m) return parseLevelFirstBracketToLogger(m, originalRaw, forParse)
  m = forParse.match(RE_LEVEL_FIRST_EU_SIMPLE)
  if (m) return parseLevelFirstEuSimple(m, originalRaw)

  m = forParse.match(RE_ISO_BRACKET_TO_LOGGER)
  if (m) return parseBracketToLogger(m, originalRaw, forParse)
  m = forParse.match(RE_ISO_SIMPLE)
  if (m) return parseBracketSimple(m, originalRaw)
  m = forParse.match(RE_ISO_NO_BRACKET)
  if (m) return parseNoBracket(m, originalRaw)

  m = forParse.match(RE_LOG4J)
  if (m) return parseLog4jThreadFirst(m, originalRaw)
  m = forParse.match(RE_LOG4J_LEVEL_FIRST)
  if (m) return parseLog4jLevelFirst(m, originalRaw)

  const minimal = parseMinimal(forParse, originalRaw)
  if (minimal && minimal.level !== 'UNKNOWN') return minimal

  return unknownLine(originalRaw)
}

export function parseLogLine(raw: string): ParsedLogLine {
  const trimmed = raw.replace(/^\uFEFF/, '').replace(/\r$/, '')
  if (trimmed === '') {
    return { raw: trimmed, level: 'UNKNOWN', message: '' }
  }
  const forParse = stripLeadingStarLevelPrefix(trimmed)
  return parseSlingLine(forParse, trimmed)
}
