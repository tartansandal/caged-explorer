# TODO

## Accessibility
- Add ARIA labels to SVG fretboard elements
- Add keyboard navigation for fretboard interaction
- Ensure screen reader compatibility

## Mobile/Responsive Layout
- Adapt control panel layout for narrow screens
- Make fretboard SVG responsive to viewport size

## URL State Persistence
- Encode state (`keyIndex`, `activeShape`, `pentaMode`, `triadMode`, `labelMode`, `overlayMode`, `isMinorKey`) in URL hash
- Enable shareable/bookmarkable configurations

## Performance
- Memoize subcomponents with `React.memo`
- Add `useCallback` for event handlers to reduce re-renders

## New Features
- Chord voicing diagrams
- Scale degree labels
- Audio playback
- Other music theory features
