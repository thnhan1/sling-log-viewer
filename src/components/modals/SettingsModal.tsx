import { type Dispatch, type ReactNode, type SetStateAction, useEffect, useRef, useState } from 'react'
import type { useUiSettings } from '../../hooks/useUiSettings'
import { FONT_LOG_STACKS, FONT_STACK_CUSTOM_ID, FONT_UI_STACKS } from '../../hooks/useUiSettings'
import { fontStackSelectValue } from '../../ui/logViewerUi'
import { getAllThemes } from '../../ui/themes'
import { APP_DESCRIPTION, APP_NAME, APP_REPO, APP_VERSION } from '../../lib/appInfo'
import {
  IconDotFill,
  IconInfo,
  IconKeyboard,
  IconLogo,
  IconPaintbrush,
  IconPlus,
  IconPlug,
  IconTrash,
  IconX,
} from '../../ui/icons'

export type SettingsSection = 'appearance' | 'connection' | 'keyboard' | 'about'

export type UiSettingsHandle = ReturnType<typeof useUiSettings>

interface RemotePrefs {
  baseUrl: string
  username: string
  logPath: string
  logFiles: string[]
}

interface Props {
  open: boolean
  ui: UiSettingsHandle
  onClose: () => void
  initialSection?: SettingsSection
  remotePrefs: RemotePrefs
  setRemotePrefs: Dispatch<SetStateAction<RemotePrefs>>
  remotePassword: string
  setRemotePassword: (v: string) => void
  remoteLogFileInput: string
  setRemoteLogFileInput: (v: string) => void
  remoteConfigured: boolean
  remoteConnecting: boolean
  onConfigureRemote: (baseUrl: string, username: string, password: string, logPath: string, logFiles: string[]) => void
  onAddRemoteLogFile: (name: string) => void
  onRemoveRemoteLogFile: (name: string) => void
  onDisconnectRemote: () => void
  sourceMode: 'local' | 'remote'
  onSwitchSourceMode: (mode: 'local' | 'remote') => void
  localPathInput: string
  setLocalPathInput: (v: string) => void
  onConfigureRoot: (path: string) => void
  rootPath: string | null
  configErr: string | null
}

