# Light/Dark Theme Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add light/dark theme support with OS preference detection, manual override, localStorage persistence, and a warm wood-tone light palette.

**Architecture:** Dual THEME objects (THEME_DARK / THEME_LIGHT) with shared shape/interval colors. Theme passed as prop to subcomponents. STYLE functions accept theme parameter. Flash prevention via inline script in index.html.

**Tech Stack:** React 19 (useState, useMemo, useEffect), localStorage, matchMedia API

---

### Task 1: Consolidate hardcoded colors into THEME

Pure refactor — no behavior change. Pull every color literal outside `THEME` into new theme keys so that the entire app's palette flows through a single object.

**Files:**
- Modify: `src/App.jsx:16-97` (THEME object and STYLE object)
- Modify: `src/App.jsx:134-148` (ToggleButton)
- Modify: `src/App.jsx:204-255` (ChordDiagram)
- Modify: `src/App.jsx:491-848` (CAGEDExplorer JSX)

**Step 1: Add new keys to THEME object**

Add these keys to the existing `THEME` at `src/App.jsx:16`:

```js
const THEME = {
  // ... existing shape, interval ...
  bg: {
    // ... existing keys ...
    page: "linear-gradient(160deg, #0c1222 0%, #1a1040 50%, #0c1222 100%)",
  },
  border: {
    // ... existing keys ...
  },
  text: {
    // ... existing keys ...
    heading: "#f1f5f9",
    footer: "#334155",
  },
  // ... existing glow, stroke, overlay ...
  accent: {
    blue: "#93c5fd",
  },
  fretboard: {
    gradientTop: "#3b2507",
    gradientBottom: "#261803",
    markerDot: "#4a5568",
    shadow: "inset 0 0 40px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.3)",
    fretLine: "#334155",
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
```

**Step 2: Replace all hardcoded colors with THEME references**

In `STYLE.divider` (line 82):
```js
divider: { color: THEME.divider, ... }
```

In `STYLE.keyBtn` (lines 83-89):
```js
keyBtn: (active, sel) => ({
    ...
    background: active ? THEME.btn.activeBg : sel ? THEME.btn.selectedBg : THEME.bg.btnOff,
    color: active ? THEME.btn.activeText : sel ? THEME.text.secondary : THEME.text.muted,
    border: `1px solid ${active ? THEME.btn.activeBorder : sel ? THEME.btn.selectedBorder : THEME.border.light}`,
}),
```

In `STYLE.minorKeyBtn` (lines 90-96):
```js
minorKeyBtn: (active, sel) => ({
    ...
    background: active ? THEME.minorBtn.activeBg : sel ? THEME.minorBtn.selectedBg : THEME.bg.btnOff,
    color: active ? THEME.minorBtn.activeText : sel ? THEME.minorBtn.selectedText : THEME.minorBtn.defaultText,
    border: `1px solid ${active ? THEME.minorBtn.activeBorder : sel ? THEME.minorBtn.selectedBorder : THEME.border.light}`,
}),
```

In `ToggleButton` (line 136):
```js
const color = active ? THEME.accent.blue : THEME.text.dim;
```

In `ChordDiagram` fret lines (line 222):
```js
stroke={THEME.fretboard.fretLine}
```

In `CAGEDExplorer` JSX:
- Line 492: `background: THEME.bg.page`
- Line 497: `color: THEME.text.heading`
- Line 502: `color: advancedMode ? THEME.accent.blue : THEME.text.dim`
- Line 594: `boxShadow: THEME.fretboard.shadow`
- Lines 598-599: update gradient stops to use `THEME.fretboard.gradientTop/Bottom`
- Lines 618-621: `fill={THEME.fretboard.markerDot}`
- Line 841: `color: THEME.text.footer`

**Step 3: Run tests and lint**

Run: `npm test && npm run lint`
Expected: All pass — pure refactor, no behavior change.

**Step 4: Verify visually**

Run: `npm run dev`
Open http://localhost:5173 and confirm everything looks identical.

**Step 5: Commit**

```
git add src/App.jsx
git commit -m "refactor: consolidate hardcoded colors into THEME object"
```

---

### Task 2: Split THEME into THEME_COMMON + THEME_DARK

Rename the consolidated THEME to THEME_DARK, extract shared colors into THEME_COMMON. Keep a module-level `THEME` alias pointing to `THEME_DARK` so nothing else changes yet.

**Files:**
- Modify: `src/App.jsx:16-67` (THEME definition)

**Step 1: Restructure the THEME definition**

```js
const THEME_COMMON = {
  shape: { C: "#d8908c", A: "#d4b880", G: "#80b8a4", E: "#a898c4", D: "#cc90a8" },
  interval: {
    R: "#e09898", "2": "#94b8d8", "3": "#dcc08c", "5": "#88c4b4",
    "6": "#b8a4cc", "♭3": "#d8ac90", "4": "#88c8d0", "♭5": "#8cacd8", "♭7": "#c4a0cc",
  },
  overlay: { fryingPanLeft: "#d4b070", fryingPanRight: "#c0a0d0" },
};

const THEME_DARK = {
  ...THEME_COMMON,
  bg: { /* all dark bg keys */ },
  border: { /* all dark border keys */ },
  text: { /* all dark text keys */ },
  glow: { /* dark glow */ },
  stroke: { /* dark stroke */ },
  accent: { /* dark accent */ },
  fretboard: { /* dark fretboard */ },
  btn: { /* dark btn */ },
  minorBtn: { /* dark minorBtn */ },
  divider: "rgba(255,255,255,0.1)",
};

// Active theme — will be replaced by dynamic selection in Task 5
const THEME = THEME_DARK;
```

