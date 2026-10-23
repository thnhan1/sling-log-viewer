# Slingtail — Rebrand Plan

**Working product name:** Slingtail  
**Design direction:** “Quiet Terminal” — a Grok-inspired, monochrome, flat, low-chrome UI for a developer log viewer  
**Scope:** Front-end rebrand + brand identity. No backend or API changes.  
**Estimated effort:** ~7 developer-days across 6 phases.


---

## 1. Executive summary

The app currently reads as a “macOS-themed developer dashboard”: glass panels, fake traffic lights, saturated Apple-blue accents, 13 colorful themes, four stacked toolbars, and repeated status information. The goal is a modern, clean, minimal UI in the spirit of the new Grok desktop app, without sacrificing the density and speed that make a log viewer useful.

The rebrand is built on five moves:

1. **Monochrome first.** Near-black / off-white surfaces, one white accent, color reserved for log severity and syntax.
2. **Flat, not glassy.** Remove `backdrop-filter`, translucency, gradients, and decorative shadows.
3. **Less chrome.** Merge four stacked bars into three: top bar, command bar, status bar.
4. **Type does the work.** A restrained type scale, a single sans family, a single mono family, generous spacing.
5. **A real identity.** A new monochrome mark, wordmark, copy voice, page metadata, and storage-key migration.

The rebrand is delivered in phases so the app remains shippable after every phase.

---

## 2. Goals and non-goals

### Goals

- Give the product a coherent, modern visual identity.
- Reduce visual noise and improve scanability of log lines.
- Make the UI feel calm and “quiet”, like a native AI desktop app.
- Keep 100% of existing functionality: local/remote sources, WebSocket tailing, tabs, filtering, search, bookmarks, settings, auto-scroll.
- Improve accessibility and keyboard navigation along the way.
- Make future theming cheaper by consolidating tokens.

### Non-goals

- No changes to Express routes, WebSocket protocol, log parsing, or remote AEM behavior.
- No rewrite of the virtualizer or data layer.
- No Electron/Tauri packaging in this project.
- No new major product features. An optional command palette (`Ctrl/Cmd+K`) is a stretch goal.
- No removal of the log viewer’s dense, power-user behavior.

---

## 3. Design direction — “Quiet Terminal”

### 3.1 Principles

| Principle | What it means in this app |
|---|---|
| **Monochrome first** | Chrome is grayscale. Color appears only on severity, syntax, and destructive actions. |
| **One accent** | White is the primary action color in dark mode; near-black in light mode. No blue decoration. |
| **Flat surfaces** | Layered grays and 1px hairlines instead of blur, gradients, and glow. |
| **Quiet chrome** | Toolbars recede. The log content is the hero. |
| **Precision** | 4px spacing grid, aligned gutters, tabular numbers, consistent icon strokes. |
| **Motion is confirmation** | 120–180 ms ease-out transitions only. No bounce, spring, or parallax. |
| **Content over controls** | Controls appear when relevant; destructive actions live in an overflow menu. |

### 3.2 What we borrow from Grok desktop

- Stark near-black background with soft off-white text.
- Very few borders; when present, they are hairlines.
- Large areas of negative space around a focused work surface.
- White primary buttons with black text.
- Small, quiet icon buttons.
- A slim sidebar with simple text rows and a single selected state.
- No decorative window chrome, no glass, no rainbow accents.
- Minimal status language: “Live”, “Paused”, “Connected”.

### 3.3 What we deliberately keep

- Dense monospace log rendering.
- Severity colors (desaturated, accessible).
- Virtual scrolling, wrapping long lines, search match navigation.
- The existing font-size and font-family settings.
- The local/remote source model.

---

## 4. Brand layer

### 4.1 Product name

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **Slingtail** | Short, memorable, combines “Sling” + “tail -f”; feels like a developer product | Slightly playful; needs a subtitle for clarity | **Recommended** |
| **Sling Logs** | Immediately descriptive; safe | Generic; may imply official Apache project | Fallback |
| **AEM Log Viewer** | Zero migration cost | Not a brand; ties the product to one platform | Keep only as a subtitle |

**Recommended lockup:** `slingtail` lowercase wordmark, with the descriptor `Sling / AEM log viewer` used in metadata, the About panel, and the README. Do not put “Apache” in the product name.

### 4.2 Logo and favicon

Retire the current colorful magnifier + gradient “AEM” logo.

**Mark concept:** a geometric monogram built from a log stream: three descending horizontal bars crossed by a small `>` chevron, or a bracket `[` + caret. One color (`currentColor`), 1.5px strokes, legible at 16px. It should work on both black and white.

**Deliverables:**

- `public/brand/mark.svg` — 24×24 monochrome mark.
- `public/brand/mark-16.png`, `mark-32.png`, `apple-touch-icon.png` (180×180).
- `public/brand/og.png` — 1200×630 social card with wordmark on near-black.
- `favicon.svg` + PNG fallback in `index.html`.
- A short logo usage note in `docs/` (clear space, minimum size, don’t recolor).

### 4.3 Voice and copy

