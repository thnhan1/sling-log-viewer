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
import { LEGACY_STORAGE_KEYS, STORAGE_KEYS, readMigrated, writeStorage } from './lib/storageKeys'
import { SettingsModal, type SettingsSection } from './components/modals/SettingsModal'
import { ConfirmClearModal } from './components/modals/ConfirmClearModal'
import { LogSidebar } from './components/sidebar/LogSidebar'
import { LogViewerEmptyState } from './components/main/LogViewerEmptyState'
import { LogTabPanel, type TabActions } from './components/main/LogTabPanel'
import {
  IconCopy,
  IconLogo,
  IconMoreHorizontal,
  IconSidebarCollapse,
  IconSidebarExpand,
  IconSync,
  IconTrash,
  IconX,
} from './ui/icons'

interface RemotePrefs {
  baseUrl: string
  username: string
  logPath: string
  logFiles: string[]
}

const EMPTY_REMOTE_PREFS: RemotePrefs = {
  baseUrl: '',
  username: '',
  logPath: 'logs/',
  logFiles: [],
}

const DEFAULT_SIDEBAR_SECTIONS: SidebarSectionsOpen = {
  folder: true,
  files: true,
  levels: true,
}

function readRemotePrefs(): RemotePrefs {
  try {
    const raw = readMigrated(STORAGE_KEYS.remotePrefs, LEGACY_STORAGE_KEYS.remotePrefs)
    if (!raw) return { ...EMPTY_REMOTE_PREFS }
    return JSON.parse(raw) as RemotePrefs
  } catch {
    return { ...EMPTY_REMOTE_PREFS }
  }
}

function saveRemotePrefs(p: RemotePrefs): void {
  writeStorage(STORAGE_KEYS.remotePrefs, JSON.stringify(p))
}

