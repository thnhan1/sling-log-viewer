import type { Server as HttpServer } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { WebSocketServer, type RawData, type WebSocket } from 'ws'
import { assertUnderRoot, getRoot, readSince, readTailAligned, statLogFile } from './logStore.js'

type ClientMsg = { type: 'subscribe'; file: string } | { type: 'ping' }

type ServerMsg =
  | { type: 'error'; message: string }
  | { type: 'subscribed'; file: string }
  | { type: 'tail'; file: string; chunk: string; toByte: number; fileSize: number; truncated: boolean }
  | { type: 'append'; file: string; chunk: string; fromByte: number; toByte: number; fileSize: number }
  | { type: 'rotated'; file: string; reason: 'truncated' | 'renamed' }
  | { type: 'pong' }

function safeSend(ws: WebSocket, msg: ServerMsg): void {
  if (ws.readyState !== ws.OPEN) return
  ws.send(JSON.stringify(msg))
}

function parseClientMessage(raw: string): ClientMsg | null {
  try {
    const v = JSON.parse(raw) as Record<string, unknown>
    if (v.type === 'subscribe' && typeof v.file === 'string') return { type: 'subscribe', file: v.file }
    if (v.type === 'ping') return { type: 'ping' }
    return null
  } catch {
    return null
  }
}

async function fileExists(fp: string): Promise<boolean> {
  try {
    const st = await fs.stat(fp)
    return st.isFile()
  } catch {
    return false
  }
}

export function mountWs(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws: WebSocket) => {
    let subscribedFile: string | null = null
    let subscribedAbs: string | null = null
    let sinceByte = 0
    let watchTimer: NodeJS.Timeout | null = null
    let pollTimer: NodeJS.Timeout | null = null
    let watcher: import('node:fs').FSWatcher | null = null

    const cleanupWatch = () => {
      if (watchTimer) {
        clearTimeout(watchTimer)
        watchTimer = null
      }
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
      if (watcher) {
        watcher.close()
        watcher = null
      }
    }

    const scheduleRead = (reason: 'change' | 'rename') => {
      if (!subscribedAbs || !subscribedFile) return
      if (watchTimer) clearTimeout(watchTimer)
      watchTimer = setTimeout(async () => {
        watchTimer = null
        const abs = subscribedAbs
        const file = subscribedFile
        if (!abs || !file) return

        const exists = await fileExists(abs)
        if (!exists) {
          safeSend(ws, { type: 'rotated', file, reason: 'renamed' })
          // keep watching; some loggers recreate file soon
          sinceByte = 0
          return
        }

        const meta = await statLogFile(abs)
        if (meta.size < sinceByte) {
          safeSend(ws, { type: 'rotated', file, reason: reason === 'rename' ? 'renamed' : 'truncated' })
          const tail = await readTailAligned(abs)
          sinceByte = tail.toByte
          safeSend(ws, {
            type: 'tail',
            file,
            chunk: tail.chunk,
            toByte: tail.toByte,
            fileSize: tail.fileSize,
            truncated: tail.truncated,
          })
          return
        }

        if (meta.size === sinceByte) return

        const r = await readSince(abs, sinceByte)
        sinceByte = r.toByte
        if (r.chunk) {
          safeSend(ws, {
            type: 'append',
            file,
            chunk: r.chunk,
            fromByte: r.fromByte,
            toByte: r.toByte,
            fileSize: r.fileSize,
          })
        }
      }, 60)
    }

    ws.on('message', async (data: RawData) => {
      const raw = typeof data === 'string' ? data : data.toString()
      const msg = parseClientMessage(raw)
      if (!msg) {
        safeSend(ws, { type: 'error', message: 'Invalid message' })
        return
      }
      if (msg.type === 'ping') {
        safeSend(ws, { type: 'pong' })
        return
      }

      const root = getRoot()
      if (!root) {
        safeSend(ws, { type: 'error', message: 'Configure root path first' })
        return
      }

      const file = msg.file.trim()
      if (!file || file.includes('..') || path.isAbsolute(file)) {
        safeSend(ws, { type: 'error', message: 'Invalid file' })
        return
      }

      cleanupWatch()
      subscribedFile = file
      try {
        subscribedAbs = assertUnderRoot(root, file)
      } catch (e) {
        subscribedAbs = null
        safeSend(ws, { type: 'error', message: e instanceof Error ? e.message : 'Invalid file' })
        return
      }

      // initial tail
      try {
        const abs = subscribedAbs
        if (!abs) {
          safeSend(ws, { type: 'error', message: 'Invalid file' })
          return
        }
        const tail = await readTailAligned(abs)
        sinceByte = tail.toByte
        safeSend(ws, { type: 'subscribed', file })
        safeSend(ws, {
          type: 'tail',
          file,
          chunk: tail.chunk,
          toByte: tail.toByte,
          fileSize: tail.fileSize,
          truncated: tail.truncated,
        })
      } catch (e) {
        safeSend(ws, { type: 'error', message: e instanceof Error ? e.message : 'Failed to read log' })
        return
      }

      // watch for changes (best-effort)
      try {
        const abs = subscribedAbs
        if (!abs) return
        const fsSync = await import('node:fs')
        watcher = fsSync.watch(abs, { persistent: false }, (evt) => {
          scheduleRead(evt === 'rename' ? 'rename' : 'change')
        })
      } catch {
        // If watch fails (platform/filesystem), client can still refresh manually (HTTP endpoints remain).
        watcher = null
      }

      // Fallback poll: fs.watch can miss append events on some Windows setups.
      // This keeps WS "push" semantics while guaranteeing progress.
      pollTimer = setInterval(() => {
        if (!subscribedAbs || !subscribedFile) return
        scheduleRead('change')
      }, 1000)
    })

    ws.on('close', () => {
      cleanupWatch()
    })
  })
}

