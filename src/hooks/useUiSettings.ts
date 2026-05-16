import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyTheme } from '../ui/themes'

const STORAGE_KEY = 'aem-log-viewer-ui'
const DEFAULT_THEME = 'macos-dark'

export const FONT_UI_STACKS: { id: string; label: string; stack: string }[] = [
  { id: 'default', label: 'Default', stack: '' },
  {
    id: 'system',
    label: 'System UI',
    stack:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
  },
  { id: 'sfPro', label: 'SF Pro', stack: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
  { id: 'tahoma', label: 'Tahoma', stack: 'Tahoma, "MS Sans Serif", "Microsoft Sans Serif", sans-serif' },
  { id: 'arial', label: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { id: 'verdana', label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
]

export const FONT_LOG_STACKS: { id: string; label: string; stack: string }[] = [
  { id: 'default', label: 'Default', stack: '' },
  { id: 'jetbrains', label: 'JetBrains Mono', stack: '"JetBrains Mono", Consolas, monospace' },
  {
    id: 'uiMono',
    label: 'UI monospace',
    stack: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  { id: 'consolas', label: 'Consolas', stack: 'Consolas, "Courier New", monospace' },
  { id: 'cascadia', label: 'Cascadia Code / Mono', stack: '"Cascadia Code", "Cascadia Mono", Consolas, monospace' },
  { id: 'courier', label: 'Courier New', stack: '"Courier New", Courier, monospace' },
]

export const FONT_STACK_CUSTOM_ID = 'custom'

export function sanitizeFontStack(input: string): string {
  return input
    .replace(/[;{}<>]/g, '')
    .slice(0, 480)
    .trim()
}

const UI_BASE = 12
const LOG_BASE = 13
const UI_MIN_PX = 10
const UI_MAX_PX = 28
const LOG_MIN_PX = 10
const LOG_MAX_PX = 28

const UI_STEP_MIN = UI_MIN_PX - UI_BASE
const UI_STEP_MAX = UI_MAX_PX - UI_BASE
const LOG_STEP_MIN = LOG_MIN_PX - LOG_BASE
const LOG_STEP_MAX = LOG_MAX_PX - LOG_BASE

export interface UiSettingsPersisted {
  fontStepUi: number
  fontStepLog: number
  fontFamilyUi: string
  fontFamilyLog: string
  theme: string
}

const defaultPersisted: UiSettingsPersisted = {
  fontStepUi: 0,
  fontStepLog: 0,
  fontFamilyUi: '',
  fontFamilyLog: '',
  theme: DEFAULT_THEME,
}

function clampUiStep(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(UI_STEP_MAX, Math.max(UI_STEP_MIN, Math.round(n)))
}

function clampLogStep(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(LOG_STEP_MAX, Math.max(LOG_STEP_MIN, Math.round(n)))
}

function migrate(raw: Record<string, unknown>): UiSettingsPersisted {
  let fontStepUi = Number(raw.fontStepUi)
  if (!Number.isFinite(fontStepUi)) fontStepUi = 0
  let fontStepLog = Number(raw.fontStepLog)
  if (!Number.isFinite(fontStepLog)) fontStepLog = 0

  const fontFamilyUi =
    typeof raw.fontFamilyUi === 'string' ? sanitizeFontStack(raw.fontFamilyUi) : ''
  const fontFamilyLog =
    typeof raw.fontFamilyLog === 'string' ? sanitizeFontStack(raw.fontFamilyLog) : ''

  const theme =
    typeof raw.theme === 'string' && raw.theme.trim() ? raw.theme.trim() : DEFAULT_THEME

  return {
    fontStepUi: clampUiStep(fontStepUi),
    fontStepLog: clampLogStep(fontStepLog),
    fontFamilyUi,
    fontFamilyLog,
    theme,
  }
}

export function readPersistedUi(): UiSettingsPersisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultPersisted }
    const p = JSON.parse(raw) as Record<string, unknown>
    return migrate(p)
  } catch {
    return { ...defaultPersisted }
  }
}

function save(p: UiSettingsPersisted): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function applyFontsToDocument(p: UiSettingsPersisted): void {
  const root = document.documentElement
  root.style.setProperty('--lv-font-ui', `${UI_BASE + p.fontStepUi}px`)
  root.style.setProperty('--lv-font-mono', `${LOG_BASE + p.fontStepLog}px`)

  const uiStack = p.fontFamilyUi.trim()
  if (uiStack) root.style.setProperty('--lv-font-family-ui', uiStack)
  else root.style.removeProperty('--lv-font-family-ui')

  const logStack = p.fontFamilyLog.trim()
  if (logStack) root.style.setProperty('--lv-font-family-log', logStack)
  else root.style.removeProperty('--lv-font-family-log')
}

export function useUiSettings() {
  const [state, setState] = useState<UiSettingsPersisted>(() =>
    typeof window === 'undefined' ? defaultPersisted : readPersistedUi(),
  )

  useEffect(() => {
    applyFontsToDocument(state)
    applyTheme(state.theme)
    save(state)
  }, [state])

  const setFontFamilyUi = useCallback((fontFamilyUi: string) => {
    setState((s) => ({ ...s, fontFamilyUi: sanitizeFontStack(fontFamilyUi) }))
  }, [])

  const setFontFamilyLog = useCallback((fontFamilyLog: string) => {
    setState((s) => ({ ...s, fontFamilyLog: sanitizeFontStack(fontFamilyLog) }))
  }, [])

  const bumpFontUi = useCallback((delta: number) => {
    setState((s) => ({
      ...s,
      fontStepUi: clampUiStep(s.fontStepUi + delta),
    }))
  }, [])

  const bumpFontLog = useCallback((delta: number) => {
    setState((s) => ({
      ...s,
      fontStepLog: clampLogStep(s.fontStepLog + delta),
    }))
  }, [])

  const setTheme = useCallback((theme: string) => {
    setState((s) => ({ ...s, theme }))
  }, [])

  const fontUiPx = useMemo(() => UI_BASE + state.fontStepUi, [state.fontStepUi])
  const fontLogPx = useMemo(() => LOG_BASE + state.fontStepLog, [state.fontStepLog])

  return {
    fontFamilyUi: state.fontFamilyUi,
    fontFamilyLog: state.fontFamilyLog,
    setFontFamilyUi,
    setFontFamilyLog,
    fontStepUi: state.fontStepUi,
    fontStepLog: state.fontStepLog,
    fontUiPx,
    fontLogPx,
    bumpFontUi,
    bumpFontLog,
    fontUiPxMin: UI_MIN_PX,
    fontUiPxMax: UI_MAX_PX,
    fontLogPxMin: LOG_MIN_PX,
    fontLogPxMax: LOG_MAX_PX,
    theme: state.theme,
    setTheme,
  }
}
