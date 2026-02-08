import { describe, it, expect } from "vitest";
import {
  generateScale,
  assignShapes,
  findShapes,
  posKey,
  TUNING,
  SCALE,
  SHAPE_ORDER,
  FRYING_PAN,
  NUM_FRETS,
  SHAPE_ORIENTATION,
} from "./music.js";

// ─── generateScale ──────────────────────────────────────────────────────────

describe("generateScale", () => {
  it("produces correct C major triad fret positions", () => {
    const notes = generateScale(0, SCALE.triadMaj);
    // On string 1 (high E, open = E = semitone 4):
    // Root C is (0 - 4 + 12) % 12 = 8 → fret 8
    // Major 3rd E is (4 - 4 + 12) % 12 = 0 → fret 0, 12
    // Perfect 5th G is (7 - 4 + 12) % 12 = 3 → fret 3, 15
    const str1 = notes.filter(([s]) => s === 1);
    const str1Frets = str1.map(([, f]) => f).sort((a, b) => a - b);
    expect(str1Frets).toContain(0);  // E (3rd) at open
    expect(str1Frets).toContain(3);  // G (5th) at fret 3
    expect(str1Frets).toContain(8);  // C (root) at fret 8
    expect(str1Frets).toContain(12); // E (3rd) at fret 12
    expect(str1Frets).toContain(15); // G (5th) at fret 15
  });

  it("keeps all frets within [0, NUM_FRETS]", () => {
    for (let key = 0; key < 12; key++) {
      for (const scale of [SCALE.triadMaj, SCALE.triadMin, SCALE.pentaMaj, SCALE.pentaMin, SCALE.bluesAdd]) {
        const notes = generateScale(key, scale);
        notes.forEach(([, fret]) => {
          expect(fret).toBeGreaterThanOrEqual(0);
          expect(fret).toBeLessThanOrEqual(NUM_FRETS);
        });
      }
    }
  });

  it("produces identical results for key=0 and key=12 (octave equivalence)", () => {
    const key0 = generateScale(0, SCALE.pentaMaj);
    const key12 = generateScale(12, SCALE.pentaMaj);
    expect(key0).toEqual(key12);
  });

  it("generates notes on all 6 strings", () => {
    const notes = generateScale(0, SCALE.pentaMaj);
    const strings = new Set(notes.map(([s]) => s));
    expect(strings.size).toBe(6);
    for (let s = 1; s <= 6; s++) {
      expect(strings.has(s)).toBe(true);
    }
  });
});

// ─── assignShapes — shape cycle correctness ─────────────────────────────────

