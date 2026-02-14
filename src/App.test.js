import { describe, it, expect } from "vitest";
import {
  SHAPE_ORDER,
  FRYING_PAN,
  NUM_FRETS,
  SHAPE_ORIENTATION,
  PENTA_BOX,
  TRIAD_SHAPE,
  shiftNotes,
} from "./music.js";

// ─── FRYING_PAN geometry ────────────────────────────────────────────────────

describe("FRYING_PAN geometry", () => {
  it("for each key 0-11, at least one shape per orientation is visible within [0, NUM_FRETS]", () => {
    for (let key = 0; key < 12; key++) {
      for (const side of ["left", "right"]) {
        const templates = FRYING_PAN[side];
        const visibleCount = templates.filter((t) => {
          const panMin = t.panMin + key;
          const panMax = t.panMax + key;
          const handleFret = t.handleFret + key;
          return [panMin, panMax, handleFret].some((f) => f >= 0 && f <= NUM_FRETS);
        }).length;
        expect(visibleCount).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("SHAPE_ORIENTATION maps all 5 shapes", () => {
    SHAPE_ORDER.forEach((shape) => {
      expect(SHAPE_ORIENTATION[shape]).toBeDefined();
      expect(["left", "right"]).toContain(SHAPE_ORIENTATION[shape]);
    });
  });

  it("visible pans span both halves of the fretboard for all 12 keys", () => {
    const mid = Math.floor(NUM_FRETS / 2);
    for (let key = 0; key < 12; key++) {
      let hasLower = false;
      let hasUpper = false;
      // Must try both shifts to cover the full fretboard for high keys
      for (const shift of [key, key - 12]) {
        for (const side of ["left", "right"]) {
          FRYING_PAN[side].forEach((t) => {
            const panMin = t.panMin + shift;
            const panMax = t.panMax + shift;
            const handleFret = t.handleFret + shift;
            if ([panMin, panMax, handleFret].some((f) => f >= 0 && f <= NUM_FRETS)) {
              if (panMin <= mid) hasLower = true;
              if (panMax > mid) hasUpper = true;
            }
          });
        }
      }
      expect(hasLower).toBe(true);
      expect(hasUpper).toBe(true);
    }
  });

  it("frying pan templates have consistent string pairs", () => {
    for (const side of ["left", "right"]) {
      FRYING_PAN[side].forEach((t) => {
        // pair should be adjacent string pairs (6,5), (4,3), or (2,1)
        expect([[6, 5], [4, 3], [2, 1]]).toContainEqual(t.pair);
        // handle string should be one of the pair
        expect(t.pair).toContain(t.handleStr);
        // handle direction matches side
        expect(t.handleDir).toBe(side);
      });
    }
  });
});

// ─── PENTA_BOX data integrity ────────────────────────────────────────────────

describe("PENTA_BOX data integrity", () => {
  it("each box has exactly 2 notes per string per octave", () => {
    for (const scale of ["major", "minor"]) {
      for (const sh of SHAPE_ORDER) {
        const notes = PENTA_BOX[scale][sh];
        for (let s = 1; s <= 6; s++) {
          const strNotes = notes
            .filter(([ns]) => ns === s)
            .sort(([, a], [, b]) => a - b);
          // 4 total: 2 in the low octave, 2 in the high (offset by +12)
          expect(strNotes).toHaveLength(4);
          const lo = strNotes.slice(0, 2);
          const hi = strNotes.slice(2, 4);
          expect(lo).toHaveLength(2);
          expect(hi).toHaveLength(2);
          // high octave notes are exactly 12 frets above low octave
          expect(hi[0][1] - lo[0][1]).toBe(12);
          expect(hi[1][1] - lo[1][1]).toBe(12);
        }
      }
    }
  });

  it("boundary notes appear in exactly 2 adjacent shapes", () => {
    for (const scale of ["major", "minor"]) {
      const posShapes = new Map();
      SHAPE_ORDER.forEach(sh => {
        // Use only the low-octave notes (first 2 per string, sorted by fret)
        const byString = {};
        PENTA_BOX[scale][sh].forEach(([s, f, iv]) => {
          if (!byString[s]) byString[s] = [];
          byString[s].push([s, f, iv]);
        });
        Object.values(byString).forEach(notes => {
          notes.sort(([, a], [, b]) => a - b);
          notes.slice(0, 2).forEach(([s, f]) => {
            const key = `${s}-${f}`;
            const shapes = posShapes.get(key) || [];
            if (!shapes.includes(sh)) shapes.push(sh);
            posShapes.set(key, shapes);
          });
        });
      });
      posShapes.forEach((shapes) => {
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
    const validMin = new Set(["R", "\u266d3", "4", "5", "\u266d7"]);
    for (const sh of SHAPE_ORDER) {
      PENTA_BOX.major[sh].forEach(([,, iv]) => expect(validMaj.has(iv)).toBe(true));
      PENTA_BOX.minor[sh].forEach(([,, iv]) => expect(validMin.has(iv)).toBe(true));
    }
  });
});

// ─── TRIAD_SHAPE data integrity ──────────────────────────────────────────────

describe("TRIAD_SHAPE data integrity", () => {
  it("each shape has at most 1 triad note per string per octave region after shifting", () => {
    for (const scale of ["major", "minor"]) {
      for (const sh of SHAPE_ORDER) {
        for (let ek = 0; ek < 12; ek++) {
          const notes = shiftNotes(TRIAD_SHAPE[scale][sh], ek);
          // Group by string
          const byString = {};
          notes.forEach(([s, f, iv]) => {
            if (!byString[s]) byString[s] = [];
            byString[s].push({ fret: f, interval: iv });
          });
          for (const [_s, strNotes] of Object.entries(byString)) {
            if (strNotes.length <= 1) continue;
            // 2 notes on the same string is only okay if they're 12 frets apart
            expect(strNotes.length).toBeLessThanOrEqual(2);
            if (strNotes.length === 2) {
              const [a, b] = strNotes.sort((x, y) => x.fret - y.fret);
              expect(Math.abs(a.fret - b.fret)).toBe(12);
            }
          }
        }
      }
    }
  });
});

// ─── major/minor pentatonic equivalence ──────────────────────────────────────

describe("major/minor pentatonic equivalence", () => {
  it("major shifted by ek has same positions as minor shifted by (ek+9)%12", () => {
    for (let ek = 0; ek < 12; ek++) {
      const majPositions = new Set();
      SHAPE_ORDER.forEach(sh => {
        shiftNotes(PENTA_BOX.major[sh], ek).forEach(([s, f]) => {
          majPositions.add(`${s}-${f}`);
        });
      });

      const minEk = (ek + 9) % 12;
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

// ─── shiftNotes ──────────────────────────────────────────────────────────────

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
      const strings = new Set();
      SHAPE_ORDER.forEach(sh => {
        shiftNotes(PENTA_BOX.major[sh], ek).forEach(([s]) => strings.add(s));
      });
      expect(strings.size).toBe(6);
    }
  });
});