**Step 2: Run tests and lint**

Run: `npm test && npm run lint`
Expected: All pass — alias preserves behavior.

**Step 3: Commit**

```
git add src/App.jsx
git commit -m "refactor: split THEME into THEME_COMMON and THEME_DARK"
```

---

### Task 3: Add theme structure test + create THEME_LIGHT

Write a test that enforces both theme objects have identical key structures, then create the light palette.

**Files:**
- Modify: `src/App.jsx` (add THEME_LIGHT, export both themes)
- Modify: `src/App.test.js` (add theme structure test)

**Step 1: Export theme objects from App.jsx**

Add a named export alongside the default export (at bottom of file, or by exporting the consts):

```js
export { THEME_DARK, THEME_LIGHT, THEME_COMMON };
```

**Step 2: Write failing test**

In `src/App.test.js`:

```js
import { THEME_DARK, THEME_LIGHT } from "./App.jsx";

function collectKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...collectKeys(v, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe("Theme structure", () => {
  test("THEME_DARK and THEME_LIGHT have identical keys", () => {
    expect(collectKeys(THEME_DARK)).toEqual(collectKeys(THEME_LIGHT));
  });

  test("no theme value is undefined", () => {
    const check = (obj, path = "") => {
      for (const [k, v] of Object.entries(obj)) {
        const p = path ? `${path}.${k}` : k;
        expect(v).not.toBeUndefined();
        if (v && typeof v === "object" && !Array.isArray(v)) check(v, p);
      }
    };
    check(THEME_DARK);
    check(THEME_LIGHT);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/App.test.js`
Expected: FAIL — `THEME_LIGHT` doesn't exist yet.

**Step 4: Create THEME_LIGHT**

In `src/App.jsx`, after `THEME_DARK`:

```js
const THEME_LIGHT = {
  ...THEME_COMMON,
  bg: {
    panel: "rgba(180,160,130,0.15)",
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
```

**Step 5: Run tests to verify they pass**

Run: `npx vitest run src/App.test.js`
Expected: PASS — both themes have identical key structures.

**Step 6: Commit**

```
git add src/App.jsx src/App.test.js
git commit -m "feat: add THEME_LIGHT palette with structure validation tests"
```

---

### Task 4: Thread theme through components

Make STYLE and all subcomponents accept `theme` as a parameter/prop instead of referencing the module-level `THEME` constant. After this task, the app still only renders dark theme, but is wired to accept either.

**Files:**
- Modify: `src/App.jsx:76-97` (STYLE → makeStyles function)
- Modify: `src/App.jsx:134-255` (ToggleButton, FretDot, LegendSection, ChordDiagram)
- Modify: `src/App.jsx:257-848` (CAGEDExplorer)

**Step 1: Convert STYLE to a function**

Replace the `STYLE` object with a function:

```js
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
```

**Step 2: Add `theme` prop to all subcomponents**

Update each component signature and replace `THEME.` with `theme.`:

- `ToggleButton({ label, active, onClick, style = {}, theme })`
- `FretDot({ cx, cy, radius, interval, keyIdx, labelMode, shapeBorder, showNoteName = false, theme })`
- `LegendSection({ title, items, dotSize, mt = 0, keyIdx, labelMode, theme })`
- `ChordDiagram({ chord, shape, accent, keyIdx, labelMode, italic = false, theme })`

In each component body, replace every `THEME.` reference with `theme.`.

**Step 3: Wire up CAGEDExplorer**

Inside `CAGEDExplorer`, after the theme mode state (for now, hardcode dark):

```js
const theme = THEME_DARK;
const STYLE = useMemo(() => makeStyles(theme), [theme]);
```

Pass `theme={theme}` to every `<ToggleButton>`, `<FretDot>`, `<LegendSection>`, and `<ChordDiagram>` instance.

Replace all remaining `THEME.` references in the JSX body of `CAGEDExplorer` with `theme.`.

**Step 4: Remove the module-level `const THEME = THEME_DARK` alias**

It's no longer needed — all references now go through the `theme` variable or prop.

**Step 5: Run tests and lint**

Run: `npm test && npm run lint`
Expected: All pass.

**Step 6: Verify visually**

Run: `npm run dev` — should look identical to before.

**Step 7: Quick manual check — temporarily swap to THEME_LIGHT**

Change `const theme = THEME_DARK` to `const theme = THEME_LIGHT` and verify the light palette renders (colors will be rough but structurally correct). Then change it back.

**Step 8: Commit**

```
git add src/App.jsx
git commit -m "refactor: thread theme through all components as prop"
```

---

