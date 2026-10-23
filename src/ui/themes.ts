/**
 * Slingtail theme system.
 *
 * Themes are CSS-driven: `applyTheme` sets `data-theme` on <html>, and the
 * token definitions in index.css do the rest.
 */

export type ThemeId =
  | 'dracula'
  | 'tokyo-night'
  | 'catppuccin-mocha'
  | 'nord'
  | 'one-dark'
  | 'gruvbox-dark'
  | 'github-light'
  | 'catppuccin-latte'
  | 'solarized-light'
  | 'system'

export interface ThemePreview {
  bg: string
  surface: string
  text: string
  accent: string
  border: string
  swatches: string[]
}

export interface ThemeDef {
  id: ThemeId
  label: string
  dark: boolean
  preview: ThemePreview
}

const THEMES: ThemeDef[] = [
  {
    id: 'dracula',
    label: 'Dracula',
    dark: true,
    preview: {
      bg: '#282a36',
      surface: '#21222c',
      text: '#f8f8f2',
      accent: '#bd93f9',
      border: '#44475a',
      swatches: ['#bd93f9', '#8be9fd', '#50fa7b', '#ffb86c', '#ff5555'],
    },
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    dark: true,
    preview: {
      bg: '#1a1b26',
      surface: '#16161e',
      text: '#c0caf5',
      accent: '#7aa2f7',
      border: '#2f334d',
      swatches: ['#7aa2f7', '#bb9af7', '#9ece6a', '#e0af68', '#f7768e'],
    },
  },
  {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    dark: true,
    preview: {
      bg: '#1e1e2e',
      surface: '#181825',
      text: '#cdd6f4',
      accent: '#cba6f7',
      border: '#313244',
      swatches: ['#cba6f7', '#89b4fa', '#a6e3a1', '#fab387', '#f38ba8'],
    },
  },
  {
    id: 'nord',
    label: 'Nord',
    dark: true,
    preview: {
      bg: '#2e3440',
      surface: '#272b36',
      text: '#eceff4',
      accent: '#88c0d0',
      border: '#3b4252',
      swatches: ['#88c0d0', '#81a1c1', '#a3be8c', '#ebcb8b', '#bf616a'],
    },
  },
  {
    id: 'one-dark',
    label: 'One Dark',
    dark: true,
    preview: {
      bg: '#282c34',
      surface: '#21252b',
      text: '#abb2bf',
      accent: '#61afef',
      border: '#353b45',
      swatches: ['#61afef', '#c678dd', '#98c379', '#e5c07b', '#e06c75'],
    },
  },
  {
    id: 'gruvbox-dark',
    label: 'Gruvbox Dark',
    dark: true,
    preview: {
      bg: '#282828',
      surface: '#1d2021',
      text: '#ebdbb2',
      accent: '#d79921',
      border: '#3c3836',
      swatches: ['#d79921', '#83a598', '#b8bb26', '#fabd2f', '#fb4934'],
    },
  },
  {
    id: 'github-light',
    label: 'GitHub Light',
    dark: false,
    preview: {
      bg: '#ffffff',
      surface: '#f6f8fa',
      text: '#1f2328',
      accent: '#0969da',
      border: '#d0d7de',
      swatches: ['#0969da', '#8250df', '#1a7f37', '#bf8700', '#cf222e'],
    },
  },
  {
    id: 'catppuccin-latte',
    label: 'Catppuccin Latte',
    dark: false,
    preview: {
      bg: '#eff1f5',
      surface: '#e6e9ef',
      text: '#4c4f69',
      accent: '#7287fd',
      border: '#ccd0da',
      swatches: ['#7287fd', '#1e66f5', '#40a02b', '#df8e1d', '#d20f39'],
    },
  },
  {
    id: 'solarized-light',
    label: 'Solarized Light',
    dark: false,
    preview: {
      bg: '#fdf6e3',
      surface: '#eee8d5',
      text: '#657b83',
      accent: '#268bd2',
      border: '#d9d2bf',
      swatches: ['#268bd2', '#6c71c4', '#859900', '#b58900', '#dc322f'],
    },
  },
  {
    id: 'system',
    label: 'System',
    dark: true,
    preview: {
      bg: '#282a36',
      surface: '#f6f8fa',
      text: '#f8f8f2',
      accent: '#bd93f9',
      border: '#44475a',
      swatches: ['#bd93f9', '#0969da', '#50fa7b', '#bf8700', '#ff5555'],
    },
  },
]

const VALID_THEME_IDS = new Set<string>(THEMES.map((t) => t.id))

const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  dark: 'dracula',
  light: 'github-light',
  'macos-dark': 'dracula',
  monokai: 'dracula',
  'solarized-dark': 'tokyo-night',
  'ayu-mirage': 'catppuccin-mocha',
  'everforest-dark': 'gruvbox-dark',
  'github-dark': 'tokyo-night',
  'catppuccin-mocha': 'catppuccin-mocha',
  'tokyo-night': 'tokyo-night',
  nord: 'nord',
  'one-dark': 'one-dark',
  'gruvbox-dark': 'gruvbox-dark',
  'github-light': 'github-light',
  'catppuccin-latte': 'catppuccin-latte',
  'solarized-light': 'solarized-light',
  dracula: 'dracula',
  system: 'system',
}

export function getTheme(id: string): ThemeDef | undefined {
  return THEMES.find((t) => t.id === id)
}

export function getAllThemes(): ThemeDef[] {
  return THEMES
}

/** Map persisted/legacy theme ids to the current set. */
export function migrateThemeId(raw: string | null | undefined): ThemeId {
  if (!raw) return 'dracula'
  if (VALID_THEME_IDS.has(raw)) return raw as ThemeId
  return LEGACY_THEME_MAP[raw] ?? 'dracula'
}

export function resolveTheme(id: string): ThemeId {
  const themeId = migrateThemeId(id)
  if (themeId === 'system') {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'github-light'
        : 'dracula'
    }
    return 'dracula'
  }
  return themeId
}

let systemMedia: MediaQueryList | null = null
let systemListener: (() => void) | null = null

function clearSystemListener(): void {
  if (systemMedia && systemListener) {
    systemMedia.removeEventListener('change', systemListener)
  }
  systemMedia = null
  systemListener = null
}

export function applyTheme(id: string): void {
  const themeId = migrateThemeId(id)
  const root = document.documentElement
  const resolved = resolveTheme(themeId)

  root.dataset.theme = resolved
  root.dataset.themePreference = themeId
  root.style.colorScheme = getTheme(resolved)?.dark === false ? 'light' : 'dark'

  clearSystemListener()

  if (themeId === 'system' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    systemMedia = window.matchMedia('(prefers-color-scheme: light)')
    systemListener = () => {
      const next = systemMedia?.matches ? 'github-light' : 'dracula'
      root.dataset.theme = next
      root.style.colorScheme = getTheme(next)?.dark === false ? 'light' : 'dark'
    }
    systemMedia.addEventListener('change', systemListener)
  }
}
