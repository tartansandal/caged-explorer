# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CAGED Explorer is an interactive React + Vite web application for visualizing the CAGED guitar chord system. It provides SVG-based fretboard visualization with controls for exploring chord shapes, triads, pentatonic scales, and the frying pan overlay system across all 12 keys.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with HMR (http://localhost:5173)
npm run build        # Production build to dist/
npm run lint         # Run ESLint
npm test             # Run Vitest test suite (vitest run)
npx vitest run src/App.test.js  # Run a single test file
```

## Architecture

### Two-File Split

Music theory logic lives in `src/music.js` (pure functions + data constants), kept separate from `src/App.jsx` (React components + UI) to preserve React Fast Refresh. The `src/main.jsx` entry point just mounts the root component.

**`src/music.js`** — Static data tables and pure functions:
- `PENTA_BOX[scale][shape]` — Pentatonic box note positions as `[string, fret, interval]` tuples for `effectiveKey=0`, two octaves. Scale is `"major"`/`"minor"`, shape is C/A/G/E/D.
- `TRIAD_SHAPE[scale][shape]` — Triad note positions per CAGED shape, same format.
- `BLUES_SHAPE[quality][shape]` — Blues note positions (minor: `♭5`, major: `♭3`) per shape.
- `SHAPE_FRET_RANGES[quality][shape]` — Precomputed fret clusters at `effectiveKey=0` from triads + pentatonics (blues excluded to avoid merging octave clusters).
- `shiftNotes(notes, effectiveKey)` — Shifts note positions by `effectiveKey` using double-shift (`+ek` and `+(ek-12)`) with dedup.
- `clusterFrets(frets, gapThreshold)` — Groups sorted frets into `{lo, hi}` clusters separated by gaps > threshold.
- `computeHoverRanges(shapeRanges, shapes)` — Computes non-overlapping hover regions from shape clusters, splitting at midpoints between adjacent cluster centers. Excludes partial clusters.
- `FRET_X` — Precomputed cumulative x-offset array for proportional fret spacing (length `NUM_FRETS + 1`). Each fret is `r = 2^(-1/12)` times the width of the previous, matching real guitar geometry. Total width preserved at `NUM_FRETS * 56` (same as the old uniform spacing). `FRET_X[0] = 0`, `FRET_X[NUM_FRETS] = 840`.
- `FRET_W(f)` — Returns the pixel width of fret `f` (1-indexed, integer only). Fret 1 ≈ 81px, fret 7 ≈ 57px, fret 13 = half of fret 1 (octave relationship). `FRET_W(0)` is `NaN` — use `fretWAt` for fret 0 or fractional values.
- `fretXAt(f)` — Linearly interpolates `FRET_X` for fractional fret values. Returns `FRET_X[f]` for integers. Used by hover ranges which produce fractional boundaries.
- `fretWAt(f)` — Width at fractional fret `f`. For `f < 1` (open strings area), returns `FRET_W(1)`. For integers ≥ 1, matches `FRET_W(f)`. For fractional values, interpolates via `fretXAt`.
- Constants: `FRYING_PAN` (overlay geometry), `SHAPE_ORDER`, `SHAPE_ORIENTATION`, `NUM_FRETS`, `posKey`, `CHORD_MAJ/MIN` (open chord fingerings), `INTERVAL_SEMITONES` (interval-to-semitone mapping)

**`src/App.jsx`** — Single `CAGEDExplorer` component with subcomponents:
- `ToggleButton`, `FretDot`, `LegendSection`, `ChordDiagram`
- `fretX(fret)` — X position of fret wire: `MARGIN_LEFT + FRET_X[fret]`
- `noteX(fret)` — X position of a note dot (midpoint via `fretXAt`): `(fretXAt(fret-1) + fretXAt(fret)) / 2`. Supports fractional frets. Fret 0 (open strings) is a special case offset left of the nut.
- Shape highlights and hover rects use `fretWAt(fret) * 0.48` for per-fret half-width padding (supports fret 0 and fractional values from hover ranges).
- Theme constants: `THEME_COMMON`, `THEME_DARK`, `THEME_LIGHT` (color palettes), `makeStyles(theme)` (layout styles)
- UI constants: `LEGEND` (context-sensitive legend entries)
- The mini `ChordDiagram` component uses its own uniform `FRET_GAP` — it represents a zoomed-in 4-fret window, not the full fretboard.

### Key Concept: effectiveKey

The `effectiveKey` variable transforms between the displayed key and the underlying music theory. For major keys it equals `keyIndex` directly; for minor keys it's `(keyIndex + 9) % 12` (relative major). All note data is shifted by `effectiveKey` via `shiftNotes`.

### Static Data Pattern

All fretboard note positions follow the same pattern as `FRYING_PAN`: defined for `effectiveKey=0` with two octaves of coverage (frets 0-27), shifted at runtime by adding `effectiveKey`. The `shiftNotes` function handles the double-shift (try both `+ek` and `+(ek-12)`) to cover the full 15-fret window for any key, with deduplication. Boundary notes between adjacent CAGED shapes appear in both shape arrays, ensuring single-shape and all-shapes views are provably consistent.

### State Management

React hooks only (`useState`, `useMemo`). Main state: `themeMode` (dark/light), `keyIndex` (0-11), `isMinorKey`, `activeShape` (C/A/G/E/D/all/off), `showTriads`, `scaleMode` (off/pentatonic/blues), `triadQuality` (major/minor), `pentaQuality` (major/minor), `labelMode` (intervals/notes/both), `showFryingPan` (boolean), `hoveredShape`.

### Overlay System

The **Frying Pan** overlay highlights 5-note groups across string pairs with pan+handle shapes, defined in `FRYING_PAN` geometry (shifted by `effectiveKey`). Only available when "All" shapes mode is active and pentatonic/blues scale is on (toggle hidden otherwise, auto-disabled when leaving either). Toggled via `showFryingPan` state.

### Shape Hover System

In "All" shapes view, each shape's fretboard column has an invisible hit rect for hover highlighting. `shapeRanges` clusters each shape's notes into `{lo, hi, partial}` ranges. Partial clusters (span < 70% of canonical) at fretboard edges are dimmed and excluded from interaction. `computeHoverRanges` splits adjacent clusters at midpoints to produce non-overlapping hover regions.

### Theme System

Dual theme support (light/dark) with three theme objects in `src/App.jsx`:
- `THEME_COMMON` — Shared colors: shape (C/A/G/E/D) and interval colors, frying pan overlay
- `THEME_DARK` — Dark palette (deep blue-purple gradient)
- `THEME_LIGHT` — Light palette (warm wood-tone)

Theme state uses `useState` with localStorage persistence and OS `prefers-color-scheme` detection via `matchMedia`. All subcomponents receive `theme` as a prop. The `STYLE` object is generated via `makeStyles(theme)` and memoized.

Shape colors: C (#d8908c), A (#d4b880), G (#80b8a4), E (#a898c4), D (#cc90a8). These are shared across both themes.

**`color-scheme` and flash prevention:** The `<meta name="color-scheme">` tag and inline script live in `<head>` in `index.html` — they must run before any CSS or body parsing. Chrome decides whether to apply auto-dark-mode early in page load; if `color-scheme` isn't declared in time, Chrome will forcibly invert light-colored pages. The CSS in `index.css` gates `color-scheme` behind `[data-theme]` selectors (never a blanket `:root { color-scheme: dark }`) to avoid fighting with the inline script.

**Dark Reader / browser dark-mode extensions:** Extensions like Dark Reader operate at a level above `color-scheme` and will invert the light theme regardless of any meta tags or CSS declarations. This is not fixable from web code — users must whitelist the site in their extension. When debugging theme colors that look inverted, always check for browser extensions first.

## Testing

Tests use Vitest (`src/App.test.js`) and cover the static data tables and overlay geometry:
- `PENTA_BOX` data integrity — 2 notes per string per octave, valid intervals, boundary sharing between adjacent shapes
- Major/minor pentatonic equivalence — verifies relative major/minor produce same fret positions across all 12 keys
- `shiftNotes` — range bounds, deduplication, full string coverage for all keys
- `FRYING_PAN` geometry — visibility across all keys, shape mapping consistency
- Partial cluster detection — every shape has at least one full cluster across all 12 keys × major/minor
- `computeHoverRanges` — no overlaps, full coverage, no partial leaks, tiling without gaps
- `FRET_X` geometry — total width, monotonicity, `2^(-1/12)` ratio between consecutive frets, octave relationship (fret 13 = half of fret 1)
- Theme structure — `THEME_DARK` and `THEME_LIGHT` have identical keys, no undefined values

Tests are property-based where possible, iterating all 12 keys × major/minor scales to verify invariants.

## Deployment

Hosted on GitHub Pages at `https://tartansandal.github.io/caged-explorer/`. A GitHub Actions workflow (`.github/workflows/deploy.yml`) auto-deploys on every push to `main`: installs deps, builds, uploads `dist/` as a Pages artifact. Vite `base` is set to `'/caged-explorer/'` in `vite.config.js` so asset paths resolve under the subdirectory. Public assets referenced in JSX must use `import.meta.env.BASE_URL` (e.g. `` `${import.meta.env.BASE_URL}logo.svg` ``), not absolute paths like `"/logo.svg"`.

## Code Style

- Inline styles throughout (no CSS modules or Tailwind)
- ESLint flat config (v9+) with React Hooks rules; `no-unused-vars` ignores uppercase/underscore-prefixed names
- Constants at top, then data structures, then helper functions, then components
- Build tool: Vite with rolldown (`npm:rolldown-vite`)

## Tech Stack

- React 19, Vite (rolldown variant), Vitest, ESLint 9.x (flat config)
