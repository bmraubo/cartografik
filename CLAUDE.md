# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run web       # Start web dev server
npm run ios       # Start iOS dev server
npm run android   # Start Android dev server
```

No linting or test infrastructure is configured.

## Architecture

Cartografik is a cross-platform retro-styled map of Greater London built with React Native, Expo, and MapLibre.

### Platform-specific components

Web and native use different MapLibre bindings. Expo resolves the correct file by extension:
- `Map.tsx` — native (iOS/Android), uses `@maplibre/maplibre-react-native`
- `Map.web.tsx` — web, uses `react-map-gl` + `maplibre-gl`

Both export the same `Map` component and `ViewportState` interface so `MapScreen.tsx` consumes them identically.

### Style pipeline

`styleBuilder.ts` fetches the MapTiler Bright v2 base style and transforms it through a fixed sequence:

1. **Remove layers** — strips 3D buildings, base POIs, ferries, tunnels
2. **`applyRetroPalette`** — rewrites fill/line/symbol paint properties to the retro colour scheme (parchment `#F9F1DC`, brown `#5A4636`, dusty blue water, sage greens, pink buildings)
3. **`applyTypography`** — assigns IM Fell English fonts with weight/style/letter-spacing/case rules by feature type
4. **`addDotPatternOverlay`** — inserts a world-covering GeoJSON fill layer with a base64 halftone pattern at 8% opacity, placed below symbol layers
5. **`buildPOILayers`** — generates symbol layers from the `poiCategories` array in `mapStyle.ts` config
6. **`addMapBorder`** — draws a decorative scale-bar-style border at the Greater London bounds using three stacked line layers (outline, parchment fill, dashed segments)

The resulting `StyleSpecification` is passed to the map component. The `retro-dots` pattern image is loaded at map init time via the `onLoad` callback (web) or `<Images>` component (native).

### Map constraints

- Bounds: `[-0.51, 51.28]` to `[0.34, 51.69]` (Greater London) — defined in both Map components and mirrored in `addMapBorder`
- Min zoom: 14 (street level)
- Rotation and pitch disabled

### Data flow

`MapScreen` owns viewport state. The `Map` component reports pan/zoom via `onViewportChange`. Viewport feeds into `useReverseGeocode` (MapTiler API, 300ms debounce) which provides the location name for `MapTitleCard`.

### Fonts

Custom PBF glyph files for IM Fell English live in `public/fonts/`. They are generated from TTF sources in `fonts-src/` using `scripts/generate-glyphs.js` (fontnik). The glyphs URL is set in `mapStyle.ts` config as `/fonts/{fontstack}/{range}.pbf`.

### Environment

Requires `EXPO_PUBLIC_MAPTILER_API_KEY` in `.env`.
