import fs from 'node:fs'
import path from 'node:path'
import type { LogSource, LogFileInfo, TailResult, SinceResult, FileMeta, WatchEvent } from './types.js'
import {
  assertUnderRoot,
  clearLogFile,
  listLogFiles,
  readSince,
  readTailAligned,
  statLogFile,
} from '../logStore.js'

export class LocalLogSource implements LogSource {
  readonly type = 'local' as const
  readonly needsPolling = false

  constructor(private rootPath: string) {}

  async listFiles(): Promise<LogFileInfo[]> {
    return listLogFiles(this.rootPath)
  }

  async statFile(relativePath: string): Promise<FileMeta> {
    const abs = assertUnderRoot(this.rootPath, relativePath)
    return statLogFile(abs)
  }

  async readTail(relativePath: string, maxBytes?: number): Promise<TailResult> {
    const abs = assertUnderRoot(this.rootPath, relativePath)
    return readTailAligned(abs, maxBytes)
  }

  async readSince(relativePath: string, sinceByte: number): Promise<SinceResult> {
    const abs = assertUnderRoot(this.rootPath, relativePath)
    return readSince(abs, sinceByte)
  }

  async clearFile(relativePath: string): Promise<void> {
    const abs = assertUnderRoot(this.rootPath, relativePath)
    return clearLogFile(abs)
  }

  watchFile(
    relativePath: string,
    onEvent: (event: WatchEvent) => void,
    _onError: (err: Error) => void,
    initialSinceByte?: number,
  ): () => void {
    const abs = assertUnderRoot(this.rootPath, relativePath)
    let sinceByte = initialSinceByte ?? 0
    let watchTimer: NodeJS.Timeout | null = null
    let pollTimer: NodeJS.Timeout | null = null
    let watcher: fs.FSWatcher | null = null
    let stopped = false

    const cleanup = () => {
      stopped = true
      if (watchTimer) { clearTimeout(watchTimer); watchTimer = null }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
      if (watcher) { watcher.close(); watcher = null }
    }

    const scheduleRead = (reason: 'change' | 'rename') => {
      if (stopped) return
      if (watchTimer) clearTimeout(watchTimer)
      watchTimer = setTimeout(async () => {
        watchTimer = null
        if (stopped) return

        try {
          const st = await statLogFile(abs)
          if (st.size < sinceByte) {
            onEvent({ type: 'rotated', reason: reason === 'rename' ? 'renamed' : 'truncated' })
            const tail = await readTailAligned(abs)
            sinceByte = tail.toByte
            onEvent({
              type: 'tail',
              chunk: tail.chunk,
              toByte: tail.toByte,
              fileSize: tail.fileSize,
              truncated: tail.truncated,
            })
            return
          }

          if (st.size === sinceByte) return

          const r = await readSince(abs, sinceByte)
          sinceByte = r.toByte
          if (r.chunk) {
            onEvent({
              type: 'append',
              chunk: r.chunk,
              fromByte: r.fromByte,
              toByte: r.toByte,
              fileSize: r.fileSize,
            })
          }
        } catch (err) {
          // File may have been deleted — ignore, polling will pick it up
        }
      }, 60)
    }

    // Seed byte offset if caller didn't provide one (e.g. direct watchFile usage)
    if (sinceByte === 0) {
      void (async () => {
        try {
          const tail = await readTailAligned(abs)
          sinceByte = tail.toByte
        } catch {
          // File may not exist yet
        }
      })()
    }

    // fs.watch for near-instant updates
    try {
      watcher = fs.watch(abs, { persistent: false }, (_evt, filename) => {
        if (filename) scheduleRead('change')
        else scheduleRead('rename')
      })
    } catch {
      watcher = null
    }

    // Fallback poll (catches missed events on Windows/network mounts)
    pollTimer = setInterval(() => {
      if (stopped) return
      scheduleRead('change')
    }, 1000)

    return cleanup
  }
}
