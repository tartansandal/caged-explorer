/**
 * Music theory data and pure functions for the CAGED system.
 * Separated from App.jsx to keep component-only exports (preserving React Fast Refresh).
 */

export const NUM_FRETS = 15;

// Guitar tuning: semitones from C for each string (6 to 1)
export const TUNING = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E

// Scale intervals (semitones from root + interval label)
export const SCALE = {
  triadMaj: [{ semi: 0, label: "R" }, { semi: 4, label: "3" }, { semi: 7, label: "5" }],
  triadMin: [{ semi: 0, label: "R" }, { semi: 3, label: "♭3" }, { semi: 7, label: "5" }],
  pentaMaj: [{ semi: 0, label: "R" }, { semi: 2, label: "2" }, { semi: 4, label: "3" }, { semi: 7, label: "5" }, { semi: 9, label: "6" }],
  pentaMin: [{ semi: 0, label: "R" }, { semi: 3, label: "♭3" }, { semi: 5, label: "4" }, { semi: 7, label: "5" }, { semi: 10, label: "♭7" }],
  bluesAdd: [{ semi: 6, label: "♭5" }],
};

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

export const posKey = (str, fret) => `${str}-${fret}`;

// Generate scale notes on the fretboard for a given root key and scale degrees.
// No transposition — notes are placed directly at their correct frets.
export function generateScale(rootKey, degrees, maxFret = NUM_FRETS) {
  const notes = [];
  TUNING.forEach((openSemi, idx) => {
    const str = 6 - idx;
    degrees.forEach(({ semi, label }) => {
      const noteSemi = (rootKey + semi) % 12;
      const baseFret = (noteSemi - openSemi + 12) % 12;
      for (let fret = baseFret; fret <= maxFret; fret += 12) {
        notes.push([str, fret, label]);
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

// Clip a shape's note array to its first contiguous fret region.
// Two passes: (1) a gap >6 between consecutive frets indicates an octave repeat,
// (2) each CAGED shape spans at most 5 frets — trim boundary notes that extend wider.
export function clipFirstRegion(notes) {
  if (notes.length === 0) return notes;
  let frets = [...new Set(notes.map(([, f]) => f))].sort((a, b) => a - b);
  // Pass 1: a gap >6 between consecutive frets indicates an octave repeat.
  for (let i = 1; i < frets.length; i++) {
    if (frets[i] - frets[i - 1] > 6) {
      const cutoff = frets[i];
      notes = notes.filter(([, f]) => f < cutoff);
      frets = frets.slice(0, i);
      break;
    }
  }
  // Pass 2: boundary notes shared with adjacent shapes can extend a shape
  // beyond its natural 4-5 fret span. Trim from the high end.
  if (frets.length > 0 && frets[frets.length - 1] - frets[0] > 4) {
    const maxFret = frets[0] + 4;
    notes = notes.filter(([, f]) => f <= maxFret);
  }
  return notes;
}

// Look up shapes for a note position, falling back to nearest pentatonic note on the same string.
// Handles notes like ♭3 that aren't at pentatonic positions but belong to the same shape
// as their nearest pentatonic neighbor (e.g., ♭3 is 1 fret below the major 3).
export function findShapes(shapeMap, string, fret) {
  const direct = shapeMap.get(posKey(string, fret));
  if (direct) return direct;
  let best = null;
  let bestDist = Infinity;
  shapeMap.forEach((shapes, key) => {
    const [ks, kf] = key.split("-").map(Number);
    if (ks === string) {
      const dist = Math.abs(kf - fret);
      if (dist < bestDist) { bestDist = dist; best = shapes; }
    }
  });
  return best;
}
