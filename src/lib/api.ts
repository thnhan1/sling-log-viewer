export async function getDefaults(): Promise<{
  ok: boolean
  envLogRoot?: string | null
  hasRemoteEnv?: boolean
  envAemUrl?: string | null
  envAemUser?: string | null
  envAemLogFiles?: string[]
  error?: string
}> {
  const r = await fetch('/api/defaults')
  return r.json() as Promise<{
    ok: boolean
    envLogRoot?: string | null
    hasRemoteEnv?: boolean
    envAemUrl?: string | null
    envAemUser?: string | null
    envAemLogFiles?: string[]
    error?: string
  }>
}

// ── Source mode ──

export async function getSourceMode(): Promise<{
  ok: boolean
  mode: 'local' | 'remote'
  configured: boolean
  localRootPath?: string | null
  remoteConfig?: {
    baseUrl: string
    username: string
    logPath: string
    logFiles: string[]
    hasPassword: boolean
  }
}> {
  const r = await fetch('/api/source-mode')
  return r.json()
}

export async function setSourceModeApi(mode: 'local' | 'remote'): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/source-mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
  return r.json()
}

// ── Remote config ──

export async function postRemoteConfig(config: {
  baseUrl: string
  username: string
  password: string
  logPath?: string
  logFiles: string[]
}): Promise<{
  ok: boolean
  baseUrl?: string
  username?: string
  logPath?: string
  logFiles?: string[]
  hasPassword?: boolean
  error?: string
}> {
  const r = await fetch('/api/remote-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return r.json()
}

// ── Clear remote config ──

export async function clearRemoteConfig(): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/remote-config/clear', { method: 'POST' })
  return r.json()
}

// ── File operations (unchanged — reused for both modes) ──

export async function postConfig(rootPath: string): Promise<{ ok: boolean; rootPath?: string; error?: string }> {
  const r = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rootPath }),
  })
  return r.json() as Promise<{ ok: boolean; rootPath?: string; error?: string }>
}

export interface LogFileRow {
  name: string
  size: number
  mtimeMs: number
}

export async function getFiles(): Promise<{ ok: boolean; files?: LogFileRow[]; error?: string }> {
  const r = await fetch('/api/files')
  return r.json() as Promise<{ ok: boolean; files?: LogFileRow[]; error?: string }>
}

export async function getLogMeta(
  file: string,
): Promise<{ ok: boolean; size?: number; mtimeMs?: number; error?: string }> {
  const q = new URLSearchParams({ file })
  const r = await fetch(`/api/log/meta?${q}`)
  return r.json() as Promise<{ ok: boolean; size?: number; mtimeMs?: number; error?: string }>
}

export async function getLogTail(
  file: string,
  maxBytes = 2 * 1024 * 1024,
): Promise<{
  ok: boolean
  chunk?: string
  fromByte?: number
  toByte?: number
  fileSize?: number
  truncated?: boolean
  error?: string
}> {
  const q = new URLSearchParams({ file, mode: 'tail', maxBytes: String(maxBytes) })
  const r = await fetch(`/api/log?${q}`)
  return r.json() as Promise<{
    ok: boolean
    chunk?: string
    fromByte?: number
    toByte?: number
    fileSize?: number
    truncated?: boolean
    error?: string
  }>
}

export async function getLogSince(
  file: string,
  sinceByte: number,
): Promise<{
  ok: boolean
  chunk?: string
  fromByte?: number
  toByte?: number
  fileSize?: number
  error?: string
}> {
  const q = new URLSearchParams({ file, mode: 'since', sinceByte: String(sinceByte) })
  const r = await fetch(`/api/log?${q}`)
  return r.json() as Promise<{
    ok: boolean
    chunk?: string
    fromByte?: number
    toByte?: number
    fileSize?: number
    error?: string
  }>
}

export async function clearLogFile(file: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/log/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  })
  return r.json() as Promise<{ ok: boolean; error?: string }>
}
