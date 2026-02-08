import { useState, useMemo } from "react";
import {
  generateScale, assignShapes, findShapes, posKey,
  NUM_FRETS, SCALE, SHAPE_ORDER, FRYING_PAN, SHAPE_ORIENTATION,
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
    fryingPan: "#d4b070",
  },
};

const FRET_SPACING   = 56;
const STRING_SPACING = 26;
const MARGIN_LEFT    = 52;
const MARGIN_TOP     = 38;
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


const MAJ_SEMI = SCALE.pentaMaj.map(d => d.semi);
const MIN_SEMI = SCALE.pentaMin.map(d => d.semi);

const groupByShape = (notes, lookup) => {
  const byShape = {};
  SHAPES.forEach(sh => { byShape[sh] = []; });
  notes.forEach(note => {
    const [s, f] = note;
    const shapes = lookup(s, f);
    if (shapes) shapes.forEach(sh => byShape[sh].push(note));
  });
  return byShape;
};

const fretX = (fret) => MARGIN_LEFT + fret * FRET_SPACING;
const noteX = (fret) => fret === 0 ? MARGIN_LEFT - 16 : MARGIN_LEFT + (fret - 0.5) * FRET_SPACING;
const strY = (str) => MARGIN_TOP + (str - 1) * STRING_SPACING;
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
  const [overlayMode, setOverlayMode] = useState("off");

  const effectiveKey = isMinorKey ? (column + 9) % 12 : column;
  const showMajTriad = triadMode === "major" || triadMode === "both";
  const showMinTriad = triadMode === "minor" || triadMode === "both";
  const anyTriad = triadMode !== "off";
  const showPenta = pentaMode !== "off";
  const visibleShapes = useMemo(() => activeShape === "all" ? SHAPES : [activeShape], [activeShape]);

  // Generate all scale notes and assign CAGED shapes via pentatonic positions
  const allMajTriadNotes = useMemo(() => generateScale(effectiveKey, SCALE.triadMaj), [effectiveKey]);
  const allMinTriadNotes = useMemo(() => generateScale(effectiveKey, SCALE.triadMin), [effectiveKey]);
  const allMajPentaNotes = useMemo(() => generateScale(effectiveKey, SCALE.pentaMaj), [effectiveKey]);
  const allMinPentaNotes = useMemo(() => generateScale(effectiveKey, SCALE.pentaMin), [effectiveKey]);
  const allBluesNotes = useMemo(() => generateScale(effectiveKey, SCALE.bluesAdd), [effectiveKey]);

  // Build separate shape maps for major and minor pentatonic
  const majShapeMap = useMemo(() => assignShapes(allMajPentaNotes, effectiveKey, MAJ_SEMI), [allMajPentaNotes, effectiveKey]);
  const minShapeMap = useMemo(() => assignShapes(allMinPentaNotes, effectiveKey, MIN_SEMI), [allMinPentaNotes, effectiveKey]);

  // Per-shape triad data: major triads use major shape map, minor triads use minor shape map
  const majTriads = useMemo(() => groupByShape(allMajTriadNotes, (s, f) => findShapes(majShapeMap, s, f)), [allMajTriadNotes, majShapeMap]);
  const minTriads = useMemo(() => groupByShape(allMinTriadNotes, (s, f) => findShapes(minShapeMap, s, f)), [allMinTriadNotes, minShapeMap]);

  // Per-shape pentatonic data
  const majPenta = useMemo(() => groupByShape(allMajPentaNotes, (s, f) => majShapeMap.get(posKey(s, f))), [allMajPentaNotes, majShapeMap]);
  const minPenta = useMemo(() => groupByShape(allMinPentaNotes, (s, f) => minShapeMap.get(posKey(s, f))), [allMinPentaNotes, minShapeMap]);

  const bluesNotes = useMemo(() => {
    const byShape = {};
    SHAPES.forEach(sh => { byShape[sh] = []; });
    allBluesNotes.forEach(note => {
      const [s, f] = note;
      // ♭5 sits between minor pentatonic 4 and 5. Assign via minor shape map
      // by finding the nearest pentatonic note at or below this fret.
      // If none found (♭5 at fret 0), wrap to the highest pentatonic note on
      // the string, which represents the end of the previous CAGED cycle.
      let bestShape = null;
      let bestFret = -1;
      let highestFret = -1;
      let highestShape = null;
      minShapeMap.forEach((shapes, key) => {
        const [ks, kf] = key.split("-").map(Number);
        if (ks === s) {
          if (kf <= f && kf > bestFret) {
            bestFret = kf;
            bestShape = shapes[0];
          }
          if (kf > highestFret) {
            highestFret = kf;
            highestShape = shapes[0];
          }
        }
      });
      const shape = bestShape || highestShape;
      if (shape) byShape[shape].push(note);
    });
    return byShape;
  }, [allBluesNotes, minShapeMap]);

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

  const showThreeTwoBars = overlayMode === "threeTwo";
  const showFryingPan = overlayMode === "fryingPan";

  // Frying pan geometry: shift static geometry by effectiveKey, filter to visible frets.
  // Shape is identical for major/minor pentatonic — determined only by effectiveKey.
  const fryingPanShapes = useMemo(() => {
    if (!showFryingPan) return [];
    const showLeft = activeShape === "all" || SHAPE_ORIENTATION[activeShape] === "left";
    const showRight = activeShape === "all" || SHAPE_ORIENTATION[activeShape] === "right";

    const shapes = [];
    const addShifted = (templates) => {
      templates.forEach(t => {
        const panMin = t.panMin + effectiveKey;
        const panMax = t.panMax + effectiveKey;
        const hFret = t.hFret + effectiveKey;
        // Keep if pan or handle is within visible fretboard
        const allFrets = [panMin, panMax, hFret];
        if (allFrets.some(f => f >= 0 && f <= NUM_FRETS)) {
          shapes.push({
            lowerStr: t.pair[0],
            upperStr: t.pair[1],
            panMinFret: panMin,
            panMaxFret: panMax,
            handleString: t.hStr,
            handleFret: hFret,
            handleDirection: t.hDir,
          });
        }
      });
    };

    if (showLeft) addShifted(FRYING_PAN.left);
    if (showRight) addShifted(FRYING_PAN.right);

    return shapes;
  }, [showFryingPan, activeShape, effectiveKey]);

  // 3:2 bars: derived from frying pan geometry.
  // Each frying pan produces a 3-note bar (handle string) and a 2-note bar (other string).
  const threeTwoBars = useMemo(() => {
    if (!showThreeTwoBars) return [];
    const showLeft = activeShape === "all" || SHAPE_ORIENTATION[activeShape] === "left";
    const showRight = activeShape === "all" || SHAPE_ORIENTATION[activeShape] === "right";

    const bars = [];
    const addBars = (templates) => {
      templates.forEach(t => {
        const panMin = t.panMin + effectiveKey;
        const panMax = t.panMax + effectiveKey;
        const hFret = t.hFret + effectiveKey;

        const otherStr = t.pair[0] === t.hStr ? t.pair[1] : t.pair[0];

        // 3-note bar: on handle string, spans from handle fret to far pan edge
        let bar3Min, bar3Max;
        if (t.hDir === "left") {
          bar3Min = hFret;
          bar3Max = panMax;
        } else {
          bar3Min = panMin;
          bar3Max = hFret;
        }

        // 2-note bar: on other string, spans pan frets
        const bar2Min = panMin;
        const bar2Max = panMax;

        // Only include bars within visible fretboard
        if (bar3Min >= 0 && bar3Max <= NUM_FRETS) {
          bars.push({ string: t.hStr, minFret: bar3Min, maxFret: bar3Max, type: 3 });
        }
        if (bar2Min >= 0 && bar2Max <= NUM_FRETS) {
          bars.push({ string: otherStr, minFret: bar2Min, maxFret: bar2Max, type: 2 });
        }
      });
    };

    if (showLeft) addBars(FRYING_PAN.left);
    if (showRight) addBars(FRYING_PAN.right);

    return bars;
  }, [showThreeTwoBars, activeShape, effectiveKey]);

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

        {/* Options Row 1: Triads + Labels */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>Triads</span>
          {["major", "minor", "both", "off"].map(m => (
            <ToggleButton key={m} label={m === "major" ? "Major" : m === "minor" ? "Minor" : m === "both" ? "Both" : "Off"}
              active={triadMode === m} onClick={() => setTriadMode(m)} />
          ))}
          <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 4px", fontSize: "0.8rem" }}>│</span>
          <span style={{ fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>Labels</span>
          {["intervals", "notes", "both"].map(m => (
            <ToggleButton key={m} label={m === "intervals" ? "Intervals" : m === "notes" ? "Notes" : "Both"}
              active={labelMode === m} onClick={() => setLabelMode(m)} />
          ))}
        </div>

        {/* Options Row 2: Pentatonic + Overlay */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>Pentatonic</span>
          {["off", "major", "minor", "blues"].map(m => (
            <ToggleButton key={m} label={m === "off" ? "Off" : m === "major" ? "Major" : m === "minor" ? "Minor" : "Blues"}
              active={pentaMode === m} onClick={() => setPentaMode(m)} accent={m !== "off" && pentaMode === m} />
          ))}
          <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 4px", fontSize: "0.8rem" }}>│</span>
          <span style={{ fontSize: "0.56rem", color: THEME.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" }}>Overlay</span>
          {["off", "fryingPan", "threeTwo"].map(m => (
            <ToggleButton key={m} label={m === "off" ? "Off" : m === "fryingPan" ? "Frying Pan" : "3:2"}
              active={overlayMode === m} onClick={() => setOverlayMode(m)} accent={m !== "off" && overlayMode === m} />
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

              return (
                <g key={`fp-${i}`}>
                  <rect
                    x={panX1} y={panY1}
                    width={panX2 - panX1} height={panY2 - panY1}
                    rx={7}
                    fill={THEME.overlay.fryingPan}
                    opacity={0.25}
                    stroke={THEME.overlay.fryingPan}
                    strokeWidth={0.8}
                    strokeOpacity={0.35}
                  />
                  <rect
                    x={handleX1} y={handleY - 4}
                    width={handleX2 - handleX1} height={8}
                    rx={4}
                    fill={THEME.overlay.fryingPan}
                    opacity={0.20}
                    stroke={THEME.overlay.fryingPan}
                    strokeWidth={0.6}
                    strokeOpacity={0.25}
                  />
                </g>
              );
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

            {showFryingPan && (
              <>
                <div style={{ fontSize: "0.55rem", color: THEME.text.dim, textTransform: "uppercase", letterSpacing: "0.2em", margin: "14px 0 8px" }}>
                  Frying Pan
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width={36} height={20} viewBox="0 0 36 20">
                      <rect x={10} y={2} width={16} height={16} rx={4} fill={THEME.overlay.fryingPan} opacity={0.35} stroke={THEME.overlay.fryingPan} strokeWidth={0.8} strokeOpacity={0.5} />
                      <rect x={26} y={7} width={8} height={6} rx={3} fill={THEME.overlay.fryingPan} opacity={0.25} stroke={THEME.overlay.fryingPan} strokeWidth={0.6} strokeOpacity={0.4} />
                    </svg>
                    <span style={{ fontSize: "0.74rem", color: THEME.text.secondary }}>5-note group across 2 strings</span>
                  </div>
                </div>
                {activeShape !== "all" && (
                  <div style={{ fontSize: "0.62rem", color: THEME.text.muted, marginTop: 6, fontStyle: "italic" }}>
                    {SHAPE_ORIENTATION[activeShape] === "left" ? "Left-hand" : "Right-hand"} orientation ({activeShape} shape)
                  </div>
                )}
              </>
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
