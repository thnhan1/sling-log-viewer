/**
 * Central localStorage keys + one-release migration from the old
 * `aem-log-viewer-*` namespace.
 */

export const STORAGE_KEYS = {
  ui: 'slingtail-ui',
  logRoot: 'slingtail-log-root',
  sidebarOpen: 'slingtail-sidebar-open',
  remotePrefs: 'slingtail-remote-prefs',
  bookmarks: 'slingtail-bookmarks',
  workspacePrefix: 'slingtail-workspace:v2',
} as const

export const LEGACY_STORAGE_KEYS = {
  ui: 'aem-log-viewer-ui',
  logRoot: 'aem-log-viewer-log-root',
  sidebarOpen: 'aem-log-viewer-sidebar-open',
  remotePrefs: 'aem-log-viewer-remote-prefs',
  bookmarks: 'aem-log-viewer-bookmarks',
  workspacePrefix: 'aem-log-viewer-workspace:v2',
} as const

export function getWorkspaceKey(namespace: string): string {
  return `${STORAGE_KEYS.workspacePrefix}:${namespace || '__default__'}`
}

export function getLegacyWorkspaceKey(namespace: string): string {
  return `${LEGACY_STORAGE_KEYS.workspacePrefix}:${namespace || '__default__'}`
}

/**
 * Read the new key; if missing, copy the legacy value forward. The legacy key
 * is intentionally kept for one release so a downgrade does not lose state.
 */
export function readMigrated(key: string, legacyKey: string): string | null {
  try {
    const current = localStorage.getItem(key)
    if (current !== null) return current

    const legacy = localStorage.getItem(legacyKey)
    if (legacy !== null) {
      localStorage.setItem(key, legacy)
    }
    return legacy
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore quota/security errors */
  }
}
