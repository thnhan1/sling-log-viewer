import { useEffect, useRef, useState } from 'react'
import type { LogFileRow } from '../../lib/api'
import { formatBytes } from '../../ui/logViewerUi'
import {
  IconChevronDown,
  IconGear,
  IconLogo,
  IconSearch,
} from '../../ui/icons'
import type { SettingsSection } from '../modals/SettingsModal'

export function LogSidebar({
  open,
  sourceMode,
  onSwitchSourceMode,
  remoteConfigured,
  remoteBaseUrl,
  rootPath,
  fileSearch,
  setFileSearch,
  filteredFiles,
  selectedFile,
  onSelectFile,
  onOpenSettings,
}: {
  open: boolean
  sourceMode: 'local' | 'remote'
  onSwitchSourceMode: (mode: 'local' | 'remote') => void
  remoteConfigured: boolean
  remoteBaseUrl: string
  rootPath: string | null
  fileSearch: string
  setFileSearch: (v: string) => void
  filteredFiles: LogFileRow[]
  selectedFile: string | null
  onSelectFile: (name: string) => void
  onOpenSettings: (section?: SettingsSection) => void
}) {
  const asideRef = useRef<HTMLElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)
  const [sourceOpen, setSourceOpen] = useState(false)

  useEffect(() => {
    const el = asideRef.current
    if (!el) return
    if (open) el.removeAttribute('inert')
    else el.setAttribute('inert', '')
  }, [open])

  useEffect(() => {
    if (!sourceOpen) return
    const onDown = (e: MouseEvent) => {
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) {
        setSourceOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [sourceOpen])

  const sourceLabel = sourceMode === 'local' ? 'Local' : 'Remote'
  const sourceDetail =
    sourceMode === 'local'
      ? rootPath || 'No folder selected'
      : remoteConfigured
        ? remoteBaseUrl || 'Connected'
        : 'Not connected'
  const sourceConnected = sourceMode === 'local' ? Boolean(rootPath) : remoteConfigured

  return (
    <aside
      ref={asideRef}
      className={`app-sidebar ${open ? 'w-[248px]' : 'w-0'}`}
      aria-hidden={!open}
      aria-label="Log sources"
    >
      <div className="flex h-full w-[248px] flex-col border-r border-border bg-surface">
        {/* Brand */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
          <IconLogo size={18} className="text-text" />
          <span className="text-[13px] font-medium tracking-[-0.01em] text-text">
            slingtail
          </span>
        </div>

        {/* Source */}
        <div ref={sourceRef} className="relative shrink-0 px-2 pt-2">
          <button
            type="button"
            className="source-row"
            onClick={() => setSourceOpen((v) => !v)}
            aria-expanded={sourceOpen}
            aria-haspopup="menu"
          >
            <span className={`status-dot ${sourceConnected ? 'is-on' : ''}`} />
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-text">{sourceLabel}</span>
              <span className="block truncate text-[11px] text-tertiary">{sourceDetail}</span>
            </span>
            <IconChevronDown size={14} className="shrink-0 text-tertiary" />
          </button>

          {sourceOpen && (
            <div className="popover absolute left-2 right-2 top-full z-50 mt-1 p-1" role="menu">
              <button
                type="button"
                className={`menu-item ${sourceMode === 'local' ? 'is-active' : ''}`}
                role="menuitemradio"
                aria-checked={sourceMode === 'local'}
                onClick={() => {
                  onSwitchSourceMode('local')
                  setSourceOpen(false)
                }}
              >
                Local files
              </button>
              <button
                type="button"
                className={`menu-item ${sourceMode === 'remote' ? 'is-active' : ''}`}
                role="menuitemradio"
                aria-checked={sourceMode === 'remote'}
                onClick={() => {
                  onSwitchSourceMode('remote')
                  setSourceOpen(false)
                }}
              >
                Remote AEM
              </button>
              <div className="menu-separator" />
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  onOpenSettings('connection')
                  setSourceOpen(false)
                }}
              >
                Configure connection…
              </button>
            </div>
          )}
        </div>

        {/* Files */}
        <div className="flex min-h-0 flex-1 flex-col px-2 pt-3">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="label">Files</span>
            {filteredFiles.length > 0 && (
              <span className="text-[10px] tabular-nums text-tertiary">{filteredFiles.length}</span>
            )}
          </div>
          <div className="px-2 pb-2">
            <div className="relative">
              <IconSearch
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary"
              />
              <input
                className="field h-7 pl-8"
                placeholder="Filter files…"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                aria-label="Filter log files"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-2">
            {filteredFiles.length === 0 ? (
              <div className="px-2 py-8 text-center">
                <p className="text-[11px] leading-relaxed text-tertiary">
                  {sourceMode === 'remote' && !remoteConfigured
                    ? 'Connect to an AEM instance to list logs.'
                    : sourceMode === 'remote'
                      ? 'No log files configured.'
                      : rootPath
                        ? 'No .log files found in this folder.'
                        : 'Choose a folder to list log files.'}
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm mt-3"
                  onClick={() => onOpenSettings('connection')}
                >
                  {sourceMode === 'remote' ? 'Connect to AEM' : 'Choose folder'}
                </button>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {filteredFiles.map((f) => (
                  <li key={f.name}>
                    <button
                      type="button"
                      className={`file-row ${selectedFile === f.name ? 'is-active' : ''}`}
                      onClick={() => onSelectFile(f.name)}
                      title={f.name}
                    >
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      <span className="shrink-0 text-[10px] tabular-nums text-tertiary">
                        {f.size > 0 ? formatBytes(f.size) : sourceMode === 'remote' ? 'remote' : '0 B'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-2">
          <button
            type="button"
            className="sidebar-action"
            onClick={() => onOpenSettings('appearance')}
          >
            <IconGear size={15} />
            Settings
          </button>
        </div>
      </div>
    </aside>
  )
}
