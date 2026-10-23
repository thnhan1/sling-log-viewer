import { LEGACY_STORAGE_KEYS, STORAGE_KEYS, readMigrated, writeStorage } from './storageKeys'

const STORAGE_KEY = STORAGE_KEYS.bookmarks
const LEGACY_STORAGE_KEY = LEGACY_STORAGE_KEYS.bookmarks

export interface LogBookmark {
  id: string
  fileName: string
  raw: string
  createdAt: number
}

function safeParse(raw: string | null): LogBookmark[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (x): x is LogBookmark =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as LogBookmark).id === 'string' &&
        typeof (x as LogBookmark).fileName === 'string' &&
        typeof (x as LogBookmark).raw === 'string' &&
        typeof (x as LogBookmark).createdAt === 'number',
    )
  } catch {
    return []
  }
}

export function loadBookmarks(): LogBookmark[] {
  try {
    return safeParse(readMigrated(STORAGE_KEY, LEGACY_STORAGE_KEY))
  } catch {
    return []
  }
}

export function saveBookmarks(rows: LogBookmark[]): void {
  writeStorage(STORAGE_KEY, JSON.stringify(rows))
}

export function bookmarksForFile(fileName: string, all: LogBookmark[]): LogBookmark[] {
  return all.filter((b) => b.fileName === fileName).sort((a, b) => b.createdAt - a.createdAt)
}

function newId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

export function addBookmark(all: LogBookmark[], fileName: string, raw: string): LogBookmark[] {
  if (all.some((b) => b.fileName === fileName && b.raw === raw)) return all
  const next: LogBookmark = {
    id: newId(),
    fileName,
    raw,
    createdAt: Date.now(),
  }
  return [next, ...all]
}

export function removeBookmark(all: LogBookmark[], id: string): LogBookmark[] {
  return all.filter((b) => b.id !== id)
}

export function isBookmarked(all: LogBookmark[], fileName: string, raw: string): boolean {
  return all.some((b) => b.fileName === fileName && b.raw === raw)
}
