import type { Server as HttpServer } from 'node:http'
import path from 'node:path'
import { WebSocketServer, type RawData, type WebSocket } from 'ws'
import { getLogSource, getSourceMode, getLocalRootPath, getRemoteConfig } from './logSources/LogSourceFactory.js'

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

function isSourceConfigured(): boolean {
  const mode = getSourceMode()
  if (mode === 'local') return Boolean(getLocalRootPath())
  if (mode === 'remote') return Boolean(getRemoteConfig())
  return false
}

export function mountWs(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws: WebSocket) => {
    let subscribedFile: string | null = null
    let unwatchFn: (() => void) | null = null
    let transientErrorTimer: NodeJS.Timeout | null = null

    const cleanupWatch = () => {
      if (unwatchFn) {
        unwatchFn()
        unwatchFn = null
      }
      if (transientErrorTimer) {
        clearTimeout(transientErrorTimer)
        transientErrorTimer = null
      }
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

      // Validate source is configured
      if (!isSourceConfigured()) {
        safeSend(ws, {
          type: 'error',
          message: getSourceMode() === 'remote'
            ? 'Configure AEM remote connection first'
            : 'Configure root path first',
        })
        return
      }

      const file = msg.file.trim()
      if (!file || file.includes('..') || path.isAbsolute(file)) {
        safeSend(ws, { type: 'error', message: 'Invalid file' })
        return
      }

      // Clean up previous subscription
      cleanupWatch()
      subscribedFile = file

      try {
        const source = getLogSource()

        // Initial tail read
        let initialTail: { chunk: string; toByte: number; fileSize: number; truncated: boolean }
        try {
          const tail = await source.readTail(file)
          initialTail = tail
        } catch (e) {
          safeSend(ws, {
            type: 'error',
            message: e instanceof Error ? e.message : 'Failed to read log',
          })
          return
        }

        safeSend(ws, { type: 'subscribed', file })
        safeSend(ws, {
          type: 'tail',
          file,
          chunk: initialTail.chunk,
          toByte: initialTail.toByte,
          fileSize: initialTail.fileSize,
          truncated: initialTail.truncated,
        })

        // Start watching for changes.
        // Pass initialTail.toByte so the watcher can skip its own redundant
        // tail read — this prevents a race where content written between
        // readTail() and the watcher's initial offset seed is silently lost.
        unwatchFn = source.watchFile(
          file,
          (event) => {
            if (!subscribedFile) return
            switch (event.type) {
              case 'append':
                if (event.chunk) {
                  safeSend(ws, {
                    type: 'append',
                    file,
                    chunk: event.chunk,
                    fromByte: event.fromByte ?? 0,
                    toByte: event.toByte ?? 0,
                    fileSize: event.fileSize ?? 0,
                  })
                }
                break
              case 'tail':
                safeSend(ws, {
                  type: 'tail',
                  file,
                  chunk: event.chunk ?? '',
                  toByte: event.toByte ?? 0,
                  fileSize: event.fileSize ?? 0,
                  truncated: event.truncated ?? false,
                })
                break
              case 'rotated':
                safeSend(ws, {
                  type: 'rotated',
                  file,
                  reason: event.reason ?? 'truncated',
                })
                break
            }
          },
          (err) => {
            // Show error briefly, then clear (transient network issues)
            safeSend(ws, { type: 'error', message: err.message })
            if (transientErrorTimer) clearTimeout(transientErrorTimer)
            transientErrorTimer = setTimeout(() => {
              transientErrorTimer = null
            }, 3000)
          },
          initialTail.toByte,
        )
      } catch (e) {
        safeSend(ws, {
          type: 'error',
          message: e instanceof Error ? e.message : 'Failed to subscribe',
        })
      }
    })

    ws.on('close', () => {
      cleanupWatch()
    })
  })
}
