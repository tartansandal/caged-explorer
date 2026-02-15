/**
 * Music theory data and pure functions for the CAGED system.
 * Separated from App.jsx to keep component-only exports (preserving React Fast Refresh).
 */

export const NUM_FRETS = 15;

export const SHAPE_ORDER = ["C", "A", "G", "E", "D"];

// Frying pan geometry: defined for effectiveKey=0 (C major / A minor pentatonic).
// The physical shape is identical for major and minor pentatonic — only labels change.
// For other keys: add effectiveKey to all fret values, then keep shapes within [0, NUM_FRETS].
// Two octaves provided so any 15-fret window is covered after shifting.
export const FRYING_PAN = {
  left: [
    { pair: [6, 5], panMin: 10, panMax: 12, handleStr: 6, handleFret: 8, handleDir: "left" },
    { pair: [4, 3], panMin: 12, panMax: 14, handleStr: 4, handleFret: 10, handleDir: "left" },
    { pair: [2, 1], panMin: 3, panMax: 5, handleStr: 2, handleFret: 1, handleDir: "left" },
    { pair: [6, 5], panMin: 22, panMax: 24, handleStr: 6, handleFret: 20, handleDir: "left" },
    { pair: [4, 3], panMin: 24, panMax: 26, handleStr: 4, handleFret: 22, handleDir: "left" },
    { pair: [2, 1], panMin: 15, panMax: 17, handleStr: 2, handleFret: 13, handleDir: "left" },
  ],
  right: [
    { pair: [6, 5], panMin: 3, panMax: 5, handleStr: 5, handleFret: 7, handleDir: "right" },
    { pair: [4, 3], panMin: 5, panMax: 7, handleStr: 3, handleFret: 9, handleDir: "right" },
    { pair: [2, 1], panMin: 8, panMax: 10, handleStr: 1, handleFret: 12, handleDir: "right" },
    { pair: [6, 5], panMin: 15, panMax: 17, handleStr: 5, handleFret: 19, handleDir: "right" },
    { pair: [4, 3], panMin: 17, panMax: 19, handleStr: 3, handleFret: 21, handleDir: "right" },
    { pair: [2, 1], panMin: 20, panMax: 22, handleStr: 1, handleFret: 24, handleDir: "right" },
  ],
};

// Which shapes align with which frying-pan orientation
export const SHAPE_ORIENTATION = {
  C: "right", A: "right", G: "right",  // Right-hand: handle toward bridge
  E: "left",  D: "left"                // Left-hand: handle toward nut
};

// Static fretboard position tables for effectiveKey=0.
// For other keys: add effectiveKey to all fret values.

