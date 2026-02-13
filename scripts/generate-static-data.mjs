/**
 * Temporary script: generates static fretboard position tables for effectiveKey=0.
 *
 * Usage:  node scripts/generate-static-data.mjs
 *
 * Prints valid JavaScript (export const declarations) to stdout.
 * Paste the output into src/music.js and delete this script when done.
 */

import { generateScale, SCALE, SHAPE_ORDER } from "../src/music.js";

// ---------------------------------------------------------------------------
// Chord data (mirrors App.jsx definitions)
// ---------------------------------------------------------------------------

const CHORD_MAJ = {
  C: { frets: ["x", 3, 2, 0, 1, 0] },
  A: { frets: ["x", 0, 2, 2, 2, 0] },
  G: { frets: [3, 2, 0, 0, 0, 3] },
  E: { frets: [0, 2, 2, 1, 0, 0] },
  D: { frets: ["x", "x", 0, 2, 3, 2] },
};

const SHAPE_ROOT_SEMI = { C: 0, D: 2, E: 4, G: 7, A: 9 };

// ---------------------------------------------------------------------------
// computePentaBox — find the 2 consecutive pentatonic notes per string
// closest to a chord center fret.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sorting helper — sort tuples by string descending (6 first), then fret asc.
// ---------------------------------------------------------------------------

function sortTuples(arr) {
  return arr.slice().sort((a, b) => b[0] - a[0] || a[1] - b[1]);
}

// ---------------------------------------------------------------------------
// Generate pentatonic notes with maxFret=27 for two-octave coverage.
// ---------------------------------------------------------------------------

const MAX_FRET = 27;
const effectiveKey = 0;

const majPentaNotes = generateScale(effectiveKey, SCALE.pentaMaj, MAX_FRET);
const minPentaNotes = generateScale(effectiveKey, SCALE.pentaMin, MAX_FRET);
const majTriadNotes = generateScale(effectiveKey, SCALE.triadMaj, MAX_FRET);
const minTriadNotes = generateScale(effectiveKey, SCALE.triadMin, MAX_FRET);
const bluesNotes = generateScale(effectiveKey, SCALE.bluesAdd, MAX_FRET);

// ---------------------------------------------------------------------------
// PENTA_BOX — pentatonic box positions per [scale][shape].
//
// For each shape, compute the chord center from CHORD_MAJ shifted by
// (0 - SHAPE_ROOT_SEMI[shape] + 12) % 12. Use computePentaBox to find the
// 2 consecutive pentatonic notes per string closest to that center.
// Do this twice: once for center, once for center+12 (second octave).
// ---------------------------------------------------------------------------

function buildPentaBox(pentaNotes, scaleDegrees) {
  const result = {};
  SHAPE_ORDER.forEach(shape => {
    const shift = (effectiveKey - SHAPE_ROOT_SEMI[shape] + 12) % 12;
    const chordFrets = CHORD_MAJ[shape].frets.filter(f => typeof f === "number");
    const chordCenter = (Math.min(...chordFrets) + Math.max(...chordFrets)) / 2 + shift;

    const tuples = [];

    // First octave
    const box1 = computePentaBox(pentaNotes, chordCenter);
    Object.entries(box1).forEach(([s, [f1, f2]]) => {
      const str = Number(s);
      // Look up the interval label for each fret
      const label1 = pentaNotes.find(([ns, nf]) => ns === str && nf === f1)?.[2];
      const label2 = pentaNotes.find(([ns, nf]) => ns === str && nf === f2)?.[2];
      if (label1) tuples.push([str, f1, label1]);
      if (label2) tuples.push([str, f2, label2]);
    });

    // Second octave (center+12)
    const box2 = computePentaBox(pentaNotes, chordCenter + 12);
    Object.entries(box2).forEach(([s, [f1, f2]]) => {
      const str = Number(s);
      const label1 = pentaNotes.find(([ns, nf]) => ns === str && nf === f1)?.[2];
      const label2 = pentaNotes.find(([ns, nf]) => ns === str && nf === f2)?.[2];
      if (label1) tuples.push([str, f1, label1]);
      if (label2) tuples.push([str, f2, label2]);
    });

    // Deduplicate (same [string, fret] from overlapping octaves)
    const seen = new Set();
    const deduped = [];
    tuples.forEach(([s, f, l]) => {
      const key = `${s}-${f}`;
      if (!seen.has(key)) { seen.add(key); deduped.push([s, f, l]); }
    });

    result[shape] = sortTuples(deduped);
  });
  return result;
}

