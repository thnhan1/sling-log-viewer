import path from 'node:path'
import dotenv from 'dotenv'

/**
 * Load `.env` from the current working directory (where `npm run dev` / `npm start` is run).
 */
export function loadEnvFromCwd(): void {
  dotenv.config({ path: path.join(process.cwd(), '.env') })
}

export function getEnvLogRoot(): string | null {
  const raw = process.env.LOG_ROOT ?? process.env.AEM_LOG_ROOT ?? ''
  const t = raw.trim()
  return t.length > 0 ? t : null
}

export function getEnvAemUrl(): string | null {
  const raw = process.env.AEM_UAT_URL ?? ''
  const t = raw.trim()
  return t.length > 0 ? t : null
}

export function getEnvAemUser(): string | null {
  const raw = process.env.AEM_UAT_USER ?? ''
  const t = raw.trim()
  return t.length > 0 ? t : null
}

export function getEnvAemPass(): string | null {
  const raw = process.env.AEM_UAT_PASS ?? ''
  const t = raw.trim()
  return t.length > 0 ? t : null
}

export function getEnvAemLogFiles(): string[] {
  const raw = process.env.AEM_LOG_FILES ?? ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
