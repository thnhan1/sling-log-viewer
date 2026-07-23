import { type Dispatch, type SetStateAction } from 'react'
import type { useUiSettings } from '../../hooks/useUiSettings'
import { FONT_LOG_STACKS, FONT_STACK_CUSTOM_ID, FONT_UI_STACKS } from '../../hooks/useUiSettings'
import { fontStackSelectValue } from '../../ui/logViewerUi'
import { getAllThemes, type ThemeDef } from '../../ui/themes'
import {
  IconX,
  IconTypography,
  IconPaintbrush,
  IconKeyboard,
  IconTerminal,
  IconPlus,
  IconDotFill,
  IconTrash,
} from '../../ui/icons'

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
}

export function SettingsModal(props: Props) {
  const {
    open, ui, onClose,
    remotePrefs, setRemotePrefs,
    remotePassword, setRemotePassword,
    remoteLogFileInput, setRemoteLogFileInput,
    remoteConfigured, remoteConnecting,
    onConfigureRemote, onAddRemoteLogFile, onRemoveRemoteLogFile,
    onDisconnectRemote,
  } = props
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className="flex h-[min(88vh,580px)] w-full max-w-[660px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[#1c1c1e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sidebar ── */}
        <div className="flex w-[175px] shrink-0 flex-col border-r border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.015)]">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[rgba(255,255,255,0.05)]">
            <h2 id="settings-title" className="text-ui-sm font-semibold text-text select-none tracking-wide">
              Settings
            </h2>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            <a href="#section-font" className="settings-nav-item">
              <IconTypography size={15} />
              <span>Font</span>
            </a>
            <a href="#section-theme" className="settings-nav-item">
              <IconPaintbrush size={15} />
              <span>Theme</span>
            </a>
            <a href="#section-connection" className="settings-nav-item">
              <IconTerminal size={15} />
              <span>Connection</span>
              {remoteConfigured && (
                <span className="ml-auto">
                  <IconDotFill size={8} className="text-[#30d158]" />
                </span>
              )}
            </a>
            <a href="#section-shortcuts" className="settings-nav-item">
              <IconKeyboard size={15} />
              <span>Shortcuts</span>
            </a>
          </nav>
        </div>

        {/* ── Content ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.05)] px-5 py-3">
            <span className="text-ui-sm font-medium text-muted">Preferences</span>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-[rgba(255,255,255,0.08)] hover:text-text transition-colors"
              onClick={onClose}
              aria-label="Close settings"
            >
              <IconX size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* ── Font ── */}
            <section id="section-font">
              <SectionHeader icon={<IconTypography size={15} />} title="Font" />
              <SettingsRow label="UI font size" hint={`${ui.fontUiPx}px`}>
                <Stepper value={ui.fontUiPx} min={ui.fontUiPxMin} max={ui.fontUiPxMax} onStep={ui.bumpFontUi} />
              </SettingsRow>
              <SettingsRow label="Log font size" hint={`${ui.fontLogPx}px`}>
                <Stepper value={ui.fontLogPx} min={ui.fontLogPxMin} max={ui.fontLogPxMax} onStep={ui.bumpFontLog} />
              </SettingsRow>
              <SettingsRow label="UI font">
                <FontSelect
                  value={fontStackSelectValue(ui.fontFamilyUi, FONT_UI_STACKS, FONT_STACK_CUSTOM_ID)}
                  stacks={FONT_UI_STACKS}
                  customId={FONT_STACK_CUSTOM_ID}
                  customValue={ui.fontFamilyUi}
                  onChange={(id) => {
                    if (id === FONT_STACK_CUSTOM_ID) {
                      ui.setFontFamilyUi(ui.fontFamilyUi.trim() || '"SF Pro Text", -apple-system, sans-serif')
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
                      ui.setFontFamilyLog(ui.fontFamilyLog.trim() || '"SF Mono", Menlo, monospace')
                      return
                    }
                    const opt = FONT_LOG_STACKS.find((o) => o.id === id)
                    if (opt) ui.setFontFamilyLog(opt.stack)
                  }}
                  onCustomChange={(v) => ui.setFontFamilyLog(v)}
                />
              </SettingsRow>
            </section>

            {/* ── Theme ── */}
            <section id="section-theme">
              <SectionHeader icon={<IconPaintbrush size={15} />} title="Theme" />
              <div className="grid grid-cols-3 gap-2">
                {getAllThemes().map((t: ThemeDef) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`relative flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all text-left ${
                      ui.theme === t.id
                        ? 'border-accent ring-[3px] ring-[rgba(10,132,255,0.18)] bg-[rgba(10,132,255,0.06)]'
                        : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.02)]'
                    }`}
                    onClick={() => ui.setTheme(t.id)}
                    title={t.label}
                  >
                    <div className="flex items-center gap-1">
                      {['--color-bg', '--color-accent', '--color-error', '--color-warning', '--color-debug'].map((k) => (
                        <span
                          key={k}
                          className="h-3 w-3 shrink-0 rounded-full border border-[rgba(255,255,255,0.15)]"
                          style={{ background: t.vars[k] }}
                        />
                      ))}
                    </div>
                    <span className="text-ui-xs text-text font-medium truncate">{t.label}</span>
                    {ui.theme === t.id && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_rgba(10,132,255,0.6)]" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Connection (Remote AEM) ── */}
            <section id="section-connection">
              <SectionHeader icon={<IconTerminal size={15} />} title="Connection" />
              <p className="mb-4 text-ui-xs leading-relaxed text-muted">
                Configure a remote AEM instance to stream logs via <code className="rounded-md bg-[rgba(255,255,255,0.08)] px-1 text-ui-xs">tailer.txt</code>.
                Credentials are stored in server memory only — never on disk or in the browser.
              </p>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-ui-xs font-medium text-muted uppercase tracking-wider">AEM Base URL</label>
                  <input
                    className="settings-input"
                    placeholder="https://aem-uat.example.com"
                    value={remotePrefs.baseUrl}
                    onChange={(e) => setRemotePrefs((p) => ({ ...p, baseUrl: e.target.value }))}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block text-ui-xs font-medium text-muted uppercase tracking-wider">Username</label>
                    <input
                      className="settings-input"
                      placeholder="your-username"
                      value={remotePrefs.username}
                      onChange={(e) => setRemotePrefs((p) => ({ ...p, username: e.target.value }))}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-ui-xs font-medium text-muted uppercase tracking-wider">
                      Password
                      {remoteConfigured && <span className="ml-1 text-[#30d158]">(saved)</span>}
                    </label>
                    <input
                      className="settings-input"
                      type="password"
                      placeholder={remoteConfigured ? '••••••••' : 'your-password'}
                      value={remotePassword}
                      onChange={(e) => setRemotePassword(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-ui-xs font-medium text-muted uppercase tracking-wider">Log path</label>
                  <div className="flex items-center gap-2">
                    <input
                      className="settings-input flex-1"
                      placeholder="logs/"
                      value={remotePrefs.logPath}
                      onChange={(e) => setRemotePrefs((p) => ({ ...p, logPath: e.target.value }))}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <span className="text-ui-xs text-muted shrink-0">+ filename</span>
                  </div>
                </div>

                {/* Log files */}
                <div className="space-y-2">
                  <label className="block text-ui-xs font-medium text-muted uppercase tracking-wider">Tracked log files</label>
                  {remotePrefs.logFiles.length > 0 && (
                    <div className="max-h-[96px] overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] divide-y divide-[rgba(255,255,255,0.04)]">
                      {remotePrefs.logFiles.map((f) => (
                        <div key={f} className="flex items-center justify-between px-3 py-2 text-ui-sm text-text">
                          <span className="truncate font-mono">{f}</span>
                          <button
                            type="button"
                            className="shrink-0 ml-2 text-muted hover:text-error transition-colors"
                            onClick={() => onRemoveRemoteLogFile(f)}
                            title="Remove"
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      className="settings-input flex-1"
                      placeholder="error.log"
                      value={remoteLogFileInput}
                      onChange={(e) => setRemoteLogFileInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onAddRemoteLogFile(remoteLogFileInput)}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="settings-btn-icon shrink-0"
                      onClick={() => onAddRemoteLogFile(remoteLogFileInput)}
                      title="Add log file"
                    >
                      <IconPlus size={14} />
                    </button>
                  </div>
                </div>

                {/* Connect / Disconnect buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    className="settings-btn-primary"
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
                    {remoteConnecting ? 'Connecting…' : remoteConfigured ? 'Update & Reconnect' : 'Connect'}
                  </button>
                  {remoteConfigured && (
                    <>
                      <span className="flex items-center gap-1.5 text-ui-xs text-[#30d158]">
                        <IconDotFill size={7} /> Connected
                      </span>
                      <button
                        type="button"
                        className="settings-btn-disconnect"
                        onClick={onDisconnectRemote}
                        title="Remove credentials and switch to local mode"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                </div>

                <p className="text-ui-xs text-muted leading-relaxed">
                  Uses AEM's <code className="rounded-md bg-[rgba(255,255,255,0.08)] px-1 text-ui-xs">/system/console/slinglog/tailer.txt</code> endpoint.
                  A service account with read-only Web Console access is recommended.
                </p>
              </div>
            </section>

            {/* ── Shortcuts ── */}
            <section id="section-shortcuts">
              <SectionHeader icon={<IconKeyboard size={15} />} title="Keyboard Shortcuts" />
              <KbdRow keys={['Ctrl', 'F']} label="Focus search" />
              <KbdRow keys={['Enter']} label="Next search match" />
              <KbdRow keys={['Shift', 'Enter']} label="Previous search match" />
              <KbdRow keys={['Escape']} label="Close panel / modal" />
              <KbdRow keys={['Ctrl', 'B']} label="Toggle sidebar" />
              <KbdRow keys={['Ctrl', 'R']} label="Refresh log" />
            </section>
          </div>
        </div>
      </div>

      <style>{`
        .settings-nav-item {
          display: flex; align-items: center; gap: 8px; padding: 6px 10px;
          border-radius: 8px; font-size: var(--lv-font-ui); color: var(--color-text);
          text-decoration: none; transition: background-color 0.12s; cursor: pointer;
        }
        .settings-nav-item:hover { background: rgba(255,255,255,0.06); }
        .settings-btn-icon {
          display: flex; align-items: center; justify-content: center;
          width: 33px; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.06); color: var(--color-text);
          cursor: pointer; transition: background-color 0.12s, border-color 0.12s;
          align-self: stretch;
        }
        .settings-btn-icon:hover:not(:disabled) { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.16); }
        .settings-btn-icon:disabled { opacity: 0.3; cursor: default; }
        .settings-btn-primary {
          border-radius: 8px; border: none; background: var(--color-accent);
          color: var(--color-btn-primary-text, #fff); padding: 7px 16px;
          font-size: var(--lv-font-ui); font-weight: 500; cursor: pointer;
          transition: opacity 0.12s; white-space: nowrap;
        }
        .settings-btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .settings-btn-primary:disabled { opacity: 0.35; cursor: default; }
        .settings-btn-disconnect {
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.10);
          background: transparent; color: var(--color-muted);
          padding: 6px 12px; font-size: var(--lv-font-ui); cursor: pointer;
          transition: color 0.12s, border-color 0.12s, background 0.12s; white-space: nowrap;
        }
        .settings-btn-disconnect:hover { color: var(--color-error); border-color: var(--color-error); background: rgba(255,69,58,0.08); }
        .settings-select {
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.05); padding: 5px 10px;
          font-size: var(--lv-font-ui); color: var(--color-text); outline: none;
          min-width: 140px; transition: border-color 0.12s, box-shadow 0.12s;
        }
        .settings-select:focus { border-color: rgba(10,132,255,0.40); box-shadow: 0 0 0 3px rgba(10,132,255,0.12); }
        .settings-select option { background: #2c2c2e; color: #f5f5f7; }
        .settings-input {
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.05); padding: 6px 10px;
          font-size: var(--lv-font-ui); color: var(--color-text); outline: none;
          width: 100%; transition: border-color 0.12s, box-shadow 0.12s;
        }
        .settings-input:focus { border-color: rgba(10,132,255,0.40); box-shadow: 0 0 0 3px rgba(10,132,255,0.12); }
        .settings-input::placeholder { color: var(--color-muted); }
      `}</style>
    </div>
  )
}

// ── Sub-components ──

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-text">
      <span className="opacity-50">{icon}</span>
      <h3 className="text-ui-sm font-semibold tracking-wide uppercase">{title}</h3>
    </div>
  )
}

function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-xl hover:bg-[rgba(255,255,255,0.015)] transition-colors group">
      <div className="min-w-0">
        <span className="text-ui-sm text-text select-none">{label}</span>
        {hint && <span className="ml-2 text-ui-xs text-muted">{hint}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Stepper({ value, min, max, onStep }: { value: number; min: number; max: number; onStep: (d: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className="settings-btn-icon" onClick={() => onStep(-1)} disabled={value <= min} aria-label="Decrease">
        <span className="text-ui-sm font-medium">−</span>
      </button>
      <span className="w-10 text-center text-ui-sm tabular-nums text-text select-none">{value}</span>
      <button type="button" className="settings-btn-icon" onClick={() => onStep(1)} disabled={value >= max} aria-label="Increase">
        <span className="text-ui-sm font-medium">+</span>
      </button>
    </div>
  )
}

function KbdRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.015)] transition-colors">
      <span className="text-ui-sm text-muted">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            <kbd className="inline-flex items-center rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-ui-xs text-text font-mono leading-none shadow-[0_1px_0_rgba(255,255,255,0.04)]">
              {k}
            </kbd>
            {i < keys.length - 1 && <span className="text-ui-xs text-muted">+</span>}
          </span>
        ))}
      </span>
    </div>
  )
}

function FontSelect({
  value, stacks, customId, customValue, onChange, onCustomChange,
}: {
  value: string
  stacks: { id: string; label: string; stack: string }[]
  customId: string
  customValue: string
  onChange: (id: string) => void
  onCustomChange: (v: string) => void
}) {
  return (
    <div>
      <select className="settings-select w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {stacks.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        <option value={customId}>Custom...</option>
      </select>
      {value === customId && (
        <input
          className="settings-input mt-2"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder='"SF Pro Text", -apple-system, sans-serif'
          spellCheck={false}
          autoComplete="off"
        />
      )}
    </div>
  )
}
