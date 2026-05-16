import { useCallback, useEffect, useRef, useState } from 'react'
import { getLogTail } from '../lib/api'
import type { ParsedLogLine } from '@shared/types'
import { parseLogLine } from '../lib/logPatterns'
import { makeLogWsUrl, tryParseLogWsMsg } from '../lib/logWs'

function splitChunk(chunk: string, carry: string): { lines: ParsedLogLine[]; nextCarry: string } {
  const full = carry + chunk
  const parts = full.split('\n')
  const nextCarry = parts.pop() ?? ''
  const lines = parts.map((p) => parseLogLine(p))
  return { lines, nextCarry }
}

export function useLogStream(file: string | null) {
  const [lines, setLines] = useState<ParsedLogLine[]>([])
  const [truncated, setTruncated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState(0)
  const carryRef = useRef('')
  const fileRef = useRef<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)
  const transientErrorTimerRef = useRef<number | null>(null)

  const reloadTail = useCallback(async () => {
    if (!file) return
    setError(null)
    const res = await getLogTail(file)
    if (!res.ok) {
      setError(res.error ?? 'Failed to load log')
      return
    }
    carryRef.current = ''
    let initial: ParsedLogLine[] = []
    if (res.chunk) {
      const { lines: parsed, nextCarry } = splitChunk(res.chunk, '')
      carryRef.current = nextCarry
      initial = parsed
    }
    setFileSize(res.fileSize ?? 0)
    setTruncated(Boolean(res.truncated))
    setLines(initial)
  }, [file])

  useEffect(() => {
    fileRef.current = file
    if (!file) {
      setLines([])
      carryRef.current = ''
      setFileSize(0)
      setTruncated(false)
      setError(null)
      if (transientErrorTimerRef.current) {
        window.clearTimeout(transientErrorTimerRef.current)
        transientErrorTimerRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      reconnectAttemptRef.current = 0
      return
    }
    void reloadTail()
  }, [file, reloadTail])

  useEffect(() => {
    if (!file) return
    let alive = true

    const cleanupSocket = () => {
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {
          /* ignore */
        }
        wsRef.current = null
      }
    }

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }

    const scheduleReconnect = () => {
      clearReconnectTimer()
      const currentFile = fileRef.current
      if (!alive || !currentFile) return

      const attempt = reconnectAttemptRef.current
      // exponential backoff with jitter, capped
      const base = Math.min(10_000, 350 * Math.pow(2, attempt))
      const jitter = Math.round(base * (0.15 * (Math.random() - 0.5) * 2))
      const delay = Math.max(250, base + jitter)
      reconnectAttemptRef.current = Math.min(attempt + 1, 8)

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null
        connect()
      }, delay)
    }

    const connect = () => {
      cleanupSocket()
      clearReconnectTimer()
      const currentFile = fileRef.current
      if (!alive || !currentFile) return

      const ws = new WebSocket(makeLogWsUrl())
      wsRef.current = ws

      ws.addEventListener('open', () => {
        if (!alive || wsRef.current !== ws) return
        reconnectAttemptRef.current = 0
        setError(null)
        ws.send(JSON.stringify({ type: 'subscribe', file: currentFile }))
      })

      ws.addEventListener('message', (ev) => {
        if (!alive || wsRef.current !== ws) return
        const msg = typeof ev.data === 'string' ? tryParseLogWsMsg(ev.data) : tryParseLogWsMsg(String(ev.data))
        if (!msg) return
        if (msg.type === 'error') {
          setError(msg.message)
          // This is a common race (client remembers file, server hasn't received /api/config yet).
          // Show briefly, then clear so it doesn't get "stuck".
          if (msg.message === 'Configure root path first') {
            if (transientErrorTimerRef.current) window.clearTimeout(transientErrorTimerRef.current)
            transientErrorTimerRef.current = window.setTimeout(() => {
              transientErrorTimerRef.current = null
              setError(null)
            }, 1500)
          }
          return
        }
        if (msg.type === 'tail') {
          carryRef.current = ''
          const { lines: parsed, nextCarry } = splitChunk(msg.chunk ?? '', '')
          carryRef.current = nextCarry
          setFileSize(msg.fileSize ?? 0)
          setTruncated(Boolean(msg.truncated))
          setLines(parsed)
          return
        }
        if (msg.type === 'append') {
          if (msg.fileSize !== undefined) setFileSize(msg.fileSize)
          if (msg.chunk) {
            const { lines: parsed, nextCarry } = splitChunk(msg.chunk, carryRef.current)
            carryRef.current = nextCarry
            if (parsed.length) setLines((prev) => [...prev, ...parsed])
          }
          return
        }
        if (msg.type === 'rotated') {
          return
        }
      })

      ws.addEventListener('close', () => {
        if (!alive || wsRef.current !== ws) return
        setError('Disconnected (reconnecting…)')
        scheduleReconnect()
      })

      ws.addEventListener('error', () => {
        if (!alive || wsRef.current !== ws) return
        setError('WebSocket error (reconnecting…)')
        // some browsers also emit close, but not always
        scheduleReconnect()
      })
    }

    connect()

    return () => {
      alive = false
      clearReconnectTimer()
      cleanupSocket()
    }
  }, [file])

  const clearViewOnly = useCallback(async () => {
    if (!file) return
    setLines([])
    carryRef.current = ''
    setFileSize(0)
  }, [file])

  return {
    lines,
    truncated,
    error,
    fileSize,
    reloadTail,
    clearViewOnly,
  }
}