function readSidebarOpen(): boolean {
  try {
    return readMigrated(STORAGE_KEYS.sidebarOpen, LEGACY_STORAGE_KEYS.sidebarOpen) !== '0'
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

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('appearance')
  const [confirmClearFile, setConfirmClearFile] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const tabActionsRef = useRef<Record<string, TabActions>>({})

  const registerTabActions = useCallback((file: string, actions: TabActions | null) => {
    if (actions) tabActionsRef.current[file] = actions
    else delete tabActionsRef.current[file]
  }, [])

  const openSettings = useCallback((section: SettingsSection = 'appearance') => {
    setSettingsSection(section)
    setSettingsOpen(true)
  }, [])

  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  // Tab operations
  const openFile = useCallback((file: string) => {
    setActiveTabId(file)
    setTabs((t) => {
      if (t.some((tab) => tab.id === file)) return t
      return [...t, { id: file, file }]
    })
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs((t) => {
      const idx = t.findIndex((tab) => tab.id === id)
      if (idx < 0) return t
      const next = [...t]
      next.splice(idx, 1)
      setActiveTabId((active) => {
        if (active !== id) return active
        if (next.length === 0) return null
        const newIdx = Math.min(idx, next.length - 1)
        return next[newIdx].id
      })
      return next
    })
  }, [])

  const activateRelativeTab = useCallback((delta: number) => {
    setTabs((t) => {
      if (t.length === 0) return t
      const idx = t.findIndex((tab) => tab.id === activeTabId)
      const next = (idx + delta + t.length) % t.length
      setActiveTabId(t[next].id)
      return t
    })
  }, [activeTabId])

  const activeFile = useMemo(() => {
    if (!activeTabId) return null
    const tab = tabs.find((t) => t.id === activeTabId)
    return tab ? tab.file : null
  }, [tabs, activeTabId])

  const activeActions = activeFile ? tabActionsRef.current[activeFile] : undefined

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
    writeStorage(STORAGE_KEYS.logRoot, resolved)
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
    const list = await getFiles()
    if (list.ok) setFiles(list.files ?? [])
    else setFiles([])
  }, [])

  const configureRemote = useCallback(async (baseUrl: string, username: string, password: string, logPath: string, logFiles: string[]) => {
    setConfigErr(null)
    setRemoteConnecting(true)
    try {
      const normalizedFiles = logFiles.map((f) => {
        const parts = f.replace(/\\/g, '/').split('/')
        return parts[parts.length - 1]
      }).filter(Boolean)
      const res = await postRemoteConfig({ baseUrl, username, password, logPath, logFiles: normalizedFiles })
      if (!res.ok) {
        setConfigErr(res.error ?? 'Failed to connect')
        return false
      }
      const prefs: RemotePrefs = { baseUrl, username, logPath, logFiles: normalizedFiles }
      setRemotePrefs(prefs)
      saveRemotePrefs(prefs)
      setSourceModeState('remote')
      setRemoteConfigured(true)
      setRemotePassword('')
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
      setFiles((prevFiles) => {
        if (prevFiles.some((rf) => rf.name === f)) return prevFiles
        return [...prevFiles, { name: f, size: 0, mtimeMs: Date.now() }]
      })
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
    setRemoteConfigured(false)
    setRemotePassword('')
    setFiles([])
    setSourceModeState('local')
    setTabs([])
    setActiveTabId(null)
    saveRemotePrefs({ ...EMPTY_REMOTE_PREFS })
    setRemotePrefs({ ...EMPTY_REMOTE_PREFS })
    void clearRemoteConfig()
  }, [])

  const removeRemoteLogFile = useCallback(
    (fileName: string) => {
      setTabs((t) => {
        const next = t.filter((tab) => tab.id !== fileName)
        setActiveTabId((active) => {
          if (active !== fileName) return active
          if (next.length === 0) return null
          return next[0].id
        })
        return next
      })
      setFiles((prev) => prev.filter((f) => f.name !== fileName))
      setRemotePrefs((prev) => {
        const nextFiles = prev.logFiles.filter((f) => f !== fileName)
        const next = { ...prev, logFiles: nextFiles }
        saveRemotePrefs(next)
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

  useEffect(() => {
    let alive = true
    ;(async () => {
      const defaults = await getDefaults()
      if (!alive) return

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
            writeStorage(STORAGE_KEYS.logRoot, modeRes.localRootPath)
          }
          if (modeRes.configured) {
            const list = await getFiles()
            if (alive && list.ok) setFiles(list.files ?? [])
          }
        }
      } catch {
        /* server may not be ready yet */
      }

      if (!remoteConfigured) {
        let saved = ''
        try {
          saved = readMigrated(STORAGE_KEYS.logRoot, LEGACY_STORAGE_KEYS.logRoot) ?? ''
        } catch {
          /* ignore */
        }
        const envPath = defaults.ok && defaults.envLogRoot ? defaults.envLogRoot.trim() : ''
        const initial = saved.trim() || envPath
        if (initial) {
          const ok = await configureRoot(initial)
          if (alive && ok) setSourceModeState('local')
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
      writeStorage(STORAGE_KEYS.sidebarOpen, next ? '1' : '0')
      return next
    })
  }, [])

  // Restore workspace: tabs and active tab
  const workspaceHydratedRef = useRef<string | null>(null)
  const tabsRestoredRef = useRef(false)

  const workspaceKey = useMemo(() => {
    if (sourceMode === 'remote' && remoteConfigured) return remotePrefs.baseUrl || '__remote__'
    return rootPath
  }, [sourceMode, remoteConfigured, remotePrefs.baseUrl, rootPath])

  useEffect(() => {
    if (!workspaceKey || files.length === 0) return
    const wsKey = workspaceKey ?? '__default__'
    const ws = readWorkspace(wsKey)

    if (workspaceHydratedRef.current !== workspaceKey) {
      workspaceHydratedRef.current = workspaceKey
      tabsRestoredRef.current = false
      setFileSearch(ws.fileSearch)
      setLevelsOff(new Set(ws.levelsOff))

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
        sidebarSections: DEFAULT_SIDEBAR_SECTIONS,
        openTabs: tabs.map((tab) => tab.file),
        activeTabFile: activeFile,
      }, workspaceKey ?? '__default__')
    }, 400)
    return () => clearTimeout(t)
  }, [workspaceKey, activeFile, fileSearch, levelsOff, tabs])

  const filteredFiles = useMemo(() => {
    const q = fileSearch.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => f.name.toLowerCase().includes(q))
  }, [files, fileSearch])

  const toggleLevel = useCallback((l: LogLevel) => {
    setLevelsOff((prev) => {
      const next = new Set(prev)
      if (next.has(l)) next.delete(l)
      else next.add(l)
      return next
    })
  }, [])

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

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        document.getElementById('log-search')?.focus()
        return
      }
      if (mod && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        if (activeFile) tabActionsRef.current[activeFile]?.reload()
        return
      }
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault()
        activateRelativeTab(1)
        return
      }
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault()
        activateRelativeTab(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleSidebar, activeFile, activateRelativeTab])

  const doClearFile = async () => {
    if (!activeFile) return
    const res = await clearLogFile(activeFile)
    if (!res.ok) {
      setConfigErr(res.error ?? 'Clear file failed')
      return
    }
    setConfirmClearFile(false)
    const list = await getFiles()
    if (list.ok) setFiles(list.files ?? [])
    setRefreshKey((k) => k + 1)
  }

  const copyActivePath = useCallback(() => {
    if (!activeFile) return
    void navigator.clipboard?.writeText(activeFile)
    setMenuOpen(false)
  }, [activeFile])

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-bg">
      <LogSidebar
        open={sidebarOpen}
        sourceMode={sourceMode}
        onSwitchSourceMode={(m) => void switchSourceMode(m)}
        remoteConfigured={remoteConfigured}
        remoteBaseUrl={remotePrefs.baseUrl}
        rootPath={rootPath}
        fileSearch={fileSearch}
        setFileSearch={setFileSearch}
        filteredFiles={filteredFiles}
        selectedFile={activeFile}
        onSelectFile={openFile}
        onOpenSettings={openSettings}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="topbar">
          <div className="flex items-center gap-0.5">
            {!sidebarOpen && (
              <div className="flex items-center gap-1.5 px-1.5">
                <IconLogo size={15} className="text-text" />
                <span className="text-[12px] font-medium tracking-[-0.01em] text-text">
                  slingtail
                </span>
              </div>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={toggleSidebar}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <IconSidebarCollapse size={15} /> : <IconSidebarExpand size={15} />}
            </button>
          </div>

          <div
            className="flex h-full min-w-0 flex-1 items-center overflow-x-auto"
            role="tablist"
            aria-label="Open log files"
          >
            {tabs.length === 0 ? (
              <span className="px-2 text-[12px] text-tertiary">No file open</span>
            ) : (
              tabs.map((tab) => {
                const isActive = tab.id === activeTabId
                return (
                  <div
                    key={tab.id}
                    className={`tab ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveTabId(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setActiveTabId(tab.id)
                      }
                    }}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    title={tab.file}
                  >
                    <span className="truncate">{tab.file}</span>
                    <button
                      type="button"
                      className="tab-close"
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab.id)
                      }}
                      title="Close tab"
                      aria-label={`Close ${tab.file}`}
                    >
                      <IconX size={11} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="icon-btn"
              disabled={!activeFile}
              onClick={() => activeActions?.reload()}
              title="Reload active log"
              aria-label="Reload active log"
            >
              <IconSync size={15} />
            </button>
            <div ref={menuRef} className="relative">
              <button
                type="button"
                className={`icon-btn ${menuOpen ? 'is-active' : ''}`}
                onClick={() => setMenuOpen((o) => !o)}
                title="More actions"
                aria-label="More actions"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <IconMoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="popover absolute right-0 top-full z-50 mt-1 w-[196px] p-1" role="menu">
                  <button
                    type="button"
                    className="menu-item"
                    role="menuitem"
                    disabled={!activeActions}
                    onClick={() => {
                      activeActions?.clearView()
                      setMenuOpen(false)
                    }}
                  >
                    Clear view
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    role="menuitem"
                    disabled={!activeFile}
                    onClick={copyActivePath}
                  >
                    <IconCopy size={13} />
                    Copy path
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    role="menuitem"
                    disabled={!activeActions}
                    onClick={() => {
                      activeActions?.reload()
                      setMenuOpen(false)
                    }}
                  >
                    <IconSync size={13} />
                    Reload tail
                  </button>
                  {sourceMode !== 'remote' && (
                    <>
                      <div className="menu-separator" />
                      <button
                        type="button"
                        className="menu-item is-danger"
                        role="menuitem"
                        disabled={!activeFile}
                        onClick={() => {
                          setMenuOpen(false)
                          setConfirmClearFile(true)
                        }}
                      >
                        <IconTrash size={13} />
                        Clear file…
                      </button>
                    </>
                  )}
                  <div className="menu-separator" />
                  <button
                    type="button"
                    className="menu-item"
                    role="menuitem"
                    disabled={!activeTabId}
                    onClick={() => {
                      if (activeTabId) closeTab(activeTabId)
                      setMenuOpen(false)
                    }}
                  >
                    <IconX size={13} />
                    Close tab
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {tabs.length === 0 ? (
          <LogViewerEmptyState
            onChooseFolder={() => openSettings('connection')}
            onConnect={() => openSettings('connection')}
          />
        ) : (
          tabs.map((tab) => (
            <LogTabPanel
              key={tab.id}
              file={tab.file}
              active={tab.id === activeTabId}
              refreshKey={refreshKey}
              levelsOff={levelsOff}
              onToggleLevel={toggleLevel}
              bookmarks={bookmarks}
              onToggleLineBookmark={toggleLineBookmark}
              onRemoveBookmark={removeBm}
              onRegisterActions={registerTabActions}
            />
          ))
        )}
      </main>

      <SettingsModal
        open={settingsOpen}
        ui={ui}
        onClose={closeSettings}
        initialSection={settingsSection}
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
        sourceMode={sourceMode}
        onSwitchSourceMode={(m) => void switchSourceMode(m)}
        localPathInput={pathInput}
        setLocalPathInput={setPathInput}
        onConfigureRoot={(p) => void configureRoot(p)}
        rootPath={rootPath}
        configErr={configErr}
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
