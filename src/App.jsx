import { Fragment, useState, useMemo, useEffect, useRef } from "react";
import {
  posKey, shiftNotes, clusterFrets, computeHoverRanges, noteName,
  NUM_FRETS, SHAPE_ORDER, FRYING_PAN, NOTES, FRET_X, FRET_W, fretXAt, fretWAt,
  PENTA_BOX, TRIAD_SHAPE, BLUES_SHAPE, SHAPE_FRET_RANGES,
  CHORD_MAJ, CHORD_MIN,
} from "./music.js";

/**
 * CAGED System Explorer
 * An interactive fretboard visualization tool for learning the CAGED system on guitar.
 */

function useIsMobile(maxWidth) {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= maxWidth
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = (e) => setMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [maxWidth]);
  return mobile;
}

const STR_NAMES = ["E", "A", "D", "G", "B", "e"];

const THEME_COMMON = {
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
  overlay: {
    fryingPanLeft: "#d4b070",
    fryingPanRight: "#c0a0d0",
  },
};

const THEME_DARK = {
  ...THEME_COMMON,
  bg: {
    page:      "linear-gradient(160deg, #0c1222 0%, #1a1040 50%, #0c1222 100%)",
    panel:     "rgba(10,15,30,0.5)",
    modal:     "#141828",
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
    heading:   "#f1f5f9",
    footer:    "#334155",
  },
  glow: {
    soft:   "rgba(255,255,255,0.08)",
    medium: "rgba(255,255,255,0.1)",
  },
  stroke: {
    light:  "rgba(255,255,255,0.25)",
    medium: "rgba(255,255,255,0.3)",
  },
  accent: {
    blue: "#93c5fd",
  },
  fretboard: {
    gradientTop: "#3b2507",
    gradientBottom: "#261803",
    markerDot: "#4a5568",
    shadow: "inset 0 0 40px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)",
    fretLine: "#334155",
    shapeHighlight: 0.08,
  },
  btn: {
    activeBg: "#f1f5f9",
    activeText: "#0f172a",
    activeBorder: "#f1f5f9",
    selectedBg: "rgba(241,245,249,0.15)",
    selectedBorder: "rgba(241,245,249,0.25)",
  },
  minorBtn: {
    activeBg: "rgba(210,170,140,0.25)",
    activeText: "#d8ac90",
    activeBorder: "rgba(210,170,140,0.4)",
    selectedBg: "rgba(210,170,140,0.1)",
    selectedText: "#8a7060",
    selectedBorder: "rgba(210,170,140,0.15)",
    defaultText: "#4a5568",
  },
  divider: "rgba(255,255,255,0.1)",
};

const THEME_LIGHT = {
  ...THEME_COMMON,
  bg: {
    panel: "rgba(180,160,130,0.15)",
    modal: "#f5ebe0",
    card: "rgba(245,235,220,0.6)",
    btnOff: "rgba(0,0,0,0.04)",
    btnOn: "rgba(0,0,0,0.08)",
    btnAccent: "rgba(59,130,246,0.12)",
    page: "linear-gradient(160deg, #f5ebe0 0%, #ede0d0 50%, #f5ebe0 100%)",
  },
  border: {
    subtle: "rgba(120,90,60,0.1)",
    light: "rgba(120,90,60,0.15)",
    medium: "rgba(120,90,60,0.2)",
    accent: "rgba(59,130,246,0.3)",
  },
  text: {
    primary: "#2a2018",
    secondary: "#6a5f50",
    muted: "#8a7f70",
    dim: "#a09585",
    dark: "#1a1030",
    heading: "#2a2018",
    footer: "#a09585",
  },
  glow: {
    soft: "rgba(0,0,0,0.06)",
    medium: "rgba(0,0,0,0.08)",
  },
  stroke: {
    light: "rgba(0,0,0,0.15)",
    medium: "rgba(0,0,0,0.2)",
  },
  accent: {
    blue: "#2563eb",
  },
  fretboard: {
    gradientTop: "#d4b896",
    gradientBottom: "#c4a880",
    markerDot: "#b8a890",
    shadow: "inset 0 0 30px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.1)",
    fretLine: "#a09080",
    shapeHighlight: 0.2,
  },
  btn: {
    activeBg: "#2a2018",
    activeText: "#f5ebe0",
    activeBorder: "#2a2018",
    selectedBg: "rgba(42,32,24,0.1)",
    selectedBorder: "rgba(42,32,24,0.2)",
  },
  minorBtn: {
    activeBg: "rgba(180,130,90,0.2)",
    activeText: "#8a6030",
    activeBorder: "rgba(180,130,90,0.4)",
    selectedBg: "rgba(180,130,90,0.08)",
    selectedText: "#8a7060",
    selectedBorder: "rgba(180,130,90,0.15)",
    defaultText: "#8a7f70",
  },
  divider: "rgba(0,0,0,0.12)",
};

const STRING_SPACING = 26;
const MARGIN_LEFT    = 52;
const MARGIN_TOP     = 38;
const TRIAD_RADIUS   = 10;
const PENTA_RADIUS   = 8;

// Mobile (vertical) fretboard layout: nut at top, frets descending
// Uniform fret spacing on mobile — proportional spacing wastes vertical space
const STRING_SPACING_M = 42;
const MARGIN_LEFT_M    = 55;   // space for fret numbers + shape labels on left
const MARGIN_TOP_M     = 58;   // space for string names + open-string notes at top
const FRET_SPACING_M   = 56;   // uniform fret width (same total as proportional)
const FRET_TOTAL_M     = NUM_FRETS * FRET_SPACING_M;

const fretY  = (fret) => MARGIN_TOP_M + fret * FRET_SPACING_M;
const noteY  = (fret) => fret === 0 ? MARGIN_TOP_M - 20 : MARGIN_TOP_M + (fret - 0.5) * FRET_SPACING_M;
const strX   = (str)  => MARGIN_LEFT_M + (6 - str) * STRING_SPACING_M;

// Shared layout styles extracted from JSX
const makeStyles = (theme) => ({
  keyRow: (mb) => ({ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: mb, flexWrap: "wrap" }),
  rowLabel: { fontSize: "0.58rem", color: theme.text.dim, letterSpacing: "0.2em", textTransform: "uppercase", marginRight: 8, minWidth: 72, textAlign: "right" },
  optionRow: (mb) => ({ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: mb, flexWrap: "wrap" }),
  optionLabel: { fontSize: "0.56rem", color: theme.text.dim, letterSpacing: "0.15em", textTransform: "uppercase" },
  divider: { color: theme.divider, margin: "0 4px", fontSize: "0.8rem" },
  keyBtn: (active, sel) => ({
    borderRadius: 5, padding: "4px 10px", fontSize: "0.75rem", fontWeight: sel ? 700 : 400,
    cursor: "pointer", transition: "all 0.15s", minWidth: 38, textAlign: "center",
    background: active ? theme.btn.activeBg : sel ? theme.btn.selectedBg : theme.bg.btnOff,
    color: active ? theme.btn.activeText : sel ? theme.text.secondary : theme.text.muted,
    border: `1px solid ${active ? theme.btn.activeBorder : sel ? theme.btn.selectedBorder : theme.border.light}`,
  }),
  minorKeyBtn: (active, sel) => ({
    borderRadius: 5, padding: "4px 6px", fontSize: "0.68rem", fontWeight: sel ? 700 : 400,
    cursor: "pointer", transition: "all 0.15s", minWidth: 38, textAlign: "center",
    background: active ? theme.minorBtn.activeBg : sel ? theme.minorBtn.selectedBg : theme.bg.btnOff,
    color: active ? theme.minorBtn.activeText : sel ? theme.minorBtn.selectedText : theme.minorBtn.defaultText,
    border: `1px solid ${active ? theme.minorBtn.activeBorder : sel ? theme.minorBtn.selectedBorder : theme.border.light}`,
  }),
});


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

