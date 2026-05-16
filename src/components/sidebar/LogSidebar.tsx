import type { LogLevel } from '@shared/types'
import type { SidebarSectionsOpen } from '../../lib/workspaceSettings'
import type { LogFileRow } from '../../lib/api'
import { formatBytes, LEVELS } from '../../ui/logViewerUi'

export function LogSidebar({
  open,
  sidebarSec,
  toggleSidebarSec,
  onToggleSidebar,
  pathInput,
  setPathInput,
  onConfigureRoot,
  rootPath,
  configErr,
  fileSearch,
  setFileSearch,
  filteredFiles,
  selectedFile,
  onSelectFile,
  levelsOff,
  onToggleLevel,
  onOpenSettings,
}: {
  open: boolean
  sidebarSec: SidebarSectionsOpen
  toggleSidebarSec: (key: keyof SidebarSectionsOpen) => void
  onToggleSidebar: () => void
  pathInput: string
  setPathInput: (v: string) => void
  onConfigureRoot: (rawPath: string) => void
  rootPath: string | null
  configErr: string | null
  fileSearch: string
  setFileSearch: (v: string) => void
  filteredFiles: LogFileRow[]
  selectedFile: string | null
  onSelectFile: (name: string) => void
  levelsOff: Set<LogLevel>
  onToggleLevel: (l: LogLevel) => void
  onOpenSettings: () => void
}) {
  void onToggleSidebar
  return (
    <aside
      className={`absolute left-0 top-0 z-[60] flex h-full w-[260px] flex-col overflow-hidden glass-sidebar border-r border-border transition-[transform,opacity] duration-250 ease-out ${
        open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full min-h-0 w-[260px] flex-col">
        {/* Sidebar header */}
        <div className="shrink-0 px-3 pt-3 pb-2 border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-ui-sm font-semibold text-text uppercase tracking-wider">
              AEM Log Viewer
            </span>
          </div>
        </div>

        {/* Log Folder section */}
        <div className="shrink-0 border-b border-[rgba(255,255,255,0.05)]">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            onClick={() => toggleSidebarSec('folder')}
            aria-expanded={sidebarSec.folder}
          >
            <span className="shrink-0 text-ui-xs text-muted select-none leading-none">
              {sidebarSec.folder ? '▾' : '▸'}
            </span>
            <span className="text-ui-sm font-semibold text-text select-none">
              Log Folder
            </span>
          </button>
          {sidebarSec.folder && (
            <div className="px-3 pb-3 pt-0.5">
              <input
                className="input-macos w-full mb-2"
                placeholder="e.g. /Users/name/logs"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void onConfigureRoot(pathInput)}
              />
              <button
                type="button"
                className="btn-macos btn-macos--primary w-full"
                onClick={() => void onConfigureRoot(pathInput)}
              >
                Use folder
              </button>
              {rootPath && (
                <p className="mt-2 break-all text-ui-sm text-muted leading-snug" title={rootPath}>
                  {rootPath}
                </p>
              )}
              {configErr && <p className="mt-2 text-ui-sm text-error">{configErr}</p>}
              <p className="mt-2 text-ui-xs leading-snug text-muted">
                Set <code className="rounded-md bg-[rgba(255,255,255,0.08)] px-1 text-ui-xs">LOG_ROOT</code> in{' '}
                <code className="rounded-md bg-[rgba(255,255,255,0.08)] px-1 text-ui-xs">.env</code> as default.
              </p>
            </div>
          )}
        </div>

        {/* Log Files section */}
        <div className="shrink-0 border-b border-[rgba(255,255,255,0.05)]">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            onClick={() => toggleSidebarSec('files')}
            aria-expanded={sidebarSec.files}
          >
            <span className="shrink-0 text-ui-xs text-muted select-none leading-none">
              {sidebarSec.files ? '▾' : '▸'}
            </span>
            <span className="text-ui-sm font-semibold text-text select-none">
              Log Files
            </span>
          </button>
          {sidebarSec.files && (
            <div className="px-3 pb-3 pt-0.5">
              <input
                className="input-macos w-full mb-2"
                placeholder="Filter by name..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
              />
              <div className="max-h-[180px] overflow-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)]">
                {filteredFiles.length === 0 ? (
                  <div className="p-3 text-ui-sm text-muted text-center">No .log files found</div>
                ) : (
                  <ul className="py-0.5">
                    {filteredFiles.map((f) => (
                      <li key={f.name}>
                        <button
                          type="button"
                          className={`flex w-full flex-col items-start px-3 py-1.5 text-left transition-colors ${
                            selectedFile === f.name
                              ? 'bg-[rgba(10,132,255,0.18)] text-text'
                              : 'text-text hover:bg-[rgba(255,255,255,0.04)]'
                          }`}
                          onClick={() => onSelectFile(f.name)}
                        >
                          <span className={`text-ui ${selectedFile === f.name ? 'font-medium' : ''}`}>
                            {f.name}
                          </span>
                          <span className="text-ui-xs text-muted">{formatBytes(f.size)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Levels section */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
            <div>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                onClick={() => toggleSidebarSec('levels')}
                aria-expanded={sidebarSec.levels}
              >
                <span className="shrink-0 text-ui-xs text-muted select-none leading-none">
                  {sidebarSec.levels ? '▾' : '▸'}
                </span>
                <span className="text-ui-sm font-semibold text-text select-none">
                  Levels
                </span>
              </button>
              {sidebarSec.levels && (
                <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-0.5">
                  {LEVELS.map((l) => {
                    const on = !levelsOff.has(l)
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => onToggleLevel(l)}
                        className={`lv-lvl-chip ${
                          on ? `lv-lvl-chip--on lv-lvl-chip--${l}` : 'lv-lvl-chip--off'
                        }`}
                      >
                        {l}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom settings */}
        <div className="shrink-0 border-t border-[rgba(255,255,255,0.05)] px-3 py-2">
          <button
            type="button"
            className="btn-macos w-full justify-center"
            onClick={onOpenSettings}
          >
            Settings
          </button>
        </div>
      </div>
    </aside>
  )
}
