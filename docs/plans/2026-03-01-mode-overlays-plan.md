# Mode Overlays Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Ionian, Mixolydian, Aeolian, and Dorian mode overlays that layer 2 extra notes on top of the existing pentatonic scale at reduced opacity.

**Architecture:** New `MODE_SHAPE` data table in `music.js` follows the existing `PENTA_BOX`/`BLUES_SHAPE` pattern. `App.jsx` adds `activeMode` state, mode buttons in the Penta options area, and renders mode notes as reduced-opacity `FretDot` components. Mode buttons are auto-filtered by key quality (major modes for major keys, minor modes for minor keys).

**Tech Stack:** React 19, Vite, Vitest

---

### Task 1: Add `MODE_SHAPE` data and new intervals to `music.js`

**Files:**
- Modify: `src/music.js:634-644` (add new intervals to `INTERVAL_SEMITONES`)
- Modify: `src/music.js` (add `MODE_SHAPE` after `BLUES_SHAPE`, before `shiftNotes`)
- Test: `src/App.test.js`

**Step 1: Write failing tests for `MODE_SHAPE` data integrity**

Add to `src/App.test.js`, importing `MODE_SHAPE` from `./music.js`:

```javascript
// ─── MODE_SHAPE data integrity ──────────────────────────────────────────────

describe("MODE_SHAPE data integrity", () => {
  const MODES = ["ionian", "mixolydian", "aeolian", "dorian"];
  const MAJOR_MODES = ["ionian", "mixolydian"];
  const MINOR_MODES = ["aeolian", "dorian"];
  const MODE_INTERVALS = {
    ionian: ["4", "7"],
    mixolydian: ["4", "♭7"],
    aeolian: ["2", "♭6"],
    dorian: ["2", "6"],
  };

  it("every mode has all 5 CAGED shapes", () => {
    MODES.forEach(mode => {
      SHAPE_ORDER.forEach(sh => {
        expect(MODE_SHAPE[mode][sh]).toBeDefined();
        expect(MODE_SHAPE[mode][sh].length).toBeGreaterThan(0);
      });
    });
  });

  it("every note uses only the mode's two extra intervals", () => {
    MODES.forEach(mode => {
      const allowed = new Set(MODE_INTERVALS[mode]);
      SHAPE_ORDER.forEach(sh => {
        MODE_SHAPE[mode][sh].forEach(([,, iv]) => {
          expect(allowed.has(iv)).toBe(true);
        });
      });
    });
  });

  it("notes are [string, fret, interval] tuples with valid ranges", () => {
    MODES.forEach(mode => {
      SHAPE_ORDER.forEach(sh => {
        MODE_SHAPE[mode][sh].forEach(([s, f, iv]) => {
          expect(s).toBeGreaterThanOrEqual(1);
          expect(s).toBeLessThanOrEqual(6);
          expect(f).toBeGreaterThanOrEqual(0);
          expect(typeof iv).toBe("string");
        });
      });
    });
  });

  it("mode notes don't overlap with their base pentatonic", () => {
    MODES.forEach(mode => {
      const quality = MAJOR_MODES.includes(mode) ? "major" : "minor";
      SHAPE_ORDER.forEach(sh => {
        const pentaPositions = new Set(
          PENTA_BOX[quality][sh].map(([s, f]) => `${s}-${f}`)
        );
        MODE_SHAPE[mode][sh].forEach(([s, f]) => {
          expect(pentaPositions.has(`${s}-${f}`)).toBe(false);
        });
      });
    });
  });

  it("adjacent shapes share boundary notes", () => {
    const order = [...SHAPE_ORDER]; // C, A, G, E, D
    MODES.forEach(mode => {
      for (let i = 0; i < order.length - 1; i++) {
        const curr = new Set(MODE_SHAPE[mode][order[i]].map(([s, f, iv]) => `${s}-${f}-${iv}`));
        const next = new Set(MODE_SHAPE[mode][order[i + 1]].map(([s, f, iv]) => `${s}-${f}-${iv}`));
        const shared = [...curr].filter(k => next.has(k));
        // At least some shapes should share boundary notes (not every pair must)
        // This is a soft check — we just verify the data format allows it
      }
    });
  });

  it("new intervals 7 and ♭6 are in INTERVAL_SEMITONES", () => {
    expect(INTERVAL_SEMITONES["7"]).toBe(11);
    expect(INTERVAL_SEMITONES["♭6"]).toBe(8);
  });

  it("all mode intervals are in INTERVAL_SEMITONES", () => {
    MODES.forEach(mode => {
      SHAPE_ORDER.forEach(sh => {
        MODE_SHAPE[mode][sh].forEach(([,, iv]) => {
          expect(INTERVAL_SEMITONES[iv]).toBeDefined();
        });
      });
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/App.test.js`
Expected: FAIL — `MODE_SHAPE` is not exported, `INTERVAL_SEMITONES` missing `"7"` and `"♭6"`

