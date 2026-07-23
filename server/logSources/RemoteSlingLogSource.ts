import https from 'node:https'
import http from 'node:http'
import type { LogSource, LogFileInfo, TailResult, SinceResult, FileMeta, WatchEvent } from './types.js'

export interface RemoteConfig {
  baseUrl: string
  username: string
  password: string
  /** Log directory path on AEM, e.g. "logs/" (default). Trailing slash is auto-appended. */
  logPath: string
  /** Bare filenames only, e.g. ["error.log", "request.log"]. Path is resolved via logPath. */
  logFiles: string[]
}

/** Strip directory prefixes and traversal sequences so only the filename remains. */
export function normalizeLogFileName(name: string): string {
  const trimmed = name.trim()
  // Remove path traversal and strip all directory prefixes
  const cleaned = trimmed
    .replace(/\.\./g, '')
    .replace(/[\\]/g, '/')
    .replace(/^.*\//, '')
  return cleaned || trimmed
}

/** Resolve a bare filename to the full AEM log path for tailer.txt. Read-only. */
function resolveLogPath(logPath: string, fileName: string): string {
  // Sanitize: strip traversal and absolute path markers from logPath
  const safePath = logPath
    .replace(/\.\./g, '')
    .replace(/\/+/g, '/')
    .replace(/^\//, '')
    .replace(/\/+$/, '')
  // Filename is already normalized by caller — defensive double-check
  const safeName = fileName.replace(/\.\./g, '').replace(/[\\]/g, '/').replace(/^.*\//, '')
  // Reject if normalization changed the name (indicates attempted traversal)
  if (safeName !== fileName) {
    throw new Error(`Invalid file name: ${fileName}`)
  }
  return safePath + '/' + safeName
}

/**
 * Fetches a URL with Basic Auth and returns the response body as a string.
 * Allows self-signed certificates (common in AEM UAT environments).
 */
function fetchWithBasicAuth(
  url: string,
  username: string,
  password: string,
  timeoutMs = 8000,
): Promise<{ body: string; status: number }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const mod = u.protocol === 'https:' ? https : http
    const auth = Buffer.from(`${username}:${password}`).toString('base64')

    const req = mod.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'text/plain, text/html',
        },
        timeout: timeoutMs,
        rejectUnauthorized: false,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          resolve({ body, status: res.statusCode ?? 500 })
        })
      },
    )

    req.on('error', (err) => reject(err))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timed out after ${timeoutMs}ms`))
    })
    req.end()
  })
}

/**
 * Extract timestamp from a log line for deduplication.
 * Handles both EU (dd.MM.yyyy HH:mm:ss) and ISO (yyyy-MM-dd HH:mm:ss) formats.
 */
function extractTimestampMs(line: string): number {
  // EU format: 23.09.2025 14:35:01.123
  let m = line.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/)
  if (m) {
    const [, d, mon, y, h, min, s, msRaw] = m
    const ms = msRaw ? parseInt(msRaw.slice(0, 3).padEnd(3, '0'), 10) : 0
    return new Date(+y, +mon - 1, +d, +h, +min, +s, ms).getTime()
  }
  // ISO format: 2025-09-23 14:35:01,123
  m = line.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:[.,](\d+))?/)
  if (m) {
    const [, y, mon, d, h, min, s, msRaw] = m
    const ms = msRaw ? parseInt(msRaw.slice(0, 3).padEnd(3, '0'), 10) : 0
    return new Date(+y, +mon - 1, +d, +h, +min, +s, ms).getTime()
  }
  return 0
}

/**
 * Polls AEM's /system/console/slinglog/tailer.txt endpoint with Basic Auth.
 *
 * Deduplication strategy (timestamp + occurrence counter):
 * - Lines without timestamps are included only on first fetch.
 * - Lines with the same timestamp are tracked by occurrence count within that second.
 * - This handles the common case (duplicate lines like heartbeats) correctly
 *   as long as the total number of lines per second doesn't change between polls.
 */
export class RemoteSlingLogSource implements LogSource {
  readonly type = 'remote' as const
  readonly needsPolling = true

  private config: RemoteConfig

  constructor(config: RemoteConfig) {
    this.config = config
  }

  /** Update config at runtime (e.g. when user changes AEM URL). */
  updateConfig(config: RemoteConfig): void {
    this.config = config
  }

  getConfig(): RemoteConfig {
    return { ...this.config }
  }

  async listFiles(): Promise<LogFileInfo[]> {
    // Return the configured log files list.
    // Sizes are unknown until individually fetched.
    return this.config.logFiles.map((name) => ({
      name,
      size: 0,
      mtimeMs: Date.now(),
    }))
  }

  async statFile(relativePath: string): Promise<FileMeta> {
    // AEM tailer.txt doesn't expose file metadata directly.
    // Return a placeholder — the UI shows size after the first fetch.
    try {
      const body = await this.fetchTail(relativePath, 1)
      const lines = body.split('\n').filter(Boolean)
      return { size: lines.length, mtimeMs: Date.now() }
    } catch {
      return { size: 0, mtimeMs: Date.now() }
    }
  }

  async readTail(relativePath: string): Promise<TailResult> {
    try {
      const body = await this.fetchTail(relativePath, 1000)
      const lines = body.split('\n')
      const fileSize = lines.filter(Boolean).length
      return {
        chunk: body,
        fromByte: 0,
        toByte: Buffer.byteLength(body, 'utf8'),
        fileSize,
        truncated: false,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      throw new Error(`Failed to fetch log from AEM: ${message}`)
    }
  }

  async readSince(_relativePath: string, _sinceByte: number): Promise<SinceResult> {
    // Remote source doesn't use byte-offset tracking.
    return { chunk: '', fromByte: 0, toByte: 0, fileSize: 0 }
  }

  async clearFile(_relativePath: string): Promise<void> {
    // Clearing remote log files is intentionally not supported.
    throw new Error('Cannot clear log files on remote AEM server')
  }

  watchFile(
    relativePath: string,
    onEvent: (event: WatchEvent) => void,
    onError: (err: Error) => void,
  ): () => void {
    let stopped = false
    let timer: NodeJS.Timeout | null = null

    // Dedupe state
    let lastTimestampMs = 0
    let sameSecondCount = 0
    let firstFetch = true

    const poll = async () => {
      if (stopped) return

      try {
        const body = await this.fetchTail(relativePath, 1000)
        const allLines = body.split('\n')
        const lines = allLines.filter((l) => l.trim())

        if (firstFetch) {
          firstFetch = false
          // Only record dedupe state — caller (ws.ts) already sent the initial tail.
          // This prevents double-emission of the same log lines.
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1]
            lastTimestampMs = extractTimestampMs(lastLine)
            sameSecondCount = countSameSecond(lines, lastTimestampMs)
          }
          return
        }

        if (lines.length === 0) return

        // Dedupe: find where new lines start
        let startIdx = 0
        let seenSameSecond = 0
        for (let i = 0; i < lines.length; i++) {
          const ts = extractTimestampMs(lines[i])
          if (ts > lastTimestampMs) {
            startIdx = i
            break
          }
          if (ts === lastTimestampMs) {
            seenSameSecond++
            if (seenSameSecond > sameSecondCount) {
              startIdx = i
              break
            }
          }
          // If all lines are older or equal, startIdx stays 0 → no new lines
        }

        const newLines = lines.slice(startIdx)

        // Update dedupe state
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1]
          lastTimestampMs = extractTimestampMs(lastLine)
          sameSecondCount = countSameSecond(lines, lastTimestampMs)
        }

        if (newLines.length > 0) {
          const chunk = newLines.join('\n') + '\n'
          onEvent({
            type: 'append',
            chunk,
            fromByte: 0,
            toByte: Buffer.byteLength(chunk, 'utf8'),
            fileSize: lines.length,
          })
        }

        // Dynamic interval: if we got >400 lines, the log is very active
        // → keep the fast pace; otherwise the standard 2.5s is fine
        if (newLines.length > 400) {
          // Already polling at standard rate — don't slow down
        }
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)))
      }
    }

    // Initial poll immediately
    void poll()

    // Poll every 2.5 seconds
    timer = setInterval(() => {
      if (stopped) return
      void poll()
    }, 2500)

    return () => {
      stopped = true
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }

  private async fetchTail(logFile: string, tail: number): Promise<string> {
    const base = this.config.baseUrl.replace(/\/+$/, '')
    const fullPath = resolveLogPath(this.config.logPath || 'logs/', logFile)
    // Ensure the path starts with / for the query param
    const name = fullPath.startsWith('/') ? fullPath : `/${fullPath}`
    const url = `${base}/system/console/slinglog/tailer.txt?name=${encodeURIComponent(name)}&tail=${tail}`

    const { body, status } = await fetchWithBasicAuth(
      url,
      this.config.username,
      this.config.password,
    )

    if (status === 401 || status === 403) {
      throw new Error(`Authentication failed (${status}). Check AEM username/password.`)
    }
    if (status !== 200) {
      throw new Error(`AEM returned HTTP ${status}`)
    }

    return body
  }
}

function countSameSecond(lines: string[], timestampMs: number): number {
  if (timestampMs === 0) return 0
  let count = 0
  for (let i = lines.length - 1; i >= 0; i--) {
    const ts = extractTimestampMs(lines[i])
    if (ts === timestampMs) count++
    else break
  }
  return count
}
