# Light/Dark Theme Support

## Goal

Add light/dark theme support that follows OS preference with manual override, persisted in `localStorage`. Light theme uses a warm wood-tone palette for the fretboard.

## Approach: Dual THEME Objects

Keep the existing inline-style architecture. Create two complete theme objects with identical key shapes and swap which one is active.

## Theme Data Structure

Three objects:

- **`THEME_COMMON`** — Colors shared across themes: `shape` (C/A/G/E/D) and `interval` (R/2/3/5/6/etc.) colors. These are mid-saturation tones that read well on both dark and light backgrounds.
- **`THEME_DARK`** — Current palette, spreads `THEME_COMMON`.
- **`THEME_LIGHT`** — New warm wood-tone palette, spreads `THEME_COMMON`.

### Hardcoded Color Migration

~20 color literals scattered outside the `THEME` object get consolidated into new theme keys:

- `btnStyle` literals (`#f1f5f9`, `#0f172a`, `rgba(241,245,249,...)`) → `btn.activeBg`, `btn.activeText`, `btn.selectedBg`, etc.
- `accentBtnStyle` literals (`#d8ac90`, `#8a7060`, `rgba(210,170,140,...)`) → `btn.accent*` keys
- Page gradient (`#0c1222`, `#1a1040`) → `bg.pageGradient` or `bg.page` stops
- Accent colors (`#93c5fd`) → `accent.blue`
- Footer color (`#334155`) → `text.footer` or reuse existing key

### Light Palette Direction

| Category | Dark (current) | Light |
|----------|---------------|-------|
| Page bg | Deep blue-purple gradient | Warm cream/tan gradient (`#f5ebe0` → `#ede0d0`) |
| Panel bg | `rgba(10,15,30,0.5)` | `rgba(180,160,130,0.15)` |
| Text primary | `#e2e8f0` | `#2a2018` (dark warm brown) |
| Text secondary | `#94a3b8` | `#6a5f50` |
| Borders | White at low alpha | Dark brown at low alpha |
| Fret lines | White/gray, low opacity | Dark brown, slightly higher opacity |
| Dot text (`dark`) | `#1a1030` | Stays dark (colored dot backgrounds) |
| Glow/stroke | White at low alpha | Dark at low alpha |

## Theme State & Persistence

`useState` hook in `CAGEDExplorer`:

1. On mount: check `localStorage("theme")` for `"light"` / `"dark"`
2. If none saved: read `window.matchMedia("(prefers-color-scheme: light)")`
3. Listen for OS preference changes — only applies when no manual override saved

Manual toggle saves to `localStorage` and flips mode. OS-following is automatic when no saved preference.

A `useEffect` keeps `document.documentElement.style.colorScheme` in sync with the active theme to prevent Chrome's auto-dark-mode SVG fill inversion.

## Toggle UI

Sun/moon icon button placed to the left of the existing gear icon (top-right). Same minimal styling as the gear button.

- Dark mode active → sun icon (click to switch to light)
- Light mode active → moon icon (click to switch to dark)
- Inline SVG icons, no icon library

No visible "system" option — OS-following is automatic and invisible.

## Flash Prevention

Inline `<script>` in `index.html`, before React loads:

```html
<script>
  const t = localStorage.getItem("theme") ||
    (matchMedia("(prefers-color-scheme:light)").matches ? "light" : "dark");
  document.documentElement.dataset.theme = t;
  document.documentElement.style.colorScheme = t;
</script>
```

CSS sets `body` background color per theme (via `[data-theme]` selector) so the base color is correct before React paints.