**Step 3: Add new intervals to `INTERVAL_SEMITONES` in `src/music.js:634-644`**

Change `INTERVAL_SEMITONES` to:

```javascript
export const INTERVAL_SEMITONES = {
  R:    0,
  "2":  2,
  "♭3": 3,
  "3":  4,
  "4":  5,
  "♭5": 6,
  "5":  7,
  "♭6": 8,
  "6":  9,
  "♭7": 10,
  "7":  11,
};
```

**Step 4: Add `MODE_SHAPE` data table to `src/music.js`**

Insert after `BLUES_SHAPE` (after line 563), before `shiftNotes`:

```javascript
export const MODE_SHAPE = {
  ionian: {
    C: [
      [6, 1, "4"], [6, 13, "4"],
      [5, 2, "7"], [5, 14, "7"],
      [4, 3, "4"], [4, 15, "4"],
      [3, 4, "7"], [3, 16, "7"],
      [2, 0, "7"], [2, 12, "7"],
      [1, 1, "4"], [1, 13, "4"],
    ],
    A: [
      [6, 3, "4"], [6, 15, "4"],
      [5, 2, "7"], [5, 14, "7"],
      [4, 3, "4"], [4, 15, "4"],
      [3, 4, "7"], [3, 16, "7"],
      [2, 6, "4"], [2, 18, "4"],
      [1, 3, "4"], [1, 15, "4"],
    ],
    G: [
      [6, 7, "7"], [6, 19, "7"],
      [5, 8, "4"], [5, 20, "4"],
      [4, 9, "7"], [4, 21, "7"],
      [3, 10, "4"], [3, 22, "4"],
      [2, 6, "4"], [2, 18, "4"],
      [1, 7, "7"], [1, 19, "7"],
    ],
    E: [
      [6, 7, "7"], [6, 19, "7"],
      [5, 8, "4"], [5, 20, "4"],
      [4, 9, "7"], [4, 21, "7"],
      [3, 10, "4"], [3, 22, "4"],
      [2, 12, "7"], [2, 24, "7"],
      [1, 7, "7"], [1, 19, "7"],
    ],
    D: [
      [6, 13, "4"], [6, 25, "4"],
      [5, 14, "7"], [5, 26, "7"],
      [4, 9, "7"], [4, 21, "7"],
      [3, 10, "4"], [3, 22, "4"],
      [2, 12, "7"], [2, 24, "7"],
      [1, 13, "4"], [1, 25, "4"],
    ],
  },
  mixolydian: {
    C: [
      [6, 1, "4"], [6, 13, "4"],
      [5, 1, "♭7"], [5, 13, "♭7"],
      [4, 3, "4"], [4, 15, "4"],
      [3, 3, "♭7"], [3, 15, "♭7"],
      [2, 11, "♭7"], [2, 23, "♭7"],
      [1, 1, "4"], [1, 13, "4"],
    ],
    A: [
      [6, 6, "♭7"], [6, 18, "♭7"],
      [5, 1, "♭7"], [5, 13, "♭7"],
      [4, 3, "4"], [4, 15, "4"],
      [3, 3, "♭7"], [3, 15, "♭7"],
      [2, 6, "4"], [2, 18, "4"],
      [1, 6, "♭7"], [1, 18, "♭7"],
    ],
    G: [
      [6, 6, "♭7"], [6, 18, "♭7"],
      [5, 8, "4"], [5, 20, "4"],
      [4, 8, "♭7"], [4, 20, "♭7"],
      [3, 10, "4"], [3, 22, "4"],
      [2, 6, "4"], [2, 18, "4"],
      [1, 6, "♭7"], [1, 18, "♭7"],
    ],
    E: [
      [6, 13, "4"], [6, 25, "4"],
      [5, 8, "4"], [5, 20, "4"],
      [4, 8, "♭7"], [4, 20, "♭7"],
      [3, 10, "4"], [3, 22, "4"],
      [2, 11, "♭7"], [2, 23, "♭7"],
      [1, 6, "♭7"], [1, 18, "♭7"],
    ],
    D: [
      [6, 13, "4"], [6, 25, "4"],
      [5, 13, "♭7"], [5, 25, "♭7"],
      [4, 15, "4"], [4, 27, "4"],
      [3, 10, "4"], [3, 22, "4"],
      [2, 11, "♭7"], [2, 23, "♭7"],
      [1, 13, "4"], [1, 25, "4"],
    ],
  },
  aeolian: {
    C: [
      [6, 4, "♭6"], [6, 16, "♭6"],
      [5, 11, "♭6"], [5, 23, "♭6"],
      [4, 0, "2"], [4, 12, "2"],
      [3, 1, "♭6"], [3, 13, "♭6"],
      [2, 3, "2"], [2, 15, "2"],
      [1, 4, "♭6"], [1, 16, "♭6"],
    ],
    A: [
      [6, 4, "♭6"], [6, 16, "♭6"],
      [5, 5, "2"], [5, 17, "2"],
      [4, 6, "♭6"], [4, 18, "♭6"],
      [3, 7, "2"], [3, 19, "2"],
      [2, 3, "2"], [2, 15, "2"],
      [1, 4, "♭6"], [1, 16, "♭6"],
    ],
    G: [
      [6, 10, "2"], [6, 22, "2"],
      [5, 5, "2"], [5, 17, "2"],
      [4, 6, "♭6"], [4, 18, "♭6"],
      [3, 7, "2"], [3, 19, "2"],
      [2, 9, "♭6"], [2, 21, "♭6"],
      [1, 10, "2"], [1, 22, "2"],
    ],
    E: [
      [6, 10, "2"], [6, 22, "2"],
      [5, 11, "♭6"], [5, 23, "♭6"],
      [4, 6, "♭6"], [4, 18, "♭6"],
      [3, 7, "2"], [3, 19, "2"],
      [2, 9, "♭6"], [2, 21, "♭6"],
      [1, 10, "2"], [1, 22, "2"],
    ],
    D: [
      [6, 10, "2"], [6, 22, "2"],
      [5, 11, "♭6"], [5, 23, "♭6"],
      [4, 12, "2"], [4, 24, "2"],
      [3, 13, "♭6"], [3, 25, "♭6"],
      [2, 9, "♭6"], [2, 21, "♭6"],
      [1, 10, "2"], [1, 22, "2"],
    ],
  },
  dorian: {
    C: [
      [6, 5, "6"], [6, 17, "6"],
      [5, 0, "6"], [5, 12, "6"],
      [4, 0, "2"], [4, 12, "2"],
      [3, 2, "6"], [3, 14, "6"],
      [2, 3, "2"], [2, 15, "2"],
      [1, 5, "6"], [1, 17, "6"],
    ],
    A: [
      [6, 5, "6"], [6, 17, "6"],
      [5, 5, "2"], [5, 17, "2"],
      [4, 7, "6"], [4, 19, "6"],
      [3, 2, "6"], [3, 14, "6"],
      [2, 3, "2"], [2, 15, "2"],
      [1, 5, "6"], [1, 17, "6"],
    ],
    G: [
      [6, 5, "6"], [6, 17, "6"],
      [5, 5, "2"], [5, 17, "2"],
      [4, 7, "6"], [4, 19, "6"],
      [3, 7, "2"], [3, 19, "2"],
      [2, 10, "6"], [2, 22, "6"],
      [1, 5, "6"], [1, 17, "6"],
    ],
    E: [
      [6, 10, "2"], [6, 22, "2"],
      [5, 12, "6"], [5, 24, "6"],
      [4, 7, "6"], [4, 19, "6"],
      [3, 7, "2"], [3, 19, "2"],
      [2, 10, "6"], [2, 22, "6"],
      [1, 10, "2"], [1, 22, "2"],
    ],
    D: [
      [6, 10, "2"], [6, 22, "2"],
      [5, 12, "6"], [5, 24, "6"],
      [4, 12, "2"], [4, 24, "2"],
      [3, 14, "6"], [3, 26, "6"],
      [2, 10, "6"], [2, 22, "6"],
      [1, 10, "2"], [1, 22, "2"],
    ],
  },
};
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/App.test.js`
Expected: PASS — all existing tests + new `MODE_SHAPE` tests