- Sentence case, not Title Case.
- Short verbs: “Choose folder”, “Connect”, “Disconnect”, “Search logs”, “Clear view”, “Copy path”.
- No exclamation marks. No “Oops!”. No cute loading copy.
- Status language: `Live`, `Paused`, `Connecting…`, `Connected`, `Not connected`, `Reconnecting…`.
- Destructive actions name the object: “Clear error.log…” not “Are you sure?”.
- Prefer “log file” over “file”; “source” over “mode”.

### 4.4 Metadata

Update:

- `index.html` `<title>` → `Slingtail — Sling / AEM log viewer`.
- `<meta name="description">`, `theme-color` (dark and light via media query), Open Graph tags.
- `package.json` `name` → `slingtail`, `description` → `A modern, minimal log viewer for Apache Sling and AEM`.
- `server/index.ts` startup line → `Slingtail running at http://127.0.0.1:3333`.
- `README.md` title, screenshot, feature names, and About copy.

---

## 5. Visual system

### 5.1 Color tokens

All values live in one place. Components must use tokens, never raw `rgba(...)` or hex values.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#08080A` | `#FFFFFF` | App canvas |
| `--surface` | `#0C0C0F` | `#FAFAFA` | Sidebar, top bar |
| `--surface-raised` | `#121216` | `#F4F4F5` | Inputs, cards, popovers |
| `--surface-hover` | `#17171C` | `#EFEFF1` | Hover / selected row |
| `--border` | `#1F1F25` | `#E6E6E9` | Hairline dividers |
| `--border-strong` | `#2C2C34` | `#D4D4D8` | Focused input, active tab |
| `--text` | `#F2F2F3` | `#0B0B0D` | Primary text |
| `--text-secondary` | `#9A9AA3` | `#5F5F68` | Secondary text |
| `--text-tertiary` | `#66666F` | `#8A8A93` | Timestamps, hints, line numbers |
| `--accent` | `#FFFFFF` | `#0B0B0D` | Primary button, active marker |
| `--accent-contrast` | `#08080A` | `#FFFFFF` | Text on accent |
| `--focus-ring` | `rgba(255,255,255,0.40)` | `rgba(0,0,0,0.35)` | `:focus-visible` ring |
| `--selection` | `rgba(255,255,255,0.10)` | `rgba(0,0,0,0.07)` | Text selection, active row |
| `--highlight` | `rgba(255,255,255,0.16)` | `rgba(0,0,0,0.10)` | Search highlight |
| `--highlight-strong` | `rgba(255,255,255,0.26)` | `rgba(0,0,0,0.16)` | Active search match |

Rules:

- No blue accent in chrome. Blue appears only in muted syntax tokens and severity.
- No pure `#000` / `#FFF` pairs except the accent button.
- No `backdrop-filter`.
- No gradient backgrounds.
- No shadows on bars, cards, or buttons. Shadows only on popovers/dialogs.

### 5.2 Severity colors

Desaturated so they read as information, not decoration.

| Level | Dark | Light | Notes |
|---|---|---|---|
| `ERROR` | `#F07373` | `#B42318` | Coral red; 500 weight |
| `WARN` | `#E0B15C` | `#8A5A00` | Muted amber |
| `INFO` | `#82B4D8` | `#1D5F84` | Steel blue |
| `DEBUG` | `#8DBB9A` | `#2F6B3A` | Sage |
| `TRACE` | `#7C7C86` | `#6B7280` | Gray |
| `UNKNOWN` | `--text-secondary` | `--text-secondary` | Neutral |

Keep the textual `*ERROR*` label. Color is never the only signal.

### 5.3 Log syntax colors

Reduce the rainbow to four muted hues plus grayscale.

| Token | Dark | Light | Use |
|---|---|---|---|
| Timestamp | `#66666F` | `#8A8A93` | Gutter / timestamp |
| Thread | `#8C8C96` | `#5F5F68` | Thread names |
| Message | `#E8E8EA` | `#1A1A1E` | Default log text |
| Method | `#F2F2F3` (500) | `#0B0B0D` (500) | GET/POST |
| Path | `#9DB8D8` | `#2F5F87` | URLs, resource paths |
| FQCN | `#B9A8D8` | `#5B3F87` | Java class names |
| String | `#A8C7A0` | `#2F6B3A` | Quoted strings |
| Number | `#B8A8D8` | `#5B3F87` | Numbers, durations |
| Exception | `#E89A9A` | `#B42318` | Exception classes |
| Bracket / operator | `#66666F` | `#8A8A93` | `[`, `]`, `=` |

### 5.4 Typography

**UI:** Inter (self-hosted variable) or the system UI stack.  
**Logs:** JetBrains Mono (self-hosted) or the system mono stack.

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Display / empty-state headline | 24px | 500 | 1.2 | `-0.02em` |
| Section title | 15px | 500 | 1.3 | `-0.01em` |
| UI body | 13px | 400 | 1.45 | `0` |
| UI small | 12px | 400 | 1.4 | `0` |
| Label / overline | 10px | 500 | 1.2 | `0.08em`, uppercase |
| Log text | 13px | 400 | 20px | `0` |
| Log small | 11.5px | 400 | 18px | `0` |
| Kbd | 10px | 500 | 1 | `0.02em` |

Rules:

- Only weights 400 and 500. No 600/700 except the wordmark if needed.
- UI and log font sizes remain user-configurable; the new baselines are UI 13px and log 13px.
- Use `font-variant-numeric: tabular-nums` for all counts, sizes, line numbers, and timestamps.
- Prefer self-hosted fonts to avoid Google Fonts flicker and offline failure. Suggested packages: `@fontsource-variable/inter`, `@fontsource/jetbrains-mono`.

### 5.5 Spacing, radius, elevation, motion

- **Spacing:** 4px base. Use 4, 8, 12, 16, 24, 32, 48.
- **Radius:** 6px controls, 8px buttons/inputs, 12px cards/dialogs, 999px status pills.
- **Borders:** 1px only. No 2px borders except the active tab underline.
- **Elevation:** none on bars/cards. Popover/dialog: `0 16px 48px rgba(0,0,0,0.45)`.
- **Motion:** `120ms` for color/opacity, `180ms` for transform, `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Reduced motion:** disable all non-essential transitions under `prefers-reduced-motion: reduce`.

### 5.6 Iconography

- 24×24 viewBox, `stroke-width: 1.5`, round caps/joins (currently 2).
- Default rendered size 16px; 14px in dense controls; 18–20px in empty states.
- Add: folder, plug, more-horizontal, arrow-down-to-line, copy, check, sun, moon, monitor, panel-left, command, circle.
- Icon-only buttons must have `aria-label` and a tooltip via `title`.

---

## 6. Layout and information architecture

### 6.1 Before vs after

**Current:** four stacked bars plus a fake macOS title bar.

```
[traffic lights] [sidebar] [tabs..........................]
[per-tab stats ....... Bottom  Clear  Clear file  Refresh  ⚙]
[search] [prev/next] [From] to [To] [Top] [bookmarks]
[log canvas]
[status bar: UTF-8 | file | lines | size ......... ● Tail]
```

**Target:** three bars, no decorative chrome.

```
┌──────────────┬─────────────────────────────────────────────────────┐
│ slingtail    │ [error.log ×] [request.log ×]   ● Live  ↻  ⋯  ⚙   │ 44px
│              ├─────────────────────────────────────────────────────┤
│ ● Local      │ ⌘K  Search logs        ERROR WARN INFO …  Any time  │ 40px
│   /logs      │                                      3/47 ↑ ↓  ☆   │
│              ├─────────────────────────────────────────────────────┤
│ FILES        │                                                     │
│  error.log   │  log canvas                                         │
│  request.log │                                                     │
│              │                                                     │
│              │                                                     │
│ ⚙ Settings   ├─────────────────────────────────────────────────────┤
└──────────────┴─ error.log · 2,997 lines · 999 B · UTF-8 · Live ────┘ 22px
```

### 6.2 App shell

- Switch from absolute sidebar + `margin-left` to a flex shell: sidebar (fixed width) + main column.
- Sidebar width: `248px` desktop, `280px` overlay on narrow screens.
- Sidebar transition: width/opacity, 180ms. Do not use `pointer-events: none` alone; set `inert` and `aria-hidden` when closed.
- Remove the three fake traffic lights. The app is a web app; fake window controls are misleading.
- Background: `--bg`; sidebar: `--surface`; divider: 1px `--border`.

### 6.3 Sidebar

**Structure:**

1. **Brand row** (44px): mark + `slingtail` wordmark, sidebar collapse icon on the right.
2. **Source row**: status dot + `Local` / `Remote` + path/host, chevron. Click opens Settings → Connection. No always-visible folder input.
3. **Files section**: search field (only when needed), scrollable file list.
4. **Bottom**: Settings button.

**File rows:**

- Height 30px, 8px horizontal padding, 6px radius.
- Name left, size right (12px, tertiary).
- Selected: `--surface-hover`, text primary, 2px left white marker.
- Hover: `--surface-hover` at 60% opacity.
- Empty state: small, muted, actionable (“Choose a folder” / “Connect to AEM”).
- Remove the collapsible “Folder” and “Levels” sections. Levels move to the command bar; folder lives in Settings.
- Remove the duplicate “Log Viewer” label and Local/Remote segmented control.

### 6.4 Top bar and tabs

**Top bar (44px):**

- Left: sidebar toggle (icon button), then the tab strip.
- Tab: filename, close button on hover/active, active state = text primary + 1.5px bottom white underline; inactive = secondary text.
- Right: live status pill (`● Live` / `Paused` / `Reconnecting…`), refresh icon, overflow menu (`⋯`), settings icon.
- No per-tab statistics row. Move counts to the status bar.
- Overflow menu: `Clear view`, `Copy path`, `Clear file…` (danger, local only), `Reload tail`.
- When no tab is open: muted “No file open” in the tab strip.

### 6.5 Command bar (40px)

Replaces `LogFilterBar` and the per-tab header actions.

- **Search field** (flex): search icon, placeholder “Search logs”, keyboard hint `⌘F` / `Ctrl F` on the right. Enter = next, Shift+Enter = previous.
- **Match controls:** `3 / 47` with up/down icon buttons. Editable ordinal input on click.
- **Divider.**
- **Level filters:** compact toggle group with a colored dot + label. Use `aria-pressed`. On narrow screens, collapse to a “Levels” popover.
- **Time range:** button labeled “Any time” or the active range; opens the existing `DateTimeInput` popover. Active range gets a subtle border and a clear button.
- **Bookmarks:** icon + count; opens a popover, not an expanding block that pushes the canvas down.
- **Filters summary:** if any filter is active, show a single `Filters · 2` chip with a clear-all action.

### 6.6 Log canvas

- Background `--bg`, horizontal padding 12px, vertical padding 4px.
- Gutter: 44–48px, right-aligned, tertiary, tabular numbers. Keep line numbers.
- Bookmark affordance: 20px rail, star only visible on row hover or when bookmarked. Do not reserve a permanent high-contrast column.
- Row height: 22px (update `estimateSize` in `VirtualLogLines` from 20 to 22).
- Hover: `--surface-hover` at 50%.
- Search hit: `--highlight` row background; active hit: `--highlight-strong` plus a 1px `--accent` inset ring.
- Severity: colored `*LEVEL*` label; optional 2px severity bar in the gutter for ERROR/WARN behind a setting (off by default).
- Cause/stack lines: 2px left border in `--border-strong`, 12px indent, slightly muted.
- Empty filtered state: centered, muted, with a “Clear filters” text button. No left-aligned `<p>`.
- When the user scrolls up, show a floating pill at bottom-center: `Jump to latest ↓`. Remove the “Bottom” button from the header.

### 6.7 Status bar

- 22px, `--surface`, top hairline, 11px tertiary text.
- Left: filename · line count · file size · encoding.
- Right: `Live` with a 4px dot, or `Paused` / `Reconnecting…`.
- Remove duplicated stats from the top bar.
- On narrow screens, hide encoding and size; keep filename and live state.

### 6.8 Empty state and onboarding

The current empty state is a sentence. Replace it with a calm welcome surface:

```
        [mark]
        Open a log to begin
        Choose a folder of .log files, or connect to an AEM instance.

        [ Choose folder ]   [ Connect to AEM ]
        ⌘B sidebar   ⌘F search   ⌘K commands
