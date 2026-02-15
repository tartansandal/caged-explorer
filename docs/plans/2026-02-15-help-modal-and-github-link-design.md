# Help Modal and GitHub Link

## Overview

Add a help/about modal with a narrative guide to the CAGED system, and a GitHub repo link in the header.

## Header Icons

Four icons in the top-right, positioned absolutely (right to left): gear (existing), theme toggle (existing), GitHub icon (new), help `?` button (new).

Spacing follows the existing pattern: `right: 8, 44, 80, 116`.

- **`?` button** (`right: 116`) — opens help modal, same muted style as existing icons
- **GitHub SVG icon** (`right: 80`) — links to repo in new tab, same muted style

## Help Modal

### Trigger

`showHelp` boolean state. Toggled by the `?` header button.

### Layout

- **Backdrop**: `position: fixed`, full viewport, `rgba(0,0,0,0.6)`, click to close
- **Content panel**: centered, `max-width: 600px`, `max-height: 80vh`, `overflow-y: auto`, themed background (`theme.bg.panel`), rounded corners, subtle border (`theme.border.subtle`)
- **Close button**: `X` in top-right corner of panel
- Theme-aware: uses existing `theme` object for colors

### Content

Four sections with headers, conversational tone, using the explorer/map metaphor:

**The Map** — The fretboard as unmapped country. You need landmarks, not a chart of every note.

**The Landmarks** — The five cowboy chords (C, A, G, E, D) as reference points. Triads (root, third, fifth on adjacent strings). Major/minor switching to see the flat 3rd. Movable shapes as the basis of barre chords.

**Expanding the Territory** — Pentatonic scales as chord shapes plus two notes. Blues scales add one more. All five shapes tile across the fretboard.

**Connecting the Shapes** — Frying pan overlay shows horizontal patterns. Two pan shapes repeat across the neck. Progressive learning builds understanding without getting lost.

## Implementation

All changes in `src/App.jsx`:

1. Add `showHelp` state
2. Add `HelpModal` subcomponent (renders when `showHelp` is true)
3. Add `?` button and GitHub SVG icon to header
4. Adjust existing icon positions (`right` values shift by 36px each)