export const PENTA_BOX = {
  major: {
    C: [
      [6, 0, "3"],
      [6, 3, "5"],
      [6, 12, "3"],
      [6, 15, "5"],
      [5, 0, "6"],
      [5, 3, "R"],
      [5, 12, "6"],
      [5, 15, "R"],
      [4, 0, "2"],
      [4, 2, "3"],
      [4, 12, "2"],
      [4, 14, "3"],
      [3, 0, "5"],
      [3, 2, "6"],
      [3, 12, "5"],
      [3, 14, "6"],
      [2, 1, "R"],
      [2, 3, "2"],
      [2, 13, "R"],
      [2, 15, "2"],
      [1, 0, "3"],
      [1, 3, "5"],
      [1, 12, "3"],
      [1, 15, "5"],
    ],
    A: [
      [6, 3, "5"],
      [6, 5, "6"],
      [6, 15, "5"],
      [6, 17, "6"],
      [5, 3, "R"],
      [5, 5, "2"],
      [5, 15, "R"],
      [5, 17, "2"],
      [4, 2, "3"],
      [4, 5, "5"],
      [4, 14, "3"],
      [4, 17, "5"],
      [3, 2, "6"],
      [3, 5, "R"],
      [3, 14, "6"],
      [3, 17, "R"],
      [2, 3, "2"],
      [2, 5, "3"],
      [2, 15, "2"],
      [2, 17, "3"],
      [1, 3, "5"],
      [1, 5, "6"],
      [1, 15, "5"],
      [1, 17, "6"],
    ],
    G: [
      [6, 5, "6"],
      [6, 8, "R"],
      [6, 17, "6"],
      [6, 20, "R"],
      [5, 5, "2"],
      [5, 7, "3"],
      [5, 17, "2"],
      [5, 19, "3"],
      [4, 5, "5"],
      [4, 7, "6"],
      [4, 17, "5"],
      [4, 19, "6"],
      [3, 5, "R"],
      [3, 7, "2"],
      [3, 17, "R"],
      [3, 19, "2"],
      [2, 5, "3"],
      [2, 8, "5"],
      [2, 17, "3"],
      [2, 20, "5"],
      [1, 5, "6"],
      [1, 8, "R"],
      [1, 17, "6"],
      [1, 20, "R"],
    ],
    E: [
      [6, 8, "R"],
      [6, 10, "2"],
      [6, 20, "R"],
      [6, 22, "2"],
      [5, 7, "3"],
      [5, 10, "5"],
      [5, 19, "3"],
      [5, 22, "5"],
      [4, 7, "6"],
      [4, 10, "R"],
      [4, 19, "6"],
      [4, 22, "R"],
      [3, 7, "2"],
      [3, 9, "3"],
      [3, 19, "2"],
      [3, 21, "3"],
      [2, 8, "5"],
      [2, 10, "6"],
      [2, 20, "5"],
      [2, 22, "6"],
      [1, 8, "R"],
      [1, 10, "2"],
      [1, 20, "R"],
      [1, 22, "2"],
    ],
    D: [
      [6, 10, "2"],
      [6, 12, "3"],
      [6, 22, "2"],
      [6, 24, "3"],
      [5, 10, "5"],
      [5, 12, "6"],
      [5, 22, "5"],
      [5, 24, "6"],
      [4, 10, "R"],
      [4, 12, "2"],
      [4, 22, "R"],
      [4, 24, "2"],
      [3, 9, "3"],
      [3, 12, "5"],
      [3, 21, "3"],
      [3, 24, "5"],
      [2, 10, "6"],
      [2, 13, "R"],
      [2, 22, "6"],
      [2, 25, "R"],
      [1, 10, "2"],
      [1, 12, "3"],
      [1, 22, "2"],
      [1, 24, "3"],
    ],
  },
  minor: {
    C: [
      [6, 1, "4"],
      [6, 3, "5"],
      [6, 13, "4"],
      [6, 15, "5"],
      [5, 1, "\u266d7"],
      [5, 3, "R"],
      [5, 13, "\u266d7"],
      [5, 15, "R"],
      [4, 1, "\u266d3"],
      [4, 3, "4"],
      [4, 13, "\u266d3"],
      [4, 15, "4"],
      [3, 0, "5"],
      [3, 3, "\u266d7"],
      [3, 12, "5"],
      [3, 15, "\u266d7"],
      [2, 1, "R"],
      [2, 4, "\u266d3"],
      [2, 13, "R"],
      [2, 16, "\u266d3"],
      [1, 1, "4"],
      [1, 3, "5"],
      [1, 13, "4"],
      [1, 15, "5"],
    ],
    A: [
      [6, 3, "5"],
      [6, 6, "\u266d7"],
      [6, 15, "5"],
      [6, 18, "\u266d7"],
      [5, 3, "R"],
      [5, 6, "\u266d3"],
      [5, 15, "R"],
      [5, 18, "\u266d3"],
      [4, 3, "4"],
      [4, 5, "5"],
      [4, 15, "4"],
      [4, 17, "5"],
      [3, 3, "\u266d7"],
      [3, 5, "R"],
      [3, 15, "\u266d7"],
      [3, 17, "R"],
      [2, 4, "\u266d3"],
      [2, 6, "4"],
      [2, 16, "\u266d3"],
      [2, 18, "4"],
      [1, 3, "5"],
      [1, 6, "\u266d7"],
      [1, 15, "5"],
      [1, 18, "\u266d7"],
    ],
    G: [
      [6, 6, "\u266d7"],
      [6, 8, "R"],
      [6, 18, "\u266d7"],
      [6, 20, "R"],
      [5, 6, "\u266d3"],
      [5, 8, "4"],
      [5, 18, "\u266d3"],
      [5, 20, "4"],
      [4, 5, "5"],
      [4, 8, "\u266d7"],
      [4, 17, "5"],
      [4, 20, "\u266d7"],
      [3, 5, "R"],
      [3, 8, "\u266d3"],
      [3, 17, "R"],
      [3, 20, "\u266d3"],
      [2, 6, "4"],
      [2, 8, "5"],
      [2, 18, "4"],
      [2, 20, "5"],
      [1, 6, "\u266d7"],
      [1, 8, "R"],
      [1, 18, "\u266d7"],
      [1, 20, "R"],
    ],
    E: [
      [6, 8, "R"],
      [6, 11, "\u266d3"],
      [6, 20, "R"],
      [6, 23, "\u266d3"],
      [5, 8, "4"],
      [5, 10, "5"],
      [5, 20, "4"],
      [5, 22, "5"],
      [4, 8, "\u266d7"],
      [4, 10, "R"],
      [4, 20, "\u266d7"],
      [4, 22, "R"],
      [3, 8, "\u266d3"],
      [3, 10, "4"],
      [3, 20, "\u266d3"],
      [3, 22, "4"],
      [2, 8, "5"],
      [2, 11, "\u266d7"],
      [2, 20, "5"],
      [2, 23, "\u266d7"],
      [1, 8, "R"],
      [1, 11, "\u266d3"],
      [1, 20, "R"],
      [1, 23, "\u266d3"],
    ],
    D: [
      [6, 11, "\u266d3"],
      [6, 13, "4"],
      [6, 23, "\u266d3"],
      [6, 25, "4"],
      [5, 10, "5"],
      [5, 13, "\u266d7"],
      [5, 22, "5"],
      [5, 25, "\u266d7"],
      [4, 10, "R"],
      [4, 13, "\u266d3"],
      [4, 22, "R"],
      [4, 25, "\u266d3"],
      [3, 10, "4"],
      [3, 12, "5"],
      [3, 22, "4"],
      [3, 24, "5"],
      [2, 11, "\u266d7"],
      [2, 13, "R"],
      [2, 23, "\u266d7"],
      [2, 25, "R"],
      [1, 11, "\u266d3"],
      [1, 13, "4"],
      [1, 23, "\u266d3"],
      [1, 25, "4"],
    ],
  },
};

