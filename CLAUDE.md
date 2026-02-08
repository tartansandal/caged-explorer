# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CAGED Explorer is an interactive React + Vite web application for visualizing the CAGED guitar chord system. It provides SVG-based fretboard visualization with controls for exploring chord shapes, triads, pentatonic scales, and overlay systems (frying pan, 3:2) across all 12 keys.

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

**`src/music.js`** — Pure functions and data:
- `generateScale(rootKey, degrees)` — Places scale notes on the fretboard using guitar tuning math
- `assignShapes(pentaNotes, effectiveKey, scaleSemi)` — Maps pentatonic note positions to CAGED shapes; each note can belong to 1-2 adjacent shapes (boundary sharing)
- `findShapes(shapeMap, string, fret)` — Looks up shapes for a position with nearest-neighbor fallback for notes not directly in the pentatonic map
- Constants: `TUNING`, `SCALE` (interval definitions for triads/pentatonics/blues), `FRYING_PAN` (overlay geometry), `SHAPE_ORDER`, `SHAPE_ORIENTATION`

**`src/App.jsx`** — Single `CAGEDExplorer` component (~850 lines) with subcomponents:
- `ToggleButton`, `FretDot`, `LegendSection`, `ChordDiagram`
- UI constants: `THEME` (complete color palette), `CHORD_MAJ/MIN` (open chord fingerings), `LEGEND` (context-sensitive legend entries), `INTERVAL_SEMITONES` (interval-to-semitone mapping)

### Key Concept: effectiveKey

The `effectiveKey` variable transforms between the displayed key and the underlying music theory. For major keys it equals `keyIndex` directly; for minor keys it's `(keyIndex + 9) % 12` (relative major). All scale generation and shape assignment use `effectiveKey`.

### State Management

React hooks only (`useState`, `useMemo`). Main state: `keyIndex` (0-11), `isMinorKey`, `activeShape` (C/A/G/E/D or 'all'), `pentaMode` (off/major/minor/blues), `triadMode` (off/major/minor/both), `labelMode` (intervals/notes/both), `overlayMode` (off/fryingPan/threeTwo).

### Overlay System

Two overlay modes visualize pentatonic grouping patterns:
- **Frying Pan** — Highlights 5-note groups across string pairs with pan+handle shapes, defined in `FRYING_PAN` geometry (shifted by `effectiveKey`)
- **3:2 System** — Derived from frying pan data; shows 3-note and 2-note per-string bars

### Theme System

The `THEME` object defines all colors. Shape colors: C (#d8908c), A (#d4b880), G (#80b8a4), E (#a898c4), D (#cc90a8). Use these consistently for any new features.

## Testing

Tests use Vitest (`src/App.test.js`) and cover the pure music theory functions in `src/music.js`:
- `generateScale` — fret position correctness, octave equivalence, string coverage
- `assignShapes` — shape cycle order per key, boundary note sharing between adjacent shapes
- `findShapes` — direct hit and nearest-neighbor fallback
- `FRYING_PAN` geometry — visibility across all keys, shape mapping consistency

Tests are property-based where possible, iterating all 12 keys × major/minor scales to verify invariants.

## Code Style

- Inline styles throughout (no CSS modules or Tailwind)
- ESLint flat config (v9+) with React Hooks rules; `no-unused-vars` ignores uppercase/underscore-prefixed names
- Constants at top, then data structures, then helper functions, then components
- Build tool: Vite with rolldown (`npm:rolldown-vite`)

## Tech Stack

- React 19, Vite (rolldown variant), Vitest, ESLint 9.x (flat config)
