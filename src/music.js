/**
 * Music theory data and pure functions for the CAGED system.
 * Separated from App.jsx to keep component-only exports (preserving React Fast Refresh).
 */

export const NUM_FRETS = 15;

// Guitar tuning: semitones from C for each string (6 to 1)
export const TUNING = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E

// Scale intervals (semitones from root + interval label)
export const SCALE = {
  triadMaj: [{ semi: 0, iv: "R" }, { semi: 4, iv: "3" }, { semi: 7, iv: "5" }],
  triadMin: [{ semi: 0, iv: "R" }, { semi: 3, iv: "♭3" }, { semi: 7, iv: "5" }],
  pentaMaj: [{ semi: 0, iv: "R" }, { semi: 2, iv: "2" }, { semi: 4, iv: "3" }, { semi: 7, iv: "5" }, { semi: 9, iv: "6" }],
  pentaMin: [{ semi: 0, iv: "R" }, { semi: 3, iv: "♭3" }, { semi: 5, iv: "4" }, { semi: 7, iv: "5" }, { semi: 10, iv: "♭7" }],
  bluesAdd: [{ semi: 6, iv: "♭5" }],
};

export const SHAPE_ORDER = ["C", "A", "G", "E", "D"];

// Frying pan geometry: defined for effectiveKey=0 (C major / A minor pentatonic).
// The physical shape is identical for major and minor pentatonic — only labels change.
// For other keys: add effectiveKey to all fret values, then keep shapes within [0, NUM_FRETS].
// Two octaves provided so any 15-fret window is covered after shifting.
export const FRYING_PAN = {
  left: [
    { pair: [6, 5], panMin: 10, panMax: 12, hStr: 6, hFret: 8, hDir: "left" },
    { pair: [4, 3], panMin: 12, panMax: 14, hStr: 4, hFret: 10, hDir: "left" },
    { pair: [2, 1], panMin: 3, panMax: 5, hStr: 2, hFret: 1, hDir: "left" },
    { pair: [6, 5], panMin: 22, panMax: 24, hStr: 6, hFret: 20, hDir: "left" },
    { pair: [4, 3], panMin: 24, panMax: 26, hStr: 4, hFret: 22, hDir: "left" },
    { pair: [2, 1], panMin: 15, panMax: 17, hStr: 2, hFret: 13, hDir: "left" },
  ],
  right: [
    { pair: [6, 5], panMin: 3, panMax: 5, hStr: 5, hFret: 7, hDir: "right" },
    { pair: [4, 3], panMin: 5, panMax: 7, hStr: 3, hFret: 9, hDir: "right" },
    { pair: [2, 1], panMin: 8, panMax: 10, hStr: 1, hFret: 12, hDir: "right" },
    { pair: [6, 5], panMin: 15, panMax: 17, hStr: 5, hFret: 19, hDir: "right" },
    { pair: [4, 3], panMin: 17, panMax: 19, hStr: 3, hFret: 21, hDir: "right" },
    { pair: [2, 1], panMin: 20, panMax: 22, hStr: 1, hFret: 24, hDir: "right" },
  ],
};

// Which shapes align with which frying-pan orientation
export const SHAPE_ORIENTATION = {
  C: "right", A: "right", G: "right",  // Right-hand: handle toward bridge
  E: "left",  D: "left"                // Left-hand: handle toward nut
};

export const posKey = (str, fret) => `${str}-${fret}`;

// Generate scale notes on the fretboard for a given root key and scale degrees.
// No transposition — notes are placed directly at their correct frets.
export function generateScale(rootKey, degrees, maxFret = NUM_FRETS) {
  const notes = [];
  TUNING.forEach((openSemi, idx) => {
    const str = 6 - idx;
    degrees.forEach(({ semi, iv }) => {
      const noteSemi = (rootKey + semi) % 12;
      const baseFret = (noteSemi - openSemi + 12) % 12;
      for (let fret = baseFret; fret <= maxFret; fret += 12) {
        notes.push([str, fret, iv]);
      }
    });
  });
  return notes;
}

// Assign CAGED shapes to pentatonic note positions.
// On each string, pentatonic notes cycle through C, A, G, E, D in fret order.
// Shape at index i owns notes at positions i and i+1 (2 consecutive notes),
// so each note (except the first) is shared between two adjacent shapes.
// The starting shape rotates based on effectiveKey — when the key shifts,
// some notes wrap around the 12-fret octave, rotating the shape cycle.
// scaleSemi: the semitone intervals of the scale (e.g. [0,2,4,7,9] for major penta).
export function assignShapes(pentaNotes, effectiveKey, scaleSemi) {
  const byString = {};
  pentaNotes.forEach(([str, fret]) => {
    if (!byString[str]) byString[str] = [];
    byString[str].push({ fret });
  });

  const shapeMap = new Map();

  // Compute offset once using string 6 as reference (TUNING[0] = 4, open E).
  // All strings share the same offset because CAGED shapes span consistent
  // fret regions across the neck — the offset depends only on key, not tuning.
  const canon6 = scaleSemi.map(d => (d - TUNING[0] + 12) % 12).sort((a, b) => a - b);
  const wrapCount = canon6.filter(f => f >= 12 - effectiveKey).length;
  const offset = (5 - wrapCount) % 5;

  Object.entries(byString).forEach(([str, notes]) => {
    notes.sort((a, b) => a.fret - b.fret);
    const s = Number(str);

    notes.forEach((note, i) => {
      const key = posKey(s, note.fret);
      const shapes = shapeMap.get(key) || [];
      if (!shapeMap.has(key)) shapeMap.set(key, shapes);

      const curShape = SHAPE_ORDER[(i + offset) % 5];
      if (!shapes.includes(curShape)) shapes.push(curShape);
      if (i > 0) {
        const prevShape = SHAPE_ORDER[(i - 1 + offset) % 5];
        if (!shapes.includes(prevShape)) shapes.push(prevShape);
      }
    });
  });

  return shapeMap;
}

// Look up shapes for a note position, falling back to nearest pentatonic note on the same string.
// Handles notes like ♭3 that aren't at pentatonic positions but belong to the same shape
// as their nearest pentatonic neighbor (e.g., ♭3 is 1 fret below the major 3).
export function findShapes(sMap, s, f) {
  const direct = sMap.get(posKey(s, f));
  if (direct) return direct;
  let best = null;
  let bestDist = Infinity;
  sMap.forEach((shapes, key) => {
    const [ks, kf] = key.split("-").map(Number);
    if (ks === s) {
      const dist = Math.abs(kf - f);
      if (dist < bestDist) { bestDist = dist; best = shapes; }
    }
  });
  return best;
}
