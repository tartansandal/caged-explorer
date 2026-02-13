# Static Data Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace calculated music theory functions with static fretboard position tables following the `FRYING_PAN` shift-and-filter pattern.

**Architecture:** All note positions stored as `[string, fret, interval]` tuples for `effectiveKey=0` across two octaves in `music.js`. A single `shiftNotes` function (double-shift + dedup) replaces `generateScale`, `assignShapes`, `computePentaBox`, and all filtering/grouping helpers. Static data generated from existing tested code, then frozen.

**Tech Stack:** React 19, Vite (rolldown), Vitest

**Design doc:** `docs/plans/2026-02-13-static-data-redesign.md`

---

### Prerequisite: Branch Setup

**Step 1: Stash uncommitted changes**

The working tree has in-progress `computePentaBox` changes that this redesign supersedes. Stash them — the generator script includes its own copy.

```bash
git stash -m "wip: computePentaBox approach (superseded by static data redesign)"
```

**Step 2: Create feature branch**

```bash
git checkout -b refactor/static-data
```

---

### Task 1: Write Data Generator Script

**Files:**
- Create: `scripts/generate-static-data.mjs`

This is a temporary tool. It uses the committed `music.js` functions to compute all static tables for `effectiveKey=0` with `maxFret=27` (two octaves), then prints valid JavaScript source to stdout.

**Step 1: Write the generator**

```js
// scripts/generate-static-data.mjs
import {
  generateScale, assignShapes, findShapes, posKey,
  SCALE, SHAPE_ORDER,
} from "../src/music.js";

const MAX_FRET = 27;

const CHORD_MAJ = {
  C: { frets: ["x",3,2,0,1,0] },
  A: { frets: ["x",0,2,2,2,0] },
  G: { frets: [3,2,0,0,0,3] },
  E: { frets: [0,2,2,1,0,0] },
  D: { frets: ["x","x",0,2,3,2] },
};
const SHAPE_ROOT_SEMI = { C: 0, D: 2, E: 4, G: 7, A: 9 };

// Same algorithm as the (stashed) computePentaBox in App.jsx
function computePentaBox(pentaNotes, chordCenter) {
  const byString = {};
  pentaNotes.forEach(([s, f]) => {
    if (!byString[s]) byString[s] = [];
    byString[s].push(f);
  });
  const pairs = {};
  Object.entries(byString).forEach(([s, frets]) => {
    frets.sort((a, b) => a - b);
    let bestI = 0, bestDist = Infinity;
    for (let i = 0; i < frets.length - 1; i++) {
      const dist = Math.abs((frets[i] + frets[i + 1]) / 2 - chordCenter);
      if (dist < bestDist) { bestDist = dist; bestI = i; }
    }
    pairs[Number(s)] = [frets[bestI], frets[bestI + 1]];
  });
  return pairs;
}

function chordCenter(shape) {
  const shift = (0 - SHAPE_ROOT_SEMI[shape] + 12) % 12;
  const nums = CHORD_MAJ[shape].frets.filter(f => typeof f === "number");
  return (Math.min(...nums) + Math.max(...nums)) / 2 + shift;
}

function chordRange(shape) {
  const shift = (0 - SHAPE_ROOT_SEMI[shape] + 12) % 12;
  const nums = CHORD_MAJ[shape].frets.filter(f => typeof f === "number");
  return { lo: Math.min(...nums) + shift, hi: Math.max(...nums) + shift };
}

// --- Generate pentatonic boxes ---
function genPentaBoxes(scaleDef) {
  const allNotes = generateScale(0, scaleDef, MAX_FRET);
  const result = {};
  SHAPE_ORDER.forEach(sh => {
    const center = chordCenter(sh);
    // Compute boxes for two octaves: original center and center+12
    const box1 = computePentaBox(allNotes, center);
    const box2 = computePentaBox(allNotes, center + 12);
    const notes = [];
    for (const box of [box1, box2]) {
      allNotes.forEach(([s, f, label]) => {
        const pair = box[s];
        if (pair && f >= pair[0] && f <= pair[1]) {
          notes.push([s, f, label]);
        }
      });
    }
    // Sort by string desc, then fret asc for readability
    notes.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    result[sh] = notes;
  });
  return result;
}

// --- Generate triad shapes ---
function genTriadShapes(scaleDef) {
  const allNotes = generateScale(0, scaleDef, MAX_FRET);
  const result = {};
  SHAPE_ORDER.forEach(sh => {
    const range = chordRange(sh);
    // Two octaves
    const notes = allNotes.filter(([, f]) =>
      (f >= range.lo && f <= range.hi) ||
      (f >= range.lo + 12 && f <= range.hi + 12)
    );
    notes.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    result[sh] = notes;
  });
  return result;
}

// --- Generate blues shapes ---
// Blues b5 belongs to the same shape as the nearest minor penta note
// at-or-below on the same string. Use minor penta boxes for range.
function genBluesShapes() {
  const allBlues = generateScale(0, SCALE.bluesAdd, MAX_FRET);
  const minPentaNotes = generateScale(0, SCALE.pentaMin, MAX_FRET);
  const result = {};
  SHAPE_ORDER.forEach(sh => {
    const center = chordCenter(sh);
    const box1 = computePentaBox(minPentaNotes, center);
    const box2 = computePentaBox(minPentaNotes, center + 12);
    const notes = [];
    for (const box of [box1, box2]) {
      allBlues.forEach(([s, f, label]) => {
        const pair = box[s];
        if (pair && f >= pair[0] && f <= pair[1]) {
          notes.push([s, f, label]);
        }
      });
    }
    notes.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    result[sh] = notes;
  });
  return result;
}

// --- Format and print ---
function fmt(data) {
  return JSON.stringify(data)
    .replace(/\[\[/g, "[\n    [")
    .replace(/\],\[/g, "],\n    [")
    .replace(/\]\]/g, "],\n  ]");
}

const pentaMaj = genPentaBoxes(SCALE.pentaMaj);
const pentaMin = genPentaBoxes(SCALE.pentaMin);
const triadMaj = genTriadShapes(SCALE.triadMaj);
const triadMin = genTriadShapes(SCALE.triadMin);
const blues = genBluesShapes();

console.log("export const PENTA_BOX = {");
console.log("  major: {");
for (const sh of SHAPE_ORDER) console.log(`    ${sh}: ${fmt(pentaMaj[sh])},`);
console.log("  },");
console.log("  minor: {");
for (const sh of SHAPE_ORDER) console.log(`    ${sh}: ${fmt(pentaMin[sh])},`);
console.log("  },");
console.log("};\n");

console.log("export const TRIAD_SHAPE = {");
console.log("  major: {");
for (const sh of SHAPE_ORDER) console.log(`    ${sh}: ${fmt(triadMaj[sh])},`);
console.log("  },");
console.log("  minor: {");
for (const sh of SHAPE_ORDER) console.log(`    ${sh}: ${fmt(triadMin[sh])},`);
console.log("  },");
console.log("};\n");

console.log("export const BLUES_SHAPE = {");
for (const sh of SHAPE_ORDER) console.log(`  ${sh}: ${fmt(blues[sh])},`);
console.log("};");
```