// Legend entries keyed by [scaleType][triadQuality]: when triads are visible,
// the legend omits intervals already shown by the triad dots.
const PENTA_LEGEND = {
  off:             { off: [], major: [], minor: [] },
  major:           { off: LEGEND.pentaMajFull, major: LEGEND.pentaMaj, minor: LEGEND.pentaMajWithMin },
  minor:           { off: LEGEND.pentaMinFull, major: LEGEND.pentaMin, minor: LEGEND.pentaMinWithMaj },
  "blues-minor":   { off: LEGEND.bluesFull,    major: LEGEND.blues,    minor: LEGEND.bluesWithMaj },
  "blues-major":   { off: LEGEND.bluesMajFull, major: LEGEND.bluesMaj, minor: LEGEND.bluesMajWithMin },
};

const scaleName = (scaleMode, pentaQuality) => {
  if (scaleMode === "off") return "";
  if (scaleMode === "blues") return pentaQuality === "major" ? "Major Blues" : "Blues Scale";
  return pentaQuality === "major" ? "Major Pentatonic" : "Minor Pentatonic";
};

const fretX = (fret) => MARGIN_LEFT + FRET_X[fret];
const noteX = (fret) => fret === 0 ? MARGIN_LEFT - 16 : MARGIN_LEFT + (fretXAt(fret - 1) + fretXAt(fret)) / 2;
const strY = (str) => MARGIN_TOP + (str - 1) * STRING_SPACING;
function PillToggle({ on, onToggle, theme }) {
  return (
    <button onClick={onToggle} aria-pressed={on} style={{
      width: 36, height: 18, borderRadius: 9, border: `1px solid ${on ? theme.border.accent : theme.border.light}`,
      cursor: "pointer",
      background: on ? theme.bg.btnAccent : theme.bg.btnOff,
      position: "relative", transition: "all 0.15s", padding: 0,
    }}>
      <span style={{
        position: "absolute", top: 1, left: on ? 19 : 1,
        width: 14, height: 14, borderRadius: "50%",
        background: on ? theme.accent.blue : theme.text.dim,
        transition: "left 0.15s, background 0.15s",
      }} />
    </button>
  );
}
function ToggleButton({ label, active, onClick, style = {}, theme }) {
  const bg = active ? theme.bg.btnAccent : theme.bg.btnOff;
  const color = active ? theme.accent.blue : theme.text.dim;
  const border = active ? theme.border.accent : theme.border.subtle;

  return (
    <button onClick={onClick} aria-pressed={active} style={{
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 5, padding: "3px 10px", fontSize: "0.7rem",
      cursor: "pointer", transition: "all 0.15s", ...style,
    }}>
      {label}
    </button>
  );
}

function FretDot({ cx, cy, radius, interval, keyIdx, labelMode, shapeBorder, fret = 1, theme }) {
  const color = theme.interval[interval];
  const note = noteName(interval, keyIdx);
  const primary = labelMode === "notes" ? note : interval;
  const secondary = labelMode === "notes" ? interval : note;
  const isLong = primary.length > 1;
  const isTriad = radius === TRIAD_RADIUS;

  return (
    <g>
      <circle cx={cx} cy={cy} r={radius + (isTriad ? 4 : 3)} fill={theme.glow[isTriad ? "medium" : "soft"]} />
      <circle cx={cx} cy={cy} r={radius} fill={color} stroke={shapeBorder || theme.stroke.medium}
        strokeWidth={shapeBorder ? 2.5 : (isTriad ? 1 : 0.7)} strokeDasharray="none" />
      <text x={cx} y={cy + (isTriad ? 3.5 : 3)} textAnchor="middle" fill={theme.text.dark}
        fontSize={isLong ? (isTriad ? 8 : 6) : (isTriad ? 10 : 8)} fontWeight={isTriad ? 700 : 600}>
        {primary}
      </text>
      {fret !== 0 && (
        <text x={cx + radius + 2} y={cy + radius + 2} textAnchor="start" fill={theme.text.secondary}
          fontSize={isTriad ? 7 : 6.5} fontWeight={500}>
          {secondary}
        </text>
      )}
    </g>
  );
}

