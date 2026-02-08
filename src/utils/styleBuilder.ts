import type { MapStyleConfig } from "../config/mapStyle";

type StyleLayer = Record<string, unknown> & {
  id: string;
  type: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
};

type MapStyle = Record<string, unknown> & {
  layers: StyleLayer[];
  glyphs?: string;
};

const RETRO_PALETTE = {
  background: "#F9F1DC",
  water: "#B8D4E3",
  waterOutline: "#9DC3D9",
  land: "#EDE3C9",
  landuse: "#E6DABA",
  park: "#CADBA5",
  forest: "#B8CC96",
  cemetery: "#C9D8A8",
  building: "#DDD2BA",
  buildingOutline: "#C4B699",
  roadFill: "#F5EDD8",
  roadOutline: "#C8B898",
  railwayLine: "#C4B090",
  pathPedestrian: "#a08060",
  pathSidewalk: "#c4b8a0",
  boundary: "#C0A882",
  label: "#5A4636",
  labelWater: "#6888A0",
  labelHalo: "#F9F1DC",
  dustyPink: "#D4B5A0",
} as const;

const MODERN_LAYER_PATTERNS = [
  "ferry",
  "aeroway",
  "aerodrome",
  "rail_station",
  "bus",
  "transit",
  "shield",
  "motorway_junction",
  "highway-shield",
];

function isModernLayer(id: string): boolean {
  return MODERN_LAYER_PATTERNS.some((p) => id.includes(p));
}

function applyRetroPalette(style: MapStyle): void {
  for (const layer of style.layers) {
    const id = layer.id.toLowerCase();
    const type = layer.type;
    const paint = layer.paint ?? {};
    const layout = layer.layout ?? {};

    if (isModernLayer(id)) {
      layer.layout = { ...layout, visibility: "none" };
      continue;
    }

    // Background
    if (id === "background" || type === "background") {
      layer.paint = { ...paint, "background-color": RETRO_PALETTE.background };
      continue;
    }

    // Water fills
    if (id.includes("water") && type === "fill") {
      layer.paint = {
        ...paint,
        "fill-color": RETRO_PALETTE.water,
        "fill-opacity": 0.85,
      };
      continue;
    }

    // Water lines
    if (id.includes("water") && type === "line") {
      layer.paint = {
        ...paint,
        "line-color": RETRO_PALETTE.waterOutline,
        "line-blur": 1,
        "line-opacity": 0.6,
      };
      continue;
    }

    // Parks and green areas
    if (
      (id.includes("park") || id.includes("grass") || id.includes("vegetation")) &&
      type === "fill"
    ) {
      layer.paint = {
        ...paint,
        "fill-color": RETRO_PALETTE.park,
        "fill-opacity": 0.6,
      };
      continue;
    }

    // Forests
    if ((id.includes("forest") || id.includes("wood")) && type === "fill") {
      layer.paint = {
        ...paint,
        "fill-color": RETRO_PALETTE.forest,
        "fill-opacity": 0.55,
      };
      continue;
    }

    // Cemeteries
    if (id.includes("cemetery") && type === "fill") {
      layer.paint = {
        ...paint,
        "fill-color": RETRO_PALETTE.cemetery,
        "fill-opacity": 0.5,
      };
      continue;
    }

    // Buildings
    if (id.includes("building") && type === "fill") {
      layer.paint = {
        ...paint,
        "fill-color": RETRO_PALETTE.building,
        "fill-opacity": 0.6,
        "fill-outline-color": RETRO_PALETTE.buildingOutline,
      };
      continue;
    }

    // General landuse
    if (id.includes("landuse") && type === "fill") {
      layer.paint = {
        ...paint,
        "fill-color": RETRO_PALETTE.landuse,
        "fill-opacity": 0.4,
      };
      continue;
    }

    // Land/earth
    if (id.includes("land") && type === "fill" && !id.includes("landuse")) {
      layer.paint = {
        ...paint,
        "fill-color": RETRO_PALETTE.land,
      };
      continue;
    }

    // Hide base path layers (replaced by custom layers)
    if (
      type === "line" &&
      (id.includes("path") || id.includes("pedestrian") || id.includes("footway") || id.includes("foot"))
    ) {
      layer.layout = { ...layout, visibility: "none" };
      continue;
    }

    // Railway
    if (type === "line" && id.includes("rail")) {
      layer.paint = {
        ...paint,
        "line-color": RETRO_PALETTE.railwayLine,
        "line-opacity": 0.5,
        "line-dasharray": [3, 3],
      };
      continue;
    }

    // Roads
    if (
      type === "line" &&
      (id.includes("road") || id.includes("highway") || id.includes("street") || id.includes("transit") || id.includes("bridge"))
    ) {
      const isMajor =
        id.includes("major") ||
        id.includes("trunk") ||
        id.includes("motorway") ||
        id.includes("primary");
      const isCasing = id.includes("casing") || id.includes("case");
      if (isCasing) {
        layer.paint = {
          ...paint,
          "line-color": RETRO_PALETTE.roadOutline,
          "line-opacity": 0.8,
        };
      } else {
        layer.paint = {
          ...paint,
          "line-color": RETRO_PALETTE.roadFill,
          "line-opacity": 0.9,
        };
      }
      continue;
    }

    // Boundaries
    if (type === "line" && id.includes("boundary")) {
      layer.paint = {
        ...paint,
        "line-color": RETRO_PALETTE.boundary,
        "line-blur": 1.5,
        "line-opacity": 0.45,
        "line-dasharray": [4, 3],
      };
      continue;
    }

    // Symbol layers — apply typography hierarchy
    if (type === "symbol") {
      const isWaterLabel =
        id.includes("water") || id.includes("ocean") || id.includes("sea") || id.includes("lake");
      layer.paint = {
        ...paint,
        "text-color": isWaterLabel ? RETRO_PALETTE.labelWater : RETRO_PALETTE.label,
        "text-halo-color": RETRO_PALETTE.labelHalo,
        "text-halo-width": isWaterLabel ? 1 : 1.2,
        "text-halo-blur": 0.5,
      };

      // Apply letter-spacing hierarchy
      const isCountry = id.includes("country") || id.includes("continent");
      const isState = id.includes("state") || id.includes("province");
      if (isCountry) {
        layer.layout = { ...layout, "text-letter-spacing": 0.4 };
      } else if (isState) {
        layer.layout = { ...layout, "text-letter-spacing": 0.2 };
      }
    }
  }
}

