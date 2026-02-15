# Help Modal and GitHub Link — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a help modal with a narrative CAGED guide and a GitHub repo link icon to the header.

**Architecture:** All changes in `src/App.jsx`. A new `HelpModal` subcomponent renders the modal overlay. Two new icon buttons are added to the header, and existing icon positions are shifted right. One new `showHelp` state variable.

**Tech Stack:** React 19, inline styles, SVG for GitHub icon

---

### Task 1: Add `showHelp` state and header icons

**Files:**
- Modify: `src/App.jsx:365-602`

**Step 1: Add `showHelp` state**

After line 365 (`showFryingPan` state), add:

```jsx
const [showHelp, setShowHelp] = useState(false);
```

**Step 2: Shift existing header icon positions**

The theme toggle button (line 592-596) currently has `right: 44`. Change to `right: 116`.

The gear button (line 597-602) currently has `right: 8`. Change to `right: 80`.

**Step 3: Add GitHub link icon between the new positions**

After the theme toggle button and before the gear button, add:

```jsx
<a href="https://github.com/tartansandal/caged-explorer" target="_blank" rel="noopener noreferrer"
  title="View on GitHub"
  style={{ position: "absolute", top: 10, right: 44, background: "none", border: "none", cursor: "pointer",
    color: theme.text.dim, transition: "color 0.15s", opacity: 0.7, display: "inline-flex" }}>
  <svg width={18} height={18} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
  </svg>
</a>
```

**Step 4: Add help `?` button**

Before the theme toggle button, add:

```jsx
<button onClick={() => setShowHelp(true)} title="About CAGED Explorer"
  style={{ position: "absolute", top: 8, right: 152, background: "none", border: "none", cursor: "pointer",
    fontSize: "1.1rem", color: theme.text.dim, transition: "color 0.15s", opacity: 0.7, fontFamily: "Georgia, serif" }}>
  ?
</button>
```

**Step 5: Run lint and tests**

Run: `npm run lint && npm test`
Expected: PASS (no logic changes)

**Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add help button and GitHub link to header"
```

---

### Task 2: Add `HelpModal` subcomponent

**Files:**
- Modify: `src/App.jsx` (add subcomponent before `CAGEDExplorer`, render inside it)

**Step 1: Create the `HelpModal` component**

Add this subcomponent alongside the existing ones (`ToggleButton`, `FretDot`, etc.):

```jsx
function HelpModal({ onClose, theme }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.bg.panel, border: `1px solid ${theme.border.subtle}`,
        borderRadius: 12, maxWidth: 600, maxHeight: "80vh", overflowY: "auto",
        padding: "32px 36px", position: "relative", color: theme.text.primary,
        lineHeight: 1.7, fontSize: "0.88rem"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 16, background: "none",
          border: "none", cursor: "pointer", fontSize: "1.2rem",
          color: theme.text.dim, opacity: 0.7
        }}>&times;</button>

        <h2 style={{ fontSize: "1.3rem", fontWeight: 300, margin: "0 0 16px",
          letterSpacing: "0.15em", color: theme.text.heading,
          fontFamily: "Georgia, 'Times New Roman', serif" }}>
          CAGED Explorer
        </h2>

        <h3 style={{ fontSize: "0.78rem", fontWeight: 700, margin: "20px 0 8px",
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: theme.text.dim }}>
          The Map
        </h3>
        <p style={{ margin: "0 0 8px" }}>
          The guitar fretboard can feel like an unmapped country — six strings,
          dozens of frets, and no obvious landmarks. Like any explorer, you need
          a map. But a map of every note on every fret is almost as overwhelming
          as the fretboard itself.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          What you really need are landmarks.
        </p>

        <h3 style={{ fontSize: "0.78rem", fontWeight: 700, margin: "20px 0 8px",
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: theme.text.dim }}>
          The Landmarks
        </h3>
        <p style={{ margin: "0 0 8px" }}>
          The CAGED system gives you five: the open chord shapes C, A, G, E,
          and D — the &ldquo;cowboy chords&rdquo; most guitarists learn first.
          These familiar shapes are your reference points.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          Start by selecting a single shape and exploring its details. Each shape
          is built from triads — three-note groups on adjacent strings containing
          a root, a third, and a fifth. Try switching between major and minor to
          see the effect of the flat 3rd (this is clearest with E/Em, A/Am, and
          D/Dm).
        </p>
        <p style={{ margin: "0 0 8px" }}>
          These shapes are movable. Pick a shape, then change the key — watch it
          slide up the neck. This is the basis of barre chords for the E, A, and
          C shapes. The G and D shapes are harder to barre physically, but the
          concept still applies.
        </p>

        <h3 style={{ fontSize: "0.78rem", fontWeight: 700, margin: "20px 0 8px",
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: theme.text.dim }}>
          Expanding the Territory
        </h3>
        <p style={{ margin: "0 0 8px" }}>
          Each chord shape can be extended into a pentatonic scale by adding two
          extra notes. This gives you five pentatonic box patterns — one for each
          CAGED shape. Add one more note (the blue note) and you have blues
          scales.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          Switch to &ldquo;All&rdquo; shapes view and you&rsquo;ll see the entire
          fretboard as a pattern of five movable, interlocking shapes.
        </p>

        <h3 style={{ fontSize: "0.78rem", fontWeight: 700, margin: "20px 0 8px",
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: theme.text.dim }}>
          Connecting the Shapes
        </h3>
        <p style={{ margin: "0 0 8px" }}>
          Now shift your focus from vertical shapes to horizontal ones. Turn on
          the frying pan overlay and notice how just two pan shapes repeat across
          the entire fretboard, cutting across the CAGED shapes. Hover over the
          shape regions to see how the vertical and horizontal patterns intersect.
        </p>
        <p style={{ margin: 0 }}>
          Organising your learning this way lets you progressively build
          understanding without getting lost — and if you do get lost, you can
          always find your way back to a familiar landmark.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Render `HelpModal` in `CAGEDExplorer`**

Inside the main component JSX, just before the closing `</div></div>`, add:

```jsx
{showHelp && <HelpModal onClose={() => setShowHelp(false)} theme={theme} />}
```

**Step 3: Run lint and tests**

Run: `npm run lint && npm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add help modal with CAGED guide narrative"
```
