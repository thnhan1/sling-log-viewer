/**
 * Theme system — compact palette definitions + builder.
 *
 * Each theme defines a ~20-color palette. The builder derives the full
 * ~80 CSS custom properties using consistent opacity/alpha formulas.
 * Adding a new theme is ~25 lines instead of ~120.
 */

export interface ThemeDef {
  id: string
  label: string
  dark: boolean
  vars: Record<string, string>
}

// ── Compact palette: the only colors a theme author needs to pick ──

interface Palette {
  bg: string // main background
  surface: string // sidebar / tab-inactive
  raised: string // status bar / glass base
  text: string // primary text
  muted: string // secondary text / line numbers
  accent: string // interactive accent
  error: string // errors
  warning: string // warnings / highlight base
  info: string // info
  success: string // debug
  method: string // HTTP verbs, method calls
  path: string // URL paths, thread names
  fqcn: string // Java class names
  string: string // quoted strings
  number: string // numeric values
  exception: string // exception class names
}

// ── Builder: palette → full CSS variable map ──

type VarMap = Record<string, string>

function alpha(hexOrRgb: string, a: number): string {
  // If already rgba, replace alpha
  if (hexOrRgb.startsWith('rgba(')) {
    return hexOrRgb.replace(/[\d.]+\)$/, `${a})`)
  }
  // hex → rgba
  const r = parseInt(hexOrRgb.slice(1, 3), 16)
  const g = parseInt(hexOrRgb.slice(3, 5), 16)
  const b = parseInt(hexOrRgb.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/** Relative luminance per WCAG 2.0. Returns 0–1. */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Mix two colors at the given ratio (0 = pure bg, 1 = pure fg). */
function mix(bg: string, fg: string, ratio: number): string {
  const parse = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  })
  const b = parse(bg)
  const f = parse(fg)
  const r = Math.round(b.r + (f.r - b.r) * ratio)
  const g = Math.round(b.g + (f.g - b.g) * ratio)
  const bl = Math.round(b.b + (f.b - b.b) * ratio)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

function buildVars(p: Palette, dark: boolean): VarMap {
  const on = dark
    ? { overlay: '255,255,255', glassAlpha: 0.08, glassAlphaStrong: 0.14 }
    : { overlay: '0,0,0', glassAlpha: 0.06, glassAlphaStrong: 0.12 }

  const m = p.muted
  const t = p.text
  const ov = on.overlay

  return {
    // ── Surface ──
    '--color-bg': p.bg,
    '--color-sidebar': p.surface,
    '--color-statusbar': p.raised,
    '--color-tab-active': p.bg,
    '--color-tab-inactive': p.surface,

    // ── Text ──
    '--color-text': p.text,
    '--color-muted': p.muted,
    '--color-line-num': dark ? mix(p.bg, t, 0.35) : mix(p.bg, t, 0.45),
    '--color-btn-text': p.text,

    // ── Interactive ──
    '--color-accent': p.accent,
    '--color-danger': p.error,
    '--color-btn': `rgba(${ov},${on.glassAlpha})`,
    '--color-btn-hover': `rgba(${ov},${on.glassAlphaStrong})`,
    // Primary button text: white text on a light accent is unreadable.
    // Use the theme's background color when accent luminance > 0.45.
    '--color-btn-primary-text': luminance(p.accent) > 0.45 ? p.bg : '#ffffff',
    '--color-border': `rgba(${ov},${dark ? 0.07 : 0.08})`,
    '--color-input': `rgba(${ov},${dark ? 0.055 : 0.04})`,
    '--color-input-border': `rgba(${ov},${dark ? 0.10 : 0.12})`,
    '--color-selection': alpha(p.accent, dark ? 0.26 : 0.16),

    // ── Severity (log levels) ──
    '--color-error': p.error,
    '--color-warning': p.warning,
    '--color-info': p.info,
    '--color-debug': p.success,
    '--color-trace': p.muted,

    // ── Highlight / search ──
    '--color-hl-bg': alpha(p.warning, 0.36),
    '--color-hl-text': dark ? p.bg : p.text,
    '--lv-search-mark-bg': alpha(p.warning, 0.40),
    '--lv-search-row-bg': alpha(p.warning, 0.08),
    '--lv-search-active-bg': alpha(p.warning, 0.16),
    '--lv-search-active-ring': alpha(p.warning, 0.52),

    // ── Glass surfaces ──
    '--theme-glass-sidebar': alpha(p.surface, 0.80),
    '--theme-glass-toolbar': alpha(p.surface, 0.72),
    '--theme-glass-modal': p.bg,

    // ── Scrollbar ──
    '--theme-scrollbar-thumb': `rgba(${ov},${dark ? 0.14 : 0.16})`,
    '--theme-scrollbar-thumb-hover': `rgba(${ov},${dark ? 0.24 : 0.26})`,

    // ── Log syntax tokens ──
    '--color-bracket': m,
    '--color-method': p.method,
    '--color-path': p.path,
    '--color-fqcn': p.fqcn,

    '--color-log-timestamp': m,
    '--color-log-thread': p.path,
    '--color-log-message': t,
    '--color-log-cause': p.warning,
    '--color-log-key': p.success,
    '--color-log-operator': m,
    '--color-log-value': p.info,
    '--color-log-string': p.string,
    '--color-log-number': p.number,
    '--color-log-exception': p.exception,
  }
}