export function SettingsModal(props: Props) {
  const {
    open, ui, onClose, initialSection = 'appearance',
    remotePrefs, setRemotePrefs,
    remotePassword, setRemotePassword,
    remoteLogFileInput, setRemoteLogFileInput,
    remoteConfigured, remoteConnecting,
    onConfigureRemote, onAddRemoteLogFile, onRemoveRemoteLogFile,
    onDisconnectRemote,
    sourceMode, onSwitchSourceMode,
    localPathInput, setLocalPathInput, onConfigureRoot,
    rootPath, configErr,
  } = props

  const [section, setSection] = useState<SettingsSection>(initialSection)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setSection(initialSection)
  }, [open, initialSection])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const el = dialogRef.current

    const focusable = () =>
      el?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []

    const first = focusable()[0]
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="modal-panel settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation */}
        <aside className="settings-nav">
          <div className="flex h-12 items-center border-b border-border px-4">
            <h2 id="settings-title" className="text-[13px] font-medium text-text">
              Settings
            </h2>
          </div>
          <nav className="flex-1 overflow-y-auto py-2" aria-label="Settings sections">
            <button
              type="button"
              className={`settings-nav-item ${section === 'appearance' ? 'is-active' : ''}`}
              onClick={() => setSection('appearance')}
              aria-current={section === 'appearance' ? 'page' : undefined}
            >
              <IconPaintbrush size={15} />
              <span>Appearance</span>
            </button>
            <button
              type="button"
              className={`settings-nav-item ${section === 'connection' ? 'is-active' : ''}`}
              onClick={() => setSection('connection')}
              aria-current={section === 'connection' ? 'page' : undefined}
            >
              <IconPlug size={15} />
              <span>Connection</span>
              {remoteConfigured && (
                <span className="ml-auto">
                  <IconDotFill size={8} className="text-accent" />
                </span>
              )}
            </button>
            <button
              type="button"
              className={`settings-nav-item ${section === 'keyboard' ? 'is-active' : ''}`}
              onClick={() => setSection('keyboard')}
              aria-current={section === 'keyboard' ? 'page' : undefined}
            >
              <IconKeyboard size={15} />
              <span>Keyboard</span>
            </button>
            <button
              type="button"
              className={`settings-nav-item ${section === 'about' ? 'is-active' : ''}`}
              onClick={() => setSection('about')}
              aria-current={section === 'about' ? 'page' : undefined}
            >
              <IconInfo size={15} />
              <span>About</span>
            </button>
          </nav>
          <div className="px-4 py-3 text-[10px] tabular-nums text-tertiary">
            v{APP_VERSION}
          </div>
        </aside>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-5">
            <span className="text-[12px] text-muted">Preferences</span>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close settings"
            >
              <IconX size={15} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {section === 'appearance' && <Appearance ui={ui} />}

            {section === 'connection' && (
              <Connection
                sourceMode={sourceMode}
                onSwitchSourceMode={onSwitchSourceMode}
                localPathInput={localPathInput}
                setLocalPathInput={setLocalPathInput}
                onConfigureRoot={onConfigureRoot}
                rootPath={rootPath}
                configErr={configErr}
                remotePrefs={remotePrefs}
                setRemotePrefs={setRemotePrefs}
                remotePassword={remotePassword}
                setRemotePassword={setRemotePassword}
                remoteLogFileInput={remoteLogFileInput}
                setRemoteLogFileInput={setRemoteLogFileInput}
                remoteConfigured={remoteConfigured}
                remoteConnecting={remoteConnecting}
                onConfigureRemote={onConfigureRemote}
                onAddRemoteLogFile={onAddRemoteLogFile}
                onRemoveRemoteLogFile={onRemoveRemoteLogFile}
                onDisconnectRemote={onDisconnectRemote}
              />
            )}

            {section === 'keyboard' && <Keyboard />}
            {section === 'about' && <About />}
          </div>

          <footer className="flex h-12 shrink-0 items-center justify-end border-t border-border px-4">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}

// ── Sections ──

