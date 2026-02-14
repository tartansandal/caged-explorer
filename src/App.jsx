import { useState, useMemo, useCallback } from "react";
import {
  posKey, shiftNotes, clusterFrets, computeHoverRanges,
  NUM_FRETS, SHAPE_ORDER, FRYING_PAN,
  PENTA_BOX, TRIAD_SHAPE, BLUES_SHAPE, SHAPE_FRET_RANGES,
} from "./music.js";

/**
 * CAGED System Explorer
 * An interactive fretboard visualization tool for learning the CAGED system on guitar.
 */

const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const SHAPES = SHAPE_ORDER;
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
  overlay: {
    fryingPanLeft: "#d4b070",
    fryingPanRight: "#c0a0d0",
  },
};

const FRET_SPACING   = 56;
const STRING_SPACING = 26;
const MARGIN_LEFT    = 52;
const MARGIN_TOP     = 38;
const TRIAD_RADIUS   = 10;
const PENTA_RADIUS   = 8;

// Shared layout styles extracted from JSX
const STYLE = {
  keyRow: (mb) => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: mb, flexWrap: "wrap" }),
  rowLabel: { fontSize: "0.58rem", color: THEME.text.dim, letterSpacing: "0.2em", textTransform: "uppercase", marginRight: 8, minWidth: 72, textAlign: "right" },
  optionRow: (mb) => ({ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: mb, flexWrap: "wrap" }),
  optionLabel: { fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" },
  divider: { color: "rgba(255,255,255,0.1)", margin: "0 4px", fontSize: "0.8rem" },
  keyBtn: (active, sel) => ({
    borderRadius: 5, padding: "4px 10px", fontSize: "0.75rem", fontWeight: sel ? 700 : 400,
    cursor: "pointer", transition: "all 0.15s", minWidth: 38, textAlign: "center",
    background: active ? "#f1f5f9" : sel ? "rgba(241,245,249,0.15)" : THEME.bg.btnOff,
    color: active ? "#0f172a" : sel ? THEME.text.secondary : THEME.text.muted,
    border: `1px solid ${active ? "#f1f5f9" : sel ? "rgba(241,245,249,0.25)" : THEME.border.light}`,
  }),
  minorKeyBtn: (active, sel) => ({
    borderRadius: 5, padding: "4px 6px", fontSize: "0.68rem", fontWeight: sel ? 700 : 400,
    cursor: "pointer", transition: "all 0.15s", minWidth: 38, textAlign: "center",
    background: active ? "rgba(210,170,140,0.25)" : sel ? "rgba(210,170,140,0.1)" : THEME.bg.btnOff,
    color: active ? "#d8ac90" : sel ? "#8a7060" : "#4a5568",
    border: `1px solid ${active ? "rgba(210,170,140,0.4)" : sel ? "rgba(210,170,140,0.15)" : THEME.border.light}`,
  }),
};