export const TRIAD_SHAPE = {
  major: {
    C: [
      [6, 3, "5"],
      [6, 15, "5"],
      [5, 3, "R"],
      [5, 15, "R"],
      [4, 2, "3"],
      [4, 14, "3"],
      [3, 0, "5"],
      [3, 12, "5"],
      [2, 1, "R"],
      [2, 13, "R"],
      [1, 0, "3"],
      [1, 12, "3"],
    ],
    A: [
      [6, 3, "5"],
      [6, 15, "5"],
      [5, 3, "R"],
      [5, 15, "R"],
      [4, 5, "5"],
      [4, 17, "5"],
      [3, 5, "R"],
      [3, 17, "R"],
      [2, 5, "3"],
      [2, 17, "3"],
      [1, 3, "5"],
      [1, 15, "5"],
    ],
    G: [
      [6, 8, "R"],
      [6, 20, "R"],
      [5, 7, "3"],
      [5, 19, "3"],
      [4, 5, "5"],
      [4, 17, "5"],
      [3, 5, "R"],
      [3, 17, "R"],
      [2, 5, "3"],
      [2, 17, "3"],
      [1, 8, "R"],
      [1, 20, "R"],
    ],
    E: [
      [6, 8, "R"],
      [6, 20, "R"],
      [5, 10, "5"],
      [5, 22, "5"],
      [4, 10, "R"],
      [4, 22, "R"],
      [3, 9, "3"],
      [3, 21, "3"],
      [2, 8, "5"],
      [2, 20, "5"],
      [1, 8, "R"],
      [1, 20, "R"],
    ],
    D: [
      [6, 12, "3"],
      [6, 24, "3"],
      [5, 10, "5"],
      [5, 22, "5"],
      [4, 10, "R"],
      [4, 22, "R"],
      [3, 12, "5"],
      [3, 24, "5"],
      [2, 13, "R"],
      [2, 25, "R"],
      [1, 12, "3"],
      [1, 24, "3"],
    ],
  },
  minor: {
    C: [
      [6, 3, "5"],
      [6, 15, "5"],
      [5, 3, "R"],
      [5, 15, "R"],
      [4, 1, "\u266d3"],
      [4, 13, "\u266d3"],
      [3, 0, "5"],
      [3, 12, "5"],
      [2, 1, "R"],
      [2, 13, "R"],
      [1, 3, "5"],
      [1, 15, "5"],
    ],
    A: [
      [6, 3, "5"],
      [6, 15, "5"],
      [5, 3, "R"],
      [5, 15, "R"],
      [4, 5, "5"],
      [4, 17, "5"],
      [3, 5, "R"],
      [3, 17, "R"],
      [2, 4, "\u266d3"],
      [2, 16, "\u266d3"],
      [1, 3, "5"],
      [1, 15, "5"],
    ],
    G: [
      [6, 8, "R"],
      [6, 20, "R"],
      [5, 6, "\u266d3"],
      [5, 18, "\u266d3"],
      [4, 5, "5"],
      [4, 17, "5"],
      [3, 5, "R"],
      [3, 17, "R"],
      [2, 8, "5"],
      [2, 20, "5"],
      [1, 8, "R"],
      [1, 20, "R"],
    ],
    E: [
      [6, 8, "R"],
      [6, 20, "R"],
      [5, 10, "5"],
      [5, 22, "5"],
      [4, 10, "R"],
      [4, 22, "R"],
      [3, 8, "\u266d3"],
      [3, 20, "\u266d3"],
      [2, 8, "5"],
      [2, 20, "5"],
      [1, 8, "R"],
      [1, 20, "R"],
    ],
    D: [
      [6, 11, "\u266d3"],
      [6, 23, "\u266d3"],
      [5, 10, "5"],
      [5, 22, "5"],
      [4, 10, "R"],
      [4, 22, "R"],
      [3, 12, "5"],
      [3, 24, "5"],
      [2, 13, "R"],
      [2, 25, "R"],
      [1, 11, "\u266d3"],
      [1, 23, "\u266d3"],
    ],
  },
};

