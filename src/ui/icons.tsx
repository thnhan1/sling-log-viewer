/**
 * SVG icon set — Lucide-style stroke icons.
 * All icons are 24×24, stroke-based, currentColor, zero dependencies.
 * Factory pattern keeps definitions compact.
 */
import type { SVGProps } from 'react'

type IconComponent = (props: SVGProps<SVGSVGElement> & { size?: number }) => JSX.Element

/** Stroke-based icon factory (24×24 viewBox). */
function strokeIcon(d: JSX.Element): IconComponent {
  return ({ size = 16, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {d}
    </svg>
  )
}

// ══════════════════════════════════════════════════
// Brand
// ══════════════════════════════════════════════════

export const IconLogo = strokeIcon(
  <>
    <path d="M4 7h8M4 12h6M4 17h8" />
    <path d="m16 8 3 4-3 4" />
  </>,
)

// ══════════════════════════════════════════════════
// Navigation
// ══════════════════════════════════════════════════

export const IconChevronDown = strokeIcon(
  <path d="m6 9 6 6 6-6" />,
)
export const IconChevronRight = strokeIcon(
  <path d="m9 18 6-6-6-6" />,
)
export const IconChevronLeft = strokeIcon(
  <path d="m15 18-6-6 6-6" />,
)
export const IconSidebarCollapse = strokeIcon(
  <>
    <rect width={18} height={18} x={3} y={3} rx={2} />
    <path d="M9 3v18m7-6-3-3 3-3" />
  </>,
)
export const IconSidebarExpand = strokeIcon(
  <>
    <rect width={18} height={18} x={3} y={3} rx={2} />
    <path d="M15 3v18M8 9l3 3-3 3" />
  </>,
)

// ══════════════════════════════════════════════════
// Actions
// ══════════════════════════════════════════════════

export const IconGear = strokeIcon(
  <>
    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
    <circle cx={12} cy={12} r={3} />
  </>,
)
export const IconSearch = strokeIcon(
  <>
    <circle cx={11} cy={11} r={8} />
    <path d="m21 21-4.3-4.3" />
  </>,
)
export const IconX = strokeIcon(
  <path d="M18 6 6 18M6 6l12 12" />,
)
export const IconPlus = strokeIcon(
  <>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </>,
)
export const IconTrash = strokeIcon(
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </>,
)
export const IconSync = strokeIcon(
  <>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </>,
)
export const IconArrowUp = strokeIcon(
  <path d="m5 12 7-7 7 7M12 19V5" />,
)
export const IconArrowDown = strokeIcon(
  <path d="M12 5v14m7-7-7 7-7-7" />,
)
export const IconPencil = strokeIcon(
  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4" />,
)

// ══════════════════════════════════════════════════
// Status / Indicators
// ══════════════════════════════════════════════════

export const IconStar = strokeIcon(
  <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
)
export const IconStarFill = strokeIcon(
  <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />,
)
export const IconDotFill = strokeIcon(
  <circle cx={12} cy={12} r={4} fill="currentColor" stroke="none" />,
)
export const IconClock = strokeIcon(
  <>
    <circle cx={12} cy={12} r={10} />
    <path d="M12 6v6l4 2" />
  </>,
)
export const IconCalendar = strokeIcon(
  <>
    <path d="M8 2v4m8-4v4" />
    <rect width={18} height={18} x={3} y={4} rx={2} />
    <path d="M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </>,
)
export const IconFilter = strokeIcon(
  <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />,
)
export const IconBookmark = strokeIcon(
  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
)
export const IconAlert = strokeIcon(
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4M12 17h.01" />
  </>,
)

// ══════════════════════════════════════════════════
// Settings / Categories
// ══════════════════════════════════════════════════

export const IconTypography = strokeIcon(
  <path d="m15 16 2.536-7.328a1.02 1.02 0 1 1 1.928 0L22 16m-6.303-2h5.606M2 16l4.039-9.69a.5.5 0 0 1 .923 0L11 16m-7.696-3h6.392" />,
)
export const IconPaintbrush = strokeIcon(
  <>
    <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
    <circle cx={13.5} cy={6.5} r={0.5} fill="currentColor" stroke="none" />
    <circle cx={17.5} cy={10.5} r={0.5} fill="currentColor" stroke="none" />
    <circle cx={6.5} cy={12.5} r={0.5} fill="currentColor" stroke="none" />
    <circle cx={8.5} cy={7.5} r={0.5} fill="currentColor" stroke="none" />
  </>,
)
export const IconKeyboard = strokeIcon(
  <>
    <path d="M10 8h.01M12 12h.01M14 8h.01M16 12h.01M18 8h.01M6 8h.01M7 16h10m-9-4h.01" />
    <rect width={20} height={16} x={2} y={4} rx={2} />
  </>,
)
export const IconTerminal = strokeIcon(
  <>
    <path d="m4 17 6-6-6-6" />
    <path d="M12 19h8" />
  </>,
)

// ══════════════════════════════════════════════════
// Additional actions
// ══════════════════════════════════════════════════

export const IconFolder = strokeIcon(
  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
)
export const IconPlug = strokeIcon(
  <>
    <path d="M12 22v-5" />
    <path d="M9 8V2" />
    <path d="M15 8V2" />
    <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
  </>,
)
export const IconMoreHorizontal = strokeIcon(
  <>
    <circle cx={5} cy={12} r={1} fill="currentColor" stroke="none" />
    <circle cx={12} cy={12} r={1} fill="currentColor" stroke="none" />
    <circle cx={19} cy={12} r={1} fill="currentColor" stroke="none" />
  </>,
)
export const IconCopy = strokeIcon(
  <>
    <rect width={14} height={14} x={8} y={8} rx={2} />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>,
)
export const IconArrowDownToLine = strokeIcon(
  <>
    <path d="M12 17V3" />
    <path d="m6 11 6 6 6-6" />
    <path d="M19 21H5" />
  </>,
)
export const IconInfo = strokeIcon(
  <>
    <circle cx={12} cy={12} r={10} />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </>,
)
export const IconCheck = strokeIcon(
  <path d="M20 6 9 17l-5-5" />,
)
