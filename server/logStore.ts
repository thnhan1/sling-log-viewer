import fs from 'node:fs/promises'
import path from 'node:path'

let rootPath: string | null = null

export function getRoot(): string | null {
  return rootPath
}

export function setRoot(dir: string | null): void {
  rootPath = dir
}

export function assertUnderRoot(root: string, relativeFile: string): string {
  const resolvedRoot = path.resolve(root)
  const candidate = path.resolve(resolvedRoot, relativeFile)
  const rel = path.relative(resolvedRoot, candidate)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Invalid file path')
  }
  return candidate
}

export async function listLogFiles(root: string): Promise<{ name: string; size: number; mtimeMs: number }[]> {
  const entries = await fs.readdir(root, { withFileTypes: true })
  const files: { name: string; size: number; mtimeMs: number }[] = []
  for (const e of entries) {
    if (!e.isFile() || !e.name.toLowerCase().endsWith('.log')) continue
    const fp = path.join(root, e.name)
    const st = await fs.stat(fp)
    files.push({ name: e.name, size: st.size, mtimeMs: st.mtimeMs })
  }
  files.sort((a, b) => a.name.localeCompare(b.name))
  return files
}

export async function statLogFile(absPath: string): Promise<{ size: number; mtimeMs: number }> {
  const st = await fs.stat(absPath)
  return { size: st.size, mtimeMs: st.mtimeMs }
}

export async function clearLogFile(absPath: string): Promise<void> {
  await fs.truncate(absPath, 0)
}

const DEFAULT_TAIL = 2 * 1024 * 1024

/**
 * Initial tail: read last maxBytes, align to first full line after first newline in chunk.
 * Returns utf-8 text chunk and byte range in file.
 */
export async function readTailAligned(
  absPath: string,
  maxBytes: number = DEFAULT_TAIL,
): Promise<{ chunk: string; fromByte: number; toByte: number; fileSize: number; truncated: boolean }> {
  const fh = await fs.open(absPath, 'r')
  try {
    const st = await fh.stat()
    const size = st.size
    if (size === 0) {
      return { chunk: '', fromByte: 0, toByte: 0, fileSize: 0, truncated: false }
    }
    const take = Math.min(maxBytes, size)
    const start = size - take
    const buf = Buffer.alloc(take)
    await fh.read(buf, 0, take, start)
    let fromByte = start
    let text = buf.toString('utf8')
    if (start > 0) {
      const nl = text.indexOf('\n')
      if (nl !== -1) {
        fromByte = start + Buffer.byteLength(text.slice(0, nl + 1), 'utf8')
        text = text.slice(nl + 1)
      }
    }
    const toByte = size
    return {
      chunk: text,
      fromByte,
      toByte,
      fileSize: size,
      truncated: size > take,
    }
  } finally {
    await fh.close()
  }
}

/** Append read: bytes [sinceByte, fileSize) */
export async function readSince(
  absPath: string,
  sinceByte: number,
): Promise<{ chunk: string; fromByte: number; toByte: number; fileSize: number }> {
  const fh = await fs.open(absPath, 'r')
  try {
    const st = await fh.stat()
    const size = st.size
    if (sinceByte >= size) {
      return { chunk: '', fromByte: size, toByte: size, fileSize: size }
    }
    if (sinceByte < 0) sinceByte = 0
    const len = size - sinceByte
    const buf = Buffer.alloc(len)
    await fh.read(buf, 0, len, sinceByte)
    return {
      chunk: buf.toString('utf8'),
      fromByte: sinceByte,
      toByte: size,
      fileSize: size,
    }
  } finally {
    await fh.close()
  }
}
