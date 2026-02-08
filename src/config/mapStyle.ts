export interface POICategory {
  id: string;
  sourceLayer: string;
  filter: unknown[];
  visible: boolean;
  iconImage?: string;
  textFont?: string[];
}

export interface MapStyleConfig {
  baseStyleURL: string;
  glyphsURL: string;
  defaultFont: string[];
  italicFont?: string[];
  poiCategories: POICategory[];
}

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_API_KEY ?? "";

const defaultConfig: MapStyleConfig = {
  baseStyleURL: `https://api.maptiler.com/maps/bright-v2/style.json?key=${MAPTILER_KEY}`,
  glyphsURL: "/fonts/{fontstack}/{range}.pbf",
  defaultFont: ["IM Fell English Regular"],
  italicFont: ["IM Fell English Italic"],
  poiCategories: [
    {
      id: "bank",
      sourceLayer: "poi",
      filter: ["==", "class", "bank"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "cemetery",
      sourceLayer: "poi",
      filter: ["==", "class", "cemetery"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "library",
      sourceLayer: "poi",
      filter: ["==", "class", "library"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "park",
      sourceLayer: "poi",
      filter: ["==", "class", "park"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "post-office",
      sourceLayer: "poi",
      filter: ["==", "class", "post"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "town-hall",
      sourceLayer: "poi",
      filter: ["==", "class", "town_hall"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "museum",
      sourceLayer: "poi",
      filter: ["==", "class", "museum"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "railway",
      sourceLayer: "poi",
      filter: ["==", "class", "railway"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "place-of-worship",
      sourceLayer: "poi",
      filter: ["==", "class", "place_of_worship"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "theatre",
      sourceLayer: "poi",
      filter: ["==", "class", "theatre"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "art-gallery",
      sourceLayer: "poi",
      filter: ["==", "class", "art_gallery"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "castle",
      sourceLayer: "poi",
      filter: ["==", "class", "castle"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
    {
      id: "monument",
      sourceLayer: "poi",
      filter: ["==", "class", "monument"],
      visible: true,
      textFont: ["IM Fell English Italic"],
    },
  ],
};

export default defaultConfig;