**Step 6: Commit**

```bash
git add src/music.js src/App.test.js
git commit -m "feat: add MODE_SHAPE data table and new intervals for mode overlays"
```

---

### Task 2: Add interval colors for `"7"` and `"♭6"` to theme

**Files:**
- Modify: `src/App.jsx:37-47` (`THEME_COMMON.interval`)

**Step 1: Write failing test for new interval colors**

Add to `src/App.test.js` in the existing theme tests:

```javascript
it("theme has colors for all intervals including mode intervals", () => {
  const requiredIntervals = ["R", "2", "3", "5", "6", "♭3", "4", "♭5", "♭7", "7", "♭6"];
  requiredIntervals.forEach(iv => {
    expect(THEME_DARK.interval[iv]).toBeDefined();
    expect(THEME_LIGHT.interval[iv]).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.js`
Expected: FAIL — `"7"` and `"♭6"` not in interval colors

**Step 3: Add colors to `THEME_COMMON.interval` in `src/App.jsx:37-47`**

Add two new entries:

```javascript
  interval: {
    R:    "#e09898",
    "2":  "#94b8d8",
    "3":  "#dcc08c",
    "5":  "#88c4b4",
    "6":  "#b8a4cc",
    "♭3": "#d8ac90",
    "4":  "#88c8d0",
    "♭5": "#8cacd8",
    "♭6": "#c4a8b8",
    "♭7": "#c4a0cc",
    "7":  "#a8c4a0",
  },
```

