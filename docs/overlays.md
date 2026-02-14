# Pentatonic Overlay

The frying-pan overlay visualizes how the pentatonic scale tiles across the fretboard as repeating 5-note groups on adjacent string pairs.

## Foundation

A pentatonic scale played across two adjacent strings always produces 3 notes on one string and 2 on the other. This 5-note group repeats across the three string pairs (6-5, 4-3, 2-1). To move from one copy to the next:

- Strings 6-5 → 4-3: up 2 strings, up 2 frets (both pairs tuned in 4ths)
- Strings 4-3 → 2-1: up 2 strings, up 3 frets (extra fret for the B string's major-third tuning)

There are two orientations of this pattern, which alternate across the fretboard:

- **Left-hand**: 3 notes on the lower (thicker) string, 2 on the upper
- **Right-hand**: 2 notes on the lower string, 3 on the upper

### Major and minor

The physical shape is identical for major and minor pentatonic — what changes is where the root falls:

**Major pentatonic** — root in the 3-note group:

| Group   | Notes  |
|---------|--------|
| 3 notes | **R**, 2, 3 |
| 2 notes | 5, 6   |

**Minor pentatonic** — root in the 2-note group:

| Group   | Notes  |
|---------|--------|
| 3 notes | ♭3, 4, 5 |
| 2 notes | ♭7, **R** |

This is because the relative minor uses the same notes as its relative major, shifted up 3 frets. C major pentatonic (C, D, E, G, A) and A minor pentatonic (A, C, D, E, G) are the same 5 notes — the frying-pan shape doesn't change, only which note is treated as root.

---

## Frying-pan shapes

The frying-pan framing thinks in terms of the **5-note group as a unit** that repeats across string pairs.

### The shape

The 5 notes on two adjacent strings form a shape resembling a frying pan:

- The **pan**: two pairs of notes that share the same frets across both strings (4 notes in a rectangular block)
- The **handle**: the single remaining note that sticks out to one side

```
String pair (e.g. 6-5), C major pentatonic:

  fret 8     fret 10    fret 12
    │           │           │
 5: ┄┄┄┄┄┄┄┄┄┄ G(5) ┄┄┄┄┄ A(6) ┄┄
 6: ┄ C(R) ┄┄┄ D(2) ┄┄┄┄┄ E(3) ┄┄
    │           │           │
    handle      ├── pan ────┤
```

D(2) + G(5) share fret 10. E(3) + A(6) share fret 12. Those four notes form the pan. C(R) at fret 8 is the handle.

### Two orientations

Named by which direction the handle points:

**Left-hand** — handle toward the nut:
```
upper: ┄┄┄┄┄┄┄┄┄ ● ┄┄┄┄┄ ● ┄┄
lower: ┄ ● ┄┄┄┄┄ ● ┄┄┄┄┄ ● ┄┄
         ↑ handle
```

**Right-hand** — handle toward the bridge:
```
upper: ┄ ● ┄┄┄┄┄ ● ┄┄┄┄┄ ● ┄┄
lower: ┄ ● ┄┄┄┄┄ ● ┄┄┄┄┄┄┄┄┄┄
                        handle ↑
```

### Purpose

The frying-pan overlay helps a player see the **repeating unit** across the neck. Once you recognise the shape on one string pair, you can find it on the others — the entire pentatonic scale is just this one shape tiled and flipped.

---

## Relationship to CAGED shapes

Each CAGED shape's fret region aligns with one orientation:

| Orientation | CAGED shapes |
|-------------|-------------|
| Left-hand   | E, D        |
| Right-hand  | C, A, G     |

When a CAGED shape is selected in the explorer, the corresponding orientation is highlighted.
