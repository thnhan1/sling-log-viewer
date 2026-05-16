import type { LogLevel } from '@shared/types'

const KEY = 'aem-log-viewer-workspace'

export interface SidebarSectionsOpen {
  folder: boolean
  files: boolean
  levels: boolean
}

export interface WorkspacePersisted {
  v: 2
  lastRootPath: string | null
  selectedFile: string | null
  fileSearch: string
  levelsOff: LogLevel[]
  viewQuickFilter: string
  timeFromStr: string
  timeToStr: string
  bookmarksOpen: boolean
  sidebarSections: SidebarSectionsOpen
  openTabs: string[]
  activeTabFile: string | null
}

const DEFAULT_SIDEBAR_SECTIONS: SidebarSectionsOpen = {
  folder: true,
  files: true,
  levels: true,
}

const DEFAULT: WorkspacePersisted = {
  v: 2,
  lastRootPath: null,
  selectedFile: null,
  fileSearch: '',
  levelsOff: [],
  viewQuickFilter: '',
  timeFromStr: '',
  timeToStr: '',
  bookmarksOpen: false,
  sidebarSections: { ...DEFAULT_SIDEBAR_SECTIONS },
  openTabs: [],
  activeTabFile: null,
}

const LEVELS: Set<string> = new Set(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'UNKNOWN'])

function migrate(raw: Record<string, unknown>): WorkspacePersisted {
  const lastRootPath =
    raw.lastRootPath === null || raw.lastRootPath === undefined
      ? null
      : String(raw.lastRootPath).trim() || null

  const selectedFile =
    raw.selectedFile === null || raw.selectedFile === undefined
      ? null
      : String(raw.selectedFile).trim() || null

  const fileSearch = typeof raw.fileSearch === 'string' ? raw.fileSearch : ''
  const levelsRaw = raw.levelsOff
  const levelsOff: LogLevel[] = []
  if (Array.isArray(levelsRaw)) {
    for (const x of levelsRaw) {
      const s = String(x)
      if (LEVELS.has(s)) levelsOff.push(s as LogLevel)
    }
  }

  const viewQuickFilter = typeof raw.viewQuickFilter === 'string' ? raw.viewQuickFilter : ''
  const timeFromStr = typeof raw.timeFromStr === 'string' ? raw.timeFromStr : ''
  const timeToStr = typeof raw.timeToStr === 'string' ? raw.timeToStr : ''
  const bookmarksOpen = Boolean(raw.bookmarksOpen)

  let sidebarSections: SidebarSectionsOpen = { ...DEFAULT_SIDEBAR_SECTIONS }
  const ss = raw.sidebarSections
  if (ss && typeof ss === 'object' && !Array.isArray(ss)) {
    const o = ss as Record<string, unknown>
    if (typeof o.folder === 'boolean') sidebarSections.folder = o.folder
    if (typeof o.files === 'boolean') sidebarSections.files = o.files
    if (typeof o.levels === 'boolean') sidebarSections.levels = o.levels
  }

  let openTabs: string[] = []
  const rawTabs = raw.openTabs
  if (Array.isArray(rawTabs)) {
    openTabs = rawTabs.map((f) => String(f).trim()).filter(Boolean)
  }

  let activeTabFile: string | null = null
  if (typeof raw.activeTabFile === 'string' && raw.activeTabFile.trim()) {
    activeTabFile = raw.activeTabFile.trim()
  }

  return {
    v: 2,
    lastRootPath,
    selectedFile,
    fileSearch,
    levelsOff,
    viewQuickFilter,
    timeFromStr,
    timeToStr,
    bookmarksOpen,
    sidebarSections,
    openTabs,
    activeTabFile,
  }
}

export function readWorkspace(): WorkspacePersisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const p = JSON.parse(raw) as Record<string, unknown>
    return migrate(p)
  } catch {
    return { ...DEFAULT }
  }
}

export function writeWorkspace(p: WorkspacePersisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}