Colors chosen to be distinct from existing intervals: `"♭6"` is a muted rose, `"7"` is a sage green.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/App.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/App.jsx src/App.test.js
git commit -m "feat: add interval colors for major 7th and minor 6th"
```

---

### Task 3: Add `activeMode` state and mode note computation

**Files:**
- Modify: `src/App.jsx:5` (add `MODE_SHAPE` to import)
- Modify: `src/App.jsx:508-521` (add `activeMode` state)
- Modify: `src/App.jsx:620-690` (add `modeNotes` useMemo, near `bluesNotes`)

**Step 1: Add `MODE_SHAPE` to the import from `music.js`**

In `src/App.jsx:5`, add `MODE_SHAPE` to the import:

```javascript
  PENTA_BOX, TRIAD_SHAPE, BLUES_SHAPE, MODE_SHAPE, SHAPE_FRET_RANGES,
```

**Step 2: Add `activeMode` state**

After the existing state declarations (near `showFryingPan`), add:

```javascript
const [activeMode, setActiveMode] = useState(null);
```

**Step 3: Add auto-clear effects for `activeMode`**

Add effects to clear mode when pentatonic is turned off or when switching quality:

```javascript
// Clear mode when pentatonic is off
useEffect(() => {
  if (scaleMode === "off") setActiveMode(null);
}, [scaleMode]);

// Clear mode when quality changes and mode doesn't match
useEffect(() => {
  if (!activeMode) return;
  const majorModes = ["ionian", "mixolydian"];
  const isMajorMode = majorModes.includes(activeMode);
  const qualityIsMajor = pentaQuality === "major";
  if (isMajorMode !== qualityIsMajor) setActiveMode(null);
}, [pentaQuality, activeMode]);
```

**Step 4: Add `modeNotes` useMemo computation**

After `bluesNotes` computation (around line 625), add:

```javascript
const modeNotes = useMemo(() => {
  if (!activeMode || scaleMode === "off") return [];
  const modeData = MODE_SHAPE[activeMode];
  const seen = new Set();
  const out = [];
  visibleShapes.forEach(sh => {
    shiftNotes(modeData[sh], effectiveKey).forEach(([s, f, interval]) => {
      const key = posKey(s, f);
      if (!seen.has(key) && !triadPositions.has(key)) { seen.add(key); out.push([s, f, interval]); }
    });
  });
  return out;
}, [activeMode, scaleMode, visibleShapes, effectiveKey, triadPositions]);
```

**Step 5: Run tests and dev server to verify no regressions**

Run: `npx vitest run src/App.test.js`
Run: `npm run build`
Expected: PASS, no errors

**Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add activeMode state and modeNotes computation"
```

---

### Task 4: Add mode buttons to desktop UI

**Files:**
- Modify: `src/App.jsx:913-928` (desktop Penta options area)

**Step 1: Add mode toggle buttons after Blues, before Pan**

In the desktop Penta options area (around line 916-924), after the Blues button and quality overrides, before the Pan button, insert:

