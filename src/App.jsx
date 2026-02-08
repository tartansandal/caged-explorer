import { useState, useMemo } from "react";

/**
 * CAGED System Explorer
 * An interactive fretboard visualization tool for learning the CAGED system on guitar.
 */

const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const SHAPES = ["C", "A", "G", "E", "D"];
const STR_NAMES = ["E", "A", "D", "G", "B", "e"];

const THEME = {
  shape: {
    C: "#d8908c",
    A: "#d4b880",
    G: "#80b8a4",
    E: "#a898c4",
    D: "#cc90a8",
  },
  interval: {
    R:    "#e09898",
    "2":  "#94b8d8",
    "3":  "#dcc08c",
    "5":  "#88c4b4",
    "6":  "#b8a4cc",
    "♭3": "#d8ac90",
    "4":  "#88c8d0",
    "♭5": "#8cacd8",
    "♭7": "#c4a0cc",
  },
  bg: {
    panel:     "rgba(10,15,30,0.5)",
    card:      "rgba(10,15,30,0.4)",
    btnOff:    "rgba(255,255,255,0.04)",
    btnOn:     "rgba(255,255,255,0.08)",
    btnAccent: "rgba(96,165,250,0.15)",
  },
  border: {
    subtle: "rgba(255,255,255,0.06)",
    light:  "rgba(255,255,255,0.08)",
    medium: "rgba(255,255,255,0.12)",
    accent: "rgba(96,165,250,0.3)",
  },
  text: {
    primary:   "#e2e8f0",
    secondary: "#94a3b8",
    muted:     "#64748b",
    dim:       "#475569",
    dark:      "#1a1030",
  },
  glow: {
    soft:   "rgba(255,255,255,0.08)",
    medium: "rgba(255,255,255,0.1)",
  },
  stroke: {
    light:  "rgba(255,255,255,0.25)",
    medium: "rgba(255,255,255,0.3)",
  },
};

const FRET_SPACING   = 56;
const STRING_SPACING = 26;
const MARGIN_LEFT    = 52;
const MARGIN_TOP     = 38;
const NUM_FRETS      = 15;
const TRIAD_RADIUS   = 10;
const PENTA_RADIUS   = 8;

