import type { LogLevel } from '@shared/types'

export const LEVELS: LogLevel[] = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'UNKNOWN']

export const LEVEL_CLASS: Record<LogLevel, string> = {
  ERROR: 'text-error',
  WARN: 'text-warning',
  INFO: 'text-info',
  DEBUG: 'text-debug',
  TRACE: 'text-trace',
  UNKNOWN: 'text-muted',
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function fontStackSelectValue(
  stack: string,
  presets: { id: string; stack: string }[],
  customId: string,
): string {
  const row = presets.find((p) => p.stack === stack)
  if (row) return row.id
  if (!stack.trim()) return 'default'
  return customId
}
