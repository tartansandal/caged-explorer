# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CAGED Explorer is an interactive React + Vite web application for visualizing the CAGED guitar chord system. It provides SVG-based fretboard visualization with controls for exploring chord shapes, triads, and pentatonic scales across different keys.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with HMR (http://localhost:5173)
npm run build        # Production build to dist/
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Architecture

### Single Component Application

The entire app lives in `src/App.jsx` as a single `CAGEDExplorer` component (~640 lines) with four subcomponents:
- `ToggleButton` - Styled toggle buttons for controls
- `FretDot` - SVG circle with label for fretboard notes
- `LegendSection` - Legend with colored dots and labels
- `ChordDiagram` - Chord fingering visualization

### State Management

React hooks only (`useState`, `useMemo`). Key state variables:
- `column` - Key index (0-11)
- `isMinorKey` - Major vs minor key toggle
- `activeShape` - Selected CAGED shape or 'all'
- `pentaMode` - Pentatonic display ('off', 'major', 'minor', 'blues')
- `triadMode` - Triad display ('off', 'major', 'minor', 'both')
- `labelMode` - Note labels ('intervals', 'notes', 'both')

### Data Structures

All music theory data is defined as constants at the top of `App.jsx`:
- `NOTES` - 12 chromatic note names
- `SHAPES` - The 5 CAGED shapes (C, A, G, E, D)
- `THEME` - Complete color palette for shapes, intervals, and UI elements
- `TRIAD_MAJ/MIN` - Fretboard positions for major/minor triads per shape
- `PENTA_MAJ/MIN` - Pentatonic scale positions
- `BLUES_ADDITION` - Blue note (♭5) positions
- `CHORD_MAJ/MIN` - Open chord fingerings with interval labels

### Theme System

The `THEME` object defines all colors. Shape colors: C (#d8908c), A (#d4b880), G (#80b8a4), E (#a898c4), D (#cc90a8). Use these consistently for any new features.

## Code Style

- Inline styles throughout (no CSS modules or Tailwind)
- ESLint flat config (v9+) with React Hooks rules
- Constants at top, then data structures, then helper functions, then components
- Build tool: Vite with rolldown (`npm:rolldown-vite`)

## Tech Stack

- React 19.2.0
- Vite (rolldown variant)
- ESLint 9.x (flat config)
- No testing framework currently configured