const SEMI = {
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

const TRIAD_MAJ = {
  C: [[5,3,"R"], [4,2,"3"], [3,0,"5"], [2,1,"R"], [1,0,"3"]],
  A: [[5,3,"R"], [4,5,"5"], [3,5,"R"], [2,5,"3"], [1,3,"5"]],
  G: [[6,8,"R"], [5,7,"3"], [4,5,"5"], [3,5,"R"], [2,5,"3"], [1,8,"R"]],
  E: [[6,8,"R"], [5,10,"5"], [4,10,"R"], [3,9,"3"], [2,8,"5"], [1,8,"R"]],
  D: [[4,10,"R"], [3,12,"5"], [2,13,"R"], [1,12,"3"]],
};

const TRIAD_MIN = {
  C: [[5,3,"R"], [4,1,"♭3"], [3,0,"5"], [2,1,"R"], [1,3,"5"]],
  A: [[5,3,"R"], [4,5,"5"], [3,5,"R"], [2,4,"♭3"], [1,3,"5"]],
  G: [[6,8,"R"], [5,6,"♭3"], [4,5,"5"], [3,5,"R"], [2,8,"5"], [1,8,"R"]],
  E: [[6,8,"R"], [5,10,"5"], [4,10,"R"], [3,8,"♭3"], [2,8,"5"], [1,8,"R"]],
  D: [[4,10,"R"], [3,12,"5"], [2,13,"R"], [1,11,"♭3"]],
};

const PENTA_MAJ = {
  C: [[6,0,"3"], [6,3,"5"], [5,0,"6"], [5,3,"R"], [4,0,"2"], [4,2,"3"], [3,0,"5"], [3,2,"6"], [2,1,"R"], [2,3,"2"], [1,0,"3"], [1,3,"5"]],
  A: [[6,3,"5"], [6,5,"6"], [5,3,"R"], [5,5,"2"], [4,2,"3"], [4,5,"5"], [3,2,"6"], [3,5,"R"], [2,3,"2"], [2,5,"3"], [1,3,"5"], [1,5,"6"]],
  G: [[6,5,"6"], [6,8,"R"], [5,5,"2"], [5,7,"3"], [4,5,"5"], [4,7,"6"], [3,5,"R"], [3,7,"2"], [2,5,"3"], [2,8,"5"], [1,5,"6"], [1,8,"R"]],
  E: [[6,8,"R"], [6,10,"2"], [5,7,"3"], [5,10,"5"], [4,7,"6"], [4,10,"R"], [3,7,"2"], [3,9,"3"], [2,8,"5"], [2,10,"6"], [1,8,"R"], [1,10,"2"]],
  D: [[6,10,"2"], [6,12,"3"], [5,10,"5"], [5,12,"6"], [4,10,"R"], [4,12,"2"], [3,9,"3"], [3,12,"5"], [2,10,"6"], [2,13,"R"], [1,10,"2"], [1,12,"3"]],
};

const PENTA_MIN = {
  C: [[6,1,"4"], [6,3,"5"], [5,1,"♭7"], [5,3,"R"], [4,1,"♭3"], [4,3,"4"], [3,0,"5"], [3,3,"♭7"], [2,1,"R"], [2,4,"♭3"], [1,1,"4"], [1,3,"5"]],
  A: [[6,3,"5"], [6,6,"♭7"], [5,3,"R"], [5,6,"♭3"], [4,3,"4"], [4,5,"5"], [3,3,"♭7"], [3,5,"R"], [2,4,"♭3"], [2,6,"4"], [1,3,"5"], [1,6,"♭7"]],
  G: [[6,6,"♭7"], [6,8,"R"], [5,6,"♭3"], [5,8,"4"], [4,5,"5"], [4,8,"♭7"], [3,5,"R"], [3,8,"♭3"], [2,6,"4"], [2,8,"5"], [1,6,"♭7"], [1,8,"R"]],
  E: [[6,8,"R"], [6,11,"♭3"], [5,8,"4"], [5,10,"5"], [4,8,"♭7"], [4,10,"R"], [3,8,"♭3"], [3,10,"4"], [2,8,"5"], [2,11,"♭7"], [1,8,"R"], [1,11,"♭3"]],
  D: [[6,11,"♭3"], [6,13,"4"], [5,10,"5"], [5,13,"♭7"], [4,10,"R"], [4,13,"♭3"], [3,10,"4"], [3,12,"5"], [2,11,"♭7"], [2,13,"R"], [1,11,"♭3"], [1,13,"4"]],
};

const BLUES_ADDITION = {
  C: [[6,2,"♭5"], [1,2,"♭5"]],
  A: [[4,4,"♭5"]],
  G: [[2,7,"♭5"]],
  E: [[5,9,"♭5"]],
  D: [[3,11,"♭5"]],
};

// 3:2 System: Two positions of the pan-handle pentatonic fingering
// Each position is a 5-note pattern on 2 strings (3 notes + 2 notes)
// 3-note group = scale degrees 1, 2, 3 (intervals R, 2, 3)
// 2-note group = scale degrees 5, 6 (intervals 5, 6)
// Tiled across string pairs: 6-5, 4-3, 2-1 with fret shifts (+2, +3 for B string)
// Defined for C major pentatonic (effectiveKey=0), transposed like other data

// Position 1: R,2,3 on lower string; 5,6 on upper (higher fret position)
const THREE_TWO_POS1_MAJ = [
  // Strings 6-5: C(R)=8, D(2)=10, E(3)=12 on str6; G(5)=10, A(6)=12 on str5
  { strings: [6, 5], notes: [[6, 8, "R"], [6, 10, "2"], [6, 12, "3"], [5, 10, "5"], [5, 12, "6"]] },
  // Strings 4-3 (+2 frets)
  { strings: [4, 3], notes: [[4, 10, "R"], [4, 12, "2"], [4, 14, "3"], [3, 12, "5"], [3, 14, "6"]] },
  // Strings 2-1 (frets 1-5)
  { strings: [2, 1], notes: [
    [2, 1, "R"],
    [2, 3, "2"],
    [2, 5, "3"],
    [1, 3, "5"],
    [1, 5, "6"]
  ] },
];

// Position 2: 5,6 on lower string; R,2,3 on upper (lower fret position)
const THREE_TWO_POS2_MAJ = [
  // Strings 6-5: G(5)=3, A(6)=5 on str6; C(R)=3, D(2)=5, E(3)=7 on str5
  { strings: [6, 5], notes: [[6, 3, "5"], [6, 5, "6"], [5, 3, "R"], [5, 5, "2"], [5, 7, "3"]] },
  // Strings 4-3 (+2 frets)
  { strings: [4, 3], notes: [[4, 5, "5"], [4, 7, "6"], [3, 5, "R"], [3, 7, "2"], [3, 9, "3"]] },
  // Strings 2-1 (+3 more frets)
  { strings: [2, 1], notes: [[2, 8, "5"], [2, 10, "6"], [1, 8, "R"], [1, 10, "2"], [1, 12, "3"]] },
];

// Minor pentatonic: R, ♭3, 4, 5, ♭7
// 3-note group = R, ♭3, 4; 2-note group = 5, ♭7

// Position 1: R,♭3,4 on lower; 5,♭7 on upper
const THREE_TWO_POS1_MIN = [
  { strings: [6, 5], notes: [[6, 8, "R"], [6, 11, "♭3"], [6, 13, "4"], [5, 10, "5"], [5, 13, "♭7"]] },
  { strings: [4, 3], notes: [[4, 10, "R"], [4, 13, "♭3"], [4, 15, "4"], [3, 12, "5"], [3, 15, "♭7"]] },
  // Strings 2-1
  { strings: [2, 1], notes: [[2, 1, "R"], [2, 4, "♭3"], [2, 6, "4"], [1, 3, "5"], [1, 6, "♭7"]] },
];

// Position 2: 5,♭7 on lower; R,♭3,4 on upper
const THREE_TWO_POS2_MIN = [
  { strings: [6, 5], notes: [[6, 3, "5"], [6, 6, "♭7"], [5, 3, "R"], [5, 6, "♭3"], [5, 8, "4"]] },
  { strings: [4, 3], notes: [[4, 5, "5"], [4, 8, "♭7"], [3, 5, "R"], [3, 8, "♭3"], [3, 10, "4"]] },
  { strings: [2, 1], notes: [[2, 8, "5"], [2, 11, "♭7"], [1, 8, "R"], [1, 11, "♭3"], [1, 13, "4"]] },
];

// Which shapes align with which 3:2 position
// Position 2 covers lower frets (C, A, G shapes)
// Position 1 covers higher frets (E, D shapes)
const SHAPE_TO_THREE_TWO = {
  C: 2, A: 2, G: 2,  // Position 2: lower fret area
  E: 1, D: 1         // Position 1: higher fret area
};

const CHORD_MAJ = {
  C: { f: ["x",3,2,0,1,0],     i: [null,"R","3","5","R","3"] },
  A: { f: ["x",0,2,2,2,0],     i: [null,"R","5","R","3","5"] },
  G: { f: [3,2,0,0,0,3],       i: ["R","3","5","R","3","R"] },
  E: { f: [0,2,2,1,0,0],       i: ["R","5","R","3","5","R"] },
  D: { f: ["x","x",0,2,3,2],   i: [null,null,"R","5","R","3"] },
};

const CHORD_MIN = {
  C: { f: ["x",3,1,0,1,"x"],   i: [null,"R","♭3","5","R",null] },
  A: { f: ["x",0,2,2,1,0],     i: [null,"R","5","R","♭3","5"] },
  G: { f: [3,1,0,0,3,3],       i: ["R","♭3","5","R","5","R"] },
  E: { f: [0,2,2,0,0,0],       i: ["R","5","R","♭3","5","R"] },
  D: { f: ["x","x",0,2,3,1],   i: [null,null,"R","5","R","♭3"] },
};

const LEGEND = {
  triadMaj:  [["R","Root"], ["3","Major 3rd"], ["5","Perfect 5th"]],
  triadMin:  [["R","Root"], ["♭3","Minor 3rd"], ["5","Perfect 5th"]],
  triadBoth: [["R","Root"], ["3","Major 3rd"], ["♭3","Minor 3rd"], ["5","Perfect 5th"]],
  pentaMaj:  [["2","Major 2nd"], ["6","Major 6th"]],
  pentaMajWithMin: [["2","Major 2nd"], ["3","Major 3rd"], ["6","Major 6th"]], // When minor triad shown (3 not in triad legend)
  pentaMin:  [["♭3","Minor 3rd"], ["4","Perfect 4th"], ["♭7","Minor 7th"]],
  pentaMinWithMaj: [["4","Perfect 4th"], ["♭7","Minor 7th"]], // When major triad shown (♭3 redundant)
  blues:     [["♭3","Minor 3rd"], ["4","Perfect 4th"], ["♭5","Blue note"], ["♭7","Minor 7th"]],
  bluesWithMaj: [["4","Perfect 4th"], ["♭5","Blue note"], ["♭7","Minor 7th"]], // When major triad shown
  // Full legends for when triads are off
  pentaMajFull:  [["R","Root"], ["2","Major 2nd"], ["3","Major 3rd"], ["5","Perfect 5th"], ["6","Major 6th"]],
  pentaMinFull:  [["R","Root"], ["♭3","Minor 3rd"], ["4","Perfect 4th"], ["5","Perfect 5th"], ["♭7","Minor 7th"]],
  bluesFull:     [["R","Root"], ["♭3","Minor 3rd"], ["4","Perfect 4th"], ["♭5","Blue note"], ["5","Perfect 5th"], ["♭7","Minor 7th"]],
};

const noteName = (interval, keyIdx) => NOTES[(keyIdx + SEMI[interval]) % 12];

const scaleName = (mode) => ({
  major: "Major Pentatonic",
  minor: "Minor Pentatonic",
  blues: "Blues Scale",
})[mode] || "";

const transpose = (data, semitones) => {
  const result = {};
  for (const [shape, notes] of Object.entries(data)) {
    let shifted = notes.map(([str, fret, iv]) => [str, fret + semitones, iv]);
    if (shifted.length > 0 && Math.min(...shifted.map(([, f]) => f)) >= 12) {
      shifted = shifted.map(([str, fret, iv]) => [str, fret - 12, iv]);
    }
    result[shape] = shifted.filter(([, fret]) => fret >= 0 && fret <= 15);
  }
  return result;
};

const fretX = (fret) => MARGIN_LEFT + fret * FRET_SPACING;
const noteX = (fret) => fret === 0 ? MARGIN_LEFT - 16 : MARGIN_LEFT + (fret - 0.5) * FRET_SPACING;
const strY = (str) => MARGIN_TOP + (str - 1) * STRING_SPACING;
const posKey = (str, fret) => `${str}-${fret}`;

function ToggleButton({ label, active, onClick, accent = false, style = {} }) {
  const bg = active ? (accent ? THEME.bg.btnAccent : THEME.bg.btnOn) : THEME.bg.btnOff;
  const color = active ? (accent ? "#93c5fd" : THEME.text.secondary) : THEME.text.dim;
  const border = active ? (accent ? THEME.border.accent : THEME.border.medium) : THEME.border.subtle;

  return (
    <button onClick={onClick} style={{
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 5, padding: "3px 10px", fontSize: "0.7rem",
      cursor: "pointer", transition: "all 0.15s", ...style,
    }}>
      {label}
    </button>
  );
}

function FretDot({ cx, cy, radius, interval, keyIdx, labelMode, shapeBorder, dashed = false, showNoteName = false }) {
  const color = THEME.interval[interval];
  const nn = noteName(interval, keyIdx);
  const primary = labelMode === "notes" ? nn : interval;
  const isLong = primary.length > 1;
  const isTriad = radius === TRIAD_RADIUS;

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius + (isTriad ? 4 : 3)} fill={THEME.glow[isTriad ? "medium" : "soft"]} />
      <circle cx={cx} cy={cy} r={radius} fill={color} stroke={shapeBorder || THEME.stroke.medium}
        strokeWidth={shapeBorder ? 2.5 : (isTriad ? 1 : 0.7)} strokeDasharray={dashed ? "3,2" : "none"} />
      <text x={cx} y={cy + (isTriad ? 3.5 : 3)} textAnchor="middle" fill={THEME.text.dark}
        fontSize={isLong ? (isTriad ? 8 : 6) : (isTriad ? 10 : 8)} fontWeight={isTriad ? 700 : 600}>
        {primary}
      </text>
      {showNoteName && (
        <text x={cx + radius + 2} y={cy + radius + 2} textAnchor="start" fill={THEME.text.secondary}
          fontSize={isTriad ? 7 : 6.5} fontWeight={500}>
          {nn}
        </text>
      )}
    </g>
  );
}