```

- Primary button: white in dark mode, black in light mode.
- Secondary: ghost with hairline border.
- If a folder is already configured, show recent files instead of the marketing copy.
- Add a small “Local / Remote” radio or segmented control inside the connect flow, not on the main screen.

### 6.9 Settings and dialogs

**Settings modal:**

- 720×560 max, `--surface`, 12px radius, hairline border, no blur.
- Left nav 180px: Appearance, Connection, Keyboard, About.
- Right content: section overline + rows 44px tall.
- Appearance: theme cards (Dark, Light, System), UI font size, log font size, UI font, log font, reduce motion.
- Connection: Local folder and Remote AEM in one flow, with a source toggle, credential fields, tracked files, connect/disconnect, read-only note.
- Keyboard: kbd rows with the same tokenized primitives.
- About: version, repo link, license, “Created by Nhan with love.”
- Footer: `Done` primary button.
- Use a proper focus trap, `aria-modal`, Escape, and return focus to the trigger.
- Move the inline `<style>` block into `index.css` or a dedicated `settings.css`.

**Confirm clear dialog:**

- 360px max, `--surface-raised`, 12px radius.
- Title “Clear error.log?”, body “This truncates the file on disk and cannot be undone.”
- Buttons: `Cancel` (ghost), `Clear file` (danger).
- Danger button: transparent red-tinted background, red text, red hairline border.

**DateTimeInput:**

- Flat popover, `--surface-raised`, 8px radius, 1px border, standard shadow.
- Inputs use the same `field` primitive.
- Keep the existing parse/commit behavior; only visual changes.

### 6.10 Responsive behavior

| Width | Behavior |
|---|---|
| ≥ 1100px | Sidebar 248px fixed; full command bar |
| 800–1099px | Sidebar 220px; time/bookmarks collapse into overflow |
| < 800px | Sidebar overlays with scrim; top bar shows brand; command bar shows search + filter icon |
| < 640px | Status bar shows filename + live only; tabs scroll horizontally |

Keep the log canvas usable at 768px. Do not hide search on mobile.

---

## 7. Technical plan

### 7.1 Token architecture

Replace the current split between `@theme` fallbacks, `:root` variables, and 80 inline variables injected by `themes.ts` with one runtime token layer.

**Recommended pattern:**

```css
@import "tailwindcss";

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-surface-hover: var(--surface-hover);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-text: var(--text);
  --color-muted: var(--text-secondary);   /* compatibility alias */
  --color-tertiary: var(--text-tertiary);
  --color-accent: var(--accent);
  --color-accent-contrast: var(--accent-contrast);
  --color-danger: var(--danger);
  --color-error: var(--sev-error);
  --color-warning: var(--sev-warning);
  --color-info: var(--sev-info);
  --color-debug: var(--sev-debug);
  --color-trace: var(--sev-trace);
  --font-sans: var(--font-ui);
  --font-mono: var(--font-log);
}

:root,
[data-theme="dark"] {
  color-scheme: dark;
  --bg: #08080a;
  --surface: #0c0c0f;
  /* ... all tokens ... */
}

