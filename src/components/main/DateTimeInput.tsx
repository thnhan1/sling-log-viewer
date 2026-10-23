import { useEffect, useRef, useState } from 'react'
import { IconCalendar, IconX } from '../../ui/icons'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

/**
 * Compact datetime picker with seconds precision.
 * Click the trigger to open a popover with separate date + time inputs.
 */
export function DateTimeInput({ value, onChange, placeholder = 'Select time…' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Parse current value into date + time parts
  const parsed = parseValue(value)

  const [dateStr, setDateStr] = useState(parsed.date)
  const [timeStr, setTimeStr] = useState(parsed.time)
  const [hasEdited, setHasEdited] = useState(false)

  // Sync internal state when value prop changes externally
  useEffect(() => {
    if (!open) {
      const p = parseValue(value)
      setDateStr(p.date)
      setTimeStr(p.time)
      setHasEdited(false)
    }
  }, [value, open])

  const commit = (d: string, t: string) => {
    if (d && t) {
      onChange(`${d}T${t}`)
    } else if (d) {
      onChange(`${d}T00:00:00`)
    }
    setHasEdited(true)
    setOpen(false)
  }

  const clear = () => {
    onChange('')
    setDateStr('')
    setTimeStr('')
    setHasEdited(false)
    setOpen(false)
  }

  const display = value ? formatDisplay(value) : ''

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        className={`field flex h-7 w-[142px] cursor-pointer items-center gap-1.5 px-2 text-left ${
          !display ? 'text-tertiary' : 'text-text'
        }`}
        onClick={() => setOpen((o) => !o)}
        title={value || placeholder}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <IconCalendar size={12} className="shrink-0 text-tertiary" />
        <span className="min-w-0 flex-1 truncate text-[11px]">{display || placeholder}</span>
        {value && <IconX size={10} className="shrink-0 text-tertiary" />}
      </button>

      {open && (
        <div className="popover absolute left-0 top-full z-[70] mt-1.5 w-[248px] p-3" role="dialog">
          <div className="space-y-3">
            <div>
              <label className="label mb-1 block">Date</label>
              <input
                type="date"
                className="field h-7"
                value={dateStr}
                onChange={(e) => {
                  setDateStr(e.target.value)
                  setHasEdited(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit(dateStr, timeStr)
                }}
                autoFocus
              />
            </div>

            <div>
              <label className="label mb-1 block">Time</label>
              <input
                type="time"
                step="1"
                className="field h-7"
                value={timeStr}
                onChange={(e) => {
                  setTimeStr(e.target.value)
                  setHasEdited(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit(dateStr, timeStr)
                }}
              />
              <p className="mt-1 text-[10px] text-tertiary">HH:MM:SS · seconds precision</p>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
                Clear
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => commit(dateStr, timeStr)}
                disabled={!hasEdited && !value}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Parse ISO datetime string into { date, time } with seconds support. */
function parseValue(v: string): { date: string; time: string } {
  if (!v) return { date: '', time: '' }
  // Try ISO: 2024-01-15T14:35:22 or 2024-01-15T14:35
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)?/)
  if (m) return { date: m[1], time: m[2] || '00:00:00' }
  // Fallback: try parsing as date
  const d = new Date(v)
  if (Number.isFinite(d.getTime())) {
    const pad = (n: number, w = 2) => String(n).padStart(w, '0')
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    }
  }
  return { date: '', time: '' }
}

/** Format ISO string for display in the trigger. */
function formatDisplay(v: string): string {
  const { date, time } = parseValue(v)
  if (!date) return ''
  const t = time || '00:00:00'
  return `${date} ${t}`
}