function LegendSection({ title, items, dotSize, mt = 0, keyIdx, labelMode }) {
  return (
    <>
      <div style={{ fontSize: "0.55rem", color: THEME.text.dim, textTransform: "uppercase",
        letterSpacing: "0.2em", marginBottom: 8, marginTop: mt }}>
        {title}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {items.map(([iv, label]) => {
          const nn = noteName(iv, keyIdx);
          const dotLabel = labelMode === "notes" ? nn : iv;
          const textLabel = labelMode === "notes" ? `${nn} (${label})` : labelMode === "both" ? `${label} · ${nn}` : label;
          return (
            <div key={iv} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: THEME.interval[iv],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: dotSize < 18 ? 6 : (dotLabel.length > 1 ? 7 : 9), fontWeight: 700, color: THEME.text.dark }}>
                {dotLabel}
              </div>
              <span style={{ fontSize: "0.74rem", color: THEME.text.secondary }}>{textLabel}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ChordDiagram({ chord, shape, accent, keyIdx, labelMode, italic = false }) {
  const S = 16, F = 18, L = 20, T = 26;
  const maxF = Math.max(...chord.f.filter(x => typeof x === "number"), 3);
  const nf = Math.max(4, maxF + 1);
  const W = L + 5 * S + 18;
  const H = T + nf * F + 10;
  const getLabel = (iv) => iv ? (labelMode === "notes" ? noteName(iv, keyIdx) : iv) : null;

  return (
    <div style={{ background: THEME.bg.card, borderRadius: 8, padding: "8px 5px 4px", border: `1px solid ${accent}25` }}>
      <div style={{ textAlign: "center", fontSize: "0.64rem", fontWeight: 700, color: accent,
        letterSpacing: "0.06em", marginBottom: 3, fontStyle: italic ? "italic" : "normal" }}>
        {shape}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W * 1.15} height={H * 1.15}>
        <rect x={L - 1} y={T} width={5 * S + 2} height={2.5} rx={1} fill={THEME.text.secondary} />
        {Array.from({ length: nf }, (_, i) => i + 1).map(f =>
          <line key={f} x1={L} y1={T + f * F} x2={L + 5 * S} y2={T + f * F} stroke="#334155" strokeWidth={0.7} />
        )}
        {[0, 1, 2, 3, 4, 5].map(i =>
          <line key={i} x1={L + i * S} y1={T} x2={L + i * S} y2={T + nf * F} stroke={THEME.text.dim} strokeWidth={0.6} />
        )}
        {chord.f.map((fret, i) => {
          const x = L + i * S;
          const iv = chord.i[i];
          const c = iv ? THEME.interval[iv] : THEME.text.secondary;
          const label = getLabel(iv);
          const lSize = label && label.length > 1 ? 5 : 6;
          if (fret === "x") {
            return <text key={i} x={x} y={T - 7} textAnchor="middle" fill={THEME.text.dim} fontSize={9} fontWeight={700}>✕</text>;
          }
          if (fret === 0) {
            return (
              <g key={i}>
                <circle cx={x} cy={T - 9} r={5.5} fill="none" stroke={c} strokeWidth={1.3} />
                <text x={x} y={T - 6.5} textAnchor="middle" fill={c} fontSize={lSize} fontWeight={700}>{label}</text>
              </g>
            );
          }
          const cy = T + (fret - 0.5) * F;
          return (
            <g key={i}>
              <circle cx={x} cy={cy} r={6.5} fill={c} stroke={THEME.stroke.light} strokeWidth={0.6} />
              <text x={x} y={cy + 2.8} textAnchor="middle" fill={THEME.text.dark} fontSize={lSize} fontWeight={700}>{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function CAGEDExplorer() {
  const [column, setColumn] = useState(0);
  const [isMinorKey, setIsMinorKey] = useState(false);
  const [activeShape, setActiveShape] = useState("C");
  const [pentaMode, setPentaMode] = useState("off");
  const [triadMode, setTriadMode] = useState("major");
  const [labelMode, setLabelMode] = useState("intervals");
  const [threeTwoMode, setThreeTwoMode] = useState("off");

  const effectiveKey = isMinorKey ? (column + 9) % 12 : column;
  const showMajTriad = triadMode === "major" || triadMode === "both";
  const showMinTriad = triadMode === "minor" || triadMode === "both";
  const anyTriad = triadMode !== "off";
  const showPenta = pentaMode !== "off";
  const visibleShapes = useMemo(() => activeShape === "all" ? SHAPES : [activeShape], [activeShape]);

  const majTriads = useMemo(() => transpose(TRIAD_MAJ, effectiveKey), [effectiveKey]);
  const minTriads = useMemo(() => transpose(TRIAD_MIN, effectiveKey), [effectiveKey]);
  const majPenta = useMemo(() => transpose(PENTA_MAJ, effectiveKey), [effectiveKey]);
  const minPenta = useMemo(() => transpose(PENTA_MIN, effectiveKey), [effectiveKey]);
  const bluesNotes = useMemo(() => transpose(BLUES_ADDITION, effectiveKey), [effectiveKey]);

  // Transpose 3:2 position data
  const transposeThreeTwo = (positions, semitones) => {
    return positions.map(pos => {
      let shifted = pos.notes.map(([str, fret, iv]) => [str, fret + semitones, iv]);
      if (shifted.length > 0 && Math.min(...shifted.map(([, f]) => f)) >= 12) {
        shifted = shifted.map(([str, fret, iv]) => [str, fret - 12, iv]);
      }
      return {
        strings: pos.strings,
        notes: shifted.filter(([, fret]) => fret >= 0 && fret <= 15)
      };
    }).filter(pos => pos.notes.length > 0);
  };

  const threeTwoPos1Maj = useMemo(() => transposeThreeTwo(THREE_TWO_POS1_MAJ, effectiveKey), [effectiveKey]);
  const threeTwoPos2Maj = useMemo(() => transposeThreeTwo(THREE_TWO_POS2_MAJ, effectiveKey), [effectiveKey]);
  const threeTwoPos1Min = useMemo(() => transposeThreeTwo(THREE_TWO_POS1_MIN, effectiveKey), [effectiveKey]);
  const threeTwoPos2Min = useMemo(() => transposeThreeTwo(THREE_TWO_POS2_MIN, effectiveKey), [effectiveKey]);

  const pentaData = pentaMode === "major" ? majPenta : (showPenta ? minPenta : null);

  const triadPositions = useMemo(() => {
    const set = new Set();
    if (showMajTriad) visibleShapes.forEach(sh => majTriads[sh].forEach(([s, f]) => set.add(posKey(s, f))));
    if (showMinTriad) visibleShapes.forEach(sh => minTriads[sh].forEach(([s, f]) => set.add(posKey(s, f))));
    return set;
  }, [majTriads, minTriads, visibleShapes, showMajTriad, showMinTriad]);

  const majTriadPositions = useMemo(() => {
    const set = new Set();
    if (showMajTriad) visibleShapes.forEach(sh => majTriads[sh].forEach(([s, f]) => set.add(posKey(s, f))));
    return set;
  }, [majTriads, visibleShapes, showMajTriad]);

  const pentaNotes = useMemo(() => {
    if (!pentaData) return [];
    const seen = new Set();
    const out = [];
    visibleShapes.forEach(sh => {
      (pentaData[sh] || []).forEach(([s, f, iv]) => {
        const key = posKey(s, f);
        if (!seen.has(key) && !triadPositions.has(key)) { seen.add(key); out.push([s, f, iv]); }
      });
      if (pentaMode === "blues") {
        (bluesNotes[sh] || []).forEach(([s, f, iv]) => {
          const key = posKey(s, f);
          if (!seen.has(key) && !triadPositions.has(key)) { seen.add(key); out.push([s, f, iv]); }
        });
      }
    });
    return out;
  }, [pentaData, bluesNotes, visibleShapes, triadPositions, pentaMode]);

  const showThreeTwoBars = threeTwoMode === "on";

  // Compute which 3:2 positions to show based on active shapes
  const threeTwoBars = useMemo(() => {
    if (!showThreeTwoBars) return [];
    const isMinor = pentaMode === "minor" || pentaMode === "blues";
    const pos1Data = isMinor ? threeTwoPos1Min : threeTwoPos1Maj;
    const pos2Data = isMinor ? threeTwoPos2Min : threeTwoPos2Maj;

    // Determine which positions to show
    const showPos1 = activeShape === "all" || SHAPE_TO_THREE_TWO[activeShape] === 1;
    const showPos2 = activeShape === "all" || SHAPE_TO_THREE_TWO[activeShape] === 2;

    const bars = [];

    const addBarsFromPosition = (posData) => {
      posData.forEach(pos => {
        // Group notes by string within this string pair
        const notesByString = {};
        pos.notes.forEach(([str, fret, iv]) => {
          if (!notesByString[str]) notesByString[str] = [];
          notesByString[str].push({ fret, iv });
        });

        // Create a bar for each string's notes
        Object.entries(notesByString).forEach(([str, notes]) => {
          if (notes.length === 0) return;
          const sortedFrets = notes.map(n => n.fret).sort((a, b) => a - b);
          bars.push({
            string: parseInt(str),
            minFret: sortedFrets[0],
            maxFret: sortedFrets[sortedFrets.length - 1],
            type: notes.length >= 3 ? 3 : 2,
            notes: notes
          });
        });
      });
    };

    if (showPos1) addBarsFromPosition(pos1Data);
    if (showPos2) addBarsFromPosition(pos2Data);

    return bars;
  }, [showThreeTwoBars, activeShape, pentaMode, threeTwoPos1Maj, threeTwoPos2Maj, threeTwoPos1Min, threeTwoPos2Min]);

  const svgW = MARGIN_LEFT + NUM_FRETS * FRET_SPACING + 25;
  const svgH = MARGIN_TOP + 5 * STRING_SPACING + 48;

  const triadLegend = triadMode === "both" ? LEGEND.triadBoth : triadMode === "minor" ? LEGEND.triadMin : LEGEND.triadMaj;
  const pentaLegend = (() => {
    if (pentaMode === "off") return [];
    // Full legends when triads are off
    if (triadMode === "off") {
      if (pentaMode === "major") return LEGEND.pentaMajFull;
      if (pentaMode === "minor") return LEGEND.pentaMinFull;
      if (pentaMode === "blues") return LEGEND.bluesFull;
    }
    // Major penta: need to show "3" when minor triad (since 3 not in minor triad legend)
    if (pentaMode === "major") {
      return triadMode === "minor" ? LEGEND.pentaMajWithMin : LEGEND.pentaMaj;
    }
    // Minor penta / blues: ♭3 is redundant when minor or both triads shown
    if (pentaMode === "minor") {
      return triadMode === "major" ? LEGEND.pentaMin : LEGEND.pentaMinWithMaj;
    }
    if (pentaMode === "blues") {
      return triadMode === "major" ? LEGEND.blues : LEGEND.bluesWithMaj;
    }
    return [];
  })();

  const keyName = NOTES[effectiveKey];
  const footerKey = (() => {
    if (triadMode === "off") return showPenta ? `${keyName} ${scaleName(pentaMode)}` : "";
    const base = triadMode === "both" ? `${keyName} Major · ${keyName} Minor` : triadMode === "minor" ? `${keyName} Minor` : `${keyName} Major`;
    return showPenta ? `${base} · ${scaleName(pentaMode)}` : base;
  })();

  const subtitle = (() => {
    const triadPart = triadMode === "both" ? "Major & Minor Triads" : triadMode === "minor" ? "Minor Triads" : "Major Triads";
    return showPenta ? `${triadPart} · ${scaleName(pentaMode)}` : triadPart;
  })();

  return (
    <div style={{ background: "linear-gradient(160deg, #0c1222 0%, #1a1040 50%, #0c1222 100%)",
      minHeight: "100vh", padding: "24px 16px", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", color: THEME.text.primary }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <h1 style={{ textAlign: "center", fontSize: "2.5rem", fontWeight: 300, margin: "0 0 2px",
          letterSpacing: "0.25em", color: "#f1f5f9", fontFamily: "Georgia, 'Times New Roman', serif" }}>
          CAGED Explorer
        </h1>
        <p style={{ textAlign: "center", fontSize: "0.62rem", color: THEME.text.muted, margin: "0 0 22px",
          letterSpacing: "0.28em", textTransform: "uppercase" }}>
          {subtitle}
        </p>

        {/* Key Selector: Major Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.58rem", color: THEME.text.dim, letterSpacing: "0.2em", textTransform: "uppercase", marginRight: 8, minWidth: 32, textAlign: "right" }}>Major</span>
          {NOTES.map((n, i) => {
            const sel = column === i;
            const rowActive = sel && !isMinorKey;
            return (
              <button key={n} onClick={() => { setColumn(i); setIsMinorKey(false); if (triadMode === "minor") setTriadMode("major"); }}
                style={{ background: rowActive ? "#f1f5f9" : sel ? "rgba(241,245,249,0.15)" : THEME.bg.btnOff,
                  color: rowActive ? "#0f172a" : sel ? THEME.text.secondary : THEME.text.muted,
                  border: `1px solid ${rowActive ? "#f1f5f9" : sel ? "rgba(241,245,249,0.25)" : THEME.border.light}`,
                  borderRadius: 5, padding: "4px 10px", fontSize: "0.75rem", fontWeight: sel ? 700 : 400,
                  cursor: "pointer", transition: "all 0.15s", minWidth: 38, textAlign: "center" }}>
                {n}
              </button>
            );
          })}
        </div>

        {/* Key Selector: Minor Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.58rem", color: THEME.text.dim, letterSpacing: "0.2em", textTransform: "uppercase", marginRight: 8, minWidth: 32, textAlign: "right" }}>Minor</span>
          {NOTES.map((_, i) => {
            const minIdx = (i + 9) % 12;
            const minName = NOTES[minIdx] + "m";
            const sel = column === i;
            const rowActive = sel && isMinorKey;
            return (
              <button key={i} onClick={() => { setColumn(i); setIsMinorKey(true); if (triadMode === "major") setTriadMode("minor"); }}
                style={{ background: rowActive ? "rgba(210,170,140,0.25)" : sel ? "rgba(210,170,140,0.1)" : THEME.bg.btnOff,
                  color: rowActive ? "#d8ac90" : sel ? "#8a7060" : "#4a5568",
                  border: `1px solid ${rowActive ? "rgba(210,170,140,0.4)" : sel ? "rgba(210,170,140,0.15)" : THEME.border.light}`,
                  borderRadius: 5, padding: "4px 6px", fontSize: "0.68rem", fontWeight: sel ? 700 : 400,
                  cursor: "pointer", transition: "all 0.15s", minWidth: 38, textAlign: "center" }}>
                {minName}
              </button>
            );
          })}
        </div>

        {/* Shape Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
          {["all", ...SHAPES].map(s => {
            const on = activeShape === s;
            const c = s === "all" ? THEME.text.secondary : THEME.shape[s];
            return (
              <button key={s} onClick={() => setActiveShape(s)}
                style={{ background: on ? (s === "all" ? "rgba(255,255,255,0.1)" : c + "20") : "transparent",
                  color: on ? (s === "all" ? THEME.text.primary : c) : THEME.text.dim,
                  border: `1px solid ${on ? (s === "all" ? "rgba(255,255,255,0.15)" : c + "55") : THEME.border.subtle}`,
                  borderRadius: 6, padding: "5px 14px", fontSize: "0.8rem", fontWeight: on ? 600 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                {s === "all" ? "All" : `${s} Shape`}
              </button>
            );
          })}
        </div>

        {/* Options Row */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>Triads</span>
          {["major", "minor", "both", "off"].map(m => (
            <ToggleButton key={m} label={m === "major" ? "Major" : m === "minor" ? "Minor" : m === "both" ? "Both" : "Off"}
              active={triadMode === m} onClick={() => setTriadMode(m)} />
          ))}
          <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 4px", fontSize: "0.8rem" }}>│</span>
          <span style={{ fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>Pentatonic</span>
          {["off", "major", "minor", "blues"].map(m => (
            <ToggleButton key={m} label={m === "off" ? "Off" : m === "major" ? "Major" : m === "minor" ? "Minor" : "Blues"}
              active={pentaMode === m} onClick={() => setPentaMode(m)} accent={m !== "off" && pentaMode === m} />
          ))}
          <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 4px", fontSize: "0.8rem" }}>│</span>
          <span style={{ fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>Labels</span>
          {["intervals", "notes", "both"].map(m => (
            <ToggleButton key={m} label={m === "intervals" ? "Intervals" : m === "notes" ? "Notes" : "Both"}
              active={labelMode === m} onClick={() => setLabelMode(m)} />
          ))}
          <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 4px", fontSize: "0.8rem" }}>│</span>
          <span style={{ fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>3:2 System</span>
          {["off", "on"].map(m => (
            <ToggleButton key={m} label={m === "off" ? "Off" : "On"}
              active={threeTwoMode === m} onClick={() => setThreeTwoMode(m)} accent={m === "on" && threeTwoMode === "on"} />
          ))}
        </div>

        {/* Fretboard */}
        <div style={{ background: THEME.bg.panel, borderRadius: 12, padding: "10px 0", border: `1px solid ${THEME.border.subtle}`,
          overflowX: "auto", boxShadow: "inset 0 0 40px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)" }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", minWidth: 700, display: "block" }}>
            <defs>
              <linearGradient id="fb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b2507" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#261803" stopOpacity="0.22" />
              </linearGradient>
            </defs>

            <rect x={MARGIN_LEFT - 3} y={MARGIN_TOP - 13} width={NUM_FRETS * FRET_SPACING + 6} height={5 * STRING_SPACING + 26} rx={3} fill="url(#fb)" />

            {[6, 5, 4, 3, 2, 1].map(s =>
              <line key={s} x1={MARGIN_LEFT - 20} y1={strY(s)} x2={MARGIN_LEFT + NUM_FRETS * FRET_SPACING} y2={strY(s)}
                stroke={THEME.text.secondary} strokeWidth={0.3 + (s - 1) * 0.16} opacity={0.45} />
            )}

            <rect x={MARGIN_LEFT - 2} y={MARGIN_TOP - 13} width={4} height={5 * STRING_SPACING + 26} rx={1} fill={THEME.text.secondary} opacity={0.8} />

            {Array.from({ length: NUM_FRETS }, (_, i) => i + 1).map(f =>
              <line key={f} x1={fretX(f)} y1={MARGIN_TOP - 11} x2={fretX(f)} y2={MARGIN_TOP + 5 * STRING_SPACING + 11}
                stroke={THEME.text.dim} strokeWidth={0.8} opacity={0.5} />
            )}

            {[3, 5, 7, 9].map(f =>
              <circle key={f} cx={noteX(f)} cy={MARGIN_TOP + 2.5 * STRING_SPACING} r={3.5} fill="#4a5568" opacity={0.85} />
            )}
            <circle cx={noteX(12)} cy={MARGIN_TOP + 1.5 * STRING_SPACING} r={3.5} fill="#4a5568" opacity={0.85} />
            <circle cx={noteX(12)} cy={MARGIN_TOP + 3.5 * STRING_SPACING} r={3.5} fill="#4a5568" opacity={0.85} />

            {Array.from({ length: NUM_FRETS }, (_, i) => i).map(f =>
              <text key={f} x={f === 0 ? MARGIN_LEFT : noteX(f)} y={MARGIN_TOP + 5 * STRING_SPACING + 34}
                textAnchor="middle" fill={THEME.text.dim} fontSize={9} fontFamily="ui-monospace, monospace">{f}</text>
            )}

            {STR_NAMES.map((l, i) =>
              <text key={i} x={14} y={strY(6 - i) + 4} textAnchor="middle" fill={THEME.text.dim} fontSize={10} fontFamily="ui-monospace, monospace">{l}</text>
            )}

            {anyTriad && activeShape === "all" && SHAPES.map(sh => {
              const majF = showMajTriad ? majTriads[sh].map(([, f]) => f) : [];
              const minF = showMinTriad ? minTriads[sh].map(([, f]) => f) : [];
              const pF = pentaData ? (pentaData[sh] || []).map(([, f]) => f) : [];
              const allFrets = [...majF, ...minF, ...pF];
              if (!allFrets.length) return null;
              const mn = Math.min(...allFrets);
              const mx = Math.max(...allFrets);
              const x1 = mn === 0 ? MARGIN_LEFT - 20 : fretX(mn) - FRET_SPACING * 0.48;
              const x2 = fretX(mx) + FRET_SPACING * 0.48;
              return <rect key={sh} x={x1} y={MARGIN_TOP - 13} width={x2 - x1} height={5 * STRING_SPACING + 26} fill={THEME.shape[sh]} opacity={0.04} rx={3} />;
            })}

            {anyTriad && activeShape === "all" && SHAPES.map(sh => {
              const fs = (showMajTriad ? majTriads[sh] : minTriads[sh]).map(([, f]) => f);
              if (!fs.length) return null;
              const avg = fs.reduce((a, b) => a + b, 0) / fs.length;
              const cx = avg < 0.5 ? MARGIN_LEFT - 16 : MARGIN_LEFT + (avg - 0.5) * FRET_SPACING;
              const lbl = triadMode === "minor" ? sh + "m" : triadMode === "both" ? `${sh}/${sh}m` : sh;
              return <text key={sh} x={cx} y={MARGIN_TOP - 20} textAnchor="middle" fill={THEME.shape[sh]} fontSize={triadMode === "both" ? 8 : 10} fontWeight={700}>{lbl}</text>;
            })}

            {/* 3:2 System bars - render behind notes */}
            {threeTwoBars.map((bar, i) => {
              const x1 = bar.minFret === 0 ? MARGIN_LEFT - 26 : noteX(bar.minFret) - PENTA_RADIUS - 4;
              const x2 = noteX(bar.maxFret) + PENTA_RADIUS + 4;
              const barColor = bar.type === 3 ? THEME.interval.R : THEME.interval["5"];
              return (
                <rect
                  key={`bar-${i}`}
                  x={x1}
                  y={strY(bar.string) - 5}
                  width={x2 - x1}
                  height={10}
                  rx={5}
                  fill={barColor}
                  opacity={0.4}
                />
              );
            })}

            {pentaNotes.map(([s, f, iv], i) => (
              <FretDot key={`p${i}`} cx={noteX(f)} cy={strY(s)} radius={PENTA_RADIUS} interval={iv}
                keyIdx={effectiveKey} labelMode={labelMode} showNoteName={labelMode === "both" && f !== 0} />
            ))}

            {showMinTriad && visibleShapes.map(sh =>
              minTriads[sh]
                .filter(([s, f]) => !(triadMode === "both" && majTriadPositions.has(posKey(s, f))))
                .map(([s, f, iv], idx) => (
                  <FretDot key={`m-${sh}-${idx}`} cx={noteX(f)} cy={strY(s)} radius={TRIAD_RADIUS} interval={iv}
                    keyIdx={effectiveKey} labelMode={labelMode} shapeBorder={activeShape === "all" ? THEME.shape[sh] : null}
                    dashed={triadMode === "both"} showNoteName={labelMode === "both" && f !== 0} />
                ))
            )}

            {showMajTriad && visibleShapes.map(sh =>
              majTriads[sh].map(([s, f, iv], idx) => (
                <FretDot key={`t-${sh}-${idx}`} cx={noteX(f)} cy={strY(s)} radius={TRIAD_RADIUS} interval={iv}
                  keyIdx={effectiveKey} labelMode={labelMode} shapeBorder={activeShape === "all" ? THEME.shape[sh] : null}
                  showNoteName={labelMode === "both" && f !== 0} />
              ))
            )}
          </svg>
        </div>

        {/* Bottom Section: Legend + Chord Diagrams */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 20, gap: 20, flexWrap: "wrap" }}>
          <div>
            {anyTriad && <LegendSection title={triadMode === "both" ? "Triads" : triadMode === "minor" ? "Minor Triad" : "Triad"}
              items={triadLegend} dotSize={20} keyIdx={effectiveKey} labelMode={labelMode} />}

            {anyTriad && triadMode === "both" && (
              <div style={{ fontSize: "0.6rem", color: THEME.text.muted, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width={20} height={12}>
                  <circle cx={6} cy={6} r={5} fill={THEME.interval["♭3"]} stroke={THEME.stroke.medium} strokeWidth={1} strokeDasharray="3,2" />
                </svg>
                <span>Dashed border = minor</span>
              </div>
            )}

            {pentaLegend.length > 0 && <LegendSection title={scaleName(pentaMode)} items={pentaLegend} dotSize={16}
              mt={anyTriad ? 14 : 0} keyIdx={effectiveKey} labelMode={labelMode} />}

            {anyTriad && activeShape === "all" && (
              <>
                <div style={{ fontSize: "0.55rem", color: THEME.text.dim, textTransform: "uppercase", letterSpacing: "0.2em", margin: "14px 0 8px" }}>Shape borders</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {SHAPES.map(s =>
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: THEME.shape[s] + "20", border: `2px solid ${THEME.shape[s]}` }} />
                      <span style={{ fontSize: "0.72rem", color: THEME.text.secondary }}>{s}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {pentaMode === "minor" && (
              <p style={{ fontSize: "0.68rem", color: THEME.text.muted, marginTop: 14, maxWidth: 300, lineHeight: 1.55, fontStyle: "italic" }}>
                The ♭3 sits beside the major 3rd — the tension at the heart of the blues.
              </p>
            )}

            {showThreeTwoBars && (
              <>
                <div style={{ fontSize: "0.55rem", color: THEME.text.dim, textTransform: "uppercase", letterSpacing: "0.2em", margin: "14px 0 8px" }}>
                  3:2 System
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 24, height: 10, borderRadius: 5, background: THEME.interval.R, opacity: 0.6 }} />
                    <span style={{ fontSize: "0.74rem", color: THEME.text.secondary }}>3 notes per string</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 16, height: 10, borderRadius: 5, background: THEME.interval["5"], opacity: 0.6 }} />
                    <span style={{ fontSize: "0.74rem", color: THEME.text.secondary }}>2 notes per string</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {anyTriad && (
            <div>
              {showMajTriad && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: showMinTriad ? 10 : 0 }}>
                  {(activeShape === "all" ? SHAPES : [activeShape]).map(sh =>
                    <ChordDiagram key={sh} chord={CHORD_MAJ[sh]} shape={sh} accent={THEME.shape[sh]} keyIdx={effectiveKey} labelMode={labelMode} />
                  )}
                </div>
              )}
              {showMinTriad && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {(activeShape === "all" ? SHAPES : [activeShape]).map(sh =>
                    <ChordDiagram key={`m-${sh}`} chord={CHORD_MIN[sh]} shape={sh + "m"} accent={THEME.shape[sh]} keyIdx={effectiveKey} labelMode={labelMode} italic />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${THEME.border.subtle}` }}>
          <span style={{ fontSize: "0.82rem", color: THEME.text.muted, fontWeight: 500 }}>{footerKey}</span>
          <span style={{ fontSize: "0.72rem", color: "#334155", marginLeft: 12 }}>
            {activeShape === "all" ? "Five shapes connected across the fretboard" : `${activeShape} shape voicing`}
          </span>
        </div>
      </div>
    </div>
  );
}
