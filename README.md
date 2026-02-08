# Cartografik

A retro-styled map of Greater London, built with React Native, Expo, and MapLibre.

Cartografik applies a vintage cartographic aesthetic — parchment tones, serif typography, and a halftone dot overlay — on top of MapTiler's Bright vector tiles. The map is constrained to the Greater London area with a decorative scale-bar-style border at the bounds.

## Features

- Retro colour palette (pastel browns, beiges, dusty pinks) applied to all map layers
- IM Fell English serif typography with weight/style hierarchy by feature type
- Halftone dot pattern overlay for vintage texture
- Curated POI categories (museums, parks, railways, monuments, etc.)
- Old-map-style title card with location name and alternating-segment scale bar
- Decorative border at map bounds
- Cross-platform: web, iOS, and Android

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [MapTiler](https://www.maptiler.com/) API key

## Setup

1. Clone the repository:

   ```sh
   git clone https://github.com/bmraubo/cartografik.git
   cd cartografik
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the project root with your MapTiler API key:

   ```
   EXPO_PUBLIC_MAPTILER_API_KEY=your_key_here
   ```

## Running

```sh
# Web
npm run web

# iOS
npm run ios

# Android
npm run android
```

## Project Structure

```
src/
  components/
    Map.tsx            # Native map (MapLibre React Native)
    Map.web.tsx        # Web map (React Map GL + MapLibre GL)
    MapTitleCard.tsx    # Retro title card with scale bar
  screens/
    MapScreen.tsx      # Main screen with location handling
  config/
    mapStyle.ts        # Style config and POI category definitions
  hooks/
    useLocation.ts     # Device geolocation
    useReverseGeocode.ts  # MapTiler reverse geocoding
  utils/
    styleBuilder.ts    # Applies retro palette, typography, dot overlay, and border
    dotPattern.ts      # Base64-encoded halftone dot pattern
```