function applyFontHierarchy(style: MapStyle, config: MapStyleConfig): void {
  const regular = config.defaultFont;
  const italic = config.italicFont ?? regular;

  for (const layer of style.layers) {
    if (layer.type !== "symbol" || !layer.layout) continue;
    if (!("text-font" in layer.layout)) continue;

    const id = layer.id.toLowerCase();

    // Italic: water labels, state/province labels
    const useItalic =
      id.includes("water") ||
      id.includes("ocean") ||
      id.includes("sea") ||
      id.includes("lake") ||
      id.includes("river") ||
      id.includes("state") ||
      id.includes("province");

    layer.layout["text-font"] = useItalic ? italic : regular;
  }
}

function buildPathLayers(source: string): StyleLayer[] {
  return [
    {
      id: "path-sidewalk",
      type: "line",
      source,
      "source-layer": "transportation",
      filter: [
        "all",
        ["in", "class", "path", "footway"],
        ["==", "subclass", "sidewalk"],
      ],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": RETRO_PALETTE.pathSidewalk,
        "line-opacity": 0.6,
        "line-dasharray": [1, 2],
        "line-width": 1.5,
      },
    },
    {
      id: "path-pedestrian",
      type: "line",
      source,
      "source-layer": "transportation",
      filter: [
        "all",
        ["in", "class", "path", "pedestrian", "footway"],
        ["!=", "subclass", "sidewalk"],
      ],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": RETRO_PALETTE.pathPedestrian,
        "line-opacity": 0.675,
        "line-dasharray": [2, 1],
        "line-width": 3,
      },
    },
  ];
}

function buildPOILayers(config: MapStyleConfig, source: string): StyleLayer[] {
  return config.poiCategories
    .filter((cat) => cat.visible)
    .map((cat) => ({
      id: `poi-${cat.id}`,
      type: "symbol",
      source,
      "source-layer": cat.sourceLayer,
      filter: cat.filter,
      layout: {
        "text-field": ["get", "name"],
        "text-font": cat.textFont ?? config.defaultFont,
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.8],
        visibility: "visible",
        ...(cat.iconImage ? { "icon-image": cat.iconImage, "icon-size": 0.6 } : {}),
      },
      paint: {
        "text-color": RETRO_PALETTE.label,
        "text-halo-color": RETRO_PALETTE.labelHalo,
        "text-halo-width": 1.2,
        "text-halo-blur": 0.5,
      },
    }));
}

function detectVectorSource(style: MapStyle): string {
  const sources = (style as Record<string, unknown>).sources as Record<string, unknown> | undefined;
  if (!sources) return "openmaptiles";
  for (const [name, src] of Object.entries(sources)) {
    if (src && typeof src === "object" && (src as Record<string, unknown>).type === "vector") {
      return name;
    }
  }
  return "openmaptiles";
}

export async function buildStyle(config: MapStyleConfig): Promise<MapStyle> {
  const res = await fetch(config.baseStyleURL);
  const style: MapStyle = await res.json();

  style.glyphs = config.glyphsURL;

  const vectorSource = detectVectorSource(style);

  // Remove 3D buildings, base POI layers, and modern transport layers
  style.layers = style.layers.filter(
    (l) =>
      l.type !== "fill-extrusion" &&
      !(l.type === "symbol" && "source-layer" in l && l["source-layer"] === "poi"),
  );

  applyRetroPalette(style);
  applyFontHierarchy(style, config);

  const pathLayers = buildPathLayers(vectorSource);
  const poiLayers = buildPOILayers(config, vectorSource);
  style.layers.push(...pathLayers, ...poiLayers);

  return style;
}