[data-theme="light"] {
  color-scheme: light;
  --bg: #ffffff;
  --surface: #fafafa;
  /* ... all tokens ... */
}
```

`applyTheme(id)` becomes:

1. Resolve `system` to `dark` or `light` via `matchMedia`.
2. Set `document.documentElement.dataset.theme`.
3. Set `color-scheme` (CSS handles it).
4. Listen for `prefers-color-scheme` changes while in `system`.

This removes ~80 inline style properties, avoids FOUC drift, and makes theme changes instant.

To prevent a flash of the wrong theme, add a tiny inline script in `index.html` that reads the persisted theme and sets `data-theme` before the app bundle loads. Keep `main.tsx` pre-application as a fallback.

#### Compatibility aliases (temporary)

Existing components already use Tailwind utilities such as `bg-bg`, `bg-statusbar`, `text-muted`, `text-line-num`, `border-border`, `text-error`, and `lv-search-*`. Keep these names working during the migration by mapping them to the new tokens. Remove the aliases in Phase 6 after a grep proves they are unused.

| Existing variable | New source |
|---|---|
| `--color-bg` | `--bg` |
| `--color-sidebar` | `--surface` |
| `--color-statusbar` | `--surface` |
| `--color-tab-active` | `--bg` |
| `--color-tab-inactive` | `--surface` |
| `--color-text` | `--text` |
| `--color-muted` | `--text-secondary` |
| `--color-line-num` | `--text-tertiary` |
| `--color-btn` | `--surface-hover` |
| `--color-btn-hover` | `--surface-hover` (or a 4% lighter mix) |
| `--color-btn-text` | `--text` |
| `--color-btn-primary-text` | `--accent-contrast` |
| `--color-border` | `--border` |
| `--color-input` | `--surface-raised` |
| `--color-input-border` | `--border` |
| `--color-selection` | `--selection` |
| `--color-error` | `--sev-error` |
| `--color-warning` | `--sev-warning` |
| `--color-info` | `--sev-info` |
| `--color-debug` | `--sev-debug` |
| `--color-trace` | `--sev-trace` |
| `--color-danger` | `--danger` |
| `--color-hl-bg` | `--highlight` |
| `--color-hl-text` | `--text` |
| `--lv-search-mark-bg` | `--highlight` |
| `--lv-search-row-bg` | `--highlight` at low alpha |
| `--lv-search-active-bg` | `--highlight-strong` |
| `--lv-search-active-ring` | `--accent` |
| `--color-log-*` | syntax tokens |
| `--color-bracket` / `--color-method` / `--color-path` / `--color-fqcn` | syntax tokens |
| `--theme-scrollbar-thumb` / `--theme-scrollbar-thumb-hover` | scrollbar tokens |
| `--theme-glass-*` | **delete** (no replacement) |

### 7.2 Theme system

- Reduce to three themes: `dark`, `light`, `system`.
- Default: `dark`.
- Keep `getAllThemes()` and `getTheme()` APIs so the Settings UI and existing imports do not break.
- Move the 13 legacy palettes to `themes.legacy.ts` only if the team decides to preserve them. Recommended: remove them from the picker and keep the palettes out of the bundle.
- Migration: if a persisted theme id is in the old dark set, map to `dark`; otherwise map to `light`; unknown ids map to `dark`.
- Rename `macos-dark` → `dark`, `github-light` → `light`, and treat `system` as a new mode.

### 7.3 CSS primitives

Add a small primitive layer so components stop composing raw rgba values:

```css
.btn {
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-control);
  font-size: 13px;
  font-weight: 500;
  transition: background-color 120ms var(--ease);
}
.btn-primary {
  background: var(--accent);
  color: var(--accent-contrast);
}
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn-ghost:hover {
  background: var(--surface-hover);
  color: var(--text);
}
.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.field {
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-raised);
  color: var(--text);
  padding: 0 10px;
}
.field:focus-visible {
  outline: none;
  border-color: var(--border-strong);
  box-shadow: 0 0 0 3px var(--focus-ring);
}
```

Keep `btn-macos` and `input-macos` as compatibility aliases for one PR, then remove them. Rename `glass-*` to nothing: delete those classes and their variables.

### 7.4 Hardcoded color cleanup

There are ~58 raw `rgba(...)` matches in `src/**/*.tsx`. Replace them all with tokens or primitives.

Priority:

1. `src/App.tsx` — shell, tabs, hover states.
2. `src/components/sidebar/LogSidebar.tsx` — all borders, hovers, selected rows.
3. `src/components/main/LogTabPanel.tsx` — error banner, header actions.
4. `src/components/main/LogFilterBar.tsx` — bookmarks popover, search controls.
5. `src/components/modals/SettingsModal.tsx` — largest concentration; remove inline `<style>`.
6. `src/components/main/DateTimeInput.tsx`, `ConfirmClearModal.tsx`, `StatusBar.tsx`, `LogLineRow.tsx`.

Guardrail: add a grep check to CI or a pre-commit note:

```bash
# Should return no matches outside index.css/themes
rg "rgba\(255,255,255|rgba\(10,132,255|#[0-9a-fA-F]{6}" src --glob "*.tsx"
```

### 7.5 File-by-file impact

| File | Change | Priority |
|---|---|---|
| `src/index.css` | New token layer, light/dark blocks, primitives, focus-visible, scrollbars, remove glass | P0 |
| `src/ui/themes.ts` | 3 themes, CSS-driven apply, legacy mapping, remove glass vars | P0 |
| `src/main.tsx` | Apply theme before render; update default | P0 |
| `index.html` | Title, meta, theme-color, favicon, inline theme script, fonts | P0 |
| `src/App.tsx` | New shell, top bar, tab strip, remove traffic lights, overflow menu, shortcuts | P0 |
| `src/components/sidebar/LogSidebar.tsx` | Brand header, source row, flat file list, move levels out, settings footer | P0 |
| `src/components/main/LogTabPanel.tsx` | Remove per-tab header, wire command bar, floating jump pill, actions to top bar | P0 |
| `src/components/main/LogFilterBar.tsx` | Rebuild as command bar; popovers for time/bookmarks; level toggles | P0 |
| `src/components/main/LogLineRow.tsx` | 22px rows, gutter, hover star, muted syntax, search states | P1 |
| `src/components/main/VirtualLogLines.tsx` | `estimateSize: 22`, centered empty states | P1 |
| `src/components/main/StatusBar.tsx` | Single-line minimal status, live state | P1 |
| `src/components/main/LogViewerEmptyState.tsx` | Welcome screen with actions and shortcuts | P1 |
| `src/components/main/DateTimeInput.tsx` | Flat popover and field primitive | P1 |
| `src/components/main/LogHeaderBar.tsx` | Delete (unused) | P2 |
| `src/components/modals/SettingsModal.tsx` | Restyle, 3 themes, About, focus trap, remove inline CSS | P0 |
| `src/components/modals/ConfirmClearModal.tsx` | Flat dialog, danger button | P1 |
| `src/ui/icons.tsx` | `strokeWidth` 1.5, add icons | P1 |
| `src/ui/logViewerUi.ts` | Severity token map, labels, helpers | P1 |
| `src/hooks/useUiSettings.ts` | Default theme, migration, system listener | P0 |
| `src/lib/workspaceSettings.ts` | New storage prefix + migration | P1 |
| `src/lib/bookmarks.ts` | New storage prefix + migration | P1 |
| `src/lib/storageKeys.ts` | New central key registry + `migrateLegacyKey` | P1 |
| `package.json` | Name, description, font dependencies | P1 |
| `server/index.ts` | Startup copy | P2 |
| `README.md` | Rebrand, screenshot, feature copy, About copy | P1 |
| `public/brand/*` | Mark, favicon, OG image | P1 |

### 7.6 Persistence migration

Do not silently lose user data.

New prefix: `slingtail`.

| Old key | New key | Migration |
|---|---|---|
| `aem-log-viewer-ui` | `slingtail-ui` | Map old theme id to `dark`/`light` |
| `aem-log-viewer-log-root` | `slingtail-log-root` | Copy string |
| `aem-log-viewer-sidebar-open` | `slingtail-sidebar-open` | Copy `1`/`0` |
| `aem-log-viewer-remote-prefs` | `slingtail-remote-prefs` | Copy JSON (password is never stored) |
| `aem-log-viewer-bookmarks` | `slingtail-bookmarks` | Copy JSON |
| `aem-log-viewer-workspace:v2:<ns>` | `slingtail-workspace:v2:<ns>` | Copy JSON; namespace is dynamic |

Helper:

```ts
export function readMigrated(key: string, legacyKey: string): string | null {
  try {
    const current = localStorage.getItem(key)
    if (current !== null) return current
    const legacy = localStorage.getItem(legacyKey)
    if (legacy !== null) {
      localStorage.setItem(key, legacy)
      // Keep legacy for one release so downgrade is safe.
    }
    return legacy
  } catch {
    return null
  }
}
```

For workspace keys, enumerate `localStorage` keys with the old prefix and copy each one. Keep the legacy key for one release; remove in a later cleanup PR.

Server-side `.env` names (`LOG_ROOT`, `AEM_*`, `PORT`) stay unchanged. They are operational, not brand.

### 7.7 Accessibility

- Sidebar closed: set `inert` and `aria-hidden="true"`; do not leave focusable children.
- Tabs: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`; roving tabindex; `Alt+↑/↓` to switch.
- Search: `aria-label="Search logs"`; match count in `aria-live="polite"`.
- Icons: `aria-hidden` on decorative SVGs; `aria-label` on icon-only buttons.
- Focus: visible `:focus-visible` ring on every interactive element, 2px offset.
- Dialogs: focus trap, Escape, restore focus, `aria-modal="true"`, labelled by title.
- Color contrast: body text ≥ 7:1; secondary ≥ 4.5:1; tertiary only for non-essential metadata.
- Motion: `prefers-reduced-motion` disables transitions and the modal scale.
- Hit targets: 28px minimum; 32px for primary actions.

### 7.8 Performance

- Removing `backdrop-filter` improves scroll/paint performance immediately.
- Theme changes should only swap a `data-theme` attribute, not 80 inline properties.
- Keep virtualization; update `estimateSize` to 22 and row line-height to match.
- Avoid per-row inline styles; use CSS classes.
- Self-hosted fonts: preload the two primary faces, `font-display: swap`.
- No new runtime dependencies for styling. Optional: `@fontsource-variable/inter`, `@fontsource/jetbrains-mono`.

---

## 8. Delivery plan

### Phase 0 — Design approval (0.5 day)

- Produce a static mockup of the dark shell (Figma or a single HTML page) and a light variant.
- Confirm name, accent strategy, theme scope, and tab placement.
- Sign off on tokens and the before/after wireframe.

**Exit:** approved mockup and decision log.

### Phase 1 — Foundation (1 day)

- Rewrite `src/index.css` token layer and primitives.
- Implement 3 themes in `themes.ts` + CSS.
- Update `useUiSettings` defaults and migration.
- Change icon stroke to 1.5 and add missing icons.
- Add `docs/DESIGN_TOKENS.md` if the token list grows.

**Exit:** app runs with new colors/primitives; no layout change yet; `npm run build` passes.

### Phase 2 — Shell (1.5 days)

- Rebuild `App.tsx` shell: flex layout, top bar, tab strip, overflow menu.
- Rebuild sidebar: brand, source row, files, settings footer.
- Remove traffic lights and glass classes.
- Add `inert`/ARIA for the collapsed sidebar.
- Move levels out of the sidebar.

**Exit:** dark and light shells look correct; sidebar collapse works; tabs open/close/restore.

### Phase 3 — Log workspace (1.5 days)

- Rebuild command bar with search, match controls, levels, time, bookmarks.
- Restyle log rows, gutter, hover, search highlights, severity, causes.
- Add floating “Jump to latest” pill.
- Rebuild status bar and empty/onboarding state.
- Update virtualizer row height.

**Exit:** streaming, filtering, search, bookmarks, and auto-scroll behave exactly as before; new UI states are correct.

### Phase 4 — Overlays (1 day)

- Rebuild Settings modal: Appearance, Connection, Keyboard, About.
- Rebuild Confirm Clear dialog.
- Restyle DateTimeInput popover.
- Add focus trap and return focus.
- Add a lightweight toast for copy/refresh/connect errors (optional but recommended).

**Exit:** all settings persist; remote connect/disconnect works; dialogs are keyboard-accessible.

### Phase 5 — Brand and migration (0.5 day)

- Add logo mark, favicon, OG image.
- Update `index.html`, `package.json`, `server/index.ts`, `README.md`.
- Add storage key registry and migrate localStorage keys.
- Update copy deck across the app.

**Exit:** no old brand strings remain; existing users keep their theme, tabs, bookmarks, and remote prefs.

### Phase 6 — QA and polish (1 day)

- Visual pass at 1440×900, 1280×800, 1024×768, 768px.
- Light/dark/system, min/max font sizes, 13 legacy themes if kept.
- Accessibility audit: keyboard-only, focus order, contrast, dialogs.
- Performance check: 100k-line scroll, theme switch, tab switch.
- Update screenshots and README.
- Remove dead code (`LogHeaderBar`, legacy CSS aliases).

**Exit:** acceptance criteria met; release candidate ready.

**Total:** ~7 developer-days. The critical path is Phase 1 → 2 → 3; Phase 4 and 5 can run in parallel with Phase 3 if two developers are available.

---

## 9. QA and acceptance criteria

### Functional regression

- Local folder: configure, list, open, tail, clear view, clear file.
- Remote AEM: connect, list configured files, stream, disconnect; clear file remains blocked.
- Tabs: open, close, activate, restore from workspace, multiple files.
- Search: Enter/Shift+Enter, ordinal jump, highlight, active match scroll.
- Filters: levels, time range, combined filters, clear all.
- Bookmarks: add/remove, persist, jump to line.
- Auto-scroll: stick to bottom, pause on scroll, jump to latest.
- Settings: font size, font family, theme, persistence.
- No console errors; no React key warnings.

### Visual states

- No folder / no files / folder error.
- Remote not configured / connecting / connected / connection error.
- File open / streaming / paused / reconnecting / rotated.
- Zero search results / zero filtered results / empty file.
- Bookmarks popover empty / populated.
- Settings on each section.
- Confirm dialog.
- Light, dark, system.

### Viewports

- 1440×900, 1280×800, 1024×768, 768×900.
- Sidebar open/closed.
- Font size minimum and maximum.
- Long unbroken lines and Java stack traces.

### Browser

- Chrome/Edge (primary).
- Firefox.
- Safari (if the team supports it).

### Acceptance checklist

- [ ] `npm run build` passes with no TypeScript errors.
- [ ] No raw `rgba(255,255,255`, `rgba(10,132,255`, or hex colors in `.tsx` files.
- [ ] No `backdrop-filter`, `glass-*`, fake traffic lights, or gradients.
- [ ] Theme switch is instant and persists after reload; no flash of wrong theme.
- [ ] Every interactive element has a visible focus state.
- [ ] Sidebar is not focusable when closed.
- [ ] Tabs and dialogs have correct ARIA roles and keyboard behavior.
- [ ] Body text contrast ≥ 7:1; secondary text ≥ 4.5:1.
- [ ] 100k-line log scroll remains smooth; no layout shift on stream append.
- [ ] Existing localStorage data migrates without loss.
- [ ] Remote mode remains read-only; clear-file guard still works.
- [ ] README and screenshots reflect the new brand.

---

## 10. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Layout restructure breaks auto-scroll or virtualizer | High | Keep scroll logic untouched; only change row height and wrapper markup; test with 100k lines. |
| Theme refactor breaks 13 existing themes | Medium | Reduce to 3 themes; archive legacy palettes behind a flag; test both modes. |
| Hardcoded colors hide in components | Medium | Token sweep + grep guardrail; review every `.tsx` in the matrix. |
| Users lose workspace/bookmarks after rename | High | Read-through migration with legacy fallback; keep old keys for one release. |
| “Minimal” design hurts log readability | High | Keep 13px mono, 22px rows, high-contrast message text; desaturate syntax, not the message. |
| Too much scope in one PR | Medium | Ship phases independently; each phase leaves the app working. |
| Trademark confusion with Apache/Adobe/xAI | Medium | Neutral product name; clear About copy; no third-party logos. |
| Font loading adds flicker/offline failure | Low | Self-host and preload; fall back to system stacks. |
| Focus trap/dialog regressions | Medium | Use native `<dialog>` or a small tested trap; keyboard test every overlay. |

---

## 11. Decisions needed before Phase 1

1. **Product name:** `Slingtail` (recommended), `Sling Logs`, or keep `AEM Log Viewer`?
2. **Theme scope:** ship 3 themes (Dark/Light/System, recommended) or keep all 13 behind “Advanced”?
3. **Accent:** pure monochrome (recommended) or a single functional accent color (e.g., a muted blue for focus/selection)?
4. **Tabs:** integrate into the top bar (recommended) or keep a dedicated tab row?
5. **Rename scope:** UI copy only, or also `package.json`, repo name, and storage keys? (Recommended: all, with migration.)
6. **Fonts:** self-host Inter + JetBrains Mono (recommended) or keep the system stack + Google Fonts?

---

## Appendix A — Copy deck

| Current | New |
|---|---|
| Log Viewer | slingtail |
| Folder / Log Folder | Source / Local folder |
| Use folder | Choose folder |
| Filter by name... | Filter files… |
| Find in log... | Search logs… |
| No log file open | Open a log to begin |
| Set a log folder and click a `.log` file… | Choose a folder of `.log` files, or connect to an AEM instance. |
| Bottom | Jump to latest |
| Clear | Clear view |
| Clear file | Clear file… |
| Tail | Live |
| not connected | Not connected |
| connected | Connected |
| Settings | Settings |
| Preferences | Preferences |
| Keyboard Shortcuts | Keyboard |
| Clear log file | Clear `error.log`? |
| Truncate `file` on disk? This cannot be undone. | This truncates the file on disk and cannot be undone. |

## Appendix B — Token starter

```css
:root,
[data-theme="dark"] {
  color-scheme: dark;

  --bg: #08080a;
  --surface: #0c0c0f;
  --surface-raised: #121216;
  --surface-hover: #17171c;
  --border: #1f1f25;
  --border-strong: #2c2c34;

  --text: #f2f2f3;
  --text-secondary: #9a9aa3;
  --text-tertiary: #66666f;

  --accent: #ffffff;
  --accent-contrast: #08080a;
  --focus-ring: rgba(255, 255, 255, 0.4);
  --selection: rgba(255, 255, 255, 0.1);
  --highlight: rgba(255, 255, 255, 0.16);
  --highlight-strong: rgba(255, 255, 255, 0.26);

  --sev-error: #f07373;
  --sev-warning: #e0b15c;
  --sev-info: #82b4d8;
  --sev-debug: #8dbb9a;
  --sev-trace: #7c7c86;
  --danger: #f07373;

  --radius-control: 6px;
  --radius-field: 8px;
  --radius-card: 12px;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
}

[data-theme="light"] {
  color-scheme: light;

  --bg: #ffffff;
  --surface: #fafafa;
  --surface-raised: #f4f4f5;
  --surface-hover: #efeff1;
  --border: #e6e6e9;
  --border-strong: #d4d4d8;

  --text: #0b0b0d;
  --text-secondary: #5f5f68;
  --text-tertiary: #8a8a93;

  --accent: #0b0b0d;
  --accent-contrast: #ffffff;
  --focus-ring: rgba(0, 0, 0, 0.35);
  --selection: rgba(0, 0, 0, 0.07);
  --highlight: rgba(0, 0, 0, 0.1);
  --highlight-strong: rgba(0, 0, 0, 0.16);

  --sev-error: #b42318;
  --sev-warning: #8a5a00;
  --sev-info: #1d5f84;
  --sev-debug: #2f6b3a;
  --sev-trace: #6b7280;
  --danger: #b42318;
}
```

## Appendix C — Logo brief

- **Grid:** 24×24, 2px safe area.
- **Strokes:** 1.5px, round caps.
- **Concept:** three descending horizontal “log lines” crossed by a small `>` chevron; optionally the negative space forms an `S`.
- **Color:** `currentColor` only.
- **Minimum size:** 16px.
- **Clear space:** 4px around the mark.
- **Do not:** use gradients, 3D, drop shadows, the old magnifier, or the AEM wordmark.
- **Wordmark:** `slingtail`, lowercase, 500 weight, `-0.02em` tracking. Use text in the UI; use the SVG mark for the icon.