### Task 5: Add theme state, toggle UI, and persistence

Replace the hardcoded `THEME_DARK` with dynamic theme selection via useState + localStorage + matchMedia.

**Files:**
- Modify: `src/App.jsx` (CAGEDExplorer component, add toggle button)

**Step 1: Add theme state with localStorage + OS detection**

At the top of `CAGEDExplorer`, before other state:

```js
const [themeMode, setThemeMode] = useState(() => {
  const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
  if (saved === "light" || saved === "dark") return saved;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
});

const theme = themeMode === "light" ? THEME_LIGHT : THEME_DARK;
```

**Step 2: Add OS preference listener**

```js
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
```

**Step 3: Add color-scheme sync effect**

```js
useEffect(() => {
  document.documentElement.style.colorScheme = themeMode;
  document.documentElement.dataset.theme = themeMode;
}, [themeMode]);
```

**Step 4: Add toggle function**

```js
const toggleTheme = () => {
  const next = themeMode === "dark" ? "light" : "dark";
  setThemeMode(next);
  localStorage.setItem("theme", next);
};
```

**Step 5: Add toggle button to UI**

Place to the left of the gear icon (around line 500). Sun/moon inline SVG:

```jsx
<button onClick={toggleTheme} title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
  style={{ position: "absolute", top: 8, right: 44, background: "none", border: "none", cursor: "pointer",
    fontSize: "1.2rem", color: theme.text.dim, transition: "color 0.15s", opacity: 0.7 }}>
  {themeMode === "dark" ? "☀" : "☾"}
</button>
```

Note: `useEffect` import already exists. No new imports needed.

**Step 6: Run tests and lint**

Run: `npm test && npm run lint`
Expected: All pass.

**Step 7: Visual verification**

Run: `npm run dev`
- Click the sun/moon toggle — theme should swap
- Reload page — theme should persist
- Clear localStorage, reload — should follow OS preference

**Step 8: Commit**

```
git add src/App.jsx
git commit -m "feat: add light/dark theme toggle with localStorage persistence"
```

---

### Task 6: Flash prevention

Add inline script to index.html and theme-aware body background in CSS.

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

**Step 1: Add inline theme-detection script to index.html**

Add before the `<script type="module">` tag:

```html
<script>
  ;(function(){
    var t = localStorage.getItem("theme");
    if (t !== "light" && t !== "dark") t = matchMedia("(prefers-color-scheme:light)").matches ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    document.documentElement.style.colorScheme = t;
  })()
</script>
```

**Step 2: Add theme-aware body background in CSS**

In `src/index.css`:

```css
:root {
  color-scheme: dark;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:root[data-theme="light"] {
  color-scheme: light;
}

body {
  margin: 0;
  min-width: 320px;
  background: #0c1222;
}

[data-theme="light"] body {
  background: #f5ebe0;
}
```

**Step 3: Visual verification**

Run: `npm run dev`
- Set theme to light, reload — should not flash dark
- Set theme to dark, reload — should not flash light
- Clear localStorage with OS set to light — should load light without flash

**Step 4: Commit**

```
git add index.html src/index.css
git commit -m "feat: add flash prevention for theme switching"
```

---

### Task 7: Polish light palette

With the full system wired up, visually compare both themes and tune the light palette colors. This is an iterative visual task.

**Files:**
- Modify: `src/App.jsx` (THEME_LIGHT values only)

**Step 1: Check each area in light mode**

Open `npm run dev`, switch to light mode, and verify:
- [ ] Page background gradient feels warm, not washed out
- [ ] Fretboard panel has enough contrast
- [ ] Fret dots are readable (text on colored circles)
- [ ] Key selector buttons have clear active/selected/default states
- [ ] Minor key buttons have distinct warm accent
- [ ] Shape labels are visible
- [ ] Chord diagrams are readable
- [ ] Frying pan overlay is visible but not overwhelming
- [ ] Legend text is readable
- [ ] Footer text is visible

**Step 2: Adjust THEME_LIGHT values as needed**

Tweak individual values. Common issues to watch for:
- Glow/stroke opacity may need adjusting (dark glows on light bg look different)
- Accent blue may need darker shade for light bg contrast
- Fretboard marker dots may blend with wood-tone background

**Step 3: Run tests**

Run: `npm test && npm run lint`
Expected: All pass (key structure test catches accidental key deletions).

**Step 4: Commit**

```
git add src/App.jsx
git commit -m "style: polish light theme palette"
```

---

### Task 8: Final verification

**Step 1: Full test suite**

Run: `npm test && npm run lint && npm run build`
Expected: All pass, no warnings.

**Step 2: Cross-theme visual check**

Toggle between themes multiple times, checking:
- Fretboard with all shapes, triads, pentatonic, blues, frying pan
- All 12 keys in both major and minor
- Advanced mode quality overrides
- Label modes (intervals, notes, both)

**Step 3: localStorage edge cases**

- Clear localStorage → follows OS
- Set to light, change OS to dark, reload → stays light (manual override)
- Remove localStorage item → follows OS on next OS change event

**Step 4: Commit any final fixes**

```
git commit -m "fix: final theme polish"
```
