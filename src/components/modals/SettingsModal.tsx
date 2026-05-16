import type { useUiSettings } from '../../hooks/useUiSettings'
import { FONT_LOG_STACKS, FONT_STACK_CUSTOM_ID, FONT_UI_STACKS } from '../../hooks/useUiSettings'
import { fontStackSelectValue } from '../../ui/logViewerUi'
import { getAllThemes, type ThemeDef } from '../../ui/themes'

export type UiSettingsHandle = ReturnType<typeof useUiSettings>

export function SettingsModal({
  open,
  ui,
  onClose,
}: {
  open: boolean
  ui: UiSettingsHandle
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(92vh,640px)] w-full max-w-lg overflow-y-auto rounded-xl glass-modal border border-[rgba(255,255,255,0.08)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)]">
          <h2 id="settings-title" className="text-ui font-semibold text-text">
            Settings
          </h2>
          <button
            type="button"
            className="text-muted hover:text-text text-ui-2xl leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4 text-ui">
          {/* Font size */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
            <span className="mb-3 block text-ui font-semibold text-text">Font size</span>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="w-6 text-ui text-muted">UI</span>
                <span className="text-ui-sm tabular-nums text-muted w-8 text-right">{ui.fontUiPx}px</span>
                <button
                  type="button"
                  className="btn-macos min-w-[28px] flex items-center justify-center"
                  onClick={() => ui.bumpFontUi(-1)}
                  disabled={ui.fontUiPx <= ui.fontUiPxMin}
                >
                  A−
                </button>
                <button
                  type="button"
                  className="btn-macos min-w-[28px] flex items-center justify-center"
                  onClick={() => ui.bumpFontUi(1)}
                  disabled={ui.fontUiPx >= ui.fontUiPxMax}
                >
                  A+
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 text-ui text-muted">Log</span>
                <span className="text-ui-sm tabular-nums text-muted w-8 text-right">{ui.fontLogPx}px</span>
                <button
                  type="button"
                  className="btn-macos min-w-[28px] flex items-center justify-center"
                  onClick={() => ui.bumpFontLog(-1)}
                  disabled={ui.fontLogPx <= ui.fontLogPxMin}
                >
                  A−
                </button>
                <button
                  type="button"
                  className="btn-macos min-w-[28px] flex items-center justify-center"
                  onClick={() => ui.bumpFontLog(1)}
                  disabled={ui.fontLogPx >= ui.fontLogPxMax}
                >
                  A+
                </button>
              </div>
            </div>
            <p className="mt-3 text-ui-xs text-muted">
              UI: {ui.fontUiPxMin}–{ui.fontUiPxMax}px · Log: {ui.fontLogPxMin}–{ui.fontLogPxMax}px
            </p>
          </div>

          {/* Font family */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
            <span className="mb-2 block text-ui font-semibold text-text">Font family</span>
            <p className="mb-3 text-ui-xs leading-snug text-muted">
              Pick a font stack or type a custom CSS value.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-ui-sm font-medium text-muted">UI font</label>
                <select
                  className="input-macos w-full"
                  value={fontStackSelectValue(ui.fontFamilyUi, FONT_UI_STACKS, FONT_STACK_CUSTOM_ID)}
                  onChange={(e) => {
                    const id = e.target.value
                    if (id === FONT_STACK_CUSTOM_ID) {
                      ui.setFontFamilyUi(
                        ui.fontFamilyUi.trim() || '"SF Pro Text", -apple-system, sans-serif',
                      )
                      return
                    }
                    const opt = FONT_UI_STACKS.find((o) => o.id === id)
                    if (opt) ui.setFontFamilyUi(opt.stack)
                  }}
                >
                  {FONT_UI_STACKS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                  <option value={FONT_STACK_CUSTOM_ID}>Custom...</option>
                </select>
                {fontStackSelectValue(ui.fontFamilyUi, FONT_UI_STACKS, FONT_STACK_CUSTOM_ID) === FONT_STACK_CUSTOM_ID && (
                  <input
                    className="input-macos w-full mt-2"
                    value={ui.fontFamilyUi}
                    onChange={(e) => ui.setFontFamilyUi(e.target.value)}
                    placeholder='"SF Pro Text", -apple-system, sans-serif'
                    spellCheck={false}
                    autoComplete="off"
                  />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-ui-sm font-medium text-muted">Log font (monospace)</label>
                <select
                  className="input-macos w-full"
                  value={fontStackSelectValue(ui.fontFamilyLog, FONT_LOG_STACKS, FONT_STACK_CUSTOM_ID)}
                  onChange={(e) => {
                    const id = e.target.value
                    if (id === FONT_STACK_CUSTOM_ID) {
                      ui.setFontFamilyLog(
                        ui.fontFamilyLog.trim() || '"SF Mono", Menlo, monospace',
                      )
                      return
                    }
                    const opt = FONT_LOG_STACKS.find((o) => o.id === id)
                    if (opt) ui.setFontFamilyLog(opt.stack)
                  }}
                >
                  {FONT_LOG_STACKS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                  <option value={FONT_STACK_CUSTOM_ID}>Custom...</option>
                </select>
                {fontStackSelectValue(ui.fontFamilyLog, FONT_LOG_STACKS, FONT_STACK_CUSTOM_ID) === FONT_STACK_CUSTOM_ID && (
                  <input
                    className="input-macos w-full mt-2"
                    value={ui.fontFamilyLog}
                    onChange={(e) => ui.setFontFamilyLog(e.target.value)}
                    placeholder='"SF Mono", Menlo, Consolas, monospace'
                    spellCheck={false}
                    autoComplete="off"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
            <span className="mb-2 block text-ui font-semibold text-text">Theme</span>
            <div className="grid grid-cols-3 gap-2">
              {getAllThemes().map((t: ThemeDef) => (
                <button
                  key={t.id}
                  type="button"
                  className={`relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                    ui.theme === t.id
                      ? 'border-accent ring-2 ring-accent'
                      : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)]'
                  }`}
                  onClick={() => ui.setTheme(t.id)}
                  title={t.label}
                >
                  <div className="flex w-full rounded-md overflow-hidden h-8">
                    <div style={{ background: t.vars['--color-sidebar'] }} className="flex-[1]" />
                    <div style={{ background: t.vars['--color-bg'] }} className="flex-[2] border-l border-[rgba(127,127,127,0.2)]" />
                  </div>
                  <span className="text-ui-xs text-text truncate w-full text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User guide */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
            <span className="mb-2 block text-ui font-semibold text-text">User guide</span>
            <ul className="list-inside list-disc space-y-1.5 text-ui-sm leading-relaxed text-muted">
              <li>Enter your logs folder and click <span className="text-text font-medium">Use folder</span>.</li>
              <li>Click a <span className="text-text font-medium">.log</span> file to tail it.</li>
              <li>Toggle <span className="text-text font-medium">Levels</span> and use filters to narrow lines.</li>
              <li>
                Set <code className="rounded-md bg-[rgba(255,255,255,0.08)] px-1 text-ui-xs">LOG_ROOT</code> in{' '}
                <code className="rounded-md bg-[rgba(255,255,255,0.08)] px-1 text-ui-xs">.env</code> as default path.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
