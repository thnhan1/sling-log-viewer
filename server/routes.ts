import fs from 'node:fs/promises'
import path from 'node:path'
import express, { type Express, type Request, type Response } from 'express'
import {
  assertUnderRoot,
  clearLogFile,
  getRoot,
  listLogFiles,
  readSince,
  readTailAligned,
  setRoot,
  statLogFile,
} from './logStore.js'
import { getEnvLogRoot } from './loadEnv.js'

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ ok: false, error: message })
}

function clampNumber(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export function mountApi(app: Express): void {
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    next()
  })

  app.use('/api', express.json({ limit: '1mb' }))

  app.get('/api/defaults', (_req: Request, res: Response) => {
    const envLogRoot = getEnvLogRoot()
    res.json({ ok: true, envLogRoot })
  })

  app.post('/api/config', async (req: Request, res: Response) => {
    const raw = (req.body as { rootPath?: string })?.rootPath?.trim()
    if (!raw) {
      sendError(res, 400, 'rootPath is required')
      return
    }
    let resolved: string
    try {
      resolved = path.resolve(raw)
    } catch {
      sendError(res, 400, 'Invalid path')
      return
    }
    try {
      const st = await fs.stat(resolved)
      if (!st.isDirectory()) {
        sendError(res, 400, 'Path is not a directory')
        return
      }
    } catch {
      sendError(res, 404, 'Directory does not exist')
      return
    }
    setRoot(resolved)
    res.json({ ok: true, rootPath: resolved })
  })

  app.get('/api/files', async (_req: Request, res: Response) => {
    const root = getRoot()
    if (!root) {
      sendError(res, 400, 'Configure root path first')
      return
    }
    try {
      const files = await listLogFiles(root)
      res.json({ ok: true, files })
    } catch (e) {
      sendError(res, 500, e instanceof Error ? e.message : 'Failed to list files')
    }
  })

  app.get('/api/log/meta', async (req: Request, res: Response) => {
    const root = getRoot()
    if (!root) {
      sendError(res, 400, 'Configure root path first')
      return
    }
    const file = String(req.query.file ?? '')
    if (!file || file.includes('..') || path.isAbsolute(file)) {
      sendError(res, 400, 'Invalid file')
      return
    }
    try {
      const abs = assertUnderRoot(root, file)
      const meta = await statLogFile(abs)
      res.json({ ok: true, ...meta, name: file })
    } catch (e) {
      sendError(res, 500, e instanceof Error ? e.message : 'Stat failed')
    }
  })

  app.get('/api/log', async (req: Request, res: Response) => {
    const root = getRoot()
    if (!root) {
      sendError(res, 400, 'Configure root path first')
      return
    }
    const file = String(req.query.file ?? '')
    if (!file || file.includes('..') || path.isAbsolute(file)) {
      sendError(res, 400, 'Invalid file')
      return
    }
    const mode = String(req.query.mode ?? 'since')
    const maxTail = clampNumber(Number(req.query.maxBytes), 1024, 8 * 1024 * 1024, 2 * 1024 * 1024)
    const sinceRaw = req.query.sinceByte
    const sinceByte =
      sinceRaw === undefined || sinceRaw === '' ? null : clampNumber(Number(sinceRaw), 0, Number.MAX_SAFE_INTEGER, 0)

    try {
      const abs = assertUnderRoot(root, file)
      if (mode === 'tail') {
        const r = await readTailAligned(abs, maxTail)
        res.json({
          ok: true,
          chunk: r.chunk,
          fromByte: r.fromByte,
          toByte: r.toByte,
          fileSize: r.fileSize,
          truncated: r.truncated,
        })
        return
      }
      if (sinceByte === null) {
        sendError(res, 400, 'sinceByte required when mode is not tail')
        return
      }
      const r = await readSince(abs, sinceByte)
      res.json({
        ok: true,
        chunk: r.chunk,
        fromByte: r.fromByte,
        toByte: r.toByte,
        fileSize: r.fileSize,
        truncated: false,
      })
    } catch (e) {
      sendError(res, 500, e instanceof Error ? e.message : 'Read failed')
    }
  })

  app.post('/api/log/clear', async (req: Request, res: Response) => {
    const root = getRoot()
    if (!root) {
      sendError(res, 400, 'Configure root path first')
      return
    }
    const file = String((req.body as { file?: string })?.file ?? '')
    if (!file || file.includes('..') || path.isAbsolute(file)) {
      sendError(res, 400, 'Invalid file')
      return
    }
    try {
      const abs = assertUnderRoot(root, file)
      await clearLogFile(abs)
      res.json({ ok: true })
    } catch (e) {
      sendError(res, 500, e instanceof Error ? e.message : 'Clear failed')
    }
  })
}
