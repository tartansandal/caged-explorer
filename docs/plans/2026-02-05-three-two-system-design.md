# 3:2 System Overlay Design

## Overview

Add a new overlay to visualize the 3:2 (pan-handle) fingering system for pentatonic scales. The 3:2 system is a 5-note pentatonic pattern spanning 2 adjacent strings: 3 notes on one string, 2 on the next. The pattern tiles across string pairs (6-5, 4-3, 2-1) with fret shifts to account for guitar tuning.

## Decisions

| Question | Decision |
|----------|----------|
| Toggle relationship | Separate toggle, works alongside pentatonic display |
| Position selection | Auto-follow active CAGED shape |
| Bar colors | Root (`#e09898`) for 3-note, Fifth (`#88c4b4`) for 2-note |
| UI placement | New "3:2 System" section in options row with On/Off |
| Display independence | Bars show even when pentatonic dots are off |

## The 3:2 Concept

- **5 notes** of the pentatonic scale span **2 adjacent strings**
- **3-note group**: scale degrees 1, 2, 3 (R, 2, 3) — or R, ♭3, 4 for minor
- **2-note group**: scale degrees 5, 6 — or 5, ♭7 for minor
- Pattern repeats on each string pair with fret shifts (+2 for most pairs, +3 for B string due to tuning)

## Two Positions

- **Position 1**: 3 notes on lower string of pair, 2 on upper (higher fret area)
- **Position 2**: 2 notes on lower string of pair, 3 on upper (lower fret area)

## Shape-to-Position Mapping

- **Position 2** (lower frets): C, A, G shapes
- **Position 1** (higher frets): E, D shapes
- **All shapes**: Both positions displayed

## Data Structure

```js
// Position 1: R,2,3 on lower string; 5,6 on upper
const THREE_TWO_POS1_MAJ = [
  { strings: [6, 5], notes: [[6, 8, "R"], [6, 10, "2"], [6, 12, "3"], [5, 10, "5"], [5, 12, "6"]] },
  { strings: [4, 3], notes: [[4, 10, "R"], [4, 12, "2"], [4, 14, "3"], [3, 12, "5"], [3, 14, "6"]] },
  { strings: [2, 1], notes: [[2, 1, "R"], [2, 3, "2"], [2, 5, "3"], [1, 3, "5"], [1, 5, "6"]] },
];

// Position 2: 5,6 on lower string; R,2,3 on upper
const THREE_TWO_POS2_MAJ = [
  { strings: [6, 5], notes: [[6, 3, "5"], [6, 5, "6"], [5, 3, "R"], [5, 5, "2"], [5, 7, "3"]] },
  // ... etc
];
```

Transposed using existing `transpose()` pattern based on selected key.

## Visual Rendering

- Horizontal rounded rectangles (pill shapes)
- Height: 10px, border-radius: 5px
- Opacity: 0.4
- Rendered behind note dots
- Bar spans from first to last note in group with padding

## State

```js
const [threeTwoMode, setThreeTwoMode] = useState("off");
const showThreeTwoBars = threeTwoMode === "on";
```

## Legend

When active, display in legend area:
- Small pill in root color + "3 notes per string"
- Small pill in fifth color + "2 notes per string"

## Key Implementation Notes

- Wrap-around logic in transpose can cause duplicate bars — avoided by not defining redundant higher-octave entries
- Notes outside fret 0-15 after transposition are filtered
- Each string pair entry creates one bar per string based on note count
