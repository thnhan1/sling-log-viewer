import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LogLevel } from '@shared/types'
import {
  addBookmark,
  isBookmarked,
  loadBookmarks,
  type LogBookmark,
  removeBookmark,
  saveBookmarks,
} from './lib/bookmarks'
import { clearLogFile, getDefaults, getFiles, postConfig, type LogFileRow } from './lib/api'
import { useUiSettings } from './hooks/useUiSettings'
import {
  readWorkspace,
  writeWorkspace,
  type SidebarSectionsOpen,
} from './lib/workspaceSettings'
import { SettingsModal } from './components/modals/SettingsModal'
import { ConfirmClearModal } from './components/modals/ConfirmClearModal'
import { LogSidebar } from './components/sidebar/LogSidebar'
import { LogViewerEmptyState } from './components/main/LogViewerEmptyState'
import { LogTabPanel } from './components/main/LogTabPanel'

const LOG_ROOT_KEY = 'aem-log-viewer-log-root'
const SIDEBAR_OPEN_KEY = 'aem-log-viewer-sidebar-open'

function readSidebarOpen(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_OPEN_KEY) !== '0'
  } catch {
    return true
  }
}

export default function App() {
  const ui = useUiSettings()

  const [sidebarOpen, setSidebarOpen] = useState(readSidebarOpen)
  const [pathInput, setPathInput] = useState('')
  const [rootPath, setRootPath] = useState<string | null>(null)
  const [configErr, setConfigErr] = useState<string | null>(null)
  const [files, setFiles] = useState<LogFileRow[]>([])
  const [fileSearch, setFileSearch] = useState('')

  // Multi-tab state
  const [tabs, setTabs] = useState<{ id: string; file: string }[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  const [levelsOff, setLevelsOff] = useState<Set<LogLevel>>(() => new Set())
  const [bookmarks, setBookmarks] = useState<LogBookmark[]>(() => loadBookmarks())

  const [sidebarSec, setSidebarSec] = useState<SidebarSectionsOpen>(() => ({
    ...readWorkspace().sidebarSections,
  }))

  const toggleSidebarSec = useCallback((key: keyof SidebarSectionsOpen) => {
    setSidebarSec((s) => ({ ...s, [key]: !s[key] }))
  }, [])

  // Tab operations
  const openFile = useCallback((file: string) => {
    setActiveTabId(() => {
      setTabs((t) => {
        const exists = t.find((tab) => tab.id === file)
        if (exists) return t
        return [...t, { id: file, file }]
      })
      return file
    })
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs((t) => {
      const idx = t.findIndex((tab) => tab.id === id)
      if (idx < 0) return t
      const next = [...t]
      next.splice(idx, 1)
      // If closing the active tab, activate neighbor
      setActiveTabId((active) => {
        if (active !== id) return active
        if (next.length === 0) return null
        const newIdx = Math.min(idx, next.length - 1)
        return next[newIdx].id
      })
      return next
    })
  }, [])

  const activeFile = useMemo(() => {
    if (!activeTabId) return null
    const tab = tabs.find((t) => t.id === activeTabId)
    return tab ? tab.file : null
  }, [tabs, activeTabId])

  const persistBookmarks = useCallback((updater: (prev: LogBookmark[]) => LogBookmark[]) => {
    setBookmarks((prev) => {
      const next = updater(prev)
      saveBookmarks(next)
      return next
    })
  }, [])

  const toggleLineBookmark = useCallback(
    (raw: string) => {
      if (!activeFile) return
      persistBookmarks((prev) => {
        if (isBookmarked(prev, activeFile, raw)) {
          return prev.filter((b) => !(b.fileName === activeFile && b.raw === raw))
        }
        return addBookmark(prev, activeFile, raw)
      })
    },
    [activeFile, persistBookmarks],
  )

  const removeBm = useCallback(
    (id: string) => {
      persistBookmarks((prev) => removeBookmark(prev, id))
    },
    [persistBookmarks],
  )

  const configureRoot = useCallback(async (rawPath: string) => {
    const raw = rawPath.trim()
    setConfigErr(null)
    if (!raw) {
      setConfigErr('Enter a folder path')
      return false
    }
    const res = await postConfig(raw)
    if (!res.ok) {
      setConfigErr(res.error ?? 'Failed to set folder')
      setRootPath(null)
      setFiles([])
      return false
    }
    const resolved = res.rootPath ?? raw
    try {
      localStorage.setItem(LOG_ROOT_KEY, resolved)
    } catch {
      /* ignore */
    }
    setPathInput(resolved)
    setRootPath(resolved)
    const list = await getFiles()
    if (!list.ok) {
      setConfigErr(list.error ?? 'Failed to list files')
      setFiles([])
      return false
    }
    setFiles(list.files ?? [])
    return true
  }, [])

  const bootstrapRef = useRef(false)
  useEffect(() => {
    if (bootstrapRef.current) return
    bootstrapRef.current = true
    let alive = true
    ;(async () => {
      const defaults = await getDefaults()
      if (!alive) return
      let saved = ''
      try {
        saved = localStorage.getItem(LOG_ROOT_KEY) ?? ''
      } catch {
        /* ignore */
      }
      const envPath = defaults.ok && defaults.envLogRoot ? defaults.envLogRoot.trim() : ''
      const initial = saved.trim() || envPath
      if (initial) await configureRoot(initial)
    })()
    return () => {
      alive = false
    }
  }, [configureRoot])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((s) => {
      const next = !s
      try {
        localStorage.setItem(SIDEBAR_OPEN_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  // Restore workspace: tabs and active tab
  const workspaceHydratedRef = useRef<string | null>(null)
  const tabsRestoredRef = useRef(false)

  useEffect(() => {
    if (!rootPath || files.length === 0) return
    const ws = readWorkspace()

    if (workspaceHydratedRef.current !== rootPath) {
      workspaceHydratedRef.current = rootPath
      setFileSearch(ws.fileSearch)
      setLevelsOff(new Set(ws.levelsOff))
      setSidebarSec({ ...ws.sidebarSections })

      // Restore tabs
      if (!tabsRestoredRef.current && ws.openTabs.length > 0) {
        tabsRestoredRef.current = true
        const validTabs = ws.openTabs
          .filter((f) => files.some((rf) => rf.name === f))
          .map((f) => ({ id: f, file: f }))
        if (validTabs.length > 0) {
          setTabs(validTabs)
          const active = ws.activeTabFile && files.some((rf) => rf.name === ws.activeTabFile)
            ? ws.activeTabFile
            : validTabs[0].id
          setActiveTabId(active)
        }
      }
    }
  }, [rootPath, files])

  // Persist workspace
  useEffect(() => {
    const t = window.setTimeout(() => {
      writeWorkspace({
        v: 2,
        lastRootPath: rootPath,
        selectedFile: activeFile,
        fileSearch,
        levelsOff: [...levelsOff],
        viewQuickFilter: '',
        timeFromStr: '',
        timeToStr: '',
        bookmarksOpen: false,
        sidebarSections: sidebarSec,
        openTabs: tabs.map((t) => t.file),
        activeTabFile: activeFile,
      })
    }, 400)
    return () => clearTimeout(t)
  }, [rootPath, activeFile, fileSearch, levelsOff, sidebarSec, tabs])

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => f.name.toLowerCase().includes(q))
  }, [files, fileSearch])

  const toggleLevel = (l: LogLevel) => {
    setLevelsOff((prev) => {
      const next = new Set(prev)
      if (next.has(l)) next.delete(l)
      else next.add(l)
      return next
    })
  }

  const [confirmClearFile, setConfirmClearFile] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen])

  useEffect(() => {
    if (!confirmClearFile) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmClearFile(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmClearFile])

  const doClearFile = async () => {
    if (!activeFile) return
    const res = await clearLogFile(activeFile)
    if (!res.ok) {
      setConfigErr(res.error ?? 'Clear file failed')
      return
    }
    setConfirmClearFile(false)
    // Refresh file list so sidebar sizes update
    const list = await getFiles()
    if (list.ok) setFiles(list.files ?? [])
    // Trigger tab to reload its stream
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden">
      <LogSidebar
        open={sidebarOpen}
        sidebarSec={sidebarSec}
        toggleSidebarSec={toggleSidebarSec}
        onToggleSidebar={toggleSidebar}
        pathInput={pathInput}
        setPathInput={setPathInput}
        onConfigureRoot={(p) => void configureRoot(p)}
        rootPath={rootPath}
        configErr={configErr}
        fileSearch={fileSearch}
        setFileSearch={setFileSearch}
        filteredFiles={filteredFiles}
        selectedFile={activeFile}
        onSelectFile={openFile}
        levelsOff={levelsOff}
        onToggleLevel={toggleLevel}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className={`flex min-w-0 min-h-0 flex-1 flex-col transition-[margin] duration-250 ease-out ${sidebarOpen ? 'ml-[260px]' : ''}`}>
        {/* Unified toolbar: traffic lights + sidebar toggle + tab strip */}
        <div className="flex shrink-0 items-center h-[38px] glass-toolbar border-b border-border select-none">
          {/* Traffic light window controls */}
          <div className="flex items-center gap-1.5 pl-3">
            <span className="traffic-light traffic-light--red" />
            <span className="traffic-light traffic-light--yellow" />
            <span className="traffic-light traffic-light--green" />
          </div>

          {/* Sidebar toggle */}
          <button
            type="button"
            className="btn-macos shrink-0 flex items-center gap-1 mx-1"
            onClick={toggleSidebar}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            aria-expanded={sidebarOpen}
          >
            <span className="text-ui-xs">{sidebarOpen ? '◀' : '▶'}</span>
          </button>

          {/* Tab strip */}
          <div className="flex items-center h-full min-w-0 flex-1 overflow-x-auto">
            {tabs.length === 0 ? (
              <div className="flex items-center px-2 text-muted text-ui">
                No file selected
              </div>
            ) : (
              tabs.map((tab) => {
                const isActive = tab.id === activeTabId
                return (
                  <div
                    key={tab.id}
                    className={`flex items-center h-full shrink-0 cursor-pointer group ${
                      isActive
                        ? 'bg-bg border-b-2 border-accent text-text'
                        : 'text-muted hover:bg-[rgba(255,255,255,0.03)] border-b-2 border-transparent'
                    }`}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <span className="px-3 text-ui truncate max-w-[180px]">{tab.file}</span>
                    <button
                      type="button"
                      className={`shrink-0 mr-1.5 w-4 h-4 flex items-center justify-center rounded-full text-ui-sm transition-colors ${
                        isActive
                          ? 'text-muted hover:text-text hover:bg-[rgba(255,255,255,0.12)]'
                          : 'text-transparent group-hover:text-muted hover:!text-text hover:bg-[rgba(255,255,255,0.08)]'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab.id)
                      }}
                      title="Close tab"
                    >
                      ×
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Tab panels */}
        {tabs.length === 0 ? (
          <LogViewerEmptyState selected={false} />
        ) : (
          tabs.map((tab) => (
            <LogTabPanel
              key={tab.id}
              file={tab.file}
              active={tab.id === activeTabId}
              refreshKey={refreshKey}
              levelsOff={levelsOff}
              bookmarks={bookmarks}
              onToggleLineBookmark={toggleLineBookmark}
              onRemoveBookmark={removeBm}
              onRequestClearFile={() => setConfirmClearFile(true)}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          ))
        )}
      </main>

      <SettingsModal open={settingsOpen} ui={ui} onClose={() => setSettingsOpen(false)} />
      <ConfirmClearModal
        open={confirmClearFile}
        selectedFile={activeFile}
        onCancel={() => setConfirmClearFile(false)}
        onConfirm={() => void doClearFile()}
      />
    </div>
  )
}
