export type LogWsMsg =
  | { type: 'error'; message: string }
  | { type: 'subscribed'; file: string }
  | { type: 'tail'; file: string; chunk: string; toByte: number; fileSize: number; truncated: boolean }
  | { type: 'append'; file: string; chunk: string; fromByte: number; toByte: number; fileSize: number }
  | { type: 'rotated'; file: string; reason: 'truncated' | 'renamed' }
  | { type: 'pong' }

export function makeLogWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
}

export function tryParseLogWsMsg(raw: string): LogWsMsg | null {
  try {
    const v = JSON.parse(raw) as { type?: unknown }
    if (!v || typeof v !== 'object') return null
    if (typeof v.type !== 'string') return null
    return v as LogWsMsg
  } catch {
    return null
  }
}

