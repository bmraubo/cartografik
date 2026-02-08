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

// Guide: "pastel colors: variations of brown, beige, and dusty pink"
// All colors derived from the retro palette shown in the guide
const HALO_COLOR = "#F9F1DC";
const LABEL_COLOR = "#5A4636";

// Layers the guide explicitly says to remove
const LAYERS_TO_REMOVE = new Set([
  "sand",
  "water offset",
  "river tunnel",
  "tunnel path",
  "ferry",
  "ferry labels",
  "oneway road",
  "highway shield",
  "highway shield (us)",
  "building top",
  // POI categories to remove (handled by stripping all base POIs)
  "transport",
  "shopping",
  "sport",
  "food",
  "drink",
  "other poi",
  "station",
  "healthcare",
  "education",
  "culture",
  "amenity",
  "tourism",
]);

/**
 * Apply the retro color palette.
 * Guide: use pastel browns, beiges, and dusty pinks throughout.
 */
function applyRetroPalette(style: MapStyle): void {
  for (const layer of style.layers) {
    const id = layer.id.toLowerCase();
    const type = layer.type;
    const paint = layer.paint ?? {};
    const layout = layer.layout ?? {};

    // Remove layers the guide says to delete
    if (LAYERS_TO_REMOVE.has(id)) {
      layer.layout = { ...layout, visibility: "none" };
      continue;
    }

    // Background — warm parchment
    if (type === "background") {
      layer.paint = { ...paint, "background-color": HALO_COLOR };
      continue;
    }

    // Water — muted dusty blue
    if (id.includes("water") && type === "fill") {
      layer.paint = { ...paint, "fill-color": "#B8CDD9" };
      continue;
    }

    // Rivers/waterways
    if ((id.includes("river") || id.includes("waterway")) && type === "line") {
      layer.paint = { ...paint, "line-color": "#A8BFCC" };
      continue;
    }

    // Grass/vegetation — muted sage
    // Forest (z0-z8) has base opacity 0.1 which is invisible with our muted color; boost it.
    // Wood/Grass (z8+) have zoom ramps (0.7→1.0) which we preserve.
    if ((id.includes("grass") || id.includes("wood") || id.includes("forest")) && type === "fill") {
      const baseOpacity = paint["fill-opacity"];
      const opacity = id.includes("forest")
        ? ["interpolate", ["linear"], ["zoom"], 0, 0.3, 6, 0.5, 8, 0.7]
        : baseOpacity ?? 0.5;
      layer.paint = { ...paint, "fill-color": "#C8D4AC", "fill-opacity": opacity };
      continue;
    }

    // Glacier — faint cool white
    if (id.includes("glacier") && type === "fill") {
      layer.paint = { ...paint, "fill-color": "#E8EDE6" };
      continue;
    }

    // Cemetery — slightly different green
    if (id.includes("cemetery") && type === "fill") {
      layer.paint = { ...paint, "fill-color": "#C5D1A8" };
      continue;
    }

    if (id.includes("residential") && type === "fill") {
      layer.paint = {
        ...paint,
        "fill-color": "#f0b19f",
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 12, 0.5, 16, 0],
      };
      continue;
    }

    // Commercial/industrial — dusty pink/tan (base uses ~35% alpha in color)
    if ((id.includes("commercial") || id.includes("industrial")) && type === "fill") {
      const isIndustrial = id.includes("industrial");
      layer.paint = { ...paint, "fill-color": isIndustrial ? "#feedc2" : "#f0b19f", "fill-opacity": isIndustrial ? 0.75 : 1 };
      continue;
    }

    // School/hospital/stadium — muted warm tones (stadium base uses 35% alpha)
    if ((id.includes("school") || id.includes("hospital") || id.includes("stadium")) && type === "fill") {
      layer.paint = { ...paint, "fill-color": "#E2D8C6", "fill-opacity": id.includes("stadium") ? 0.35 : 1 };
      continue;
    }

    // Other landuse (base uses 20% alpha; rail uses 50%)
    if ((id === "other" || id.includes("quarry") || id.includes("rail")) && type === "fill") {
      const opacity = id.includes("rail") ? 0.5 : 0.3;
      layer.paint = { ...paint, "fill-color": "#E6DCC8", "fill-opacity": opacity };
      continue;
    }

    // Buildings — warm brownish beige
    if (id.includes("building") && type === "fill") {
      layer.paint = { ...paint, "fill-color": "#f0b19f", "fill-outline-color": "#d4907e" };
      continue;
    }

    // Road fills — pale cream
    if (
      type === "line" &&
      (id.includes("road") || id.includes("highway") || id.includes("minor road") || id.includes("major road"))
    ) {
      const isOutline = id.includes("outline");
      if (isOutline) {
        layer.paint = { ...paint, "line-color": "#C8B898" };
      } else {
        layer.paint = { ...paint, "line-color": "#F0E8D4" };
      }
      continue;
    }

    // Tunnels
    if (id.includes("tunnel") && type === "line") {
      layer.paint = { ...paint, "line-color": "#D8D0C0", "line-opacity": 0.6 };
      continue;
    }

    // Bridge fill
    if (id.includes("bridge") && type === "fill") {
      layer.paint = { ...paint, "fill-color": "#E8E0CC" };
      continue;
    }

    // Paths
    if (id.includes("path") && type === "line") {
      layer.paint = { ...paint, "line-color": "#C8BC9E" };
      continue;
    }

    // Railway — muted brown
    if (id.includes("railway") && type === "line") {
      layer.paint = { ...paint, "line-color": "#C0B498" };
      continue;
    }

    // Transit
    if (id.includes("transit") && type === "line") {
      layer.paint = { ...paint, "line-color": "#C8BC9E" };
      continue;
    }

    // Cablecar
    if (id.includes("cablecar") && type === "line") {
      layer.paint = { ...paint, "line-color": "#B8AC90" };
      continue;
    }

    // Pier
    if (id.includes("pier") && type === "fill") {
      layer.paint = { ...paint, "fill-color": "#E0D8C4" };
      continue;
    }
    if (id.includes("pier") && type === "line") {
      layer.paint = { ...paint, "line-color": "#C8C0AC" };
      continue;
    }

    // Boundaries — subtle dashed brown
    if (id.includes("border") && type === "line") {
      const isCountry = id.includes("country");
      layer.paint = {
        ...paint,
        "line-color": isCountry ? "#B0A080" : "#C0B498",
        "line-opacity": isCountry ? 0.6 : 0.4,
      };
      continue;
    }

    // All symbol/label layers — apply retro halo and label color
    if (type === "symbol") {
      const isWater =
        id.includes("water") ||
        id.includes("ocean") ||
        id.includes("sea") ||
        id.includes("lake") ||
        id.includes("river");

      layer.paint = {
        ...paint,
        "text-color": isWater ? "#6888A0" : LABEL_COLOR,
        // Guide: halo #F9F1DC, 80% opacity, 1-1.5px width, with blur
        "text-halo-color": HALO_COLOR,
        "text-halo-width": isWater ? 1 : 1.2,
        "text-halo-blur": 0.5,
      };
    }
  }
}

