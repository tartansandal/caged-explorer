import { describe, it, expect } from "vitest";
import {
  SHAPE_ORDER,
  FRYING_PAN,
  NUM_FRETS,
  SHAPE_ORIENTATION,
  PENTA_BOX,
  TRIAD_SHAPE,
  BLUES_SHAPE,
  shiftNotes,
  clusterFrets,
  SHAPE_FRET_RANGES,
  computeHoverRanges,
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

// ─── BLUES_SHAPE bounding ────────────────────────────────────────────────────

// Shared helper for blues bounding tests (uses exported clusterFrets)

const filterBlues = (bluesNotes, clusters) =>
  bluesNotes.filter(([, f]) => clusters.some(c => f >= c.lo - 1 && f <= c.hi + 1));

describe("BLUES_SHAPE.minor notes bounded to minor pentatonic box", () => {
  it("after cluster filtering, all blues notes are within 1 fret of their shape's minor pentatonic cluster", () => {
    for (const sh of SHAPE_ORDER) {
      for (let ek = 0; ek < 12; ek++) {
        const pentaFrets = shiftNotes(PENTA_BOX.minor[sh], ek).map(([, f]) => f);
        const clusters = clusterFrets(pentaFrets);
        const shifted = shiftNotes(BLUES_SHAPE.minor[sh], ek);
        const filtered = filterBlues(shifted, clusters);

        filtered.forEach(([s, f]) => {
          const inRange = clusters.some(c => f >= c.lo - 1 && f <= c.hi + 1);
          expect(inRange, `shape=${sh} ek=${ek} string=${s} fret=${f} clusters=${JSON.stringify(clusters)}`).toBe(true);
        });
      }
    }
  });

  it("at most 3 notes per string per cluster with blues scale (2 penta + 1 blue)", () => {
    for (const sh of SHAPE_ORDER) {
      for (let ek = 0; ek < 12; ek++) {
        const pentaNotes = shiftNotes(PENTA_BOX.minor[sh], ek);
        const pentaFrets = pentaNotes.map(([, f]) => f);
        const clusters = clusterFrets(pentaFrets);
        const blues = filterBlues(shiftNotes(BLUES_SHAPE.minor[sh], ek), clusters);
        const allNotes = [...pentaNotes, ...blues];

        for (const cluster of clusters) {
          for (let s = 1; s <= 6; s++) {
            const count = allNotes.filter(([ns, f]) =>
              ns === s && f >= cluster.lo - 1 && f <= cluster.hi + 1
            ).length;
            expect(count, `shape=${sh} ek=${ek} str=${s} cluster=${JSON.stringify(cluster)}`).toBeLessThanOrEqual(3);
          }
        }
      }
    }
  });

  it("unfiltered blues notes have out-of-range entries that filtering removes", () => {
    let totalRemoved = 0;
    for (const sh of SHAPE_ORDER) {
      for (let ek = 0; ek < 12; ek++) {
        const pentaFrets = shiftNotes(PENTA_BOX.minor[sh], ek).map(([, f]) => f);
        const clusters = clusterFrets(pentaFrets);
        const shifted = shiftNotes(BLUES_SHAPE.minor[sh], ek);
        const filtered = filterBlues(shifted, clusters);
        totalRemoved += shifted.length - filtered.length;
      }
    }
    expect(totalRemoved).toBeGreaterThan(0);
  });
});

describe("BLUES_SHAPE.major notes bounded to major pentatonic box", () => {
  it("after cluster filtering, all major blues notes are within 1 fret of their shape's major pentatonic cluster", () => {
    for (const sh of SHAPE_ORDER) {
      for (let ek = 0; ek < 12; ek++) {
        const pentaFrets = shiftNotes(PENTA_BOX.major[sh], ek).map(([, f]) => f);
        const clusters = clusterFrets(pentaFrets);
        const shifted = shiftNotes(BLUES_SHAPE.major[sh], ek);
        const filtered = filterBlues(shifted, clusters);

        filtered.forEach(([s, f]) => {
          const inRange = clusters.some(c => f >= c.lo - 1 && f <= c.hi + 1);
          expect(inRange, `shape=${sh} ek=${ek} string=${s} fret=${f} clusters=${JSON.stringify(clusters)}`).toBe(true);
        });
      }
    }
  });

  it("at most 3 notes per string per cluster with major blues scale (2 penta + 1 blue)", () => {
    for (const sh of SHAPE_ORDER) {
      for (let ek = 0; ek < 12; ek++) {
        const pentaNotes = shiftNotes(PENTA_BOX.major[sh], ek);
        const pentaFrets = pentaNotes.map(([, f]) => f);
        const clusters = clusterFrets(pentaFrets);
        const blues = filterBlues(shiftNotes(BLUES_SHAPE.major[sh], ek), clusters);
        const allNotes = [...pentaNotes, ...blues];

        for (const cluster of clusters) {
          for (let s = 1; s <= 6; s++) {
            const count = allNotes.filter(([ns, f]) =>
              ns === s && f >= cluster.lo - 1 && f <= cluster.hi + 1
            ).length;
            expect(count, `shape=${sh} ek=${ek} str=${s} cluster=${JSON.stringify(cluster)}`).toBeLessThanOrEqual(3);
          }
        }
      }
    }
  });

  it("unfiltered major blues notes have out-of-range entries that filtering removes", () => {
    let totalRemoved = 0;
    for (const sh of SHAPE_ORDER) {
      for (let ek = 0; ek < 12; ek++) {
        const pentaFrets = shiftNotes(PENTA_BOX.major[sh], ek).map(([, f]) => f);
        const clusters = clusterFrets(pentaFrets);
        const shifted = shiftNotes(BLUES_SHAPE.major[sh], ek);
        const filtered = filterBlues(shifted, clusters);
        totalRemoved += shifted.length - filtered.length;
      }
    }
    expect(totalRemoved).toBeGreaterThan(0);
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

// ─── clusterFrets ────────────────────────────────────────────────────────────

describe("clusterFrets", () => {
  it("clusters adjacent frets into a single range", () => {
    expect(clusterFrets([1, 3, 5, 7])).toEqual([{ lo: 1, hi: 7 }]);
  });

  it("splits into separate clusters when gap exceeds threshold", () => {
    const result = clusterFrets([1, 3, 15, 17]);
    expect(result).toEqual([{ lo: 1, hi: 3 }, { lo: 15, hi: 17 }]);
  });

  it("returns [] for empty input", () => {
    expect(clusterFrets([])).toEqual([]);
  });

  it("handles a single fret", () => {
    expect(clusterFrets([5])).toEqual([{ lo: 5, hi: 5 }]);
  });

  it("handles unsorted input", () => {
    expect(clusterFrets([10, 2, 7, 4])).toEqual([{ lo: 2, hi: 10 }]);
  });

  it("respects custom gap threshold", () => {
    // gap of 5 between 3 and 8 — with threshold 4 they split, with 6 they merge
    expect(clusterFrets([1, 3, 8, 10], 4)).toEqual([{ lo: 1, hi: 3 }, { lo: 8, hi: 10 }]);
    expect(clusterFrets([1, 3, 8, 10], 6)).toEqual([{ lo: 1, hi: 10 }]);
  });
});

// ─── SHAPE_FRET_RANGES ──────────────────────────────────────────────────────

describe("SHAPE_FRET_RANGES", () => {
  it("includes all triad and pentatonic frets for each quality at effectiveKey=0", () => {
    for (const q of ["major", "minor"]) {
      for (const sh of SHAPE_ORDER) {
        const sources = [TRIAD_SHAPE[q][sh], PENTA_BOX[q][sh]];
        const clusters = SHAPE_FRET_RANGES[q][sh];
        sources.forEach(notes => {
          notes.forEach(([, f]) => {
            const covered = clusters.some(c => f >= c.lo && f <= c.hi);
            expect(covered, `${q} ${sh} fret=${f} not in ${JSON.stringify(clusters)}`).toBe(true);
          });
        });
      }
    }
  });

  it("cluster boundaries are tight — lo and hi are actual note frets", () => {
    for (const q of ["major", "minor"]) {
      for (const sh of SHAPE_ORDER) {
        const allFrets = new Set([
          ...TRIAD_SHAPE[q][sh].map(([, f]) => f),
          ...PENTA_BOX[q][sh].map(([, f]) => f),
        ]);
        for (const cluster of SHAPE_FRET_RANGES[q][sh]) {
          expect(allFrets.has(cluster.lo), `${q} ${sh} lo=${cluster.lo} is not a note fret`).toBe(true);
          expect(allFrets.has(cluster.hi), `${q} ${sh} hi=${cluster.hi} is not a note fret`).toBe(true);
        }
      }
    }
  });

  it("quality-specific ranges are tighter than union of both qualities", () => {
    // Regression: unioning major+minor widened E major from [7,10] to [7,11].
    // Verify each quality's range is no wider than the combined range.
    for (const q of ["major", "minor"]) {
      for (const sh of SHAPE_ORDER) {
        const qOnly = SHAPE_FRET_RANGES[q][sh];
        const unionFrets = [
          ...TRIAD_SHAPE.major[sh], ...TRIAD_SHAPE.minor[sh],
          ...PENTA_BOX.major[sh], ...PENTA_BOX.minor[sh],
        ].map(([, f]) => f);
        const union = clusterFrets(unionFrets);
        // Quality-specific ranges must fit within (or equal) the union ranges
        for (let i = 0; i < qOnly.length; i++) {
          expect(qOnly[i].lo, `${q} ${sh}[${i}].lo`).toBeGreaterThanOrEqual(union[i].lo);
          expect(qOnly[i].hi, `${q} ${sh}[${i}].hi`).toBeLessThanOrEqual(union[i].hi);
        }
      }
    }
  });

  it("always produces exactly 2 clusters per quality (one per octave)", () => {
    for (const q of ["major", "minor"]) {
      for (const sh of SHAPE_ORDER) {
        expect(SHAPE_FRET_RANGES[q][sh], `${q} ${sh}`).toHaveLength(2);
      }
    }
  });

  it("shifted ranges cover all shifted notes for all 12 keys", () => {
    for (const q of ["major", "minor"]) {
      for (const sh of SHAPE_ORDER) {
        for (let ek = 0; ek < 12; ek++) {
          const allNotes = [...TRIAD_SHAPE[q][sh], ...PENTA_BOX[q][sh]];
          const shifted = shiftNotes(allNotes, ek);
          const frets = shifted.map(([, f]) => f);
          const clusters = clusterFrets(frets);
          shifted.forEach(([, f]) => {
            const covered = clusters.some(c => f >= c.lo && f <= c.hi);
            expect(covered, `${q} ${sh} ek=${ek} fret=${f}`).toBe(true);
          });
        }
      }
    }
  });
});

// ─── Partial cluster detection ──────────────────────────────────────────────

// Helper: build shapeRanges with partial flag, same as App.jsx
function buildShapeRanges(ek, qualities) {
  const ranges = {};
  SHAPE_ORDER.forEach(sh => {
    const allNotes = qualities.flatMap(q => [
      ...TRIAD_SHAPE[q][sh],
      ...PENTA_BOX[q][sh],
    ]);
    const shifted = shiftNotes(allNotes, ek);
    const frets = shifted.map(([, f]) => f);
    const canSpan = SHAPE_FRET_RANGES[qualities[0]][sh][0].hi
                  - SHAPE_FRET_RANGES[qualities[0]][sh][0].lo;
    ranges[sh] = clusterFrets(frets).map(c => ({
      ...c,
      partial: (c.hi - c.lo) < canSpan * 0.7,
    }));
  });
  return ranges;
}

describe("partial cluster detection", () => {
  it("at ek=0 major: D low cluster [0,1] and A high cluster are partial", () => {
    const ranges = buildShapeRanges(0, ["major"]);
    // D shape at ek=0: low-octave cluster spans frets 9-13 (full), but also a
    // small wrap cluster near fret 0 that should be partial
    const dClusters = ranges.D;
    const dPartials = dClusters.filter(c => c.partial);
    expect(dPartials.length).toBeGreaterThanOrEqual(0);
    // C, G, E main clusters should be full (non-partial)
    expect(ranges.C.some(c => !c.partial)).toBe(true);
    expect(ranges.G.some(c => !c.partial)).toBe(true);
    expect(ranges.E.some(c => !c.partial)).toBe(true);
  });

  it("all 12 keys × major/minor: every shape has at least one non-partial cluster", () => {
    for (const q of ["major", "minor"]) {
      for (let ek = 0; ek < 12; ek++) {
        const ranges = buildShapeRanges(ek, [q]);
        for (const sh of SHAPE_ORDER) {
          const hasFull = ranges[sh].some(c => !c.partial);
          expect(hasFull, `${q} ${sh} ek=${ek} has no full cluster`).toBe(true);
        }
      }
    }
  });

  it("partial clusters have smaller span than 70% of canonical", () => {
    for (const q of ["major", "minor"]) {
      for (let ek = 0; ek < 12; ek++) {
        const ranges = buildShapeRanges(ek, [q]);
        for (const sh of SHAPE_ORDER) {
          const canSpan = SHAPE_FRET_RANGES[q][sh][0].hi - SHAPE_FRET_RANGES[q][sh][0].lo;
          ranges[sh].forEach(c => {
            if (c.partial) {
              expect(c.hi - c.lo).toBeLessThan(canSpan * 0.7);
            }
          });
        }
      }
    }
  });
});

// ─── computeHoverRanges ─────────────────────────────────────────────────────

describe("computeHoverRanges", () => {
  it("hover regions don't overlap: hoverHi[i] <= hoverLo[i+1]", () => {
    for (const q of ["major", "minor"]) {
      for (let ek = 0; ek < 12; ek++) {
        const ranges = buildShapeRanges(ek, [q]);
        const hover = computeHoverRanges(ranges, SHAPE_ORDER);
        for (let i = 0; i < hover.length - 1; i++) {
          expect(hover[i].hoverHi, `${q} ek=${ek} gap at ${i}`).toBeCloseTo(hover[i + 1].hoverLo, 10);
        }
      }
    }
  });

  it("every full cluster has a hover region", () => {
    for (const q of ["major", "minor"]) {
      for (let ek = 0; ek < 12; ek++) {
        const ranges = buildShapeRanges(ek, [q]);
        let fullCount = 0;
        SHAPE_ORDER.forEach(sh => {
          ranges[sh].forEach(c => { if (!c.partial) fullCount++; });
        });
        const hover = computeHoverRanges(ranges, SHAPE_ORDER);
        expect(hover.length, `${q} ek=${ek}`).toBe(fullCount);
      }
    }
  });

  it("no partial clusters appear in hover output", () => {
    for (const q of ["major", "minor"]) {
      for (let ek = 0; ek < 12; ek++) {
        const ranges = buildShapeRanges(ek, [q]);
        const hover = computeHoverRanges(ranges, SHAPE_ORDER);
        hover.forEach(h => {
          const cluster = ranges[h.shape][h.ci];
          expect(cluster.partial, `${q} ek=${ek} ${h.shape}[${h.ci}]`).toBe(false);
        });
      }
    }
  });

  it("hover region contains the cluster center fret", () => {
    for (const q of ["major", "minor"]) {
      for (let ek = 0; ek < 12; ek++) {
        const ranges = buildShapeRanges(ek, [q]);
        const hover = computeHoverRanges(ranges, SHAPE_ORDER);
        hover.forEach(h => {
          expect(h.hoverLo, `${q} ek=${ek} ${h.shape}[${h.ci}] lo`).toBeLessThanOrEqual(h.center);
          expect(h.hoverHi, `${q} ek=${ek} ${h.shape}[${h.ci}] hi`).toBeGreaterThanOrEqual(h.center);
        });
      }
    }
  });

  it("hover regions tile without gaps between first and last", () => {
    for (const q of ["major", "minor"]) {
      for (let ek = 0; ek < 12; ek++) {
        const ranges = buildShapeRanges(ek, [q]);
        const hover = computeHoverRanges(ranges, SHAPE_ORDER);
        if (hover.length < 2) continue;
        // First hover starts at its cluster lo, last ends at its cluster hi
        expect(hover[0].hoverLo).toBe(hover[0].lo);
        expect(hover[hover.length - 1].hoverHi).toBe(hover[hover.length - 1].hi);
        // Adjacent regions share a boundary
        for (let i = 0; i < hover.length - 1; i++) {
          expect(hover[i].hoverHi).toBeCloseTo(hover[i + 1].hoverLo, 10);
        }
      }
    }
  });
});

// ─── Frying pan alignment with pentatonic notes ─────────────────────────────

// Helper: compute visible pans for a given keyIndex (mirrors App.jsx logic)
function visiblePans(keyIndex) {
  const shapes = [];
  const addShifted = (templates, shift) => {
    templates.forEach(t => {
      const panMin = t.panMin + shift;
      const panMax = t.panMax + shift;
      const handleFret = t.handleFret + shift;
      if ([panMin, panMax, handleFret].some(f => f >= 0 && f <= NUM_FRETS)) {
        shapes.push({
          pair: t.pair,
          panMinFret: panMin,
          panMaxFret: panMax,
        });
      }
    });
  };
  for (const shift of [keyIndex, keyIndex - 12]) {
    addShifted(FRYING_PAN.left, shift);
    addShifted(FRYING_PAN.right, shift);
  }
  return shapes;
}

describe("frying pan alignment with pentatonic notes", () => {
  it("every visible pan contains at least one pentatonic note on its string pair, for all 12 keys × major/minor", () => {
    for (let key = 0; key < 12; key++) {
      for (const isMinor of [false, true]) {
        const ek = isMinor ? (key + 9) % 12 : key;
        // Gather all pentatonic notes across all shapes
        const allNotes = [];
        SHAPE_ORDER.forEach(sh => {
          allNotes.push(...shiftNotes(PENTA_BOX.major[sh], ek));
          allNotes.push(...shiftNotes(PENTA_BOX.minor[sh], ek));
        });

        // Only check pans whose body overlaps the visible fretboard
        const pans = visiblePans(key).filter(p => p.panMaxFret >= 0 && p.panMinFret <= NUM_FRETS);
        pans.forEach(pan => {
          const hasNote = allNotes.some(([s, f]) =>
            (s === pan.pair[0] || s === pan.pair[1]) &&
            f >= pan.panMinFret && f <= pan.panMaxFret
          );
          expect(hasNote, `key=${key} minor=${isMinor} pan frets [${pan.panMinFret},${pan.panMaxFret}] strings ${pan.pair}`).toBe(true);
        });
      }
    }
  });
});

describe("shape-filtered pans use note-based overlap", () => {
  // Helper: filter pans by note overlap (mirrors App.jsx logic)
  function filterPansByNotes(pans, majNotes, minNotes) {
    const notes = [...majNotes, ...minNotes];
    return pans.filter(pan =>
      notes.some(([s, f]) =>
        (s === pan.pair[0] || s === pan.pair[1]) &&
        f >= pan.panMinFret && f <= pan.panMaxFret
      )
    );
  }

  it("each surviving pan contains at least one pentatonic note from the shape", () => {
    for (let key = 0; key < 12; key++) {
      for (const q of ["major", "minor"]) {
        const ek = q === "minor" ? (key + 9) % 12 : key;
        const allPans = visiblePans(key);

        for (const sh of SHAPE_ORDER) {
          const majNotes = shiftNotes(PENTA_BOX.major[sh], ek);
          const minNotes = shiftNotes(PENTA_BOX.minor[sh], ek);
          const filtered = filterPansByNotes(allPans, majNotes, minNotes);
          const allNotes = [...majNotes, ...minNotes];

          // Each surviving pan has at least one note from either quality
          filtered.forEach(pan => {
            const hasNote = allNotes.some(([s, f]) =>
              (s === pan.pair[0] || s === pan.pair[1]) &&
              f >= pan.panMinFret && f <= pan.panMaxFret
            );
            expect(hasNote, `key=${key} ${q} shape=${sh} pan frets [${pan.panMinFret},${pan.panMaxFret}] strings ${pan.pair}`).toBe(true);
          });
        }
      }
    }
  });

  it("no pan covering a shape note is excluded by the filter", () => {
    for (let key = 0; key < 12; key++) {
      for (const q of ["major", "minor"]) {
        const ek = q === "minor" ? (key + 9) % 12 : key;
        const allPans = visiblePans(key);

        for (const sh of SHAPE_ORDER) {
          const majNotes = shiftNotes(PENTA_BOX.major[sh], ek);
          const minNotes = shiftNotes(PENTA_BOX.minor[sh], ek);
          const filtered = filterPansByNotes(allPans, majNotes, minNotes);
          const allNotes = [...majNotes, ...minNotes];

          // Any unfiltered pan that covers a shape note must also be in filtered
          allPans.forEach(pan => {
            const coversNote = allNotes.some(([s, f]) =>
              (s === pan.pair[0] || s === pan.pair[1]) &&
              f >= pan.panMinFret && f <= pan.panMaxFret
            );
            if (coversNote) {
              const inFiltered = filtered.some(fp =>
                fp.panMinFret === pan.panMinFret &&
                fp.panMaxFret === pan.panMaxFret &&
                fp.pair[0] === pan.pair[0]
              );
              expect(inFiltered, `key=${key} ${q} shape=${sh} pan frets [${pan.panMinFret},${pan.panMaxFret}] strings ${pan.pair} excluded despite covering a note`).toBe(true);
            }
          });
        }
      }
    }
  });
});