**Step 2: Run it and review**

```bash
node scripts/generate-static-data.mjs > /tmp/static-data.js
```

Visually inspect the output. For C major pentatonic C shape, string 6 should have frets 0 and 3 (the E and G closest to the open C chord). For E shape, string 6 should have frets 8 and 10 (C and D near the barre E chord at fret 8).

**Step 3: Commit the generator**

```bash
git add scripts/generate-static-data.mjs
git commit -m "chore: add static data generator script (temporary)"
```

---

### Task 2: Add Static Data and `shiftNotes` to `music.js`

**Files:**
- Modify: `src/music.js`

**Step 1: Add static tables**

Paste the generated output from `/tmp/static-data.js` into `music.js` after the existing `FRYING_PAN` and `SHAPE_ORIENTATION` constants. Do NOT delete anything yet — both old and new code coexist.

**Step 2: Add `shiftNotes` function**

Add to `music.js` after the static tables:

```js
// Shift note positions by effectiveKey using the FRYING_PAN double-shift
// pattern: try both +ek and +(ek-12) to cover the full fretboard for any
// key, dedup by position since two-octave data can produce overlapping notes.
export function shiftNotes(notes, effectiveKey, maxFret = NUM_FRETS) {
  const seen = new Set();
  const result = [];
  for (const shift of [effectiveKey, effectiveKey - 12]) {
    for (const [s, f, interval] of notes) {
      const sf = f + shift;
      if (sf >= 0 && sf <= maxFret) {
        const key = `${s}-${sf}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push([s, sf, interval]);
        }
      }
    }
  }
  return result;
}
```

**Step 3: Commit**

```bash
git add src/music.js
git commit -m "feat: add static PENTA_BOX, TRIAD_SHAPE, BLUES_SHAPE tables and shiftNotes"
```

---

### Task 3: Write Data Integrity Tests

**Files:**
- Modify: `src/App.test.js`

Add a new test block after the existing tests. Do NOT remove old tests yet — they validate the functions we haven't deleted.

**Step 1: Write pentatonic box structure tests**

```js
import {
  PENTA_BOX, TRIAD_SHAPE, BLUES_SHAPE, shiftNotes,
  // ... existing imports
} from "./music.js";