/**
 * Apply font hierarchy and typography rules from the guide.
 * Guide: Bold for continents/countries/capitals, Regular for cities/towns/roads,
 * Italic for states/lakes/seas/oceans, Light Italic for rivers/villages/POIs.
 * Letter spacing: 0-0.4em depending on feature type.
 * Uppercase: continents, countries, capitals, states, islands.
 */
function applyTypography(style: MapStyle, config: MapStyleConfig): void {
  const regular = config.defaultFont;
  const italic = config.italicFont ?? regular;

  for (const layer of style.layers) {
    if (layer.type !== "symbol" || !layer.layout) continue;

    const id = layer.id.toLowerCase();
    const layout = layer.layout;

    // Font assignment
    if ("text-font" in layout) {
      const useItalic =
        id.includes("state") ||
        id.includes("place label") ||
        id.includes("lake") ||
        id.includes("sea") ||
        id.includes("ocean") ||
        id.includes("river") ||
        id.includes("village") ||
        id.includes("island");

      layout["text-font"] = useItalic ? italic : regular;
    }

    // Letter spacing — guide values
    if (id.includes("continent") || id.includes("country")) {
      layout["text-letter-spacing"] = 0.3;
    } else if (id.includes("capital") || id.includes("state") || id.includes("city")) {
      layout["text-letter-spacing"] = 0.2;
    } else if (
      id.includes("lake") ||
      id.includes("river") ||
      id.includes("island") ||
      id.includes("airport")
    ) {
      layout["text-letter-spacing"] = 0.1;
    } else if (id.includes("road")) {
      layout["text-letter-spacing"] = 0.05;
    } else if (id.includes("town") || id.includes("village")) {
      layout["text-letter-spacing"] = 0;
    }

    // Uppercase — guide: continents, countries, capitals, states, islands
    if (
      id.includes("continent") ||
      id.includes("country") ||
      id.includes("capital") ||
      id.includes("state") ||
      id.includes("island")
    ) {
      layout["text-transform"] = "uppercase";
    }
  }
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
        "text-font": cat.textFont ?? config.italicFont ?? config.defaultFont,
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          14, 10,
          16, 12,
        ],
        "text-anchor": "top",
        "text-offset": [0, 0.8],
        "text-letter-spacing": 0.1,
        visibility: "visible",
      },
      paint: {
        "text-color": LABEL_COLOR,
        "text-halo-color": HALO_COLOR,
        "text-halo-width": 1,
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

function addDotPatternOverlay(style: MapStyle): void {
  const sources = (style as Record<string, unknown>).sources as Record<string, Record<string, unknown>>;
  sources["dot-pattern-source"] = {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]],
      },
      properties: {},
    },
  };

  // Find the first symbol layer to insert the pattern overlay beneath labels
  const firstSymbolIdx = style.layers.findIndex((l) => l.type === "symbol");
  const insertIdx = firstSymbolIdx >= 0 ? firstSymbolIdx : style.layers.length;

  style.layers.splice(insertIdx, 0, {
    id: "dot-pattern-overlay",
    type: "fill",
    source: "dot-pattern-source",
    paint: {
      "fill-pattern": "retro-dots",
      "fill-opacity": 0.08,
    },
  });
}

export async function buildStyle(config: MapStyleConfig): Promise<MapStyle> {
  const res = await fetch(config.baseStyleURL);
  const style: MapStyle = await res.json();

  style.glyphs = config.glyphsURL;

  const vectorSource = detectVectorSource(style);

  // Remove 3D buildings and all base POI symbol layers
  style.layers = style.layers.filter(
    (l) =>
      l.type !== "fill-extrusion" &&
      !(l.type === "symbol" && "source-layer" in l && l["source-layer"] === "poi"),
  );

  applyRetroPalette(style);
  applyTypography(style, config);
  addDotPatternOverlay(style);

  const poiLayers = buildPOILayers(config, vectorSource);
  style.layers.push(...poiLayers);

  return style;
}
