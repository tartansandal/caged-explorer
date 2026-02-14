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
- Constants: `FRYING_PAN` (overlay geometry), `SHAPE_ORDER`, `SHAPE_ORIENTATION`, `NUM_FRETS`, `posKey`

**`src/App.jsx`** — Single `CAGEDExplorer` component with subcomponents:
- `ToggleButton`, `FretDot`, `LegendSection`, `ChordDiagram`
- UI constants: `THEME` (complete color palette), `CHORD_MAJ/MIN` (open chord fingerings), `LEGEND` (context-sensitive legend entries), `INTERVAL_SEMITONES` (interval-to-semitone mapping)

### Key Concept: effectiveKey

The `effectiveKey` variable transforms between the displayed key and the underlying music theory. For major keys it equals `keyIndex` directly; for minor keys it's `(keyIndex + 9) % 12` (relative major). All note data is shifted by `effectiveKey` via `shiftNotes`.

### Static Data Pattern

All fretboard note positions follow the same pattern as `FRYING_PAN`: defined for `effectiveKey=0` with two octaves of coverage (frets 0-27), shifted at runtime by adding `effectiveKey`. The `shiftNotes` function handles the double-shift (try both `+ek` and `+(ek-12)`) to cover the full 15-fret window for any key, with deduplication. Boundary notes between adjacent CAGED shapes appear in both shape arrays, ensuring single-shape and all-shapes views are provably consistent.

### State Management

React hooks only (`useState`, `useMemo`). Main state: `keyIndex` (0-11), `isMinorKey`, `activeShape` (C/A/G/E/D/all/off), `showTriads`, `pentaScale` (off/pentatonic/blues), `triadQuality` (major/minor), `pentaQuality` (major/minor), `labelMode` (intervals/notes/both), `showFryingPan` (boolean), `hoveredShape`, `pinnedShapes` (Set).

### Overlay System

The **Frying Pan** overlay highlights 5-note groups across string pairs with pan+handle shapes, defined in `FRYING_PAN` geometry (shifted by `effectiveKey`). Toggled via `showFryingPan` state.

### Shape Hover System

In "All" shapes view, each shape's fretboard column has an invisible hit rect for hover highlighting and click-to-pin. `shapeRanges` clusters each shape's notes into `{lo, hi, partial}` ranges. Partial clusters (span < 70% of canonical) at fretboard edges are dimmed and excluded from interaction. `computeHoverRanges` splits adjacent clusters at midpoints to produce non-overlapping hover regions.

### Theme System

The `THEME` object defines all colors. Shape colors: C (#d8908c), A (#d4b880), G (#80b8a4), E (#a898c4), D (#cc90a8). Use these consistently for any new features.

## Testing

Tests use Vitest (`src/App.test.js`) and cover the static data tables and overlay geometry:
- `PENTA_BOX` data integrity — 2 notes per string per octave, valid intervals, boundary sharing between adjacent shapes
- Major/minor pentatonic equivalence — verifies relative major/minor produce same fret positions across all 12 keys
- `shiftNotes` — range bounds, deduplication, full string coverage for all keys
- `FRYING_PAN` geometry — visibility across all keys, shape mapping consistency
- Partial cluster detection — every shape has at least one full cluster across all 12 keys × major/minor
- `computeHoverRanges` — no overlaps, full coverage, no partial leaks, tiling without gaps

Tests are property-based where possible, iterating all 12 keys × major/minor scales to verify invariants.

## Code Style

- Inline styles throughout (no CSS modules or Tailwind)
- ESLint flat config (v9+) with React Hooks rules; `no-unused-vars` ignores uppercase/underscore-prefixed names
- Constants at top, then data structures, then helper functions, then components
- Build tool: Vite with rolldown (`npm:rolldown-vite`)

## Tech Stack

- React 19, Vite (rolldown variant), Vitest, ESLint 9.x (flat config)
