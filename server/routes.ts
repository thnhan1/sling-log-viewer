import fs from 'node:fs/promises'
import path from 'node:path'
import express, { type Express, type Request, type Response } from 'express'
import {
  getLogSource,
  getSourceMode,
  getLocalRootPath,
  getRemoteConfig,
  setSourceMode,
  setLocalRootPath,
  updateRemoteConfig,
  type SourceMode,
} from './logSources/LogSourceFactory.js'
import type { RemoteConfig } from './logSources/RemoteSlingLogSource.js'
import { normalizeLogFileName } from './logSources/RemoteSlingLogSource.js'
import { getEnvAemUrl, getEnvAemUser, getEnvAemPass, getEnvAemLogFiles, getEnvLogRoot } from './loadEnv.js'

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ ok: false, error: message })
}

function clampNumber(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

const KNOWN_LEVELS = new Set(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'UNKNOWN'])

export function mountApi(app: Express): void {
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    next()
  })

  app.use('/api', express.json({ limit: '1mb' }))

  // ── Defaults (env hints for the UI) ──
  app.get('/api/defaults', (_req: Request, res: Response) => {
    const envLogRoot = getEnvLogRoot()
    const envAemUrl = getEnvAemUrl()
    const hasRemoteEnv = Boolean(envAemUrl && getEnvAemUser())
    res.json({
      ok: true,
      envLogRoot,
      hasRemoteEnv,
      envAemUrl: envAemUrl ?? null,
      envAemUser: getEnvAemUser() ?? null,
      envAemLogFiles: getEnvAemLogFiles(),
    })
  })

  // ── Source mode ──
  app.get('/api/source-mode', (_req: Request, res: Response) => {
    const mode = getSourceMode()
    const remoteCfg = getRemoteConfig()
    res.json({
      ok: true,
      mode,
      configured: mode === 'local' ? Boolean(getLocalRootPath()) : Boolean(remoteCfg),
      localRootPath: getLocalRootPath(),
      remoteConfig: remoteCfg
        ? {
            baseUrl: remoteCfg.baseUrl,
            username: remoteCfg.username,
            logPath: remoteCfg.logPath || 'logs/',
            logFiles: remoteCfg.logFiles,
            hasPassword: Boolean(remoteCfg.password),
          }
        : undefined,
    })
  })

  app.post('/api/source-mode', (req: Request, res: Response) => {
    const raw = (req.body as { mode?: string })?.mode
    if (raw !== 'local' && raw !== 'remote') {
      sendError(res, 400, 'mode must be "local" or "remote"')
      return
    }
    setSourceMode(raw)
    res.json({ ok: true, mode: raw })
  })

  // ── Remote config ──
  app.post('/api/remote-config', (req: Request, res: Response) => {
    const body = req.body as {
      baseUrl?: string
      username?: string
      password?: string
      logPath?: string
      logFiles?: string[]
    }

    const baseUrl = (body.baseUrl ?? '').trim()
    const username = (body.username ?? '').trim()
    const password = (body.password ?? '').trim()
    const logPath = (body.logPath ?? '').trim() || 'logs/'
    // Normalize: strip path prefixes so only bare filenames are stored
    const logFiles = Array.isArray(body.logFiles)
      ? [...new Set(body.logFiles.map((f) => normalizeLogFileName(f)).filter(Boolean))]
      : []

    if (!baseUrl) {
      sendError(res, 400, 'baseUrl is required')
      return
    }
    if (!username) {
      sendError(res, 400, 'username is required')
      return
    }

    // Allow reconnect without re-entering password (server still has it in memory)
    let effectivePassword = password
    if (!effectivePassword) {
      const existingCfg = getRemoteConfig()
      if (existingCfg) {
        effectivePassword = existingCfg.password
      }
    }
    if (!effectivePassword) {
      sendError(res, 400, 'password is required')
      return
    }

    const config: RemoteConfig = { baseUrl, username, password: effectivePassword, logPath, logFiles }
    updateRemoteConfig(config)
    setSourceMode('remote')

    res.json({
      ok: true,
      baseUrl,
      username,
      logPath,
      logFiles,
      hasPassword: true,
    })
  })

  // ── Local config (existing) ──
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
    setLocalRootPath(resolved)
    setSourceMode('local')
    res.json({ ok: true, rootPath: resolved })
  })

  // ── File listing (works for both local and remote) ──
  app.get('/api/files', async (_req: Request, res: Response) => {
    try {
      const source = getLogSource()
      const files = await source.listFiles()
      res.json({ ok: true, files })
    } catch (e) {
      sendError(res, 500, e instanceof Error ? e.message : 'Failed to list files')
    }
  })

  // ── Log file meta ──
  app.get('/api/log/meta', async (req: Request, res: Response) => {
    const file = String(req.query.file ?? '')
    if (!file || file.includes('..') || path.isAbsolute(file)) {
      sendError(res, 400, 'Invalid file')
      return
    }
    try {
      const source = getLogSource()
      const meta = await source.statFile(file)
      res.json({ ok: true, ...meta, name: file })
    } catch (e) {
      sendError(res, 500, e instanceof Error ? e.message : 'Stat failed')
    }
  })

  // ── Read log (tail or since) ──
  app.get('/api/log', async (req: Request, res: Response) => {
    const file = String(req.query.file ?? '')
    if (!file || file.includes('..') || path.isAbsolute(file)) {
      sendError(res, 400, 'Invalid file')
      return
    }
    const mode = String(req.query.mode ?? 'since')
    const maxTail = clampNumber(Number(req.query.maxBytes), 1024, 8 * 1024 * 1024, 2 * 1024 * 1024)
    const sinceRaw = req.query.sinceByte
    const sinceByte =
      sinceRaw === undefined || sinceRaw === ''
        ? null
        : clampNumber(Number(sinceRaw), 0, Number.MAX_SAFE_INTEGER, 0)

    try {
      const source = getLogSource()

      if (mode === 'tail') {
        const r = await source.readTail(file, maxTail)
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
      const r = await source.readSince(file, sinceByte)
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

  // ── Clear log ──
  app.post('/api/log/clear', async (req: Request, res: Response) => {
    const file = String((req.body as { file?: string })?.file ?? '')
    if (!file || file.includes('..') || path.isAbsolute(file)) {
      sendError(res, 400, 'Invalid file')
      return
    }
    try {
      const source = getLogSource()
      await source.clearFile(file)
      res.json({ ok: true })
    } catch (e) {
      sendError(res, 500, e instanceof Error ? e.message : 'Clear failed')
    }
  })
}
