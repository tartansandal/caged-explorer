# Proportional Fret Spacing Design

## Goal

Make the fretboard look more like a real guitar by tapering fret widths — wider at fret 1, narrower toward fret 15 — while preserving the same total fretboard width and keeping labels readable.

## The Math

Real guitar frets follow the 12th root of 2: each fret is `r = 2^(-1/12) ≈ 0.9439` times the width of the previous. The 12th fret is exactly half the width of the 1st.

To preserve the current total width (840px = 15 frets × 56px), solve for the first fret width using the geometric series:

```
w1 = TOTAL_WIDTH × (1 - r) / (1 - r^NUM_FRETS)
```

This gives: fret 1 = 81px, fret 7 = 57px (≈ current), fret 12 = 43px, fret 15 = 36px.

## Approach: Replace `FRET_SPACING` With a Lookup Table

### New constants in `music.js`

Add a precomputed cumulative position array:

```js
const FRET_RATIO = Math.pow(2, -1 / 12);
const TOTAL_FRET_WIDTH = NUM_FRETS * 56; // preserve current total
const FRET_W1 = TOTAL_FRET_WIDTH * (1 - FRET_RATIO) / (1 - Math.pow(FRET_RATIO, NUM_FRETS));

// FRET_X[f] = cumulative x offset from fret 0 to fret f (0-indexed, length NUM_FRETS+1)
// FRET_X[0] = 0, FRET_X[NUM_FRETS] = TOTAL_FRET_WIDTH
export const FRET_X = Array.from({ length: NUM_FRETS + 1 }, (_, f) =>
  f === 0 ? 0 : FRET_X[f - 1] + FRET_W1 * Math.pow(FRET_RATIO, f - 1)
);

// Width of fret f (1-indexed: the space between fret wire f-1 and fret wire f)
export const FRET_W = (f) => FRET_X[f] - FRET_X[f - 1];
```

Build this with a simple loop (since `FRET_X` can't self-reference in `Array.from`).

### Changes in `App.jsx`

Replace the two core position functions:

```js
// Before
const FRET_SPACING = 56;
const fretX = (fret) => MARGIN_LEFT + fret * FRET_SPACING;
const noteX = (fret) => fret === 0 ? MARGIN_LEFT - 16 : MARGIN_LEFT + (fret - 0.5) * FRET_SPACING;

// After
const fretX = (fret) => MARGIN_LEFT + FRET_X[fret];
const noteX = (fret) => fret === 0 ? MARGIN_LEFT - 16 : MARGIN_LEFT + (FRET_X[fret - 1] + FRET_X[fret]) / 2;
```

`noteX` now returns the midpoint between two fret wires (center of the fret space), which is physically correct.

Replace all `NUM_FRETS * FRET_SPACING` with `FRET_X[NUM_FRETS]` (the total width). There are 4 occurrences: SVG width, fretboard rect, string lines, and label area.

### Shape highlights and hover regions

The pattern `noteX(lo) - FRET_SPACING * 0.48` uses a half-fret offset. Replace with the actual half-width of the specific fret:

```js
// Before
const x1 = noteX(lo) - FRET_SPACING * 0.48;
const x2 = noteX(hi) + FRET_SPACING * 0.48;

// After
const x1 = noteX(lo) - FRET_W(lo) * 0.48;
const x2 = noteX(hi) + FRET_W(hi) * 0.48;
```

Same pattern for hover rects (2 occurrences) and shape label positioning (1 occurrence).

### Frying pan overlays

Frying pan positions use `noteX()` already, so they'll adapt automatically. The pan/handle widths are based on `PENTA_RADIUS` (fixed), not fret width, so no changes needed there.

### Chord diagrams (mini)

The `ChordDiagram` component uses its own local `FRET_GAP`/`STR_GAP` constants for the small chord diagrams in the legend. These stay uniform — they represent a zoomed-in 4-fret window, not the full fretboard.

## Files Changed

- **`src/music.js`**: Add `FRET_X` array and `FRET_W` function. Export both.
- **`src/App.jsx`**: Import `FRET_X`/`FRET_W`, update `fretX`/`noteX`, replace ~10 `FRET_SPACING` references. Remove `FRET_SPACING` constant.
- **`src/App.test.js`**: Add tests for `FRET_X` (total width, monotonic, ratio between consecutive frets).

## What Stays the Same

- Total SVG width (840px fretboard + margins)
- String spacing (vertical)
- Chord diagram layout (mini diagrams in legend)
- Note dot radii (`PENTA_RADIUS`, `TRIAD_RADIUS`)
- All music theory logic

## Risks

- **Label overlap at high frets**: At 36px (fret 15), single-char labels ("R", "5") fit fine. Two-char labels ("b7") may be tight. Monitor visually and consider reducing font size for narrow frets if needed.
- **Hover region accuracy**: The `computeHoverRanges` midpoint logic in `music.js` works on fret numbers, not pixel positions. It should still work correctly since the fret ordering is preserved.

## Rollback

If the visual result is unsatisfactory, the change is fully reversible: restore `FRET_SPACING` and the linear `fretX`/`noteX` functions.