// ── Palette definitions (one per theme) ──

const P: Record<string, Palette> = {
  'macos-dark': {
    bg: '#1c1c1e', surface: '#1c1c1e', raised: '#242426',
    text: '#f5f5f7', muted: '#98989d',
    accent: '#0a84ff', error: '#ff453a', warning: '#ff9f0a',
    info: '#64d2ff', success: '#30d158',
    method: '#ffd60a', path: '#64d2ff', fqcn: '#ff9f0a',
    string: '#ffd60a', number: '#bf5af2', exception: '#ff453a',
  },
  dracula: {
    bg: '#282a36', surface: '#21222c', raised: '#21222c',
    text: '#f8f8f2', muted: '#6272a4',
    accent: '#8be9fd', error: '#ff79c6', warning: '#ffb86c',
    info: '#8be9fd', success: '#50fa7b',
    method: '#ff79c6', path: '#8be9fd', fqcn: '#50fa7b',
    string: '#f1fa8c', number: '#bd93f9', exception: '#ff79c6',
  },
  'one-dark': {
    bg: '#282c34', surface: '#21252b', raised: '#21252b',
    text: '#abb2bf', muted: '#5c6370',
    accent: '#61afef', error: '#e06c75', warning: '#e5c07b',
    info: '#56b6c2', success: '#98c379',
    method: '#c678dd', path: '#56b6c2', fqcn: '#e5c07b',
    string: '#e5c07b', number: '#c678dd', exception: '#e06c75',
  },
  'github-light': {
    bg: '#ffffff', surface: '#f6f8fa', raised: '#f6f8fa',
    text: '#1f2328', muted: '#656d76',
    accent: '#0969da', error: '#cf222e', warning: '#bf8700',
    info: '#0969da', success: '#1a7f37',
    method: '#8250df', path: '#0969da', fqcn: '#953800',
    string: '#0a3069', number: '#0550ae', exception: '#cf222e',
  },
  'github-dark': {
    bg: '#0d1117', surface: '#0d1117', raised: '#161b22',
    text: '#e6edf3', muted: '#8b949e',
    accent: '#58a6ff', error: '#f85149', warning: '#d2991d',
    info: '#58a6ff', success: '#3fb950',
    method: '#d2a8ff', path: '#58a6ff', fqcn: '#ffa657',
    string: '#a5d6ff', number: '#d2a8ff', exception: '#ff7b72',
  },
  monokai: {
    bg: '#272822', surface: '#1e1f1c', raised: '#1e1f1c',
    text: '#f8f8f2', muted: '#75715e',
    accent: '#f92672', error: '#f92672', warning: '#fd971f',
    info: '#66d9ef', success: '#a6e22e',
    method: '#f92672', path: '#66d9ef', fqcn: '#fd971f',
    string: '#e6db74', number: '#ae81ff', exception: '#f92672',
  },
  nord: {
    bg: '#2e3440', surface: '#272b36', raised: '#272b36',
    text: '#eceff4', muted: '#616e88',
    accent: '#88c0d0', error: '#bf616a', warning: '#ebcb8b',
    info: '#81a1c1', success: '#a3be8c',
    method: '#8fbcbb', path: '#88c0d0', fqcn: '#ebcb8b',
    string: '#ebcb8b', number: '#b48ead', exception: '#bf616a',
  },
  'solarized-dark': {
    bg: '#002b36', surface: '#00212b', raised: '#00212b',
    text: '#93a1a1', muted: '#586e75',
    accent: '#268bd2', error: '#dc322f', warning: '#b58900',
    info: '#2aa198', success: '#859900',
    method: '#d33682', path: '#2aa198', fqcn: '#b58900',
    string: '#b58900', number: '#6c71c4', exception: '#dc322f',
  },
  'tokyo-night': {
    bg: '#1a1b26', surface: '#16161e', raised: '#16161e',
    text: '#c0caf5', muted: '#565f89',
    accent: '#7aa2f7', error: '#f7768e', warning: '#e0af68',
    info: '#7dcfff', success: '#9ece6a',
    method: '#bb9af7', path: '#7dcfff', fqcn: '#e0af68',
    string: '#e0af68', number: '#bb9af7', exception: '#f7768e',
  },
  'catppuccin-mocha': {
    bg: '#1e1e2e', surface: '#181825', raised: '#181825',
    text: '#cdd6f4', muted: '#6c7086',
    accent: '#cba6f7', error: '#f38ba8', warning: '#fab387',
    info: '#89b4fa', success: '#a6e3a1',
    method: '#cba6f7', path: '#89b4fa', fqcn: '#fab387',
    string: '#f9e2af', number: '#cba6f7', exception: '#f38ba8',
  },
  'gruvbox-dark': {
    bg: '#282828', surface: '#1d2021', raised: '#1d2021',
    text: '#ebdbb2', muted: '#a89984',
    accent: '#d79921', error: '#cc241d', warning: '#d65d0e',
    info: '#458588', success: '#98971a',
    method: '#fe8019', path: '#8ec07c', fqcn: '#fabd2f',
    string: '#fabd2f', number: '#d3869b', exception: '#fb4934',
  },
  'ayu-mirage': {
    bg: '#1f2430', surface: '#1a1e29', raised: '#1a1e29',
    text: '#cccac2', muted: '#5c6773',
    accent: '#ffcc66', error: '#ff3333', warning: '#ff8f40',
    info: '#5ccfe6', success: '#a6cc70',
    method: '#ffad66', path: '#5ccfe6', fqcn: '#ffcc66',
    string: '#ffd580', number: '#d4bfff', exception: '#ff3333',
  },
  'everforest-dark': {
    bg: '#2d353b', surface: '#272e33', raised: '#272e33',
    text: '#d3c6aa', muted: '#859289',
    accent: '#a7c080', error: '#e67e80', warning: '#dbbc7f',
    info: '#7fbbb3', success: '#a7c080',
    method: '#e69875', path: '#7fbbb3', fqcn: '#dbbc7f',
    string: '#dbbc7f', number: '#d699b6', exception: '#e67e80',
  },
}