function LegendSection({ title, items, dotSize, mt = 0, keyIdx, labelMode, theme }) {
  return (
    <>
      <div style={{ fontSize: "0.55rem", color: theme.text.dim, textTransform: "uppercase",
        letterSpacing: "0.2em", marginBottom: 8, marginTop: mt }}>
        {title}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {items.map(([interval, label]) => {
          const note = noteName(interval, keyIdx);
          const dotLabel = labelMode === "notes" ? note : interval;
          const textLabel = labelMode === "notes" ? `${label} · ${interval}` : `${label} · ${note}`;
          return (
            <div key={interval} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: theme.interval[interval],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: dotSize < 18 ? 6 : (dotLabel.length > 1 ? 7 : 9), fontWeight: 700, color: theme.text.dark }}>
                {dotLabel}
              </div>
              <span style={{ fontSize: "0.74rem", color: theme.text.secondary }}>{textLabel}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ChordDiagram({ chord, shape, accent, keyIdx, labelMode, italic = false, theme }) {
  const STR_GAP = 16, FRET_GAP = 18, LEFT = 20, TOP = 26;
  const numericFrets = chord.frets.filter(x => typeof x === "number");
  const maxF = numericFrets.length ? Math.max(...numericFrets, 3) : 3;
  const nf = Math.max(4, maxF + 1);
  const W = LEFT + 5 * STR_GAP + 18;
  const H = TOP + nf * FRET_GAP + 10;
  const getLabel = (interval) => interval ? (labelMode === "notes" ? noteName(interval, keyIdx) : interval) : null;

  return (
    <div style={{ background: theme.bg.card, borderRadius: 8, padding: "8px 5px 4px", border: `1px solid ${accent}25` }}>
      <div style={{ textAlign: "center", fontSize: "0.64rem", fontWeight: 700, color: accent,
        letterSpacing: "0.06em", marginBottom: 3, fontStyle: italic ? "italic" : "normal" }}>
        {shape}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W * 1.15} height={H * 1.15}>
        <rect x={LEFT - 1} y={TOP} width={5 * STR_GAP + 2} height={2.5} rx={1} fill={theme.text.secondary} />
        {Array.from({ length: nf }, (_, i) => i + 1).map(f =>
          <line key={f} x1={LEFT} y1={TOP + f * FRET_GAP} x2={LEFT + 5 * STR_GAP} y2={TOP + f * FRET_GAP} stroke={theme.fretboard.fretLine} strokeWidth={0.7} />
        )}
        {[0, 1, 2, 3, 4, 5].map(i =>
          <line key={i} x1={LEFT + i * STR_GAP} y1={TOP} x2={LEFT + i * STR_GAP} y2={TOP + nf * FRET_GAP} stroke={theme.text.dim} strokeWidth={0.6} />
        )}
        {chord.frets.map((fret, i) => {
          const x = LEFT + i * STR_GAP;
          const interval = chord.intervals[i];
          const c = interval ? theme.interval[interval] : theme.text.secondary;
          const label = getLabel(interval);
          const lSize = label && label.length > 1 ? 5 : 6;
          if (fret === "x") {
            return <text key={i} x={x} y={TOP - 7} textAnchor="middle" fill={theme.text.dim} fontSize={9} fontWeight={700}>✕</text>;
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
              <circle cx={x} cy={cy} r={6.5} fill={c} stroke={theme.stroke.light} strokeWidth={0.6} />
              <text x={x} y={cy + 2.8} textAnchor="middle" fill={theme.text.dark} fontSize={lSize} fontWeight={700}>{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HelpPanel({ isOpen, onClose, theme }) {
  const heading = { fontSize: "0.78rem", fontWeight: 700, margin: "20px 0 8px",
    letterSpacing: "0.15em", textTransform: "uppercase", color: theme.text.dim };
  const para = { margin: "0 0 8px" };
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
      zIndex: 1000,
      opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none",
      transition: "opacity 0.3s"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 380, maxWidth: "100vw",
        background: theme.bg.modal, border: `1px solid ${theme.border.subtle}`,
        borderRadius: "12px 0 0 12px",
        padding: "24px 14px 24px 24px", overflow: "hidden",
        display: "flex", flexDirection: "column",
        color: theme.text.primary, lineHeight: 1.7, fontSize: "0.88rem",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 8, left: 8, background: "none",
          border: "none", cursor: "pointer", fontSize: "1.2rem",
          color: theme.text.dim, opacity: 0.7, zIndex: 1
        }}>&times;</button>
        <div className="themed-scroll" style={{ overflowY: "auto", paddingRight: 12, minHeight: 0 }}>
        <h3 style={{ ...heading, marginTop: 0 }}>The Map</h3>
        <p style={para}>
          The guitar fretboard can feel like an unmapped country &mdash; six strings,
          dozens of frets, and no obvious landmarks. Like any explorer, you need
          a map. But a map of every note on every fret is almost as overwhelming
          as the fretboard itself. What you really need are landmarks.
        </p>

        <h3 style={heading}>The Landmarks</h3>
        <p style={para}>
          The CAGED system gives you five: the open chord shapes C, A, G, E,
          and D &mdash; the &ldquo;cowboy chords&rdquo; most guitarists learn first.
          These familiar shapes are your reference points.
        </p>
        <p style={para}>
          Pick a shape &mdash; any shape &mdash; and poke around. You&rsquo;ll
          see it&rsquo;s built from triads: three-note clusters on adjacent
          strings. A root, a third, a fifth. Flip between major and minor and
          watch the third drop &mdash; it&rsquo;s easiest to spot with E, A,
          and D.
        </p>
        <p style={para}>
          Now change the key and watch your shape slide up the neck.
          Congratulations, you&rsquo;ve just discovered barre chords. The G
          and D shapes are harder to barre physically, but the concept still
          applies.
        </p>

        <h3 style={heading}>Expanding the Territory</h3>
        <p style={para}>
          Each shape is really a skeleton. Flesh it out with two more notes and
          you&rsquo;ve got a pentatonic box. Five shapes, five boxes &mdash; one
          for each. Throw in the blue note and suddenly you&rsquo;re playing
          blues.
        </p>
        <p style={para}>
          Switch to &ldquo;All&rdquo; and step back. The whole fretboard is just
          five interlocking shapes, repeating up the neck.
        </p>

        <h3 style={heading}>Connecting the Shapes</h3>
        <p style={para}>
          So far you&rsquo;ve been thinking in vertical slices. Turn on the
          frying pan overlay and something surprising happens &mdash; just two
          little pan shapes tile across the entire fretboard, cutting right
          through the CAGED boundaries. Hover over the shape regions and watch
          the two systems overlap.
        </p>
        <p style={para}>
          And if you ever get lost up the neck, just look for the nearest
          landmark. It&rsquo;s never far.
        </p>

        <h3 style={heading}>Putting the Map Away</h3>
        <p style={para}>
          The CAGED system is a map, not a destination. As you play more,
          you&rsquo;ll internalize the shapes and hear the intervals without
          thinking. One day you&rsquo;ll realize you haven&rsquo;t opened this
          in months. That&rsquo;s not failure &mdash; that&rsquo;s the whole point.
        </p>
        <p style={{ margin: 0 }}>
          You&rsquo;ve outgrown the map. Time to explore harmony and melody on
          your own terms &mdash; perhaps with a Modal or Arpeggio Explorer?
        </p>
      </div>
      </div>
    </div>
  );
}

export default function CAGEDExplorer() {
  const [keyIndex, setKeyIndex] = useState(0);
  const [isMinorKey, setIsMinorKey] = useState(false);
  const [activeShape, setActiveShape] = useState("C");
  const [showTriads, setShowTriads] = useState(true);
  const [scaleMode, setPentaScale] = useState("off");
  const [triadQuality, setTriadQuality] = useState("major");
  const [pentaQuality, setPentaQuality] = useState("major");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [labelMode, setLabelMode] = useState("intervals");
  const [showFryingPan, setShowFryingPan] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTouchRef = useRef(null);

  const [hoveredShape, setHoveredShape] = useState(null);
  const isMobile = useIsMobile(639);
  const menuOpen = isMobile && showMenu;

  const [themeMode, setThemeMode] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "light" || saved === "dark") return saved;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    return "dark";
  });

  const theme = themeMode === "light" ? THEME_LIGHT : THEME_DARK;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e) => {
      if (!localStorage.getItem("theme")) {
        setThemeMode(e.matches ? "light" : "dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = themeMode;
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  const toggleTheme = () => {
    const next = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    localStorage.setItem("theme", next);
  };
  const STYLE = useMemo(() => makeStyles(theme), [theme]);

  const changeShape = (s) => {
    setActiveShape(s);
    if (s !== "all") setShowFryingPan(false);
  };

  const effectiveKey = isMinorKey ? (keyIndex + 9) % 12 : keyIndex;
  const showMajTriad = showTriads && triadQuality === "major";
  const showMinTriad = showTriads && triadQuality === "minor";
  const showPenta = scaleMode !== "off";
  const showShapeDistinctions = activeShape !== "off";

  const toggleAdvanced = () => {
    if (advancedMode) {
      const q = isMinorKey ? "minor" : "major";
      setTriadQuality(q);
      setPentaQuality(q);
    }
    setAdvancedMode(!advancedMode);
  };
  const visibleShapes = useMemo(() => (activeShape === "all" || activeShape === "off") ? SHAPE_ORDER : [activeShape], [activeShape]);

  // Per-shape triad notes — shift static data by effectiveKey
  const majTriads = useMemo(() => {
    if (!showTriads || triadQuality !== "major") return {};
    const byShape = {};
    visibleShapes.forEach(sh => { byShape[sh] = shiftNotes(TRIAD_SHAPE.major[sh], effectiveKey); });
    return byShape;
  }, [visibleShapes, effectiveKey, showTriads, triadQuality]);

  const minTriads = useMemo(() => {
    if (!showTriads || triadQuality !== "minor") return {};
    const byShape = {};
    visibleShapes.forEach(sh => { byShape[sh] = shiftNotes(TRIAD_SHAPE.minor[sh], effectiveKey); });
    return byShape;
  }, [visibleShapes, effectiveKey, showTriads, triadQuality]);

  // Per-shape pentatonic notes (used by pentatonic display and frying pan filtering)
  const majPenta = useMemo(() => {
    if (scaleMode === "off" && !showFryingPan) return {};
    const byShape = {};
    visibleShapes.forEach(sh => { byShape[sh] = shiftNotes(PENTA_BOX.major[sh], effectiveKey); });
    return byShape;
  }, [visibleShapes, effectiveKey, scaleMode, showFryingPan]);

  const minPenta = useMemo(() => {
    if (scaleMode === "off" && !showFryingPan) return {};
    const byShape = {};
    visibleShapes.forEach(sh => { byShape[sh] = shiftNotes(PENTA_BOX.minor[sh], effectiveKey); });
    return byShape;
  }, [visibleShapes, effectiveKey, scaleMode, showFryingPan]);

  // Per-shape blues notes (minor: ♭5, major: ♭3)
  const bluesNotes = useMemo(() => {
    if (scaleMode !== "blues") return {};
    const byShape = {};
    visibleShapes.forEach(sh => { byShape[sh] = shiftNotes(BLUES_SHAPE[pentaQuality][sh], effectiveKey); });
    return byShape;
  }, [visibleShapes, effectiveKey, pentaQuality, scaleMode]);

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
    const q0 = rangeQualities[0];
    SHAPE_ORDER.forEach(sh => {
      const noteSets = (q) => [
        ...(showTriads ? TRIAD_SHAPE[q][sh] : []),
        ...(showPenta ? PENTA_BOX[q][sh] : []),
      ];
      const allNotes = rangeQualities.flatMap(noteSets);
      const shifted = shiftNotes(allNotes, effectiveKey);
      const frets = shifted.map(([, f]) => f);
      // Canonical span from same note types at ek=0, used for partial detection.
      const canClusters = clusterFrets(noteSets(q0).map(([, f]) => f));
      const canSpan = canClusters.length > 0 ? canClusters[0].hi - canClusters[0].lo : 0;
      ranges[sh] = clusterFrets(frets).map(c => ({
        ...c,
        partial: (c.hi - c.lo) < canSpan * 0.7,
      }));
    });
    return ranges;
  }, [effectiveKey, rangeQualities, showTriads, showPenta]);

  const hoverRanges = useMemo(
    () => computeHoverRanges(shapeRanges, SHAPE_ORDER),
    [shapeRanges]
  );

  const pentaData = scaleMode === "off" ? null : (pentaQuality === "major" ? majPenta : minPenta);

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
      if (scaleMode === "blues") {
        // Bound blues notes to within 1 fret of the shape's pentatonic clusters
        const clusterSource = pentaQuality === "major" ? majPenta : minPenta;
        const pentaFrets = (clusterSource[sh] || []).map(([, f]) => f);
        const clusters = clusterFrets(pentaFrets);
        (bluesNotes[sh] || []).forEach(([s, f, interval]) => {
          const key = posKey(s, f);
          const inRange = clusters.some(c => f >= c.lo - 1 && f <= c.hi + 1);
          if (inRange && !seen.has(key) && !triadPositions.has(key)) { seen.add(key); out.push([s, f, interval]); }
        });
      }
    });
    return out;
  }, [pentaData, bluesNotes, majPenta, minPenta, visibleShapes, triadPositions, scaleMode, pentaQuality]);


  // Frying pan geometry: shift static geometry by keyIndex (not effectiveKey,
  // since minor pentatonic clusters are offset 3 semitones from relative major).
  // Only available in "all" shapes mode.
  const fryingPanShapes = useMemo(() => {
    if (!showFryingPan || activeShape !== "all") return [];

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

    return shapes;
  }, [showFryingPan, activeShape, keyIndex]);

  const svgW = MARGIN_LEFT + FRET_X[NUM_FRETS] + 25;
  const svgH = MARGIN_TOP + 5 * STRING_SPACING + 48;

  const svgW_M = MARGIN_LEFT_M + 5 * STRING_SPACING_M + 25;
  const svgH_M = MARGIN_TOP_M + FRET_TOTAL_M + 20;

  const triadLegend = triadQuality === "minor" ? LEGEND.triadMin : LEGEND.triadMaj;
  const pentaLegendKey = scaleMode === "off" ? "off"
    : scaleMode === "blues" ? `blues-${pentaQuality}`
    : pentaQuality;
  const triadLegendKey = showTriads ? triadQuality : "off";
  const pentaLegend = PENTA_LEGEND[pentaLegendKey][triadLegendKey];

  const keyName = NOTES[effectiveKey];
  const footerKey = (() => {
    if (!showTriads) return showPenta ? `${keyName} ${scaleName(scaleMode, pentaQuality)}` : "";
    const base = triadQuality === "minor" ? `${keyName} Minor` : `${keyName} Major`;
    return showPenta ? `${base} · ${scaleName(scaleMode, pentaQuality)}` : base;
  })();

  const subtitle = (() => {
    const triadPart = triadQuality === "minor" ? "Minor Triads" : "Major Triads";
    return showPenta ? `${triadPart} · ${scaleName(scaleMode, pentaQuality)}` : triadPart;
  })();

  const sheetSummary = (() => {
    const parts = [];
    const kn = isMinorKey ? NOTES[(keyIndex + 9) % 12] + " Min" : NOTES[keyIndex] + " Maj";
    parts.push(kn);
    if (activeShape === "all") parts.push("All Shapes");
    else if (activeShape === "off") parts.push("No Shape");
    else parts.push((isMinorKey ? activeShape + "m" : activeShape) + " Shape");
    if (showTriads) parts.push("Triads");
    if (scaleMode === "pentatonic") parts.push("Pentatonic");
    else if (scaleMode === "blues") parts.push("Blues");
    return parts.join(" \u00b7 ");
  })();

  return (
    <div style={{ background: theme.bg.page,
      minHeight: "100vh", padding: isMobile ? "12px 4px 52px" : "24px 16px", boxSizing: "border-box", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", color: theme.text.primary }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>

        <img src={`${import.meta.env.BASE_URL}logo.svg`} width={isMobile ? 32 : 80} height={isMobile ? 32 : 80} alt=""
          style={{ position: "absolute", top: isMobile ? 2 : -4, left: isMobile ? 8 : 0, opacity: 0.85 }} />
        <h1 style={{ textAlign: "center", fontSize: isMobile ? "1.4rem" : "2.5rem", fontWeight: 300, margin: "0 0 2px",
          letterSpacing: "0.25em", color: theme.text.heading, fontFamily: "Georgia, 'Times New Roman', serif" }}>
          CAGED Explorer
        </h1>
        {isMobile ? (
          <div style={{ position: "absolute", top: 4, right: 8 }}>
            <button onClick={() => setShowMenu(m => !m)} title="Menu"
              style={{ background: "none", border: "none", cursor: "pointer",
                fontSize: "1.4rem", color: theme.text.dim, opacity: 0.7 }}>
              ☰
            </button>
            {menuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowMenu(false)} />
                <div style={{ position: "absolute", top: 32, right: 0, zIndex: 100,
                  background: theme.bg.modal, border: `1px solid ${theme.border.subtle}`,
                  borderRadius: 8, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
                  <button onClick={() => { setShowHelp(true); setShowMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
                      cursor: "pointer", color: theme.text.primary, fontSize: "0.82rem", padding: "4px 0" }}>
                    <span style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}>?</span> About
                  </button>
                  <button onClick={() => { toggleTheme(); setShowMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
                      cursor: "pointer", color: theme.text.primary, fontSize: "0.82rem", padding: "4px 0" }}>
                    {themeMode === "dark" ? "☀" : "☾"} Theme
                  </button>
                  <a href="https://github.com/tartansandal/caged-explorer" target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
                      cursor: "pointer", color: theme.text.primary, fontSize: "0.82rem", padding: "4px 0", textDecoration: "none" }}>
                    <svg width={14} height={14} viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    GitHub
                  </a>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setShowHelp(true)} title="About CAGED Explorer"
              style={{ background: "none", border: "none", cursor: "pointer",
                fontSize: "1.3rem", fontWeight: 600, color: theme.text.dim, transition: "color 0.15s", opacity: 0.7, fontFamily: "Georgia, serif" }}>
              ?
            </button>
            <a href="https://github.com/tartansandal/caged-explorer" target="_blank" rel="noopener noreferrer"
              title="View on GitHub"
              style={{ background: "none", border: "none", cursor: "pointer",
                color: theme.text.dim, transition: "color 0.15s", opacity: 0.7, display: "inline-flex" }}>
              <svg width={18} height={18} viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </a>
            <button onClick={toggleTheme} title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{ background: "none", border: "none", cursor: "pointer",
                fontSize: "1.4rem", color: theme.text.dim, transition: "color 0.15s", opacity: 0.7 }}>
              {themeMode === "dark" ? "☀" : "☾"}
            </button>
          </div>
        )}
        <p style={{ textAlign: "center", fontSize: isMobile ? "0.55rem" : "0.62rem", color: theme.text.muted, margin: "0 0 22px",
          letterSpacing: "0.28em", textTransform: "uppercase" }}>
          {subtitle}
        </p>

        {!isMobile && (
          <>
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
              {["off", ...SHAPE_ORDER, "all"].map(s => {
                const label = s === "off" ? "Off" : s === "all" ? "All"
                  : isMinorKey ? s + "m" : s;
                return (
                  <ToggleButton key={s} label={label}
                    active={activeShape === s} onClick={() => changeShape(s)} theme={theme} />
                );
              })}
              <span style={STYLE.divider}>│</span>
              <ToggleButton label="Intervals" active={labelMode === "intervals"} onClick={() => setLabelMode("intervals")} theme={theme} />
              <span style={{ color: theme.text.dim, fontSize: "0.7rem" }}>/</span>
              <ToggleButton label="Notes" active={labelMode === "notes"} onClick={() => setLabelMode("notes")} theme={theme} />
            </div>
          </>
        )}

        {/* Options Row: Triads + Pentatonic + Frying Pan */}
        {!isMobile && (
          <div style={STYLE.optionRow(22)}>
            <span style={STYLE.optionLabel}>Triads</span>
            <PillToggle on={showTriads} onToggle={() => setShowTriads(t => !t)} theme={theme} />
            {advancedMode && showTriads && (
              <>
                {["major", "minor"].map(q => (
                  <ToggleButton key={q} label={q === "major" ? "Maj" : "Min"}
                    active={triadQuality === q} onClick={() => setTriadQuality(q)}
                    style={{ fontSize: "0.6rem", padding: "2px 7px" }} theme={theme} />
                ))}
              </>
            )}
            <span style={STYLE.divider}>│</span>
            <span style={STYLE.optionLabel}>Pentatonics</span>
            <PillToggle on={scaleMode !== "off"} onToggle={() => {
              if (scaleMode !== "off") { setPentaScale("off"); setShowFryingPan(false); }
              else { setPentaScale("pentatonic"); }
            }} theme={theme} />
            {scaleMode !== "off" && (
              <ToggleButton label="Blues" active={scaleMode === "blues"}
                onClick={() => setPentaScale(scaleMode === "blues" ? "pentatonic" : "blues")} theme={theme} />
            )}
            {advancedMode && scaleMode !== "off" && (
              <>
                {["major", "minor"].map(q => (
                  <ToggleButton key={q} label={q === "major" ? "Maj" : "Min"}
                    active={pentaQuality === q} onClick={() => setPentaQuality(q)}
                    style={{ fontSize: "0.6rem", padding: "2px 7px" }} theme={theme} />
                ))}
              </>
            )}
            {activeShape === "all" && scaleMode !== "off" && (
              <ToggleButton label="Pan" active={showFryingPan}
                onClick={() => setShowFryingPan(p => !p)} theme={theme} />
            )}
            <span style={STYLE.divider}>│</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={STYLE.optionLabel}>Quality</span>
              <PillToggle on={advancedMode} onToggle={toggleAdvanced} theme={theme} />
            </span>
          </div>
        )}

        {/* Fretboard */}
        <div style={isMobile
          ? { marginTop: 10 }
          : { background: theme.bg.panel, borderRadius: 12, padding: "10px 0", border: `1px solid ${theme.border.subtle}`,
              boxShadow: theme.fretboard.shadow, overflowX: "auto" }
        }>
          <svg viewBox={`0 0 ${isMobile ? svgW_M : svgW} ${isMobile ? svgH_M : svgH}`}
               style={{ width: "100%", ...(isMobile ? {} : { minWidth: 700 }), display: "block" }}>
            <defs>
              <linearGradient id="fb" x1="0" y1="0" x2={isMobile ? "1" : "0"} y2={isMobile ? "0" : "1"}>
                <stop offset="0%" stopColor={theme.fretboard.gradientTop} stopOpacity="0.22" />
                <stop offset="100%" stopColor={theme.fretboard.gradientBottom} stopOpacity="0.22" />
              </linearGradient>
              {isMobile && <clipPath id="fb-clip">
                <rect x={0} y={MARGIN_TOP_M - 24} width={svgW_M} height={FRET_TOTAL_M + 30} />
              </clipPath>}
            </defs>

            {isMobile
              ? <rect x={MARGIN_LEFT_M - 13} y={MARGIN_TOP_M - 3} width={5 * STRING_SPACING_M + 26} height={FRET_TOTAL_M + 6} rx={3} fill="url(#fb)" />
              : <rect x={MARGIN_LEFT - 3} y={MARGIN_TOP - 13} width={FRET_X[NUM_FRETS] + 6} height={5 * STRING_SPACING + 26} rx={3} fill="url(#fb)" />
            }

            {[6, 5, 4, 3, 2, 1].map(s =>
              isMobile
                ? <line key={s} x1={strX(s)} y1={MARGIN_TOP_M - 20} x2={strX(s)} y2={MARGIN_TOP_M + FRET_TOTAL_M}
                    stroke={theme.text.secondary} strokeWidth={0.3 + (s - 1) * 0.16} opacity={0.45} />
                : <line key={s} x1={MARGIN_LEFT - 20} y1={strY(s)} x2={MARGIN_LEFT + FRET_X[NUM_FRETS]} y2={strY(s)}
                    stroke={theme.text.secondary} strokeWidth={0.3 + (s - 1) * 0.16} opacity={0.45} />
            )}

            {isMobile
              ? <rect x={MARGIN_LEFT_M - 13} y={MARGIN_TOP_M - 2} width={5 * STRING_SPACING_M + 26} height={4} rx={1} fill={theme.text.secondary} opacity={0.8} />
              : <rect x={MARGIN_LEFT - 2} y={MARGIN_TOP - 13} width={4} height={5 * STRING_SPACING + 26} rx={1} fill={theme.text.secondary} opacity={0.8} />
            }

            {Array.from({ length: NUM_FRETS }, (_, i) => i + 1).map(f =>
              isMobile
                ? <line key={f} x1={MARGIN_LEFT_M - 11} y1={fretY(f)} x2={MARGIN_LEFT_M + 5 * STRING_SPACING_M + 11} y2={fretY(f)}
                    stroke={theme.text.dim} strokeWidth={0.8} opacity={0.5} />
                : <line key={f} x1={fretX(f)} y1={MARGIN_TOP - 11} x2={fretX(f)} y2={MARGIN_TOP + 5 * STRING_SPACING + 11}
                    stroke={theme.text.dim} strokeWidth={0.8} opacity={0.5} />
            )}

            {[3, 5, 7, 9].map(f =>
              isMobile
                ? <circle key={f} cx={MARGIN_LEFT_M + 2.5 * STRING_SPACING_M} cy={noteY(f)} r={3.5} fill={theme.fretboard.markerDot} opacity={0.85} />
                : <circle key={f} cx={noteX(f)} cy={MARGIN_TOP + 2.5 * STRING_SPACING} r={3.5} fill={theme.fretboard.markerDot} opacity={0.85} />
            )}
            {isMobile ? <>
              <circle cx={MARGIN_LEFT_M + 1.5 * STRING_SPACING_M} cy={noteY(12)} r={3.5} fill={theme.fretboard.markerDot} opacity={0.85} />
              <circle cx={MARGIN_LEFT_M + 3.5 * STRING_SPACING_M} cy={noteY(12)} r={3.5} fill={theme.fretboard.markerDot} opacity={0.85} />
            </> : <>
              <circle cx={noteX(12)} cy={MARGIN_TOP + 1.5 * STRING_SPACING} r={3.5} fill={theme.fretboard.markerDot} opacity={0.85} />
              <circle cx={noteX(12)} cy={MARGIN_TOP + 3.5 * STRING_SPACING} r={3.5} fill={theme.fretboard.markerDot} opacity={0.85} />
            </>}

            {Array.from({ length: NUM_FRETS + 1 }, (_, i) => i).map(f =>
              isMobile
                ? <text key={f} x={MARGIN_LEFT_M - 28} y={f === 0 ? MARGIN_TOP_M : noteY(f)}
                    textAnchor="middle" dominantBaseline="central" fill={theme.text.dim} fontSize={9} fontFamily="ui-monospace, monospace">{f}</text>
                : <text key={f} x={f === 0 ? MARGIN_LEFT : noteX(f)} y={MARGIN_TOP + 5 * STRING_SPACING + 34}
                    textAnchor="middle" fill={theme.text.dim} fontSize={9} fontFamily="ui-monospace, monospace">{f}</text>
            )}

            {STR_NAMES.map((l, i) =>
              isMobile
                ? <text key={i} x={strX(6 - i)} y={MARGIN_TOP_M - 40} textAnchor="middle" fill={theme.text.dim} fontSize={10} fontFamily="ui-monospace, monospace">{l}</text>
                : <text key={i} x={14} y={strY(6 - i) + 4} textAnchor="middle" fill={theme.text.dim} fontSize={10} fontFamily="ui-monospace, monospace">{l}</text>
            )}

            {(showTriads || showPenta) && activeShape === "all" && (() => {
              if (!hoveredShape) return null;
              return SHAPE_ORDER.filter(sh => sh === hoveredShape).flatMap(sh =>
                shapeRanges[sh].map(({ lo, hi }, ci) => {
                  if (isMobile) {
                    const y1 = noteY(lo) - FRET_SPACING_M * 0.48;
                    const y2 = noteY(hi) + FRET_SPACING_M * 0.48;
                    return <rect key={`bg-${sh}-${ci}`} x={MARGIN_LEFT_M - 13} y={y1} width={5 * STRING_SPACING_M + 26} height={y2 - y1} fill={theme.shape[sh]} opacity={theme.fretboard.shapeHighlight} rx={3} />;
                  }
                  const x1 = noteX(lo) - fretWAt(lo) * 0.48;
                  const x2 = noteX(hi) + fretWAt(hi) * 0.48;
                  return <rect key={`bg-${sh}-${ci}`} x={x1} y={MARGIN_TOP - 13} width={x2 - x1} height={5 * STRING_SPACING + 26} fill={theme.shape[sh]} opacity={theme.fretboard.shapeHighlight} rx={3} />;
                })
              );
            })()}

            {(showTriads || showPenta) && showShapeDistinctions && visibleShapes.length > 0 && !isMobile && (
              <text x={9} y={MARGIN_TOP - 27} textAnchor="start" fill={theme.text.dim} fontSize={9} fontWeight={700}>Shape:</text>
            )}

            {/* Hit rects for shape hover/click in all-view */}
            {(showTriads || showPenta) && activeShape === "all" && hoverRanges.map(({ shape, ci, hoverLo, hoverHi }) => {
              if (isMobile) {
                const y1 = noteY(hoverLo) - FRET_SPACING_M * 0.48;
                const y2 = noteY(hoverHi) + FRET_SPACING_M * 0.48;
                return <rect
                  key={`hit-${shape}-${ci}`}
                  x={MARGIN_LEFT_M - 38}
                  y={y1}
                  width={5 * STRING_SPACING_M + 26 + 38 - 13}
                  height={y2 - y1}
                  fill="transparent"
                  onMouseEnter={() => setHoveredShape(shape)}
                  onMouseLeave={() => setHoveredShape(null)}
                  onClick={() => setHoveredShape(h => h === shape ? null : shape)}
                />;
              }
              const x1 = noteX(hoverLo) - fretWAt(hoverLo) * 0.48;
              const x2 = noteX(hoverHi) + fretWAt(hoverHi) * 0.48;
              return <rect
                key={`hit-${shape}-${ci}`}
                x={x1}
                y={MARGIN_TOP - 38}
                width={x2 - x1}
                height={5 * STRING_SPACING + 26 + 38 - 13}
                fill="transparent"
                onMouseEnter={() => setHoveredShape(shape)}
                onMouseLeave={() => setHoveredShape(null)}
              />;
            })}

            {/* Shape labels */}
            {(showTriads || showPenta) && showShapeDistinctions && visibleShapes.flatMap(sh => {
              const lbl = isMinorKey ? sh + "m" : sh;
              const isActive = hoveredShape === sh;
              const isAllView = activeShape === "all";
              return shapeRanges[sh].map(({ lo, hi, partial }, ci) => {
                const avg = (lo + hi) / 2;
                if (isMobile) {
                  const cy = avg < 0.5 ? MARGIN_TOP_M : noteY(Math.round(avg));
                  return <text
                    key={`${sh}-${ci}`}
                    x={MARGIN_LEFT_M - 42}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={theme.shape[sh]}
                    fontSize={13}
                    fontWeight={700}
                    opacity={partial ? 0.25 : (isAllView ? (isActive ? 1 : 0.6) : 1)}
                  >{lbl}</text>;
                }
                const raw = avg < 0.5 ? MARGIN_LEFT - 16 : noteX(Math.round(avg));
                const cx = Math.max(raw, MARGIN_LEFT + 4);
                return <text
                  key={`${sh}-${ci}`}
                  x={cx}
                  y={MARGIN_TOP - 27}
                  textAnchor="middle"
                  fill={theme.shape[sh]}
                  fontSize={10}
                  fontWeight={700}
                  opacity={partial ? 0.25 : (isAllView ? (isActive ? 1 : 0.6) : 1)}
                >{lbl}</text>;
              });
            })}

            {/* Frying-pan overlay - render behind notes */}
            <g clipPath={isMobile ? "url(#fb-clip)" : undefined}>
            {fryingPanShapes.map((pan, i) => {
              const panColor = pan.handleDirection === "left"
                ? theme.overlay.fryingPanLeft
                : theme.overlay.fryingPanRight;

              if (isMobile) {
                const panY1 = noteY(pan.panMinFret) - PENTA_RADIUS - 6;
                const panY2 = noteY(pan.panMaxFret) + PENTA_RADIUS + 6;
                // strX reverses string order (6-str), so use min/max
                const sx1 = strX(pan.upperStr);
                const sx2 = strX(pan.lowerStr);
                const panX1 = Math.min(sx1, sx2) - 9;
                const panX2 = Math.max(sx1, sx2) + 9;
                const handleX = strX(pan.handleString);

                let handleY1, handleY2;
                if (pan.handleDirection === "left") {
                  handleY1 = pan.handleFret === 0 ? MARGIN_TOP_M - 26 : noteY(pan.handleFret) - PENTA_RADIUS - 4;
                  handleY2 = panY1;
                } else {
                  handleY1 = panY2;
                  handleY2 = noteY(pan.handleFret) + PENTA_RADIUS + 4;
                }

                return (
                  <g key={`fp-${i}`} pointerEvents="none">
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
                      x={handleX - 4} y={handleY1}
                      width={8} height={handleY2 - handleY1}
                      rx={4}
                      fill={panColor}
                      opacity={0.20}
                      stroke={panColor}
                      strokeWidth={0.6}
                      strokeOpacity={0.25}
                    />
                  </g>
                );
              }

              const panX1 = noteX(pan.panMinFret) - PENTA_RADIUS - 6;
              const panX2 = noteX(pan.panMaxFret) + PENTA_RADIUS + 6;
              const panY1 = strY(pan.upperStr) - 9;
              const panY2 = strY(pan.lowerStr) + 9;
              const handleY = strY(pan.handleString);

              let handleX1, handleX2;
              if (pan.handleDirection === "left") {
                handleX1 = pan.handleFret === 0 ? MARGIN_LEFT - 26 : noteX(pan.handleFret) - PENTA_RADIUS - 4;
                handleX2 = panX1;
              } else {
                handleX1 = panX2;
                handleX2 = noteX(pan.handleFret) + PENTA_RADIUS + 4;
              }

              return (
                <g key={`fp-${i}`} pointerEvents="none">
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
            </g>

            {pentaNotes.map(([s, f, interval]) => (
              <FretDot key={posKey(s, f)} cx={isMobile ? strX(s) : noteX(f)} cy={isMobile ? noteY(f) : strY(s)} radius={PENTA_RADIUS} interval={interval}
                keyIdx={effectiveKey} labelMode={labelMode} fret={f} theme={theme} />
            ))}

            {showMinTriad && visibleShapes.map(sh =>
              minTriads[sh].map(([s, f, interval], idx) => (
                  <FretDot key={`m-${sh}-${idx}`} cx={isMobile ? strX(s) : noteX(f)} cy={isMobile ? noteY(f) : strY(s)} radius={TRIAD_RADIUS} interval={interval}
                    keyIdx={effectiveKey} labelMode={labelMode} shapeBorder={activeShape === "all" ? theme.shape[sh] : null}
                    fret={f} theme={theme} />
                ))
            )}

            {showMajTriad && visibleShapes.map(sh =>
              majTriads[sh].map(([s, f, interval], idx) => (
                <FretDot key={`t-${sh}-${idx}`} cx={isMobile ? strX(s) : noteX(f)} cy={isMobile ? noteY(f) : strY(s)} radius={TRIAD_RADIUS} interval={interval}
                  keyIdx={effectiveKey} labelMode={labelMode} shapeBorder={activeShape === "all" ? theme.shape[sh] : null}
                  fret={f} theme={theme} />
              ))
            )}
          </svg>
        </div>

        {/* Bottom Section: Legend + Chord Diagrams */}
        <div style={{
          display: "flex", alignItems: "stretch", justifyContent: "center",
          marginTop: isMobile ? 8 : 20, gap: isMobile ? 10 : 16, flexWrap: "wrap",
          ...(isMobile && { flexDirection: "column", alignItems: "center" })
        }}>
          {showTriads && (
            <div style={{ minWidth: 140, padding: "8px 12px", border: `1px solid ${theme.border.subtle}`, borderRadius: 8 }}>
              <LegendSection title={triadQuality === "minor" ? "Minor Triad" : "Triad"}
                items={triadLegend} dotSize={20} keyIdx={effectiveKey} labelMode={labelMode} theme={theme} />
            </div>
          )}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch", justifyContent: "center" }}>
            {pentaLegend.length > 0 && (
              <div style={{ minWidth: 140, padding: "8px 12px", border: `1px solid ${theme.border.subtle}`, borderRadius: 8 }}>
                <LegendSection title={scaleName(scaleMode, pentaQuality)} items={pentaLegend} dotSize={16}
                  keyIdx={effectiveKey} labelMode={labelMode} theme={theme} />
              </div>
            )}

            {showFryingPan && (
              <div style={{ minWidth: 140, padding: "8px 12px", border: `1px solid ${theme.border.subtle}`, borderRadius: 8 }}>
                <div style={{ fontSize: "0.55rem", color: theme.text.dim, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>
                  Frying Pan
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width={36} height={20} viewBox="0 0 36 20">
                      <rect x={10} y={2} width={16} height={16} rx={4} fill={theme.overlay.fryingPanLeft} opacity={0.35} stroke={theme.overlay.fryingPanLeft} strokeWidth={0.8} strokeOpacity={0.5} />
                      <rect x={2} y={7} width={8} height={6} rx={3} fill={theme.overlay.fryingPanLeft} opacity={0.25} stroke={theme.overlay.fryingPanLeft} strokeWidth={0.6} strokeOpacity={0.4} />
                    </svg>
                    <span style={{ fontSize: "0.74rem", color: theme.text.secondary }}>Left-hand pan</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width={36} height={20} viewBox="0 0 36 20">
                      <rect x={10} y={2} width={16} height={16} rx={4} fill={theme.overlay.fryingPanRight} opacity={0.35} stroke={theme.overlay.fryingPanRight} strokeWidth={0.8} strokeOpacity={0.5} />
                      <rect x={26} y={7} width={8} height={6} rx={3} fill={theme.overlay.fryingPanRight} opacity={0.25} stroke={theme.overlay.fryingPanRight} strokeWidth={0.6} strokeOpacity={0.4} />
                    </svg>
                    <span style={{ fontSize: "0.74rem", color: theme.text.secondary }}>Right-hand pan</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {scaleMode === "pentatonic" && pentaQuality === "minor" && (
            <p style={{ fontSize: "0.68rem", color: theme.text.muted, lineHeight: 1.55, fontStyle: "italic", margin: 0, alignSelf: "center" }}>
              The ♭3 sits beside the major 3rd — the tension at the heart of the blues.
            </p>
          )}
          {scaleMode === "blues" && pentaQuality === "minor" && (
            <p style={{ fontSize: "0.68rem", color: theme.text.muted, lineHeight: 1.55, fontStyle: "italic", margin: 0, alignSelf: "center" }}>
              The ♭5 squeezes between the 4th and 5th — a chromatic passing tone that gives the blues its grit.
            </p>
          )}
          {scaleMode === "blues" && pentaQuality === "major" && (
            <p style={{ fontSize: "0.68rem", color: theme.text.muted, lineHeight: 1.55, fontStyle: "italic", margin: 0, alignSelf: "center" }}>
              The ♭3 bends into the major 3rd — adding soul to a major key.
            </p>
          )}

          {showTriads && (
            <div style={{ flexBasis: "100%", minWidth: 0 }}>
              {showMajTriad && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: showMinTriad ? 10 : 0 }}>
                  {visibleShapes.map(sh =>
                    <ChordDiagram key={sh} chord={CHORD_MAJ[sh]} shape={sh} accent={theme.shape[sh]} keyIdx={effectiveKey} labelMode={labelMode} theme={theme} />
                  )}
                </div>
              )}
              {showMinTriad && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {visibleShapes.map(sh =>
                    <ChordDiagram key={`m-${sh}`} chord={CHORD_MIN[sh]} shape={sh + "m"} accent={theme.shape[sh]} keyIdx={effectiveKey} labelMode={labelMode} italic theme={theme} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${theme.border.subtle}` }}>
          <span style={{ fontSize: "0.82rem", color: theme.text.muted, fontWeight: 500 }}>{footerKey}</span>
          <span style={{ fontSize: "0.72rem", color: theme.text.footer, marginLeft: 12 }}>
            {activeShape === "off" ? "Full fretboard view" : activeShape === "all" ? "Five shapes connected across the fretboard" : `${activeShape} shape voicing`}
          </span>
        </div>
      </div>
      {isMobile && (
          <>
            {sheetOpen && (
              <div onClick={() => setSheetOpen(false)} style={{
                position: "fixed", inset: 0, zIndex: 49,
                background: "rgba(0,0,0,0.3)", transition: "opacity 0.25s",
              }} />
            )}
            <div
              onTouchStart={e => {
                sheetTouchRef.current = { y: e.touches[0].clientY, open: sheetOpen };
              }}
              onTouchMove={e => {
                if (!sheetTouchRef.current) return;
                const dy = e.touches[0].clientY - sheetTouchRef.current.y;
                e.currentTarget.style.transition = "none";
                const base = sheetTouchRef.current.open ? 0 : e.currentTarget.offsetHeight - 44;
                e.currentTarget.style.transform = `translateY(${Math.max(0, base + dy)}px)`;
              }}
              onTouchEnd={e => {
                if (!sheetTouchRef.current) return;
                const dy = e.changedTouches[0].clientY - sheetTouchRef.current.y;
                e.currentTarget.style.transition = "transform 0.25s ease-out";
                if (sheetTouchRef.current.open && dy > 40) {
                  setSheetOpen(false);
                } else if (!sheetTouchRef.current.open && dy < -40) {
                  setSheetOpen(true);
                }
                e.currentTarget.style.transform = "";
                sheetTouchRef.current = null;
              }}
              style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
              background: theme.bg.modal,
              borderTop: `1px solid ${theme.border.subtle}`,
              borderRadius: "12px 12px 0 0",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
              transform: sheetOpen ? "translateY(0)" : "translateY(calc(100% - 44px))",
              transition: "transform 0.25s ease-out",
            }}>
              {/* Handle bar */}
              <div onClick={() => setSheetOpen(o => !o)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: 44, boxSizing: "border-box", padding: "0 16px", cursor: "pointer",
              }}>
                <div style={{
                  width: 32, height: 4, borderRadius: 2,
                  background: theme.text.dim, marginBottom: 6,
                }} />
                <div style={{
                  fontSize: "0.65rem", color: theme.text.secondary,
                  letterSpacing: "0.05em", whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90vw",
                }}>
                  {sheetSummary}
                </div>
              </div>
              {sheetOpen && (() => {
                const sheetLabel = { fontSize: "0.5rem", color: theme.text.dim, letterSpacing: "0.12em", textTransform: "uppercase" };
                return (
                <div style={{ padding: "8px 12px 16px", display: "flex", gap: 12 }}>
                  {/* Left panel: Key grid */}
                  <div style={{ width: "50%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 6px", alignContent: "start" }}>
                    <span style={{ ...sheetLabel, textAlign: "center", padding: "2px 0" }}>Major</span>
                    <span style={{ ...sheetLabel, textAlign: "center", padding: "2px 0" }}>Rel. Minor</span>
                    {NOTES.map((n, i) => {
                      const sel = keyIndex === i;
                      return (
                        <Fragment key={i}>
                          <button
                            aria-pressed={sel && !isMinorKey}
                            onClick={() => { setKeyIndex(i); setIsMinorKey(false); if (!advancedMode) { setTriadQuality("major"); setPentaQuality("major"); } }}
                            style={{ ...STYLE.keyBtn(sel && !isMinorKey, sel), padding: "5px 8px", fontSize: "0.7rem", minWidth: 0 }}>
                            {n}
                          </button>
                          <button
                            aria-pressed={sel && isMinorKey}
                            onClick={() => { setKeyIndex(i); setIsMinorKey(true); if (!advancedMode) { setTriadQuality("minor"); setPentaQuality("minor"); } }}
                            style={{ ...STYLE.minorKeyBtn(sel && isMinorKey, sel), padding: "5px 6px", fontSize: "0.63rem", minWidth: 0 }}>
                            {NOTES[(i + 9) % 12] + "m"}
                          </button>
                        </Fragment>
                      );
                    })}
                  </div>
                  {/* Right panel: Shapes, Labels, Options */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    {/* Shapes */}
                    <div>
                      <span style={{ ...sheetLabel, display: "block", textAlign: "center" }}>Shapes</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, marginTop: 4 }}>
                        {["off", ...SHAPE_ORDER].map(s => {
                          const label = s === "off" ? "Off" : isMinorKey ? s + "m" : s;
                          return (
                            <ToggleButton key={s} label={label}
                              active={activeShape === s} onClick={() => changeShape(s)} theme={theme} />
                          );
                        })}
                        <ToggleButton label="All" active={activeShape === "all"}
                          onClick={() => changeShape(activeShape === "all" ? "off" : "all")}
                          style={{ gridColumn: "1 / -1" }} theme={theme} />
                      </div>
                    </div>
                    {/* Intervals / Notes toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <ToggleButton label="Intervals" active={labelMode === "intervals"} onClick={() => setLabelMode("intervals")} theme={theme} />
                      <span style={{ color: theme.text.dim, fontSize: "0.7rem" }}>/</span>
                      <ToggleButton label="Notes" active={labelMode === "notes"} onClick={() => setLabelMode("notes")} theme={theme} />
                    </div>
                    {/* Options */}
                    {(() => {
                      const mBtn = { fontSize: "0.65rem", padding: "2px 6px" };
                      const optRow = { display: "flex", alignItems: "center", gap: 4 };
                      const qualBtns = { display: "flex", gap: 4, marginLeft: 46 };
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                          <div>
                            <div style={optRow}>
                              <span style={{ ...sheetLabel, minWidth: 42 }}>Triads</span>
                              <PillToggle on={showTriads} onToggle={() => setShowTriads(t => !t)} theme={theme} />
                            </div>
                            {advancedMode && showTriads && (
                              <div style={{ ...qualBtns, marginTop: 4 }}>
                                {["major", "minor"].map(q => (
                                  <ToggleButton key={q} label={q === "major" ? "Maj" : "Min"}
                                    active={triadQuality === q} onClick={() => setTriadQuality(q)}
                                    style={{ fontSize: "0.6rem", padding: "2px 7px" }} theme={theme} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={optRow}>
                              <span style={{ ...sheetLabel, minWidth: 42 }}>Penta</span>
                              <PillToggle on={scaleMode !== "off"} onToggle={() => {
                                if (scaleMode !== "off") { setPentaScale("off"); setShowFryingPan(false); }
                                else { setPentaScale("pentatonic"); }
                              }} theme={theme} />
                              {scaleMode !== "off" && (
                                <ToggleButton label="Blues" active={scaleMode === "blues"}
                                  onClick={() => setPentaScale(scaleMode === "blues" ? "pentatonic" : "blues")} style={mBtn} theme={theme} />
                              )}
                              {activeShape === "all" && scaleMode !== "off" && (
                                <ToggleButton label="Pan" active={showFryingPan}
                                  onClick={() => setShowFryingPan(p => !p)} style={mBtn} theme={theme} />
                              )}
                            </div>
                            {advancedMode && scaleMode !== "off" && (
                              <div style={{ ...qualBtns, marginTop: 4 }}>
                                {["major", "minor"].map(q => (
                                  <ToggleButton key={q} label={q === "major" ? "Maj" : "Min"}
                                    active={pentaQuality === q} onClick={() => setPentaQuality(q)}
                                    style={{ fontSize: "0.6rem", padding: "2px 7px" }} theme={theme} />
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={optRow}>
                            <span style={{ ...sheetLabel, minWidth: 42 }}>Quality</span>
                            <PillToggle on={advancedMode} onToggle={toggleAdvanced} theme={theme} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                );
              })()}
            </div>
          </>
        )}
      <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} theme={theme} />
    </div>
  );
}

export { THEME_DARK, THEME_LIGHT, THEME_COMMON };