export const BLUES_SHAPE = {
  minor: {
    C: [
      [6, 2, "\u266d5"],
      [6, 14, "\u266d5"],
      [5, 9, "\u266d5"],
      [4, 4, "\u266d5"],
      [4, 16, "\u266d5"],
      [3, 11, "\u266d5"],
      [2, 7, "\u266d5"],
      [1, 2, "\u266d5"],
      [1, 14, "\u266d5"],
    ],
    A: [
      [6, 14, "\u266d5"],
      [5, 9, "\u266d5"],
      [4, 4, "\u266d5"],
      [4, 16, "\u266d5"],
      [3, 11, "\u266d5"],
      [2, 7, "\u266d5"],
      [1, 14, "\u266d5"],
    ],
    G: [
      [6, 14, "\u266d5"],
      [5, 9, "\u266d5"],
      [4, 16, "\u266d5"],
      [3, 11, "\u266d5"],
      [2, 7, "\u266d5"],
      [2, 19, "\u266d5"],
      [1, 14, "\u266d5"],
    ],
    E: [
      [6, 14, "\u266d5"],
      [5, 9, "\u266d5"],
      [5, 21, "\u266d5"],
      [4, 16, "\u266d5"],
      [3, 11, "\u266d5"],
      [3, 23, "\u266d5"],
      [2, 19, "\u266d5"],
      [1, 14, "\u266d5"],
    ],
    D: [
      [6, 14, "\u266d5"],
      [5, 21, "\u266d5"],
      [4, 16, "\u266d5"],
      [3, 11, "\u266d5"],
      [3, 23, "\u266d5"],
      [2, 19, "\u266d5"],
      [1, 14, "\u266d5"],
    ],
  },
  major: {
    C: [
      [6, -1, "\u266d3"], [6, 11, "\u266d3"],
      [4, 1, "\u266d3"], [4, 13, "\u266d3"],
      [1, -1, "\u266d3"], [1, 11, "\u266d3"],
    ],
    A: [
      [4, 1, "\u266d3"], [4, 13, "\u266d3"],
      [2, 4, "\u266d3"], [2, 16, "\u266d3"],
    ],
    G: [
      [5, 6, "\u266d3"], [5, 18, "\u266d3"],
      [2, 4, "\u266d3"], [2, 16, "\u266d3"],
    ],
    E: [
      [5, 6, "\u266d3"], [5, 18, "\u266d3"],
      [3, 8, "\u266d3"], [3, 20, "\u266d3"],
    ],
    D: [
      [6, 11, "\u266d3"], [6, 23, "\u266d3"],
      [3, 8, "\u266d3"], [3, 20, "\u266d3"],
      [1, 11, "\u266d3"], [1, 23, "\u266d3"],
    ],
  },
};

