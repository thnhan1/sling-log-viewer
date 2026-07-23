import type { LogSource } from './types.js'
import type { RemoteConfig } from './RemoteSlingLogSource.js'
import { LocalLogSource } from './LocalLogSource.js'
import { RemoteSlingLogSource } from './RemoteSlingLogSource.js'

export type SourceMode = 'local' | 'remote'

let currentMode: SourceMode = 'local'
let localRootPath: string | null = null
let remoteConfig: RemoteConfig | null = null
let currentSource: LogSource | null = null

export function getSourceMode(): SourceMode {
  return currentMode
}

export function setSourceMode(mode: SourceMode): void {
  currentMode = mode
  currentSource = null // force rebuild
}

export function getLocalRootPath(): string | null {
  return localRootPath
}

export function setLocalRootPath(p: string | null): void {
  localRootPath = p
  currentSource = null
}

export function getRemoteConfig(): RemoteConfig | null {
  return remoteConfig
}

export function updateRemoteConfig(config: RemoteConfig): void {
  remoteConfig = { ...config }
  currentSource = null
}

/**
 * Returns the active LogSource based on current mode and configuration.
 * Rebuilds when mode or config changes (lazy init).
 */
export function getLogSource(): LogSource {
  if (currentSource) return currentSource

  if (currentMode === 'remote' && remoteConfig) {
    currentSource = new RemoteSlingLogSource(remoteConfig)
    return currentSource
  }

  if (currentMode === 'local' && localRootPath) {
    currentSource = new LocalLogSource(localRootPath)
    return currentSource
  }

  // Fallback: local source with no root (will error on use)
  currentSource = new LocalLogSource(localRootPath ?? '')
  return currentSource
}
