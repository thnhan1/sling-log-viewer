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
import {
  clearLogFile,
  clearRemoteConfig,
  getDefaults,
  getFiles,
  getSourceMode,
  postConfig,
  postRemoteConfig,
  setSourceModeApi,
  type LogFileRow,
} from './lib/api'
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
import { IconSidebarCollapse, IconSidebarExpand, IconX } from './ui/icons'

const LOG_ROOT_KEY = 'aem-log-viewer-log-root'
const SIDEBAR_OPEN_KEY = 'aem-log-viewer-sidebar-open'
const REMOTE_PREFS_KEY = 'aem-log-viewer-remote-prefs'

interface RemotePrefs {
  baseUrl: string
  username: string
  logPath: string
  logFiles: string[]
}

function readRemotePrefs(): RemotePrefs {
  try {
    const raw = localStorage.getItem(REMOTE_PREFS_KEY)
    if (!raw) return { baseUrl: '', username: '', logPath: 'logs/', logFiles: [] }
    return JSON.parse(raw) as RemotePrefs
  } catch {
    return { baseUrl: '', username: '', logPath: 'logs/', logFiles: [] }
  }
}

function saveRemotePrefs(p: RemotePrefs): void {
  try {
    localStorage.setItem(REMOTE_PREFS_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

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

  // Source mode & remote config
  const [sourceMode, setSourceModeState] = useState<'local' | 'remote'>('local')
  const [remoteConfigured, setRemoteConfigured] = useState(false)
  const [remotePrefs, setRemotePrefs] = useState<RemotePrefs>(readRemotePrefs)
  const [remotePassword, setRemotePassword] = useState('')
  const [remoteLogFileInput, setRemoteLogFileInput] = useState('')
  const [remoteConnecting, setRemoteConnecting] = useState(false)

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
    (fileName: string, raw: string) => {
      persistBookmarks((prev) => {
        if (isBookmarked(prev, fileName, raw)) {
          return prev.filter((b) => !(b.fileName === fileName && b.raw === raw))
        }
        return addBookmark(prev, fileName, raw)
      })
    },
    [persistBookmarks],
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

  const switchSourceMode = useCallback(async (mode: 'local' | 'remote') => {
    const res = await setSourceModeApi(mode)
    if (!res.ok) {
      setConfigErr(res.error ?? 'Failed to switch mode')
      return
    }
    setSourceModeState(mode)
    setConfigErr(null)
    // Refresh file list for the new mode
    const list = await getFiles()
    if (list.ok) setFiles(list.files ?? [])
    else setFiles([])
  }, [])

  const configureRemote = useCallback(async (baseUrl: string, username: string, password: string, logPath: string, logFiles: string[]) => {
    setConfigErr(null)
    setRemoteConnecting(true)
    try {
      // Strip path prefixes so only bare filenames are sent
      const normalizedFiles = logFiles.map((f) => {
        const parts = f.replace(/\\/g, '/').split('/')
        return parts[parts.length - 1]
      }).filter(Boolean)
      const res = await postRemoteConfig({ baseUrl, username, password, logPath, logFiles: normalizedFiles })
      if (!res.ok) {
        setConfigErr(res.error ?? 'Failed to connect')
        return false
      }
      // Save prefs (without password)
      const prefs: RemotePrefs = { baseUrl, username, logPath, logFiles: normalizedFiles }
      setRemotePrefs(prefs)
      saveRemotePrefs(prefs)
      setSourceModeState('remote')
      setRemoteConfigured(true)
      setRemotePassword('') // clear password from memory
      // Refresh file list
      const list = await getFiles()
      if (list.ok) setFiles(list.files ?? [])
      else setFiles([])
      return true
    } finally {
      setRemoteConnecting(false)
    }
  }, [])

  const addRemoteLogFile = useCallback((fileName: string) => {
    const f = fileName.trim()
    if (!f) return
    setRemotePrefs((prev) => {
      if (prev.logFiles.includes(f)) return prev
      const next = { ...prev, logFiles: [...prev.logFiles, f] }
      saveRemotePrefs(next)
      // Optimistic: update sidebar file list immediately
      setFiles((files) => {
        if (files.some((rf) => rf.name === f)) return files
        return [...files, { name: f, size: 0, mtimeMs: Date.now() }]
      })
      // Sync to server if already connected
      if (remoteConfigured) {
        void postRemoteConfig({
          baseUrl: prev.baseUrl,
          username: prev.username,
          password: '',
          logPath: prev.logPath,
          logFiles: next.logFiles,
        })
      }
      return next
    })
    setRemoteLogFileInput('')
  }, [remoteConfigured])

  const disconnectRemote = useCallback(() => {
    // Clear local state first (always, even if server call fails)
    setRemoteConfigured(false)
    setRemotePassword('')
    setFiles([])
    setSourceModeState('local')
    setTabs([])
    setActiveTabId(null)
    saveRemotePrefs({ baseUrl: '', username: '', logPath: 'logs/', logFiles: [] })
    setRemotePrefs({ baseUrl: '', username: '', logPath: 'logs/', logFiles: [] })
    // Fire-and-forget server clear
    void clearRemoteConfig()
  }, [])

  const removeRemoteLogFile = useCallback(
    (fileName: string) => {
      // Close any open tabs for this file
      setTabs((t) => {
        const next = t.filter((tab) => tab.id !== fileName)
        setActiveTabId((active) => {
          if (active !== fileName) return active
          if (next.length === 0) return null
          return next[0].id
        })
        return next
      })
      // Remove from files list immediately
      setFiles((prev) => prev.filter((f) => f.name !== fileName))
      // Update prefs and sync to server
      setRemotePrefs((prev) => {
        const nextFiles = prev.logFiles.filter((f) => f !== fileName)
        const next = { ...prev, logFiles: nextFiles }
        saveRemotePrefs(next)
        // Sync to server if already connected (password reused on server)
        if (remoteConfigured) {
          void postRemoteConfig({
            baseUrl: prev.baseUrl,
            username: prev.username,
            password: '',
            logPath: prev.logPath,
            logFiles: nextFiles,
          })
        }
        return next
      })
    },
    [remoteConfigured],
  )

  const bootstrapRef = useRef(false)
  useEffect(() => {
    if (bootstrapRef.current) return
    bootstrapRef.current = true
    let alive = true
    ;(async () => {
      const defaults = await getDefaults()
      if (!alive) return

      // Restore remote prefs from localStorage if not already set
      if (!remotePrefs.baseUrl && defaults.ok && defaults.envAemUrl) {
        const envFiles = (defaults.envAemLogFiles ?? []).map((f) => f.split('/').pop() || f)
        const prefs: RemotePrefs = {
          baseUrl: defaults.envAemUrl.trim(),
          username: defaults.envAemUser?.trim() ?? '',
          logPath: 'logs/',
          logFiles: envFiles.length > 0 ? envFiles : [],
        }
        setRemotePrefs(prefs)
        saveRemotePrefs(prefs)
      }

      // Check current server state
      try {
        const modeRes = await getSourceMode()
        if (alive && modeRes.ok) {
          setSourceModeState(modeRes.mode)
          setRemoteConfigured(modeRes.configured && modeRes.mode === 'remote')
          if (modeRes.remoteConfig) {
            setRemotePrefs({
              baseUrl: modeRes.remoteConfig.baseUrl,
              username: modeRes.remoteConfig.username,
              logPath: modeRes.remoteConfig.logPath || 'logs/',
              logFiles: modeRes.remoteConfig.logFiles,
            })
          }
          if (modeRes.localRootPath) {
            setRootPath(modeRes.localRootPath)
            setPathInput(modeRes.localRootPath)
          }
          // Fetch files for current mode
          if (modeRes.configured) {
            const list = await getFiles()
            if (alive && list.ok) setFiles(list.files ?? [])
          }
        }
      } catch {
        /* server may not be ready yet */
      }

      // Fallback: if no server config but we have local env/saved path, configure local
      if (!remoteConfigured) {
        let saved = ''
        try {
          saved = localStorage.getItem(LOG_ROOT_KEY) ?? ''
        } catch {
          /* ignore */
        }
        const envPath = defaults.ok && defaults.envLogRoot ? defaults.envLogRoot.trim() : ''
        const initial = saved.trim() || envPath
        if (initial) {
          const ok = await configureRoot(initial)
          if (alive && ok) {
            setSourceModeState('local')
          }
        }
      }
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

  // Derive a workspace identity key that works for both local and remote modes.
  // Local mode: keyed by rootPath. Remote mode: keyed by the AEM base URL.
  const workspaceKey = useMemo(() => {
    if (sourceMode === 'remote' && remoteConfigured) return remotePrefs.baseUrl || '__remote__'
    return rootPath
  }, [sourceMode, remoteConfigured, remotePrefs.baseUrl, rootPath])

  useEffect(() => {
    if (!workspaceKey || files.length === 0) return
    const ws = readWorkspace()

    if (workspaceHydratedRef.current !== workspaceKey) {
      workspaceHydratedRef.current = workspaceKey
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
  }, [workspaceKey, files])

  // Persist workspace
  useEffect(() => {
    const t = window.setTimeout(() => {
      writeWorkspace({
        v: 2,
        lastRootPath: workspaceKey,
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
  }, [workspaceKey, activeFile, fileSearch, levelsOff, sidebarSec, tabs])

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
        sourceMode={sourceMode}
        onSwitchSourceMode={(m) => void switchSourceMode(m)}
        remoteConfigured={remoteConfigured}
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
            <span className="text-ui-xs">
              {sidebarOpen ? <IconSidebarCollapse size={14} /> : <IconSidebarExpand size={14} />}
            </span>
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
                      <IconX size={11} />
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
              sourceMode={sourceMode}
            />
          ))
        )}
      </main>

      <SettingsModal
        open={settingsOpen}
        ui={ui}
        onClose={() => setSettingsOpen(false)}
        remotePrefs={remotePrefs}
        setRemotePrefs={setRemotePrefs}
        remotePassword={remotePassword}
        setRemotePassword={setRemotePassword}
        remoteLogFileInput={remoteLogFileInput}
        setRemoteLogFileInput={setRemoteLogFileInput}
        remoteConfigured={remoteConfigured}
        remoteConnecting={remoteConnecting}
        onConfigureRemote={configureRemote}
        onAddRemoteLogFile={addRemoteLogFile}
        onRemoveRemoteLogFile={removeRemoteLogFile}
        onDisconnectRemote={() => void disconnectRemote()}
      />
      <ConfirmClearModal
        open={confirmClearFile}
        selectedFile={activeFile}
        onCancel={() => setConfirmClearFile(false)}
        onConfirm={() => void doClearFile()}
      />
    </div>
  )
}