function Appearance({ ui }: { ui: UiSettingsHandle }) {
  return (
    <section aria-labelledby="appearance-title">
      <SectionTitle
        id="appearance-title"
        title="Appearance"
        description="A quiet, monochrome workspace. Color is reserved for log severity."
      />

      <div className="mt-4">
        <span className="label">Theme</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {getAllThemes().map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-card ${ui.theme === t.id ? 'is-active' : ''}`}
              onClick={() => ui.setTheme(t.id)}
              aria-pressed={ui.theme === t.id}
            >
              <div className="theme-preview">
                <div
                  className="flex w-full flex-col justify-between p-1.5"
                  style={{ background: t.preview.bg }}
                >
                  <span
                    className="h-1 w-8 rounded-full"
                    style={{ background: t.preview.accent }}
                  />
                  <span
                    className="h-1 w-10 rounded-full"
                    style={{ background: t.preview.text, opacity: 0.35 }}
                  />
                </div>
              </div>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-medium text-text">{t.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {t.preview.swatches.map((c) => (
                    <span
                      key={c}
                      className="h-2 w-2 rounded-full border border-black/20"
                      style={{ background: c }}
                    />
                  ))}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <span className="label">Type</span>
        <div className="mt-1">
          <SettingsRow label="UI font size" hint={`${ui.fontUiPx}px`}>
            <Stepper
              value={ui.fontUiPx}
              min={ui.fontUiPxMin}
              max={ui.fontUiPxMax}
              onStep={ui.bumpFontUi}
            />
          </SettingsRow>
          <SettingsRow label="Log font size" hint={`${ui.fontLogPx}px`}>
            <Stepper
              value={ui.fontLogPx}
              min={ui.fontLogPxMin}
              max={ui.fontLogPxMax}
              onStep={ui.bumpFontLog}
            />
          </SettingsRow>
          <SettingsRow label="UI font">
            <FontSelect
              value={fontStackSelectValue(ui.fontFamilyUi, FONT_UI_STACKS, FONT_STACK_CUSTOM_ID)}
              stacks={FONT_UI_STACKS}
              customId={FONT_STACK_CUSTOM_ID}
              customValue={ui.fontFamilyUi}
              onChange={(id) => {
                if (id === FONT_STACK_CUSTOM_ID) {
                  ui.setFontFamilyUi(ui.fontFamilyUi.trim() || '"Inter Variable", Inter, sans-serif')
                  return
                }
                const opt = FONT_UI_STACKS.find((o) => o.id === id)
                if (opt) ui.setFontFamilyUi(opt.stack)
              }}
              onCustomChange={(v) => ui.setFontFamilyUi(v)}
            />
          </SettingsRow>
          <SettingsRow label="Log font">
            <FontSelect
              value={fontStackSelectValue(ui.fontFamilyLog, FONT_LOG_STACKS, FONT_STACK_CUSTOM_ID)}
              stacks={FONT_LOG_STACKS}
              customId={FONT_STACK_CUSTOM_ID}
              customValue={ui.fontFamilyLog}
              onChange={(id) => {
                if (id === FONT_STACK_CUSTOM_ID) {
                  ui.setFontFamilyLog(ui.fontFamilyLog.trim() || '"JetBrains Mono", monospace')
                  return
                }
                const opt = FONT_LOG_STACKS.find((o) => o.id === id)
                if (opt) ui.setFontFamilyLog(opt.stack)
              }}
              onCustomChange={(v) => ui.setFontFamilyLog(v)}
            />
          </SettingsRow>
        </div>
      </div>
    </section>
  )
}

function Connection(props: {
  sourceMode: 'local' | 'remote'
  onSwitchSourceMode: (mode: 'local' | 'remote') => void
  localPathInput: string
  setLocalPathInput: (v: string) => void
  onConfigureRoot: (path: string) => void
  rootPath: string | null
  configErr: string | null
  remotePrefs: RemotePrefs
  setRemotePrefs: Dispatch<SetStateAction<RemotePrefs>>
  remotePassword: string
  setRemotePassword: (v: string) => void
  remoteLogFileInput: string
  setRemoteLogFileInput: (v: string) => void
  remoteConfigured: boolean
  remoteConnecting: boolean
  onConfigureRemote: (baseUrl: string, username: string, password: string, logPath: string, logFiles: string[]) => void
  onAddRemoteLogFile: (name: string) => void
  onRemoveRemoteLogFile: (name: string) => void
  onDisconnectRemote: () => void
}) {
  const {
    sourceMode, onSwitchSourceMode,
    localPathInput, setLocalPathInput, onConfigureRoot, rootPath, configErr,
    remotePrefs, setRemotePrefs,
    remotePassword, setRemotePassword,
    remoteLogFileInput, setRemoteLogFileInput,
    remoteConfigured, remoteConnecting,
    onConfigureRemote, onAddRemoteLogFile, onRemoveRemoteLogFile, onDisconnectRemote,
  } = props

  return (
    <section aria-labelledby="connection-title">
      <SectionTitle
        id="connection-title"
        title="Connection"
        description="Read local files or stream from a remote AEM instance. Remote access is read-only."
      />

      <div className="mt-4 flex items-center justify-between">
        <span className="label">Source</span>
        <div className="segmented" role="group" aria-label="Log source">
          <button
            type="button"
            className={sourceMode === 'local' ? 'is-active' : ''}
            onClick={() => onSwitchSourceMode('local')}
            aria-pressed={sourceMode === 'local'}
          >
            Local
          </button>
          <button
            type="button"
            className={sourceMode === 'remote' ? 'is-active' : ''}
            onClick={() => onSwitchSourceMode('remote')}
            aria-pressed={sourceMode === 'remote'}
          >
            Remote
          </button>
        </div>
      </div>

      {sourceMode === 'local' ? (
        <div className="mt-5 space-y-3">
          <div>
            <label className="label mb-1.5 block" htmlFor="local-folder">
              Log folder
            </label>
            <div className="flex gap-2">
              <input
                id="local-folder"
                className="field flex-1"
                placeholder="e.g. C:\aem\crx-quickstart\logs"
                value={localPathInput}
                onChange={(e) => setLocalPathInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfigureRoot(localPathInput)
                }}
                spellCheck={false}
              />
              <button
                type="button"
                className="btn btn-primary shrink-0"
                onClick={() => onConfigureRoot(localPathInput)}
              >
                Use folder
              </button>
            </div>
            {rootPath && (
              <p className="mt-2 break-all text-[11px] leading-relaxed text-tertiary">{rootPath}</p>
            )}
            {configErr && <p className="mt-2 text-[11px] text-danger">{configErr}</p>}
          </div>
          <p className="text-[11px] leading-relaxed text-tertiary">
            Set <code className="rounded bg-surface-hover px-1 font-mono">LOG_ROOT</code> in{' '}
            <code className="rounded bg-surface-hover px-1 font-mono">.env</code> for a default folder.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div>
            <label className="label mb-1.5 block" htmlFor="remote-url">
              AEM base URL
            </label>
            <input
              id="remote-url"
              className="field"
              placeholder="https://aem-uat.example.com"
              value={remotePrefs.baseUrl}
              onChange={(e) => setRemotePrefs((p) => ({ ...p, baseUrl: e.target.value }))}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1.5 block" htmlFor="remote-user">
                Username
              </label>
              <input
                id="remote-user"
                className="field"
                placeholder="your-username"
                value={remotePrefs.username}
                onChange={(e) => setRemotePrefs((p) => ({ ...p, username: e.target.value }))}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="label mb-1.5 block" htmlFor="remote-pass">
                Password {remoteConfigured && <span className="text-accent">(saved)</span>}
              </label>
              <input
                id="remote-pass"
                className="field"
                type="password"
                placeholder={remoteConfigured ? '••••••••' : 'your-password'}
                value={remotePassword}
                onChange={(e) => setRemotePassword(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="label mb-1.5 block" htmlFor="remote-path">
              Log path
            </label>
            <div className="flex items-center gap-2">
              <input
                id="remote-path"
                className="field flex-1"
                placeholder="logs/"
                value={remotePrefs.logPath}
                onChange={(e) => setRemotePrefs((p) => ({ ...p, logPath: e.target.value }))}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="shrink-0 text-[11px] text-tertiary">+ filename</span>
            </div>
          </div>

          <div>
            <label className="label mb-1.5 block">Tracked log files</label>
            {remotePrefs.logFiles.length > 0 && (
              <div className="mb-2 max-h-[110px] divide-y divide-border overflow-y-auto rounded-lg border border-border bg-surface-raised">
                {remotePrefs.logFiles.map((f) => (
                  <div key={f} className="flex items-center justify-between px-3 py-1.5 text-[12px] text-text">
                    <span className="truncate font-mono">{f}</span>
                    <button
                      type="button"
                      className="icon-btn ml-2 h-6 w-6 shrink-0"
                      onClick={() => onRemoveRemoteLogFile(f)}
                      aria-label={`Remove ${f}`}
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="field flex-1"
                placeholder="error.log"
                value={remoteLogFileInput}
                onChange={(e) => setRemoteLogFileInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onAddRemoteLogFile(remoteLogFileInput)
                }}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="icon-btn shrink-0 border border-border"
                onClick={() => onAddRemoteLogFile(remoteLogFileInput)}
                title="Add log file"
                aria-label="Add log file"
              >
                <IconPlus size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              className="btn btn-primary"
              disabled={remoteConnecting || !remotePrefs.baseUrl || !remotePrefs.username}
              onClick={() =>
                onConfigureRemote(
                  remotePrefs.baseUrl,
                  remotePrefs.username,
                  remotePassword,
                  remotePrefs.logPath,
                  remotePrefs.logFiles,
                )
              }
            >
              {remoteConnecting ? 'Connecting…' : remoteConfigured ? 'Update & reconnect' : 'Connect'}
            </button>
            {remoteConfigured && (
              <>
                <span className="flex items-center gap-1.5 text-[11px] text-accent">
                  <IconDotFill size={7} /> Connected
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onDisconnectRemote}
                  title="Remove credentials and switch to local mode"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-tertiary">
            Uses AEM&apos;s{' '}
            <code className="rounded bg-surface-hover px-1 font-mono">
              /system/console/slinglog/tailer.txt
            </code>{' '}
            endpoint. Credentials live in server memory only and are never written to disk or the
            browser.
          </p>
        </div>
      )}
    </section>
  )
}

function Keyboard() {
  return (
    <section aria-labelledby="keyboard-title">
      <SectionTitle
        id="keyboard-title"
        title="Keyboard"
        description="Everything important is reachable without leaving the keyboard."
      />
      <div className="mt-4">
        <KbdRow keys={['Ctrl', 'B']} label="Toggle sidebar" />
        <KbdRow keys={['Ctrl', 'F']} label="Focus search" />
        <KbdRow keys={['Enter']} label="Next search match" />
        <KbdRow keys={['Shift', 'Enter']} label="Previous search match" />
        <KbdRow keys={['Ctrl', 'R']} label="Reload active log" />
        <KbdRow keys={['Alt', '↑ / ↓']} label="Switch tabs" />
        <KbdRow keys={['Escape']} label="Close panel or dialog" />
      </div>
    </section>
  )
}

function About() {
  return (
    <section aria-labelledby="about-title">
      <SectionTitle id="about-title" title="About" description={APP_DESCRIPTION} />
      <div className="mt-6 flex items-start gap-4 rounded-xl border border-border bg-surface-raised p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
          <IconLogo size={22} className="text-text" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-text">{APP_NAME}</p>
          <p className="mt-0.5 text-[11px] tabular-nums text-tertiary">Version {APP_VERSION}</p>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">{APP_DESCRIPTION}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            <a
              href={APP_REPO}
              target="_blank"
              rel="noreferrer"
              className="text-text underline decoration-border underline-offset-2 hover:decoration-text"
            >
              View source on GitHub
            </a>
            {' · '}MIT License
          </p>
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-tertiary">
        Created by Nhan with love.
      </p>
    </section>
  )
}

// ── Sub-components ──

function SectionTitle({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div>
      <h3 id={id} className="text-[15px] font-medium tracking-[-0.01em] text-text">
        {title}
      </h3>
      <p className="mt-1 max-w-[46ch] text-[12px] leading-relaxed text-muted">{description}</p>
    </div>
  )
}

function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="settings-row">
      <div className="min-w-0">
        <span className="text-[12px] text-text">{label}</span>
        {hint && <span className="ml-2 text-[11px] tabular-nums text-tertiary">{hint}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Stepper({
  value,
  min,
  max,
  onStep,
}: {
  value: number
  min: number
  max: number
  onStep: (d: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="icon-btn border border-border"
        onClick={() => onStep(-1)}
        disabled={value <= min}
        aria-label="Decrease"
      >
        <span className="text-[13px] font-medium">−</span>
      </button>
      <span className="w-9 text-center text-[12px] tabular-nums text-text">{value}</span>
      <button
        type="button"
        className="icon-btn border border-border"
        onClick={() => onStep(1)}
        disabled={value >= max}
        aria-label="Increase"
      >
        <span className="text-[13px] font-medium">+</span>
      </button>
    </div>
  )
}

function KbdRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-1 py-2.5 last:border-b-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            <kbd className="kbd">{k}</kbd>
            {i < keys.length - 1 && <span className="text-[10px] text-tertiary">+</span>}
          </span>
        ))}
      </span>
    </div>
  )
}

function FontSelect({
  value,
  stacks,
  customId,
  customValue,
  onChange,
  onCustomChange,
}: {
  value: string
  stacks: { id: string; label: string; stack: string }[]
  customId: string
  customValue: string
  onChange: (id: string) => void
  onCustomChange: (v: string) => void
}) {
  return (
    <div className="w-[180px]">
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {stacks.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
        <option value={customId}>Custom…</option>
      </select>
      {value === customId && (
        <input
          className="field mt-2"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder='"Inter Variable", Inter, sans-serif'
          spellCheck={false}
          autoComplete="off"
        />
      )}
    </div>
  )
}
