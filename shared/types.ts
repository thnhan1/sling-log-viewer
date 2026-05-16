export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'UNKNOWN'

export interface ParsedLogLine {
  raw: string
  timestamp?: string
  level: LogLevel
  thread?: string
  bundleOrClass?: string
  message: string
  /** Set when pattern splits “Caused by:” (stack cause) from the main message. */
  cause?: string
}

export interface LogFileInfo {
  name: string
  size: number
  mtimeMs: number
}

export interface ConfigResponse {
  ok: boolean
  rootPath?: string
  error?: string
}

export interface ReadLogResponse {
  chunk: string
  fileSize: number
  /** Byte offset where chunk starts in file (after alignment to line boundary for initial tail). */
  fromByte: number
  /** Byte offset at end of chunk in file. */
  toByte: number
  truncated: boolean
}
