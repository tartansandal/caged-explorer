# Warm Neutral Palette Design

## Problem

The deep blue-purple page background in dark theme makes label text hard to read. The light theme's pale fretboard washes out dot colors. Fixing individual colors creates a cascade of adjustments because the background is driving the palette rather than receding.

## Design Principle

Background recedes. Fretboard and dots are the star. Both themes feel like the same app (same polarity, warm neutral undertone). Shared `THEME_COMMON` dot/shape pastels stay unchanged.

## Dark Theme

| Token | Before | After | Contrast |
|-------|--------|-------|----------|
| `bg.page` | `linear-gradient(#0c1222→#1a1040)` | `#1c1a18` (flat warm charcoal) | — |
| `bg.panel` | `rgba(10,15,30,0.5)` | `rgba(20,18,16,0.5)` | — |
| `bg.modal` | `#141828` | `#1a1816` | — |
| `bg.card` | `rgba(10,15,30,0.4)` | `rgba(20,18,16,0.4)` | — |
| `text.dim` | `#708090` | `#788898` | 4.8:1 AA |
| `text.footer` | `#667888` | `#748494` | 4.5:1 AA |
| `border.*` | blue-tinted rgba | warm-neutral rgba | — |
| `minorBtn.defaultText` | `#4a5568` | `#6e7e86` | 4.1:1 |

## Light Theme

| Token | Before | After | Contrast |
|-------|--------|-------|----------|
| `bg.page` | `linear-gradient(#f5ebe0→#ede0d0)` | `#f3f0ec` (flat warm gray) | — |
| `text.muted` | `#8a7f70` | `#706656` | 5.0:1 AA |
| `text.dim` | `#a09585` | `#7a7060` | 4.3:1 |
| `text.footer` | `#a09585` | `#7c7262` | 4.2:1 |
| `minorBtn.defaultText` | `#8a7f70` | `#706656` | 5.0:1 |

## Unchanged

- All `THEME_COMMON` colors (dot, shape, overlay palettes)
- Fretboard wood tones (both themes)
- Primary, secondary, heading text
- Button active/selected states
