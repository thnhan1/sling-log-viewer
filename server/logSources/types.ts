export interface LogFileInfo {
  name: string
  size: number
  mtimeMs: number
}

export interface TailResult {
  chunk: string
  fromByte: number
  toByte: number
  fileSize: number
  truncated: boolean
}

export interface SinceResult {
  chunk: string
  fromByte: number
  toByte: number
  fileSize: number
}

export interface FileMeta {
  size: number
  mtimeMs: number
}

export type WatchEventType = 'append' | 'tail' | 'rotated'

export interface WatchEvent {
  type: WatchEventType
  chunk?: string
  fromByte?: number
  toByte?: number
  fileSize?: number
  truncated?: boolean
  reason?: 'truncated' | 'renamed'
}

export interface LogSource {
  readonly type: 'local' | 'remote'
  readonly needsPolling: boolean

  /** List available log files. */
  listFiles(): Promise<LogFileInfo[]>

  /** Get metadata for a single log file. */
  statFile(relativePath: string): Promise<FileMeta>

  /** Read the tail of a log file (for initial load). */
  readTail(relativePath: string, maxBytes?: number): Promise<TailResult>

  /** Read new content since a byte offset. */
  readSince(relativePath: string, sinceByte: number): Promise<SinceResult>

  /** Truncate / clear a log file. */
  clearFile(relativePath: string): Promise<void>

  /**
   * Start watching a file for changes.
   * Returns a cleanup function that stops watching.
   */
  watchFile(
    relativePath: string,
    onEvent: (event: WatchEvent) => void,
    onError: (err: Error) => void,
  ): () => void
}
