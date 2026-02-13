# Static Data Redesign

Replace calculated music theory with static fretboard position tables, following the proven `FRYING_PAN` pattern.

## Problem

The current architecture computes note positions and shape assignments at runtime using `generateScale`, `assignShapes`, `computePentaBox`, and several filtering/grouping helpers. These calculations are fragile — the commit history shows repeated fixes to offset wrapping, center-distance heuristics, and nearest-neighbor fallback logic. Meanwhile, `FRYING_PAN` (static positions for key=0, shifted at runtime) has been reliable since day one.

## Key Insight

The guitar fretboard is 6 strings x 15 frets = 90 positions. The 5 CAGED pentatonic boxes are well-known, fixed patterns that every guitarist memorizes. Storing them as explicit data (~420 tuples) is trivial and eliminates an entire class of calculation bugs.

## Design

### Data Model

Three static tables in `music.js`, all defined for `effectiveKey=0` with two octaves of coverage (frets 0-27) so any key shift stays within the 15-fret window:

```
PENTA_BOX[scale][shape]    -> [[string, fret, interval], ...]
TRIAD_SHAPE[scale][shape]  -> [[string, fret, interval], ...]
BLUES_SHAPE[shape]         -> [[string, fret, interval], ...]
```

- `scale`: `"major"` or `"minor"`
- `shape`: `"C"`, `"A"`, `"G"`, `"E"`, or `"D"`
- Each entry: `[string (1-6), fret (0-27), interval label]`
- Boundary notes shared between adjacent shapes appear in both shape arrays

### Major/Minor Duplication

Major pentatonic and relative minor pentatonic produce the same physical fret positions with different interval labels (e.g., C major penta at `effectiveKey=0` = A minor penta at `effectiveKey=9`). We store both `PENTA_BOX.major` and `PENTA_BOX.minor` as separate, complete tables.

**Rationale:** eliminating this redundancy would require computing interval labels at runtime, reintroducing exactly the kind of calculation this redesign eliminates. The duplication is small (~240 extra entries) and each table is independently auditable.

**Drift prevention:** a test asserts that for all 12 keys, `PENTA_BOX.major` shifted by `ek` produces the same fret positions as `PENTA_BOX.minor` shifted by `(ek + 3) % 12`. This catches any accidental inconsistency between the two tables without adding runtime complexity.

Triads have no redundancy concern — major triad (R, 3, 5) and minor triad (R, b3, 5) have genuinely different fret positions.

### Runtime Operations

One function replaces all current music theory:

```js
function shiftNotes(notes, effectiveKey, maxFret = NUM_FRETS) {
  return notes
    .map(([s, f, interval]) => [s, f + effectiveKey, interval])
    .filter(([, f]) => f >= 0 && f <= maxFret);
}
```

For high keys (effectiveKey > ~4), apply both `effectiveKey` and `effectiveKey - 12` shifts to cover the full fretboard, same as `FRYING_PAN` does today.

Derived data (computed via `useMemo`):

- **Shape ownership map** (all-shapes view): reverse index from merged per-shape arrays. A position appearing in two shapes gets both shape names — boundary sharing is automatic.
- **Fret ranges** (labels/highlights): min/max of shifted frets per shape.
- **Triad position set** (dedup): `Set` built from shifted triad entries.

### Use Case Mapping

| Use case | Current | New |
|---|---|---|
| Notes for shape X | `generateScale` then `filterByBox`/`filterByRange` | `shiftNotes(TABLE[scale][shape], ek)` |
| Shape ownership | `assignShapes` then `findShapes` then `groupByShape` | Reverse index from merged shape arrays |
| Fret range for labels | `shapeRanges` from `CHORD_MAJ` | min/max of shifted frets |
| Triad dedup | `Set` from filtered notes | `Set` from shifted notes |
| Frying pan / 3:2 | Already static | No change |
| Chord diagrams | Already static | No change |

### Data Volume

- Pentatonic boxes: 5 shapes x 12 notes x 2 octaves x 2 scales = ~240 entries
- Triads: 5 shapes x ~8 notes x 2 octaves x 2 scales = ~160 entries
- Blues: 5 shapes x ~2 notes x 2 octaves = ~20 entries
- **Total: ~420 `[string, fret, interval]` tuples**

### What Gets Deleted

From `music.js`:
- `generateScale`, `assignShapes`, `findShapes`
- `SCALE` (interval definitions — baked into data)
- `TUNING` (no longer computing frets from string tuning)

From `App.jsx`:
- `computePentaBox`, `filterByBox`, `filterByRange`, `groupByShape`, `findShapeBelow`
- `MAJ_SEMI`, `MIN_SEMI`
- `SHAPE_ROOT_SEMI`, `shapeRanges` computation (derived from data instead)
- All `assignShapes`/`findShapes` call sites

### What Stays

- `FRYING_PAN` + `SHAPE_ORIENTATION` (already static, unchanged)
- `CHORD_MAJ` / `CHORD_MIN` (chord diagram data, unchanged)
- `posKey` utility (still useful for position hashing)
- `NUM_FRETS`, `SHAPE_ORDER` constants
- `effectiveKey` derivation logic in the component

### Boundary Notes

Shared boundary notes (e.g., G at fret 3 belonging to both C and A shapes in C major pentatonic) are duplicated in both shape arrays. This ensures:

- Single-shape view renders correctly from one array
- All-shapes view builds correct multi-shape ownership from the merge
- Both views are **provably consistent** — same source data

### Testing Strategy

- **Data integrity:** each pentatonic box has exactly 2 notes per string, all intervals are valid for the scale type, boundary notes appear in exactly 2 adjacent shapes
- **Major/minor equivalence:** major penta positions shifted by `ek` match minor penta positions shifted by `(ek + 3) % 12` for all 12 keys
- **Shift correctness:** shifted notes stay within [0, NUM_FRETS], all 12 keys produce full fretboard coverage
- **Backwards compatibility:** rendered output for each key matches current implementation (snapshot test during migration, removed after)

### Migration Strategy

1. Write a generator script using the existing `generateScale` + `assignShapes` + `computePentaBox` to emit the static tables for `effectiveKey=0`
2. Verify output against guitar reference diagrams
3. Replace runtime computation with static data + `shiftNotes`
4. Update tests to verify static data integrity and shift correctness
5. Delete the generator functions
