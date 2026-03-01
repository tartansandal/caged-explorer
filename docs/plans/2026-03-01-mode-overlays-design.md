# Mode Overlays Design

## Concept

Modes layer 2 extra notes on top of the existing pentatonic scale, completing the 7-note diatonic scale. The extra notes render at reduced opacity (~55%) to visually signal "these complete the scale" while keeping the pentatonic foundation prominent.

Modes are a separate layer from pentatonic and blues — all three can be active simultaneously.

## Mode-to-Pentatonic Mapping

### Major keys (over major pentatonic: R 2 3 5 6)

| Mode | Extra Notes | Character |
|------|------------|-----------|
| Ionian | 4, 7 | Default major scale |
| Mixolydian | 4, ♭7 | Dominant/blues-rock flavor |

### Minor keys (over minor pentatonic: R ♭3 4 5 ♭7)

| Mode | Extra Notes | Character |
|------|------------|-----------|
| Aeolian | 2, ♭6 | Natural minor |
| Dorian | 2, 6 | Jazzy, Santana flavor |

## UI

### Desktop

Mode buttons appear in the Penta options area, conditionally when pentatonic is on, alongside Blues and Pan:

```
Penta [pill]  [Blues] [Ion] [Mix] [Pan]     ← major key
Penta [pill]  [Blues] [Aeol] [Dor] [Pan]    ← minor key
```

- Mutually exclusive toggle buttons (click to enable, click again to disable)
- Only the 2 modes matching the current quality appear (auto-filtered)
- Blues and modes are independent (can be active simultaneously)
- Pan continues to require "All" shapes + pentatonic on

### Mobile

Mode buttons appear in the bottom sheet options area, same conditional logic as desktop.

## Data Model

### New table: `MODE_SHAPE[mode][shape]`

Same `[string, fret, interval]` tuple format as `PENTA_BOX`. Defined at `effectiveKey=0` with two octaves of coverage. Each mode table contains **only the 2 extra notes** per shape (not the full 7-note scale), since the pentatonic notes are already rendered separately.

Four mode keys: `"ionian"`, `"mixolydian"`, `"aeolian"`, `"dorian"`.
Five shape keys each: `"C"`, `"A"`, `"G"`, `"E"`, `"D"`.

### New intervals in `INTERVAL_SEMITONES`

- `"7"` — major 7th (11 semitones), needed for Ionian
- `"♭6"` — minor 6th (8 semitones), needed for Aeolian

Intervals `"4"`, `"♭7"`, `"2"`, and `"6"` already exist.

### New interval colors in theme

Add colors for `"7"` and `"♭6"` to `THEME_COMMON.interval`.

## State

- `activeMode`: `null | "ionian" | "mixolydian" | "aeolian" | "dorian"` (default `null`)
- Auto-clears when pentatonic is toggled off
- Auto-clears when switching between major/minor keys if the current mode doesn't match the new quality
- Independent from `scaleMode` (blues) — both can be active

## Rendering

- Mode notes render after pentatonic dots and before hit rects in SVG order
- Use existing `FretDot` component wrapped in a `<g opacity={0.55}>` group
- Same `PENTA_RADIUS` as pentatonic dots
- Interval-based colors from the same theme palette
- Mode notes follow the same `shiftNotes(data, effectiveKey)` pipeline

## Legend

When a mode is active, the legend adds entries for the 2 extra intervals at reduced opacity to match the dot rendering. These appear after pentatonic legend entries.

## Shape Ranges

Mode notes are **excluded** from `SHAPE_FRET_RANGES` computation (same as blues notes), since they would risk merging adjacent shape clusters. The existing pentatonic + triad clustering remains the source of truth for shape hover regions.
