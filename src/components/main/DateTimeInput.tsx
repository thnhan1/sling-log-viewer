import { useEffect, useRef, useState } from 'react'
import { IconCalendar, IconX } from '../../ui/icons'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

/**
 * Modern datetime picker with seconds precision.
 * Click the trigger to open a popover with separate date + time (HH:MM:SS) inputs.
 */
export function DateTimeInput({ value, onChange, placeholder = 'Select time...' }: Props) {
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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
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

  const display = value
    ? formatDisplay(value)
    : ''

  return (
    <div ref={ref} className="relative shrink-0">
      {/* Trigger */}
      <button
        type="button"
        className={`input-macos flex items-center gap-2 w-[175px] cursor-pointer text-left transition-all ${
          open ? 'border-accent shadow-[0_0_0_3px_rgba(10,132,255,0.16)]' : ''
        } ${!display ? 'text-muted' : 'text-text'}`}
        onClick={() => setOpen((o) => !o)}
        title={value || placeholder}
      >
        <IconCalendar size={13} className="shrink-0 opacity-40" />
        <span className={`truncate flex-1 text-ui-sm ${!display ? '' : ''}`}>
          {display || placeholder}
        </span>
        {value && (
          <span
            className="shrink-0 text-muted hover:text-text text-ui leading-none w-4 h-4 flex items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.12)] transition-colors"
            onClick={(e) => { e.stopPropagation(); clear() }}
            title="Clear"
          >
            <IconX size={11} />
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-[70] rounded-xl glass-modal border border-[rgba(255,255,255,0.10)] shadow-2xl p-4 w-[248px]">
          <div className="space-y-3">
            {/* Date */}
            <div>
              <label className="block mb-1 text-ui-xs font-medium text-muted uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                className="input-macos w-full"
                value={dateStr}
                onChange={(e) => { setDateStr(e.target.value); setHasEdited(true) }}
                onKeyDown={(e) => { if (e.key === 'Enter') commit(dateStr, timeStr) }}
                autoFocus
              />
            </div>

            {/* Time with seconds */}
            <div>
              <label className="block mb-1 text-ui-xs font-medium text-muted uppercase tracking-wider">
                Time
              </label>
              <input
                type="time"
                step="1"
                className="input-macos w-full"
                value={timeStr}
                onChange={(e) => { setTimeStr(e.target.value); setHasEdited(true) }}
                onKeyDown={(e) => { if (e.key === 'Enter') commit(dateStr, timeStr) }}
              />
              <p className="mt-0.5 text-ui-xs text-muted">HH:MM:SS · seconds precision</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[rgba(255,255,255,0.06)]">
              <button type="button" className="btn-macos text-ui-sm" onClick={clear}>
                Clear
              </button>
              <button
                type="button"
                className="btn-macos btn-macos--primary text-ui-sm"
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