describe("assignShapes — shape cycle", () => {
  const majSemi = SCALE.pentaMaj.map((d) => d.semi);

  it("for key=0 the first shape on every string is C", () => {
    const pentaNotes = generateScale(0, SCALE.pentaMaj);
    const shapeMap = assignShapes(pentaNotes, 0, majSemi);
    // First note on each string (lowest fret) should include C
    for (let s = 1; s <= 6; s++) {
      const strNotes = pentaNotes
        .filter(([ns]) => ns === s)
        .sort((a, b) => a[1] - b[1]);
      const firstKey = posKey(s, strNotes[0][1]);
      const shapes = shapeMap.get(firstKey);
      expect(shapes).toContain("C");
    }
  });

  it("for key=4 the first shape on every string is E", () => {
    const pentaNotes = generateScale(4, SCALE.pentaMaj);
    const shapeMap = assignShapes(pentaNotes, 4, majSemi);
    for (let s = 1; s <= 6; s++) {
      const strNotes = pentaNotes
        .filter(([ns]) => ns === s)
        .sort((a, b) => a[1] - b[1]);
      const firstKey = posKey(s, strNotes[0][1]);
      const shapes = shapeMap.get(firstKey);
      expect(shapes).toContain("E");
    }
  });

  it("for key=9 the first shape on every string is A", () => {
    const pentaNotes = generateScale(9, SCALE.pentaMaj);
    const shapeMap = assignShapes(pentaNotes, 9, majSemi);
    for (let s = 1; s <= 6; s++) {
      const strNotes = pentaNotes
        .filter(([ns]) => ns === s)
        .sort((a, b) => a[1] - b[1]);
      const firstKey = posKey(s, strNotes[0][1]);
      const shapes = shapeMap.get(firstKey);
      expect(shapes).toContain("A");
    }
  });

  it("first note on every string maps to the same shape for all 12 keys", () => {
    for (let key = 0; key < 12; key++) {
      const pentaNotes = generateScale(key, SCALE.pentaMaj);
      const shapeMap = assignShapes(pentaNotes, key, majSemi);
      let expectedShape = null;
      for (let s = 1; s <= 6; s++) {
        const strNotes = pentaNotes
          .filter(([ns]) => ns === s)
          .sort((a, b) => a[1] - b[1]);
        const firstKey = posKey(s, strNotes[0][1]);
        const shapes = shapeMap.get(firstKey);
        // First note gets the "primary" shape (index 0 in cycle)
        // It should be the same shape on every string
        if (expectedShape === null) {
          expectedShape = shapes[0];
        }
        expect(shapes).toContain(expectedShape);
      }
    }
  });

  it("boundary notes are shared between exactly 2 adjacent shapes", () => {
    const pentaNotes = generateScale(0, SCALE.pentaMaj);
    const shapeMap = assignShapes(pentaNotes, 0, majSemi);
    // Non-first notes should have exactly 2 shapes (shared boundary)
    for (let s = 1; s <= 6; s++) {
      const strNotes = pentaNotes
        .filter(([ns]) => ns === s)
        .sort((a, b) => a[1] - b[1]);
      // Skip first note (only 1 shape); rest should have 2
      for (let i = 1; i < strNotes.length; i++) {
        const key = posKey(s, strNotes[i][1]);
        const shapes = shapeMap.get(key);
        expect(shapes).toHaveLength(2);
        // The two shapes should be adjacent in SHAPE_ORDER
        const idx0 = SHAPE_ORDER.indexOf(shapes[0]);
        const idx1 = SHAPE_ORDER.indexOf(shapes[1]);
        const diff = Math.abs(idx0 - idx1);
        expect(diff === 1 || diff === 4).toBe(true); // adjacent or wrap-around
      }
    }
  });
});

// ─── assignShapes — coverage (all 12 keys x major + minor) ──────────────────

