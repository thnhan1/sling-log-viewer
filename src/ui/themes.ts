/**
 * Slingtail theme system.
 *
 * Themes are CSS-driven: `applyTheme` sets `data-theme` on <html>, and the
 * token definitions in index.css do the rest.
 */

export type ThemeId = 'dracula' | 'github-light' | 'github-dark' | 'default'

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
    id: 'github-light',
    label: 'GitHub Light',
    dark: false,
    preview: {
      bg: '#fafbfc',
      surface: '#f0f2f5',
      text: '#1f2328',
      accent: '#0550ae',
      border: '#d3d9e0',
      swatches: ['#0550ae', '#8250df', '#17692e', '#8a5f00', '#b5202c'],
    },
  },
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    dark: true,
    preview: {
      bg: '#0d1117',
      surface: '#161b22',
      text: '#e6edf3',
      accent: '#58a6ff',
      border: '#30363d',
      swatches: ['#58a6ff', '#d2a8ff', '#3fb950', '#d29922', '#f85149'],
    },
  },
  {
    id: 'default',
    label: 'Default',
    dark: true,
    preview: {
      bg: '#0c223f',
      surface: '#081a30',
      text: '#f6f8fa',
      accent: '#0091ff',
      border: '#2a4566',
      swatches: ['#0091ff', '#1ce783', '#ffc247', '#ff4f5e', '#7b8794'],
    },
  },
]

const VALID_THEME_IDS = new Set<string>(THEMES.map((t) => t.id))

const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  dark: 'dracula',
  light: 'github-light',
  'macos-dark': 'dracula',
  monokai: 'dracula',
  'solarized-dark': 'dracula',
  'ayu-mirage': 'dracula',
  'everforest-dark': 'dracula',
  'github-dark': 'dracula',
  'catppuccin-mocha': 'dracula',
  'tokyo-night': 'dracula',
  nord: 'dracula',
  'one-dark': 'dracula',
  'gruvbox-dark': 'dracula',
  'catppuccin-latte': 'github-light',
  'solarized-light': 'github-light',
  system: 'dracula',
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

export function applyTheme(id: string): void {
  const themeId = migrateThemeId(id)
  const root = document.documentElement

  root.dataset.theme = themeId
  root.style.colorScheme = getTheme(themeId)?.dark === false ? 'light' : 'dark'
}