// ── Build the full theme list ──

const LABELS: Record<string, string> = {
  'macos-dark': 'macOS Dark',
  dracula: 'Dracula',
  'one-dark': 'One Dark',
  'github-light': 'GitHub Light',
  'github-dark': 'GitHub Dark',
  monokai: 'Monokai',
  nord: 'Nord',
  'solarized-dark': 'Solarized Dark',
  'tokyo-night': 'Tokyo Night',
  'catppuccin-mocha': 'Catppuccin Mocha',
  'gruvbox-dark': 'Gruvbox Dark',
  'ayu-mirage': 'Ayu Mirage',
  'everforest-dark': 'Everforest Dark',
}

const DARK_THEMES = new Set([
  'macos-dark', 'dracula', 'one-dark', 'github-dark', 'monokai',
  'nord', 'solarized-dark', 'tokyo-night', 'catppuccin-mocha',
  'gruvbox-dark', 'ayu-mirage', 'everforest-dark',
])

const THEMES: ThemeDef[] = Object.entries(P).map(([id, palette]) => ({
  id,
  label: LABELS[id] || id,
  dark: DARK_THEMES.has(id),
  vars: buildVars(palette, DARK_THEMES.has(id)),
}))

// ── Public API (unchanged) ──

export function getTheme(id: string): ThemeDef | undefined {
  return THEMES.find((t) => t.id === id)
}

export function getAllThemes(): ThemeDef[] {
  return THEMES
}

export function applyTheme(id: string): void {
  const theme = getTheme(id)
  if (!theme) return
  const root = document.documentElement
  for (const [name, value] of Object.entries(theme.vars)) {
    root.style.setProperty(name, value)
  }
}