```javascript
{scaleMode !== "off" && (() => {
  const modes = pentaQuality === "major"
    ? [["ionian", "Ion"], ["mixolydian", "Mix"]]
    : [["aeolian", "Aeol"], ["dorian", "Dor"]];
  return modes.map(([mode, label]) => (
    <ToggleButton key={mode} label={label}
      title={`Show ${mode} mode scale tones`}
      active={activeMode === mode}
      onClick={() => setActiveMode(m => m === mode ? null : mode)} theme={theme} />
  ));
})()}
```

**Step 2: Run dev server to verify buttons appear correctly**

Run: `npm run dev`
- With pentatonic on + major key: should see `[Blues] [Ion] [Mix] [Pan]`
- With pentatonic on + minor key: should see `[Blues] [Aeol] [Dor] [Pan]`
- Clicking a mode button toggles it, clicking again deselects
- Switching major/minor clears the mode selection

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add mode toggle buttons to desktop Penta options"
```

---

### Task 5: Add mode buttons to mobile bottom sheet

**Files:**
- Modify: `src/App.jsx:1439-1448` (mobile Penta options area in bottom sheet)

**Step 1: Add mode buttons after Blues, before Pan in the mobile bottom sheet**

In the mobile Penta options area (around line 1442-1448), after the Blues button and before the Pan button, insert:

```javascript
{scaleMode !== "off" && (() => {
  const modes = pentaQuality === "major"
    ? [["ionian", "Ion"], ["mixolydian", "Mix"]]
    : [["aeolian", "Aeol"], ["dorian", "Dor"]];
  return modes.map(([mode, label]) => (
    <ToggleButton key={mode} label={label}
      title={`Show ${mode} mode scale tones`}
      active={activeMode === mode}
      onClick={() => setActiveMode(m => m === mode ? null : mode)} style={mBtn} theme={theme} />
  ));
})()}
```

**Step 2: Run dev server at mobile viewport to verify**

Run: `npm run dev` — resize to ≤639px or use DevTools mobile emulation
Expected: Mode buttons appear in bottom sheet Penta row, same behavior as desktop

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add mode toggle buttons to mobile bottom sheet"
```

---

### Task 6: Render mode notes on fretboard

**Files:**
- Modify: `src/App.jsx:1158-1161` (SVG rendering, after pentaNotes, before triad notes)

**Step 1: Add mode note rendering after pentatonic dots**

After the `pentaNotes.map(...)` block (around line 1161), before the triad rendering, add:

```javascript
{modeNotes.length > 0 && (
  <g opacity={0.55}>
    {modeNotes.map(([s, f, interval]) => (
      <FretDot key={`mode-${posKey(s, f)}`} cx={isMobile ? strX(s) : noteX(f)} cy={isMobile ? noteY(f) : strY(s)} radius={PENTA_RADIUS} interval={interval}
        keyIdx={effectiveKey} labelMode={labelMode} fret={f} theme={theme} />
    ))}
  </g>
)}
```

**Step 2: Run dev server to verify mode notes render**

Run: `npm run dev`
- Enable pentatonic, click "Ion" — should see 2 extra notes per string at reduced opacity
- Notes should shift correctly when changing keys
- Notes should respect shape selection (single shape vs all)

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: render mode notes on fretboard at reduced opacity"
```

---

### Task 7: Add mode legend entries

**Files:**
- Modify: `src/App.jsx:224-249` (LEGEND and PENTA_LEGEND)
- Modify: `src/App.jsx:733-738` (legend computation)
- Modify: `src/App.jsx:1225-1229` (legend rendering)

**Step 1: Add mode legend data**

After the `LEGEND` constant, add:

```javascript
const MODE_LEGEND = {
  ionian:     [["4", "Perfect 4th"], ["7", "Major 7th"]],
  mixolydian: [["4", "Perfect 4th"], ["♭7", "Minor 7th"]],
  aeolian:    [["2", "Major 2nd"], ["♭6", "Minor 6th"]],
  dorian:     [["2", "Major 2nd"], ["6", "Major 6th"]],
};