describe("assignShapes — coverage", () => {
  const majSemi = SCALE.pentaMaj.map((d) => d.semi);
  const minSemi = SCALE.pentaMin.map((d) => d.semi);

  it("every major triad note has a direct hit in the major pentatonic shape map", () => {
    for (let key = 0; key < 12; key++) {
      const triadNotes = generateScale(key, SCALE.triadMaj);
      const pentaNotes = generateScale(key, SCALE.pentaMaj);
      const shapeMap = assignShapes(pentaNotes, key, majSemi);
      // Major triad intervals (R, 3, 5) are all in major pentatonic (R, 2, 3, 5, 6)
      // so every triad note position should be directly in the shape map
      triadNotes.forEach(([s, f]) => {
        const shapes = findShapes(shapeMap, s, f);
        expect(shapes).not.toBeNull();
        expect(shapes.length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  it("every minor triad note has a direct hit in the minor pentatonic shape map", () => {
    for (let key = 0; key < 12; key++) {
      const triadNotes = generateScale(key, SCALE.triadMin);
      const pentaNotes = generateScale(key, SCALE.pentaMin);
      const shapeMap = assignShapes(pentaNotes, key, minSemi);
      // Minor triad intervals (R, ♭3, 5) are all in minor pentatonic (R, ♭3, 4, 5, ♭7)
      triadNotes.forEach(([s, f]) => {
        const shapes = findShapes(shapeMap, s, f);
        expect(shapes).not.toBeNull();
        expect(shapes.length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  it("every pentatonic note is assigned to at least one shape", () => {
    for (let key = 0; key < 12; key++) {
      for (const [scale, semi] of [
        [SCALE.pentaMaj, majSemi],
        [SCALE.pentaMin, minSemi],
      ]) {
        const pentaNotes = generateScale(key, scale);
        const shapeMap = assignShapes(pentaNotes, key, semi);
        pentaNotes.forEach(([s, f]) => {
          const key_ = posKey(s, f);
          const shapes = shapeMap.get(key_);
          expect(shapes).toBeDefined();
          expect(shapes.length).toBeGreaterThanOrEqual(1);
        });
      }
    }
  });

  it("every blues ♭5 has a minor pentatonic note at or below on the same string (or wraps)", () => {
    for (let key = 0; key < 12; key++) {
      const bluesNotes = generateScale(key, SCALE.bluesAdd);
      const pentaNotes = generateScale(key, SCALE.pentaMin);
      const shapeMap = assignShapes(pentaNotes, key, minSemi);
      bluesNotes.forEach(([s, f]) => {
        // There should be a minor pentatonic note at or below this fret on the same string
        const sameString = pentaNotes.filter(([ns]) => ns === s);
        const atOrBelow = sameString.filter(([, nf]) => nf <= f);
        // Either there's one at or below, or we wrap to the highest
        if (atOrBelow.length === 0) {
          // Wrap case: highest pentatonic note on this string should exist
          expect(sameString.length).toBeGreaterThan(0);
        } else {
          expect(atOrBelow.length).toBeGreaterThan(0);
        }
        // The blues note should be findable via the shape map (nearest neighbor)
        const shapes = findShapes(shapeMap, s, f);
        expect(shapes).not.toBeNull();
      });
    }
  });
});

// ─── findShapes ─────────────────────────────────────────────────────────────

describe("findShapes", () => {
  const majSemi = SCALE.pentaMaj.map((d) => d.semi);

  it("direct hit returns correct shapes", () => {
    const pentaNotes = generateScale(0, SCALE.pentaMaj);
    const shapeMap = assignShapes(pentaNotes, 0, majSemi);
    // Pick a known pentatonic position
    const [s, f] = pentaNotes[0];
    const direct = shapeMap.get(posKey(s, f));
    const found = findShapes(shapeMap, s, f);
    expect(found).toBe(direct);
  });

  it("nearest-neighbor fallback for off-position notes", () => {
    const pentaNotes = generateScale(0, SCALE.pentaMaj);
    const shapeMap = assignShapes(pentaNotes, 0, majSemi);
    // ♭3 at fret positions — these are not in major pentatonic but should
    // resolve via nearest neighbor
    const minTriadNotes = generateScale(0, SCALE.triadMin);
    const b3Notes = minTriadNotes.filter(([, , iv]) => iv === "♭3");
    b3Notes.forEach(([s, f]) => {
      const key = posKey(s, f);
      if (!shapeMap.has(key)) {
        // This is an off-position note — findShapes should return nearest
        const shapes = findShapes(shapeMap, s, f);
        expect(shapes).not.toBeNull();
        expect(shapes.length).toBeGreaterThanOrEqual(1);
        // Should be a valid CAGED shape
        shapes.forEach((sh) => {
          expect(SHAPE_ORDER).toContain(sh);
        });
      }
    });
  });
});

// ─── FRYING_PAN geometry ────────────────────────────────────────────────────

describe("FRYING_PAN geometry", () => {
  it("for each key 0-11, at least one shape per orientation is visible within [0, NUM_FRETS]", () => {
    for (let key = 0; key < 12; key++) {
      for (const side of ["left", "right"]) {
        const templates = FRYING_PAN[side];
        const visibleCount = templates.filter((t) => {
          const panMin = t.panMin + key;
          const panMax = t.panMax + key;
          const hFret = t.hFret + key;
          return [panMin, panMax, hFret].some((f) => f >= 0 && f <= NUM_FRETS);
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

  it("frying pan templates have consistent string pairs", () => {
    for (const side of ["left", "right"]) {
      FRYING_PAN[side].forEach((t) => {
        // pair should be adjacent string pairs (6,5), (4,3), or (2,1)
        expect([[6, 5], [4, 3], [2, 1]]).toContainEqual(t.pair);
        // handle string should be one of the pair
        expect(t.pair).toContain(t.hStr);
        // handle direction matches side
        expect(t.hDir).toBe(side);
      });
    }
  });
});