const INTERVAL_SEMITONES = {
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

const CHORD_MAJ = {
  C: { frets: ["x",3,2,0,1,0],     intervals: [null,"R","3","5","R","3"] },
  A: { frets: ["x",0,2,2,2,0],     intervals: [null,"R","5","R","3","5"] },
  G: { frets: [3,2,0,0,0,3],       intervals: ["R","3","5","R","3","R"] },
  E: { frets: [0,2,2,1,0,0],       intervals: ["R","5","R","3","5","R"] },
  D: { frets: ["x","x",0,2,3,2],   intervals: [null,null,"R","5","R","3"] },
};

const CHORD_MIN = {
  C: { frets: ["x",3,1,0,1,"x"],   intervals: [null,"R","♭3","5","R",null] },
  A: { frets: ["x",0,2,2,1,0],     intervals: [null,"R","5","R","♭3","5"] },
  G: { frets: [3,1,0,0,3,3],       intervals: ["R","♭3","5","R","5","R"] },
  E: { frets: [0,2,2,0,0,0],       intervals: ["R","5","R","♭3","5","R"] },
  D: { frets: ["x","x",0,2,3,1],   intervals: [null,null,"R","5","R","♭3"] },
};

const LEGEND = {
  triadMaj:  [["R","Root"], ["3","Major 3rd"], ["5","Perfect 5th"]],
  triadMin:  [["R","Root"], ["♭3","Minor 3rd"], ["5","Perfect 5th"]],
  pentaMaj:  [["2","Major 2nd"], ["6","Major 6th"]],
  pentaMajWithMin: [["2","Major 2nd"], ["3","Major 3rd"], ["6","Major 6th"]],
  pentaMin:  [["♭3","Minor 3rd"], ["4","Perfect 4th"], ["♭7","Minor 7th"]],
  pentaMinWithMaj: [["4","Perfect 4th"], ["♭7","Minor 7th"]],
  blues:     [["♭3","Minor 3rd"], ["4","Perfect 4th"], ["♭5","Blue note"], ["♭7","Minor 7th"]],
  bluesWithMaj: [["4","Perfect 4th"], ["♭5","Blue note"], ["♭7","Minor 7th"]],
  pentaMajFull:  [["R","Root"], ["2","Major 2nd"], ["3","Major 3rd"], ["5","Perfect 5th"], ["6","Major 6th"]],
  pentaMinFull:  [["R","Root"], ["♭3","Minor 3rd"], ["4","Perfect 4th"], ["5","Perfect 5th"], ["♭7","Minor 7th"]],
  bluesFull:     [["R","Root"], ["♭3","Minor 3rd"], ["4","Perfect 4th"], ["♭5","Blue note"], ["5","Perfect 5th"], ["♭7","Minor 7th"]],
  bluesMajFull:  [["R","Root"], ["2","Major 2nd"], ["♭3","Blue note"], ["3","Major 3rd"], ["5","Perfect 5th"], ["6","Major 6th"]],
  bluesMaj:      [["2","Major 2nd"], ["♭3","Blue note"], ["6","Major 6th"]],
  bluesMajWithMin: [["2","Major 2nd"], ["3","Major 3rd"], ["6","Major 6th"]],
};

const noteName = (interval, keyIdx) => NOTES[(keyIdx + INTERVAL_SEMITONES[interval]) % 12];

const scaleName = (pentaScale, pentaQuality) => {
  if (pentaScale === "off") return "";
  if (pentaScale === "blues") return pentaQuality === "major" ? "Major Blues" : "Blues Scale";
  return pentaQuality === "major" ? "Major Pentatonic" : "Minor Pentatonic";
};

const fretX = (fret) => MARGIN_LEFT + fret * FRET_SPACING;
const noteX = (fret) => fret === 0 ? MARGIN_LEFT - 16 : MARGIN_LEFT + (fret - 0.5) * FRET_SPACING;
const strY = (str) => MARGIN_TOP + (str - 1) * STRING_SPACING;
function ToggleButton({ label, active, onClick, style = {} }) {
  const bg = active ? THEME.bg.btnAccent : THEME.bg.btnOff;
  const color = active ? "#93c5fd" : THEME.text.dim;
  const border = active ? THEME.border.accent : THEME.border.subtle;

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

function FretDot({ cx, cy, radius, interval, keyIdx, labelMode, shapeBorder, showNoteName = false }) {
  const color = THEME.interval[interval];
  const note = noteName(interval, keyIdx);
  const primary = labelMode === "notes" ? note : interval;
  const isLong = primary.length > 1;
  const isTriad = radius === TRIAD_RADIUS;

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius + (isTriad ? 4 : 3)} fill={THEME.glow[isTriad ? "medium" : "soft"]} />
      <circle cx={cx} cy={cy} r={radius} fill={color} stroke={shapeBorder || THEME.stroke.medium}
        strokeWidth={shapeBorder ? 2.5 : (isTriad ? 1 : 0.7)} strokeDasharray="none" />
      <text x={cx} y={cy + (isTriad ? 3.5 : 3)} textAnchor="middle" fill={THEME.text.dark}
        fontSize={isLong ? (isTriad ? 8 : 6) : (isTriad ? 10 : 8)} fontWeight={isTriad ? 700 : 600}>
        {primary}
      </text>
      {showNoteName && (
        <text x={cx + radius + 2} y={cy + radius + 2} textAnchor="start" fill={THEME.text.secondary}
          fontSize={isTriad ? 7 : 6.5} fontWeight={500}>
          {note}
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
        {items.map(([interval, label]) => {
          const note = noteName(interval, keyIdx);
          const dotLabel = labelMode === "notes" ? note : interval;
          const textLabel = labelMode === "notes" ? `${note} (${label})` : labelMode === "both" ? `${label} · ${note}` : label;
          return (
            <div key={interval} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: THEME.interval[interval],
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
  const STR_GAP = 16, FRET_GAP = 18, LEFT = 20, TOP = 26;
  const maxF = Math.max(...chord.frets.filter(x => typeof x === "number"), 3);
  const nf = Math.max(4, maxF + 1);
  const W = LEFT + 5 * STR_GAP + 18;
  const H = TOP + nf * FRET_GAP + 10;
  const getLabel = (interval) => interval ? (labelMode === "notes" ? noteName(interval, keyIdx) : interval) : null;

  return (
    <div style={{ background: THEME.bg.card, borderRadius: 8, padding: "8px 5px 4px", border: `1px solid ${accent}25` }}>
      <div style={{ textAlign: "center", fontSize: "0.64rem", fontWeight: 700, color: accent,
        letterSpacing: "0.06em", marginBottom: 3, fontStyle: italic ? "italic" : "normal" }}>
        {shape}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W * 1.15} height={H * 1.15}>
        <rect x={LEFT - 1} y={TOP} width={5 * STR_GAP + 2} height={2.5} rx={1} fill={THEME.text.secondary} />
        {Array.from({ length: nf }, (_, i) => i + 1).map(f =>
          <line key={f} x1={LEFT} y1={TOP + f * FRET_GAP} x2={LEFT + 5 * STR_GAP} y2={TOP + f * FRET_GAP} stroke="#334155" strokeWidth={0.7} />
        )}
        {[0, 1, 2, 3, 4, 5].map(i =>
          <line key={i} x1={LEFT + i * STR_GAP} y1={TOP} x2={LEFT + i * STR_GAP} y2={TOP + nf * FRET_GAP} stroke={THEME.text.dim} strokeWidth={0.6} />
        )}
        {chord.frets.map((fret, i) => {
          const x = LEFT + i * STR_GAP;
          const interval = chord.intervals[i];
          const c = interval ? THEME.interval[interval] : THEME.text.secondary;
          const label = getLabel(interval);
          const lSize = label && label.length > 1 ? 5 : 6;
          if (fret === "x") {
            return <text key={i} x={x} y={TOP - 7} textAnchor="middle" fill={THEME.text.dim} fontSize={9} fontWeight={700}>✕</text>;
          }
          if (fret === 0) {
            return (
              <g key={i}>
                <circle cx={x} cy={TOP - 9} r={5.5} fill="none" stroke={c} strokeWidth={1.3} />
                <text x={x} y={TOP - 6.5} textAnchor="middle" fill={c} fontSize={lSize} fontWeight={700}>{label}</text>
              </g>
            );
          }
          const cy = TOP + (fret - 0.5) * FRET_GAP;
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
  const [keyIndex, setKeyIndex] = useState(0);
  const [isMinorKey, setIsMinorKey] = useState(false);
  const [activeShape, setActiveShape] = useState("C");
  const [showTriads, setShowTriads] = useState(true);
  const [pentaScale, setPentaScale] = useState("off");
  const [triadQuality, setTriadQuality] = useState("major");
  const [pentaQuality, setPentaQuality] = useState("major");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [labelMode, setLabelMode] = useState("intervals");
  const [showFryingPan, setShowFryingPan] = useState(false);
  const [pinnedShapes, setPinnedShapes] = useState(new Set());
  const [hoveredShape, setHoveredShape] = useState(null);

  const toggleShapePin = (sh) => {
    setPinnedShapes(prev => {
      const next = new Set(prev);
      if (next.has(sh)) next.delete(sh);
      else next.add(sh);
      return next;
    });
  };

  const changeShape = (s) => {
    setActiveShape(s);
    if (s !== "all") setPinnedShapes(new Set());
  };

  const effectiveKey = isMinorKey ? (keyIndex + 9) % 12 : keyIndex;
  const showMajTriad = showTriads && triadQuality === "major";
  const showMinTriad = showTriads && triadQuality === "minor";
  const showPenta = pentaScale !== "off";
  const showShapeDistinctions = activeShape !== "off";

  const toggleAdvanced = () => {
    if (advancedMode) {
      const q = isMinorKey ? "minor" : "major";
      setTriadQuality(q);
      setPentaQuality(q);
    }
    setAdvancedMode(!advancedMode);
  };
  const visibleShapes = useMemo(() => (activeShape === "all" || activeShape === "off") ? SHAPES : [activeShape], [activeShape]);

  // Per-shape triad notes — shift static data by effectiveKey
  const majTriads = useMemo(() => {
    const byShape = {};
    const shapes = (activeShape === "all" || activeShape === "off") ? SHAPES : [activeShape];
    shapes.forEach(sh => { byShape[sh] = shiftNotes(TRIAD_SHAPE.major[sh], effectiveKey); });
    return byShape;
  }, [activeShape, effectiveKey]);

  const minTriads = useMemo(() => {
    const byShape = {};
    const shapes = (activeShape === "all" || activeShape === "off") ? SHAPES : [activeShape];
    shapes.forEach(sh => { byShape[sh] = shiftNotes(TRIAD_SHAPE.minor[sh], effectiveKey); });
    return byShape;
  }, [activeShape, effectiveKey]);

  // Per-shape pentatonic notes
  const majPenta = useMemo(() => {
    const byShape = {};
    const shapes = (activeShape === "all" || activeShape === "off") ? SHAPES : [activeShape];
    shapes.forEach(sh => { byShape[sh] = shiftNotes(PENTA_BOX.major[sh], effectiveKey); });
    return byShape;
  }, [activeShape, effectiveKey]);

  const minPenta = useMemo(() => {
    const byShape = {};
    const shapes = (activeShape === "all" || activeShape === "off") ? SHAPES : [activeShape];
    shapes.forEach(sh => { byShape[sh] = shiftNotes(PENTA_BOX.minor[sh], effectiveKey); });
    return byShape;
  }, [activeShape, effectiveKey]);

  // Per-shape blues notes (minor: ♭5, major: ♭3)
  const bluesNotes = useMemo(() => {
    const byShape = {};
    const shapes = (activeShape === "all" || activeShape === "off") ? SHAPES : [activeShape];
    shapes.forEach(sh => { byShape[sh] = shiftNotes(BLUES_SHAPE[pentaQuality][sh], effectiveKey); });
    return byShape;
  }, [activeShape, effectiveKey, pentaQuality]);

  // Shape fret ranges for labels and background highlights — quality-dependent.
  // Uses only the active quality's triads + pentatonics so ranges tightly bound the
  // notes that can actually appear. In advanced mode triad and penta qualities can
  // differ, so both are included. Blues excluded: ♭5s bridge the octave gap.
  const rangeQualities = useMemo(() => {
    const q = new Set([triadQuality, pentaQuality]);
    return [...q];
  }, [triadQuality, pentaQuality]);

  const shapeRanges = useMemo(() => {
    const ranges = {};
    SHAPES.forEach(sh => {
      const allNotes = rangeQualities.flatMap(q => [
        ...TRIAD_SHAPE[q][sh],
        ...PENTA_BOX[q][sh],
      ]);
      const shifted = shiftNotes(allNotes, effectiveKey);
      const frets = shifted.map(([, f]) => f);
      const canSpan = SHAPE_FRET_RANGES[rangeQualities[0]][sh][0].hi
                    - SHAPE_FRET_RANGES[rangeQualities[0]][sh][0].lo;
      ranges[sh] = clusterFrets(frets).map(c => ({
        ...c,
        partial: (c.hi - c.lo) < canSpan * 0.7,
      }));
    });
    return ranges;
  }, [effectiveKey, rangeQualities]);

  const hoverRanges = useMemo(
    () => computeHoverRanges(shapeRanges, SHAPES),
    [shapeRanges]
  );

  const pentaData = pentaScale === "off" ? null : (pentaQuality === "major" ? majPenta : minPenta);

  const triadPositions = useMemo(() => {
    const set = new Set();
    if (showMajTriad) visibleShapes.forEach(sh => majTriads[sh].forEach(([s, f]) => set.add(posKey(s, f))));
    if (showMinTriad) visibleShapes.forEach(sh => minTriads[sh].forEach(([s, f]) => set.add(posKey(s, f))));
    return set;
  }, [majTriads, minTriads, visibleShapes, showMajTriad, showMinTriad]);

  const pentaNotes = useMemo(() => {
    if (!pentaData) return [];
    const seen = new Set();
    const out = [];
    visibleShapes.forEach(sh => {
      (pentaData[sh] || []).forEach(([s, f, interval]) => {
        const key = posKey(s, f);
        if (!seen.has(key) && !triadPositions.has(key)) { seen.add(key); out.push([s, f, interval]); }
      });
      if (pentaScale === "blues") {
        // Bound blues notes to within 1 fret of the shape's pentatonic clusters
        const clusterSource = pentaQuality === "major" ? majPenta : minPenta;
        const pentaFrets = (clusterSource[sh] || []).map(([, f]) => f).sort((a, b) => a - b);
        const clusters = [];
        pentaFrets.forEach(f => {
          const last = clusters[clusters.length - 1];
          if (last && f - last.hi <= 6) last.hi = f;
          else clusters.push({ lo: f, hi: f });
        });
        (bluesNotes[sh] || []).forEach(([s, f, interval]) => {
          const key = posKey(s, f);
          const inRange = clusters.some(c => f >= c.lo - 1 && f <= c.hi + 1);
          if (inRange && !seen.has(key) && !triadPositions.has(key)) { seen.add(key); out.push([s, f, interval]); }
        });
      }
    });
    return out;
  }, [pentaData, bluesNotes, majPenta, minPenta, visibleShapes, triadPositions, pentaScale, pentaQuality]);


  // Frying pan geometry: shift static geometry by keyIndex (not effectiveKey,
  // since minor pentatonic clusters are offset 3 semitones from relative major).
  const fryingPanShapes = useMemo(() => {
    if (!showFryingPan) return [];

    const shapes = [];
    const addShifted = (templates, shift) => {
      templates.forEach(t => {
        const panMin = t.panMin + shift;
        const panMax = t.panMax + shift;
        const handleFret = t.handleFret + shift;
        if ([panMin, panMax, handleFret].some(f => f >= 0 && f <= NUM_FRETS)) {
          shapes.push({
            lowerStr: t.pair[0],
            upperStr: t.pair[1],
            panMinFret: panMin,
            panMaxFret: panMax,
            handleString: t.handleStr,
            handleFret,
            handleDirection: t.handleDir,
          });
        }
      });
    };

    for (const shift of [keyIndex, keyIndex - 12]) {
      addShifted(FRYING_PAN.left, shift);
      addShifted(FRYING_PAN.right, shift);
    }

    // When a single shape is selected, keep only pans that overlap the
    // shape's actual pentatonic notes (both qualities, to cover all toggles)
    if (activeShape !== "all" && activeShape !== "off") {
      const notes = [
        ...(majPenta[activeShape] || []),
        ...(minPenta[activeShape] || []),
      ];
      return shapes.filter(pan =>
        notes.some(([s, f]) =>
          (s === pan.lowerStr || s === pan.upperStr) &&
          f >= pan.panMinFret && f <= pan.panMaxFret
        )
      );
    }

    return shapes;
  }, [showFryingPan, activeShape, keyIndex, majPenta, minPenta]);


  // When frying pan is on in single-shape view, filter notes to only those
  // covered by a surviving pan (prevents orphan dots in partial clusters)
  const isSingleShapePan = showFryingPan && activeShape !== "all" && activeShape !== "off";
  const panCovers = useCallback((s, f) =>
    fryingPanShapes.some(pan =>
      (s === pan.lowerStr || s === pan.upperStr) &&
      f >= pan.panMinFret && f <= pan.panMaxFret
    ),
  [fryingPanShapes]);

  const displayPentaNotes = useMemo(() =>
    isSingleShapePan ? pentaNotes.filter(([s, f]) => panCovers(s, f)) : pentaNotes,
  [pentaNotes, isSingleShapePan, panCovers]);

  const svgW = MARGIN_LEFT + NUM_FRETS * FRET_SPACING + 25;
  const svgH = MARGIN_TOP + 5 * STRING_SPACING + 48;

  const triadLegend = triadQuality === "minor" ? LEGEND.triadMin : LEGEND.triadMaj;
  const pentaLegendKey = pentaScale === "off" ? "off"
    : pentaScale === "blues" ? `blues-${pentaQuality}`
    : pentaQuality;
  const triadLegendKey = showTriads ? triadQuality : "off";
  const PENTA_LEGEND = {
    off:             { off: [], major: [], minor: [] },
    major:           { off: LEGEND.pentaMajFull, major: LEGEND.pentaMaj, minor: LEGEND.pentaMajWithMin },
    minor:           { off: LEGEND.pentaMinFull, major: LEGEND.pentaMin, minor: LEGEND.pentaMinWithMaj },
    "blues-minor":   { off: LEGEND.bluesFull,    major: LEGEND.blues,    minor: LEGEND.bluesWithMaj },
    "blues-major":   { off: LEGEND.bluesMajFull, major: LEGEND.bluesMaj, minor: LEGEND.bluesMajWithMin },
  };
  const pentaLegend = PENTA_LEGEND[pentaLegendKey][triadLegendKey];

  const keyName = NOTES[effectiveKey];
  const footerKey = (() => {
    if (!showTriads) return showPenta ? `${keyName} ${scaleName(pentaScale, pentaQuality)}` : "";
    const base = triadQuality === "minor" ? `${keyName} Minor` : `${keyName} Major`;
    return showPenta ? `${base} · ${scaleName(pentaScale, pentaQuality)}` : base;
  })();

  const subtitle = (() => {
    const triadPart = triadQuality === "minor" ? "Minor Triads" : "Major Triads";
    return showPenta ? `${triadPart} · ${scaleName(pentaScale, pentaQuality)}` : triadPart;
  })();

  return (
    <div style={{ background: "linear-gradient(160deg, #0c1222 0%, #1a1040 50%, #0c1222 100%)",
      minHeight: "100vh", padding: "24px 16px", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", color: THEME.text.primary }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>

        <h1 style={{ textAlign: "center", fontSize: "2.5rem", fontWeight: 300, margin: "0 0 2px",
          letterSpacing: "0.25em", color: "#f1f5f9", fontFamily: "Georgia, 'Times New Roman', serif" }}>
          CAGED Explorer
        </h1>
        <button onClick={toggleAdvanced} title={advancedMode ? "Hide quality overrides" : "Show quality overrides"}
          style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer",
            fontSize: "1.3rem", color: advancedMode ? "#93c5fd" : THEME.text.dim, transition: "color 0.15s",
            opacity: advancedMode ? 1 : 0.6 }}>
          ⚙
        </button>
        <p style={{ textAlign: "center", fontSize: "0.62rem", color: THEME.text.muted, margin: "0 0 22px",
          letterSpacing: "0.28em", textTransform: "uppercase" }}>
          {subtitle}
        </p>

        {/* Key Selector: Major Row */}
        <div style={STYLE.keyRow(4)}>
          <span style={STYLE.rowLabel}>Major</span>
          {NOTES.map((n, i) => {
            const sel = keyIndex === i;
            return (
              <button key={n} onClick={() => { setKeyIndex(i); setIsMinorKey(false); if (!advancedMode) { setTriadQuality("major"); setPentaQuality("major"); } }}
                style={STYLE.keyBtn(sel && !isMinorKey, sel)}>
                {n}
              </button>
            );
          })}
        </div>

        {/* Key Selector: Minor Row */}
        <div style={STYLE.keyRow(20)}>
          <span style={STYLE.rowLabel}>Rel. Minor</span>
          {NOTES.map((_, i) => {
            const sel = keyIndex === i;
            return (
              <button key={i} onClick={() => { setKeyIndex(i); setIsMinorKey(true); if (!advancedMode) { setTriadQuality("minor"); setPentaQuality("minor"); } }}
                style={STYLE.minorKeyBtn(sel && isMinorKey, sel)}>
                {NOTES[(i + 9) % 12] + "m"}
              </button>
            );
          })}
        </div>

        {/* Shapes + Labels */}
        <div style={STYLE.optionRow(14)}>
          <span style={STYLE.optionLabel}>Shapes</span>
          {["off", ...SHAPES, "all"].map(s => {
            const label = s === "off" ? "Off" : s === "all" ? "All"
              : isMinorKey ? s + "m" : s;
            return (
              <ToggleButton key={s} label={label}
                active={activeShape === s} onClick={() => changeShape(s)} />
            );
          })}
          <span style={STYLE.divider}>│</span>
          <span style={STYLE.optionLabel}>Labels</span>
          {["intervals", "notes", "both"].map(m => (
            <ToggleButton key={m} label={m === "intervals" ? "Intervals" : m === "notes" ? "Notes" : "Both"}
              active={labelMode === m} onClick={() => setLabelMode(m)} />
          ))}
        </div>

        {/* Options Row: Triads + Pentatonic + Frying Pan */}
        <div style={STYLE.optionRow(22)}>
          <span style={STYLE.optionLabel}>Triads</span>
          <ToggleButton label="Off" active={!showTriads} onClick={() => setShowTriads(false)} />
          <ToggleButton label="On" active={showTriads} onClick={() => setShowTriads(true)} />
          {advancedMode && showTriads && (
            <>
              {["major", "minor"].map(q => (
                <ToggleButton key={q} label={q === "major" ? "Maj" : "Min"}
                  active={triadQuality === q} onClick={() => setTriadQuality(q)}
                  style={{ fontSize: "0.6rem", padding: "2px 7px" }} />
              ))}
            </>
          )}
          <span style={STYLE.divider}>│</span>
          <span style={STYLE.optionLabel}>Pentatonic</span>
          <ToggleButton label="Off" active={pentaScale === "off"} onClick={() => setPentaScale("off")} />
          <ToggleButton label="On" active={pentaScale === "pentatonic"} onClick={() => setPentaScale("pentatonic")} />
          <ToggleButton label="Blues" active={pentaScale === "blues"} onClick={() => setPentaScale("blues")} />
          {advancedMode && pentaScale !== "off" && (
            <>
              {["major", "minor"].map(q => (
                <ToggleButton key={q} label={q === "major" ? "Maj" : "Min"}
                  active={pentaQuality === q} onClick={() => setPentaQuality(q)}
                  style={{ fontSize: "0.6rem", padding: "2px 7px" }} />
              ))}
            </>
          )}
          <span style={STYLE.divider}>│</span>
          <span style={STYLE.optionLabel}>Frying Pan</span>
          <ToggleButton label="Off" active={!showFryingPan} onClick={() => setShowFryingPan(false)} />
          <ToggleButton label="On" active={showFryingPan} onClick={() => setShowFryingPan(true)} />
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

            {Array.from({ length: NUM_FRETS + 1 }, (_, i) => i).map(f =>
              <text key={f} x={f === 0 ? MARGIN_LEFT : noteX(f)} y={MARGIN_TOP + 5 * STRING_SPACING + 34}
                textAnchor="middle" fill={THEME.text.dim} fontSize={9} fontFamily="ui-monospace, monospace">{f}</text>
            )}

            {STR_NAMES.map((l, i) =>
              <text key={i} x={14} y={strY(6 - i) + 4} textAnchor="middle" fill={THEME.text.dim} fontSize={10} fontFamily="ui-monospace, monospace">{l}</text>
            )}

            {(showTriads || showPenta) && activeShape === "all" && (() => {
              const highlighted = new Set([...pinnedShapes, ...(hoveredShape ? [hoveredShape] : [])]);
              return SHAPES.filter(sh => highlighted.has(sh)).flatMap(sh =>
                shapeRanges[sh].map(({ lo, hi }, ci) => {
                  const x1 = noteX(lo) - FRET_SPACING * 0.48;
                  const x2 = noteX(hi) + FRET_SPACING * 0.48;
                  return <rect key={`${sh}-${ci}`} x={x1} y={MARGIN_TOP - 13} width={x2 - x1} height={5 * STRING_SPACING + 26} fill={THEME.shape[sh]} opacity={0.08} rx={3} />;
                })
              );
            })()}

            {(showTriads || showPenta) && showShapeDistinctions && visibleShapes.length > 0 && (
              <text x={9} y={MARGIN_TOP - 27} textAnchor="start" fill={THEME.text.dim} fontSize={9} fontWeight={700}>Shape:</text>
            )}

            {/* Hit rects for shape hover/click in all-view */}
            {(showTriads || showPenta) && activeShape === "all" && hoverRanges.map(({ shape, ci, hoverLo, hoverHi }) => {
              const x1 = noteX(hoverLo) - FRET_SPACING * 0.48;
              const x2 = noteX(hoverHi) + FRET_SPACING * 0.48;
              return <rect
                key={`hit-${shape}-${ci}`}
                x={x1}
                y={MARGIN_TOP - 38}
                width={x2 - x1}
                height={5 * STRING_SPACING + 26 + 38 - 13}
                fill="transparent"
                cursor="pointer"
                onMouseEnter={() => setHoveredShape(shape)}
                onMouseLeave={() => setHoveredShape(null)}
                onClick={() => toggleShapePin(shape)}
              />;
            })}

            {/* Shape labels */}
            {(showTriads || showPenta) && showShapeDistinctions && visibleShapes.flatMap(sh => {
              const lbl = isMinorKey ? sh + "m" : sh;
              const isActive = pinnedShapes.has(sh) || hoveredShape === sh;
              const isAllView = activeShape === "all";
              return shapeRanges[sh].map(({ lo, hi, partial }, ci) => {
                const avg = (lo + hi) / 2;
                const raw = avg < 0.5 ? MARGIN_LEFT - 16 : MARGIN_LEFT + (avg - 0.5) * FRET_SPACING;
                const cx = Math.max(raw, MARGIN_LEFT + 4);
                return <text
                  key={`${sh}-${ci}`}
                  x={cx}
                  y={MARGIN_TOP - 27}
                  textAnchor="middle"
                  fill={THEME.shape[sh]}
                  fontSize={10}
                  fontWeight={700}
                  opacity={partial ? 0.25 : (isAllView ? (isActive ? 1 : 0.6) : 1)}
                  style={!partial && isAllView ? { cursor: "pointer", textDecoration: pinnedShapes.has(sh) ? "underline" : "none" } : undefined}
                >{lbl}</text>;
              });
            })}

            {/* Frying-pan overlay - render behind notes */}
            {fryingPanShapes.map((pan, i) => {
              const panX1 = noteX(pan.panMinFret) - PENTA_RADIUS - 6;
              const panX2 = noteX(pan.panMaxFret) + PENTA_RADIUS + 6;
              const panY1 = strY(pan.upperStr) - 9;
              const panY2 = strY(pan.lowerStr) + 9;
              const handleY = strY(pan.handleString);

              // Handle extends from pan edge to the handle note
              let handleX1, handleX2;
              if (pan.handleDirection === "left") {
                handleX1 = pan.handleFret === 0 ? MARGIN_LEFT - 26 : noteX(pan.handleFret) - PENTA_RADIUS - 4;
                handleX2 = panX1;
              } else {
                handleX1 = panX2;
                handleX2 = noteX(pan.handleFret) + PENTA_RADIUS + 4;
              }

              const panColor = pan.handleDirection === "left"
                ? THEME.overlay.fryingPanLeft
                : THEME.overlay.fryingPanRight;

              return (
                <g key={`fp-${i}`}>
                  <rect
                    x={panX1} y={panY1}
                    width={panX2 - panX1} height={panY2 - panY1}
                    rx={7}
                    fill={panColor}
                    opacity={0.25}
                    stroke={panColor}
                    strokeWidth={0.8}
                    strokeOpacity={0.35}
                  />
                  <rect
                    x={handleX1} y={handleY - 4}
                    width={handleX2 - handleX1} height={8}
                    rx={4}
                    fill={panColor}
                    opacity={0.20}
                    stroke={panColor}
                    strokeWidth={0.6}
                    strokeOpacity={0.25}
                  />
                </g>
              );
            })}


            {displayPentaNotes.map(([s, f, interval], i) => (
              <FretDot key={`p${i}`} cx={noteX(f)} cy={strY(s)} radius={PENTA_RADIUS} interval={interval}
                keyIdx={effectiveKey} labelMode={labelMode} showNoteName={labelMode === "both" && f !== 0} />
            ))}

            {showMinTriad && visibleShapes.map(sh =>
              minTriads[sh].filter(([s, f]) => !isSingleShapePan || panCovers(s, f)).map(([s, f, interval], idx) => (
                  <FretDot key={`m-${sh}-${idx}`} cx={noteX(f)} cy={strY(s)} radius={TRIAD_RADIUS} interval={interval}
                    keyIdx={effectiveKey} labelMode={labelMode} shapeBorder={activeShape === "all" ? THEME.shape[sh] : null}
                    showNoteName={labelMode === "both" && f !== 0} />
                ))
            )}

            {showMajTriad && visibleShapes.map(sh =>
              majTriads[sh].filter(([s, f]) => !isSingleShapePan || panCovers(s, f)).map(([s, f, interval], idx) => (
                <FretDot key={`t-${sh}-${idx}`} cx={noteX(f)} cy={strY(s)} radius={TRIAD_RADIUS} interval={interval}
                  keyIdx={effectiveKey} labelMode={labelMode} shapeBorder={activeShape === "all" ? THEME.shape[sh] : null}
                  showNoteName={labelMode === "both" && f !== 0} />
              ))
            )}
          </svg>
        </div>

        {/* Bottom Section: Legend + Chord Diagrams */}
        <div style={{ display: "flex", alignItems: "stretch", marginTop: 20, gap: 16, flexWrap: "wrap" }}>
          {showTriads && (
            <div style={{ minWidth: 140, padding: "8px 12px", border: `1px solid ${THEME.border.subtle}`, borderRadius: 8 }}>
              <LegendSection title={triadQuality === "minor" ? "Minor Triad" : "Triad"}
                items={triadLegend} dotSize={20} keyIdx={effectiveKey} labelMode={labelMode} />
            </div>
          )}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
            {pentaLegend.length > 0 && (
              <div style={{ minWidth: 140, padding: "8px 12px", border: `1px solid ${THEME.border.subtle}`, borderRadius: 8 }}>
                <LegendSection title={scaleName(pentaScale, pentaQuality)} items={pentaLegend} dotSize={16}
                  keyIdx={effectiveKey} labelMode={labelMode} />
              </div>
            )}

            {showFryingPan && (
              <div style={{ minWidth: 140, padding: "8px 12px", border: `1px solid ${THEME.border.subtle}`, borderRadius: 8 }}>
                <div style={{ fontSize: "0.55rem", color: THEME.text.dim, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>
                  Frying Pan
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width={36} height={20} viewBox="0 0 36 20">
                      <rect x={10} y={2} width={16} height={16} rx={4} fill={THEME.overlay.fryingPanLeft} opacity={0.35} stroke={THEME.overlay.fryingPanLeft} strokeWidth={0.8} strokeOpacity={0.5} />
                      <rect x={2} y={7} width={8} height={6} rx={3} fill={THEME.overlay.fryingPanLeft} opacity={0.25} stroke={THEME.overlay.fryingPanLeft} strokeWidth={0.6} strokeOpacity={0.4} />
                    </svg>
                    <span style={{ fontSize: "0.74rem", color: THEME.text.secondary }}>Left-hand pan</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width={36} height={20} viewBox="0 0 36 20">
                      <rect x={10} y={2} width={16} height={16} rx={4} fill={THEME.overlay.fryingPanRight} opacity={0.35} stroke={THEME.overlay.fryingPanRight} strokeWidth={0.8} strokeOpacity={0.5} />
                      <rect x={26} y={7} width={8} height={6} rx={3} fill={THEME.overlay.fryingPanRight} opacity={0.25} stroke={THEME.overlay.fryingPanRight} strokeWidth={0.6} strokeOpacity={0.4} />
                    </svg>
                    <span style={{ fontSize: "0.74rem", color: THEME.text.secondary }}>Right-hand pan</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {pentaScale === "pentatonic" && pentaQuality === "minor" && (
            <p style={{ flexBasis: "100%", fontSize: "0.68rem", color: THEME.text.muted, lineHeight: 1.55, fontStyle: "italic", margin: 0, alignSelf: "center" }}>
              The ♭3 sits beside the major 3rd — the tension at the heart of the blues.
            </p>
          )}
          {pentaScale === "blues" && pentaQuality === "minor" && (
            <p style={{ flexBasis: "100%", fontSize: "0.68rem", color: THEME.text.muted, lineHeight: 1.55, fontStyle: "italic", margin: 0, alignSelf: "center" }}>
              The ♭5 squeezes between the 4th and 5th — a chromatic passing tone that gives the blues its grit.
            </p>
          )}
          {pentaScale === "blues" && pentaQuality === "major" && (
            <p style={{ flexBasis: "100%", fontSize: "0.68rem", color: THEME.text.muted, lineHeight: 1.55, fontStyle: "italic", margin: 0, alignSelf: "center" }}>
              The ♭3 bends into the major 3rd — adding soul to a major key.
            </p>
          )}

          {showTriads && (
            <div style={{ flexBasis: "100%", minWidth: 0 }}>
              {showMajTriad && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: showMinTriad ? 10 : 0 }}>
                  {((activeShape === "all" || activeShape === "off") ? SHAPES : [activeShape]).map(sh =>
                    <ChordDiagram key={sh} chord={CHORD_MAJ[sh]} shape={sh} accent={THEME.shape[sh]} keyIdx={effectiveKey} labelMode={labelMode} />
                  )}
                </div>
              )}
              {showMinTriad && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {((activeShape === "all" || activeShape === "off") ? SHAPES : [activeShape]).map(sh =>
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
            {activeShape === "off" ? "Full fretboard view" : activeShape === "all" ? "Five shapes connected across the fretboard" : `${activeShape} shape voicing`}
          </span>
        </div>
      </div>
    </div>
  );
}