// Shift note positions by effectiveKey using the FRYING_PAN double-shift
// pattern: try both +ek and +(ek-12) to cover the full fretboard for any
// key, dedup by position since two-octave data can produce overlapping notes.
// Also filters results to [0, maxFret] — out-of-range notes are discarded.
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

export function clusterFrets(frets, gapThreshold = 6) {
  const sorted = [...frets].sort((a, b) => a - b);
  if (!sorted.length) return [];
  const clusters = [{ lo: sorted[0], hi: sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - clusters[clusters.length - 1].hi > gapThreshold) {
      clusters.push({ lo: sorted[i], hi: sorted[i] });
    } else {
      clusters[clusters.length - 1].hi = sorted[i];
    }
  }
  return clusters;
}

// Precomputed shape fret ranges at effectiveKey=0, keyed by quality then shape.
// Blues notes excluded: their ♭5s span across the fretboard gap between octave
// clusters and would merge them into one giant range, breaking label positioning.
export const SHAPE_FRET_RANGES = { major: {}, minor: {} };
["major", "minor"].forEach(q => {
  SHAPE_ORDER.forEach(sh => {
    const allFrets = [
      ...TRIAD_SHAPE[q][sh],
      ...PENTA_BOX[q][sh],
    ].map(([, f]) => f);
    SHAPE_FRET_RANGES[q][sh] = clusterFrets(allFrets);
  });
});

export function computeHoverRanges(shapeRanges, shapes) {
  const full = [];
  shapes.forEach(sh => {
    shapeRanges[sh].forEach((c, ci) => {
      if (!c.partial) full.push({ shape: sh, ci, lo: c.lo, hi: c.hi, center: (c.lo + c.hi) / 2 });
    });
  });
  full.sort((a, b) => a.center - b.center);
  return full.map((entry, i) => {
    const prevMid = i > 0 ? (full[i - 1].center + entry.center) / 2 : entry.lo;
    const nextMid = i < full.length - 1 ? (entry.center + full[i + 1].center) / 2 : entry.hi;
    return { ...entry, hoverLo: prevMid, hoverHi: nextMid };
  });
}

export const posKey = (str, fret) => `${str}-${fret}`;

export const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

export const INTERVAL_SEMITONES = {
  R:    0,
  "2":  2,
  "♭3": 3,
  "3":  4,
  "4":  5,
  "♭5": 6,
  "5":  7,
  "6":  9,
  "♭7": 10,
};

export const noteName = (interval, keyIdx) => NOTES[(keyIdx + INTERVAL_SEMITONES[interval]) % 12];

export const CHORD_MAJ = {
  C: { frets: ["x",3,2,0,1,0],     intervals: [null,"R","3","5","R","3"] },
  A: { frets: ["x",0,2,2,2,0],     intervals: [null,"R","5","R","3","5"] },
  G: { frets: [3,2,0,0,0,3],       intervals: ["R","3","5","R","3","R"] },
  E: { frets: [0,2,2,1,0,0],       intervals: ["R","5","R","3","5","R"] },
  D: { frets: ["x","x",0,2,3,2],   intervals: [null,null,"R","5","R","3"] },
};

export const CHORD_MIN = {
  C: { frets: ["x",3,1,0,1,"x"],   intervals: [null,"R","♭3","5","R",null] },
  A: { frets: ["x",0,2,2,1,0],     intervals: [null,"R","5","R","♭3","5"] },
  G: { frets: [3,1,0,0,3,3],       intervals: ["R","♭3","5","R","5","R"] },
  E: { frets: [0,2,2,0,0,0],       intervals: ["R","5","R","♭3","5","R"] },
  D: { frets: ["x","x",0,2,3,1],   intervals: [null,null,"R","5","R","♭3"] },
};