const pentaBoxMaj = buildPentaBox(majPentaNotes, SCALE.pentaMaj);
const pentaBoxMin = buildPentaBox(minPentaNotes, SCALE.pentaMin);

// ---------------------------------------------------------------------------
// TRIAD_SHAPE — triad positions per [scale][shape].
//
// For each shape, compute chord fret range (lo/hi from CHORD_MAJ frets + shift).
// Filter all triad notes to within that range. Do this for both octaves.
// ---------------------------------------------------------------------------

function buildTriadShape(triadNotes) {
  const result = {};
  SHAPE_ORDER.forEach(shape => {
    const shift = (effectiveKey - SHAPE_ROOT_SEMI[shape] + 12) % 12;
    const chordFrets = CHORD_MAJ[shape].frets.filter(f => typeof f === "number");
    const lo = Math.min(...chordFrets) + shift;
    const hi = Math.max(...chordFrets) + shift;

    const tuples = [];

    // First octave range
    triadNotes.forEach(([s, f, label]) => {
      if (f >= lo && f <= hi) tuples.push([s, f, label]);
    });

    // Second octave range (lo+12 to hi+12)
    triadNotes.forEach(([s, f, label]) => {
      if (f >= lo + 12 && f <= hi + 12) tuples.push([s, f, label]);
    });

    // Deduplicate
    const seen = new Set();
    const deduped = [];
    tuples.forEach(([s, f, l]) => {
      const key = `${s}-${f}`;
      if (!seen.has(key)) { seen.add(key); deduped.push([s, f, l]); }
    });

    result[shape] = sortTuples(deduped);
  });
  return result;
}

const triadShapeMaj = buildTriadShape(majTriadNotes);
const triadShapeMin = buildTriadShape(minTriadNotes);

// ---------------------------------------------------------------------------
// BLUES_SHAPE — blues flat-5 positions per shape.
//
// Uses minor pentatonic box ranges to determine which shape each flat-5
// belongs to. Same two-octave approach.
// ---------------------------------------------------------------------------

function buildBluesShape(bluesNotes, minPentaBoxes) {
  // Derive per-shape fret ranges from the minor pentatonic box positions
  const ranges = {};
  SHAPE_ORDER.forEach(shape => {
    const positions = minPentaBoxes[shape];
    const frets = positions.map(([, f]) => f);
    ranges[shape] = { lo: Math.min(...frets), hi: Math.max(...frets) };
  });

  const result = {};
  SHAPE_ORDER.forEach(shape => {
    const { lo, hi } = ranges[shape];
    const tuples = [];

    bluesNotes.forEach(([s, f, label]) => {
      if (f >= lo && f <= hi) tuples.push([s, f, label]);
    });

    // Deduplicate
    const seen = new Set();
    const deduped = [];
    tuples.forEach(([s, f, l]) => {
      const key = `${s}-${f}`;
      if (!seen.has(key)) { seen.add(key); deduped.push([s, f, l]); }
    });

    result[shape] = sortTuples(deduped);
  });
  return result;
}

const bluesShape = buildBluesShape(bluesNotes, pentaBoxMin);

// ---------------------------------------------------------------------------
// Output — print valid JavaScript to stdout.
// ---------------------------------------------------------------------------

function formatTuples(tuples, indent = "    ") {
  if (tuples.length === 0) return `[]`;
  const lines = tuples.map(([s, f, l]) => `${indent}  [${s}, ${f}, ${JSON.stringify(l)}],`);
  return `[\n${lines.join("\n")}\n${indent}]`;
}

function formatScaleObject(obj, indent = "  ") {
  const lines = SHAPE_ORDER.map(shape =>
    `${indent}  ${shape}: ${formatTuples(obj[shape], indent + "  ")},`
  );
  return `{\n${lines.join("\n")}\n${indent}}`;
}

const output = `\
// Static fretboard position tables for effectiveKey=0.
// Generated by scripts/generate-static-data.mjs — do not edit by hand.
// For other keys: add effectiveKey to all fret values.

export const PENTA_BOX = {
  major: ${formatScaleObject(pentaBoxMaj)},
  minor: ${formatScaleObject(pentaBoxMin)},
};

export const TRIAD_SHAPE = {
  major: ${formatScaleObject(triadShapeMaj)},
  minor: ${formatScaleObject(triadShapeMin)},
};

export const BLUES_SHAPE = ${formatScaleObject(bluesShape)};
`;

console.log(output);