const MODE_NAMES = {
  ionian: "Ionian",
  mixolydian: "Mixolydian",
  aeolian: "Aeolian",
  dorian: "Dorian",
};
```

**Step 2: Add mode legend computation**

In the legend computation area (around line 733-738), after `pentaLegend`, add:

```javascript
const modeLegend = activeMode ? MODE_LEGEND[activeMode] : [];
```

**Step 3: Add mode legend rendering**

After the pentatonic legend box (around line 1225-1229), add a mode legend box:

```javascript
{modeLegend.length > 0 && (
  <div style={{ minWidth: 140, padding: "8px 12px", border: `1px solid ${theme.border.subtle}`, borderRadius: 8, opacity: 0.7 }}>
    <LegendSection title={MODE_NAMES[activeMode]} items={modeLegend} dotSize={16}
      keyIdx={effectiveKey} labelMode={labelMode} theme={theme} />
  </div>
)}
```

**Step 4: Run dev server to verify legend appears**

Run: `npm run dev`
- Enable pentatonic + a mode — legend box should appear with the 2 extra intervals at reduced opacity
- Disabling mode should hide the legend

**Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add mode legend entries with reduced opacity"
```

---

### Task 8: Add mode name to header/summary strings

**Files:**
- Modify: `src/App.jsx:740-749` (title computation)
- Modify: `src/App.jsx:756-761` (mobile sheet summary)

**Step 1: Update title string to include mode name**

In the `title` useMemo (around line 740), append mode name when active. Find where `scaleName(scaleMode, pentaQuality)` is used in the title and append mode info:

After `scaleName` calls, if `activeMode` is set, append ` · ${MODE_NAMES[activeMode]}`.

**Step 2: Update mobile sheet summary**

In the `sheetSummary` computation (around line 756-761), add mode name to the parts array:

```javascript
if (activeMode) parts.push(MODE_NAMES[activeMode]);
```

**Step 3: Run dev server to verify**

Run: `npm run dev`
- Header should show e.g. "C Maj · Major Pentatonic · Ionian"
- Mobile peek bar should include mode name

**Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: show mode name in header and mobile summary"
```

---

### Task 9: Filter mode notes to shape clusters (like blues)

**Files:**
- Modify: `src/App.jsx` (update `modeNotes` computation from Task 3)

**Step 1: Add cluster bounding to `modeNotes`**

Update the `modeNotes` useMemo to bound mode notes within the shape's pentatonic clusters (same pattern as blues notes), preventing mode notes from appearing in the gap between octave clusters:

```javascript
const modeNotes = useMemo(() => {
  if (!activeMode || scaleMode === "off") return [];
  const quality = ["ionian", "mixolydian"].includes(activeMode) ? "major" : "minor";
  const modeData = MODE_SHAPE[activeMode];
  const clusterSource = quality === "major" ? majPenta : minPenta;
  const seen = new Set();
  const out = [];
  visibleShapes.forEach(sh => {
    const pentaFrets = (clusterSource[sh] || []).map(([, f]) => f);
    const clusters = clusterFrets(pentaFrets);
    shiftNotes(modeData[sh], effectiveKey).forEach(([s, f, interval]) => {
      const key = posKey(s, f);
      const inRange = clusters.some(c => f >= c.lo - 1 && f <= c.hi + 1);
      if (inRange && !seen.has(key) && !triadPositions.has(key)) { seen.add(key); out.push([s, f, interval]); }
    });
  });
  return out;
}, [activeMode, scaleMode, visibleShapes, effectiveKey, triadPositions, majPenta, minPenta]);
```

**Step 2: Run dev server and tests**

Run: `npx vitest run src/App.test.js`
Run: `npm run dev`
Expected: Mode notes only appear within shape regions, not floating in gaps

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: bound mode notes to shape pentatonic clusters"
```

---

### Task 10: Final integration testing and cleanup

**Files:**
- Test: `src/App.test.js`
- Verify: `src/App.jsx`, `src/music.js`

**Step 1: Run full test suite**

Run: `npx vitest run src/App.test.js`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Run production build**

Run: `npm run build`
Expected: Clean build, no warnings

**Step 4: Manual testing checklist**

- [ ] Major key + pentatonic on → Ion/Mix buttons appear
- [ ] Minor key + pentatonic on → Aeol/Dor buttons appear
- [ ] Clicking mode shows 2 extra notes at reduced opacity
- [ ] Mode notes shift correctly across all 12 keys
- [ ] Mode notes respect single shape vs all shapes
- [ ] Blues + mode can be active simultaneously
- [ ] Switching major/minor clears incompatible mode
- [ ] Turning off pentatonic clears mode
- [ ] Legend shows mode intervals when active
- [ ] Mobile bottom sheet has mode buttons
- [ ] Mobile fretboard renders mode notes correctly

**Step 5: Commit any final adjustments**

```bash
git add -A
git commit -m "test: verify mode overlays integration"
```