describe("PENTA_BOX data integrity", () => {
  it("each box has exactly 2 notes per string per octave", () => {
    for (const scale of ["major", "minor"]) {
      for (const sh of SHAPE_ORDER) {
        const notes = PENTA_BOX[scale][sh];
        // Group by string, then by octave (frets 0-14 vs 12-27)
        for (let s = 1; s <= 6; s++) {
          const lo = notes.filter(([ns, f]) => ns === s && f < 12);
          const hi = notes.filter(([ns, f]) => ns === s && f >= 12);
          expect(lo).toHaveLength(2);
          expect(hi).toHaveLength(2);
        }
      }
    }
  });

  it("boundary notes appear in exactly 2 adjacent shapes", () => {
    for (const scale of ["major", "minor"]) {
      // Build position → shapes map from first-octave data
      const posShapes = new Map();
      SHAPE_ORDER.forEach(sh => {
        PENTA_BOX[scale][sh]
          .filter(([, f]) => f < 12)
          .forEach(([s, f]) => {
            const key = `${s}-${f}`;
            const shapes = posShapes.get(key) || [];
            if (!shapes.includes(sh)) shapes.push(sh);
            posShapes.set(key, shapes);
          });
      });
      posShapes.forEach((shapes, key) => {
        // Each position is in 1 shape (edge) or 2 shapes (boundary)
        expect(shapes.length).toBeLessThanOrEqual(2);
        if (shapes.length === 2) {
          const i0 = SHAPE_ORDER.indexOf(shapes[0]);
          const i1 = SHAPE_ORDER.indexOf(shapes[1]);
          const diff = Math.abs(i0 - i1);
          expect(diff === 1 || diff === 4).toBe(true);
        }
      });
    }
  });

  it("intervals are valid for the scale type", () => {
    const validMaj = new Set(["R", "2", "3", "5", "6"]);
    const validMin = new Set(["R", "♭3", "4", "5", "♭7"]);
    for (const sh of SHAPE_ORDER) {
      PENTA_BOX.major[sh].forEach(([,, iv]) => expect(validMaj.has(iv)).toBe(true));
      PENTA_BOX.minor[sh].forEach(([,, iv]) => expect(validMin.has(iv)).toBe(true));
    }
  });
});
```

**Step 2: Write major/minor equivalence test**

```js
describe("major/minor pentatonic equivalence", () => {
  it("major shifted by ek has same positions as minor shifted by (ek+3)%12", () => {
    for (let ek = 0; ek < 12; ek++) {
      const majPositions = new Set();
      SHAPE_ORDER.forEach(sh => {
        shiftNotes(PENTA_BOX.major[sh], ek).forEach(([s, f]) => {
          majPositions.add(`${s}-${f}`);
        });
      });

      const minEk = (ek + 3) % 12;
      const minPositions = new Set();
      SHAPE_ORDER.forEach(sh => {
        shiftNotes(PENTA_BOX.minor[sh], minEk).forEach(([s, f]) => {
          minPositions.add(`${s}-${f}`);
        });
      });

      expect(majPositions).toEqual(minPositions);
    }
  });
});
```

**Step 3: Write `shiftNotes` tests**

```js
describe("shiftNotes", () => {
  it("shift=0 returns notes in [0, NUM_FRETS]", () => {
    const notes = shiftNotes(PENTA_BOX.major.C, 0);
    notes.forEach(([, f]) => {
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(NUM_FRETS);
    });
  });

  it("deduplicates overlapping positions from double shift", () => {
    for (let ek = 0; ek < 12; ek++) {
      const notes = shiftNotes(PENTA_BOX.major.C, ek);
      const positions = notes.map(([s, f]) => `${s}-${f}`);
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it("all 12 keys produce notes on all 6 strings", () => {
    for (let ek = 0; ek < 12; ek++) {
      // Merge all shapes
      const strings = new Set();
      SHAPE_ORDER.forEach(sh => {
        shiftNotes(PENTA_BOX.major[sh], ek).forEach(([s]) => strings.add(s));
      });
      expect(strings.size).toBe(6);
    }
  });
});
```

**Step 4: Run tests**

```bash
npm test
```

Expected: all new tests pass, all old tests still pass.

**Step 5: Commit**

```bash
git add src/App.test.js
git commit -m "test: add data integrity and shiftNotes tests for static tables"
```

---

### Task 4: Replace Pentatonic Consumers in `App.jsx`

**Files:**
- Modify: `src/App.jsx`

**Step 1: Update imports**

Add `PENTA_BOX`, `BLUES_SHAPE`, `shiftNotes` to the import from `./music.js`.

**Step 2: Replace pentatonic memo blocks**

Remove `allMajPentaNotes`, `allMinPentaNotes`, `allBluesNotes`, `majPentaRanges`, `minPentaRanges`, `majShapeMap`, `minShapeMap`, `computePentaBox`, `filterByBox`, `MAJ_SEMI`, `MIN_SEMI`.

Replace `majPenta`, `minPenta`, `bluesNotes` with:

```js
const majPenta = useMemo(() => {
  const byShape = {};
  const shapes = activeShape === "all" ? SHAPES : [activeShape];
  shapes.forEach(sh => { byShape[sh] = shiftNotes(PENTA_BOX.major[sh], effectiveKey); });
  return byShape;
}, [activeShape, effectiveKey]);

const minPenta = useMemo(() => {
  const byShape = {};
  const shapes = activeShape === "all" ? SHAPES : [activeShape];
  shapes.forEach(sh => { byShape[sh] = shiftNotes(PENTA_BOX.minor[sh], effectiveKey); });
  return byShape;
}, [activeShape, effectiveKey]);

const bluesNotes = useMemo(() => {
  const byShape = {};
  const shapes = activeShape === "all" ? SHAPES : [activeShape];
  shapes.forEach(sh => { byShape[sh] = shiftNotes(BLUES_SHAPE[sh], effectiveKey); });
  return byShape;
}, [activeShape, effectiveKey]);
```

**Step 3: Verify**

```bash
npm test && npm run dev
```

Open browser, check all 12 keys × major/minor × each shape + "all". Pentatonic dots should render same as before.

**Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: replace pentatonic computation with static PENTA_BOX + shiftNotes"
```

---

### Task 5: Replace Triad Consumers in `App.jsx`

**Files:**
- Modify: `src/App.jsx`

**Step 1: Update imports**

Add `TRIAD_SHAPE` to the import from `./music.js`.

**Step 2: Replace triad memo blocks**

Remove `allMajTriadNotes`, `allMinTriadNotes`, `filterByRange`, `groupByShape`, `findShapeBelow`.

Replace `majTriads`, `minTriads` with:

```js
const majTriads = useMemo(() => {
  const byShape = {};
  const shapes = activeShape === "all" ? SHAPES : [activeShape];
  shapes.forEach(sh => { byShape[sh] = shiftNotes(TRIAD_SHAPE.major[sh], effectiveKey); });
  return byShape;
}, [activeShape, effectiveKey]);

const minTriads = useMemo(() => {
  const byShape = {};
  const shapes = activeShape === "all" ? SHAPES : [activeShape];
  shapes.forEach(sh => { byShape[sh] = shiftNotes(TRIAD_SHAPE.minor[sh], effectiveKey); });
  return byShape;
}, [activeShape, effectiveKey]);
```

**Step 3: Replace `shapeRanges`**

Remove the `shapeRanges` useMemo and `SHAPE_ROOT_SEMI`. Derive fret ranges from the triad data (which is always present regardless of display mode):

```js
const shapeRanges = useMemo(() => {
  const ranges = {};
  SHAPES.forEach(sh => {
    const notes = shiftNotes(TRIAD_SHAPE.major[sh], effectiveKey);
    const frets = notes.map(([, f]) => f);
    ranges[sh] = { lo: Math.min(...frets), hi: Math.max(...frets) };
  });
  return ranges;
}, [effectiveKey]);
```

**Step 4: Remove shape ownership indirection**

In the all-shapes SVG rendering, triad dots currently get shape borders via the pentatonic shape map. With static data, the shape is known from which array the note came from — the rendering loop already iterates `visibleShapes.map(sh => ...)`. No separate ownership lookup needed for triads.

For pentatonic dots that need shape borders in all-shapes view, build the reverse index:

```js
const pentaShapeOwnership = useMemo(() => {
  if (activeShape !== "all") return null;
  const scale = pentaMode === "major" ? "major" : "minor";
  const map = new Map();
  SHAPES.forEach(sh => {
    shiftNotes(PENTA_BOX[scale][sh], effectiveKey).forEach(([s, f]) => {
      const key = posKey(s, f);
      const shapes = map.get(key) || [];
      if (!shapes.includes(sh)) shapes.push(sh);
      map.set(key, shapes);
    });
  });
  return map;
}, [activeShape, effectiveKey, pentaMode]);
```

**Step 5: Verify**

```bash
npm test && npm run dev
```

Check triads in all 12 keys, all shapes, major/minor/both modes.

**Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: replace triad computation with static TRIAD_SHAPE + shiftNotes"
```

---

### Task 6: Delete Dead Code

**Files:**
- Modify: `src/music.js`
- Modify: `src/App.jsx`
- Modify: `src/App.test.js`
- Delete: `scripts/generate-static-data.mjs`

**Step 1: Clean `music.js`**

Remove:
- `TUNING`
- `SCALE`
- `generateScale`
- `assignShapes`
- `findShapes`

Keep:
- `NUM_FRETS`, `SHAPE_ORDER`, `posKey`
- `FRYING_PAN`, `SHAPE_ORIENTATION`
- `PENTA_BOX`, `TRIAD_SHAPE`, `BLUES_SHAPE`, `shiftNotes`

**Step 2: Clean `App.jsx`**

Remove:
- `generateScale`, `assignShapes`, `findShapes` from imports
- `SHAPE_ROOT_SEMI`
- `computePentaBox`, `filterByBox`, `filterByRange`, `groupByShape`, `findShapeBelow`
- `MAJ_SEMI`, `MIN_SEMI`
- Any remaining dead `useMemo` blocks

**Step 3: Update `App.test.js`**

Remove:
- `generateScale` tests (function no longer exists)
- `assignShapes` tests (function no longer exists)
- `findShapes` tests (function no longer exists)
- `shapeRanges` tests that replicate `CHORD_MAJ` logic (ranges now derived from data)
- `pentaShapeRanges` / `computePentaBox` tests (function no longer exists)
- Imports of deleted functions
- Test-local copies of `CHORD_MAJ`, `SHAPE_ROOT_SEMI`, `computeShapeRanges`, `computePentaBox`, `computePentaShapeBoxes`

Keep:
- `FRYING_PAN` geometry tests (unchanged)
- New data integrity tests from Task 3
- New `shiftNotes` tests from Task 3

**Step 4: Delete generator script**

```bash
rm scripts/generate-static-data.mjs
rmdir scripts 2>/dev/null || true
```

**Step 5: Run full test suite**

```bash
npm test
npm run lint
npm run build
```

Expected: all pass, no warnings about missing exports.

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove generateScale, assignShapes, and all calculation helpers"
```

---

### Task 7: Final Verification and Cleanup

**Step 1: Visual regression check**

```bash
npm run dev
```

Systematically check:
- All 12 major keys × C/A/G/E/D shapes + "All"
- All 12 minor keys × same
- Triads: major, minor, both, off
- Pentatonic: major, minor, blues, off
- Labels: intervals, notes, both
- Overlays: frying pan, 3:2, off
- Chord diagrams render correctly

**Step 2: Review diff**

```bash
git diff main..HEAD --stat
```

Verify net code reduction. The static data tables add lines, but the deleted computation logic should result in a significant net simplification of `App.jsx`.

**Step 3: Update `CLAUDE.md` if needed**

The Architecture section references `generateScale`, `assignShapes`, and `findShapes`. Update to describe the new static data + `shiftNotes` pattern.

**Step 4: Commit any final adjustments**

```bash
git add -A
git commit -m "docs: update CLAUDE.md for static data architecture"
```
