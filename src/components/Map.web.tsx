import { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import ReactMapGL, { Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import type { StyleSpecification, MapLibreEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildStyle } from "../utils/styleBuilder";
import { DOT_PATTERN_BASE64, DOT_PATTERN_SIZE } from "../utils/dotPattern";
import defaultConfig from "../config/mapStyle";

export interface ViewportState {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface MapProps {
  latitude: number;
  longitude: number;
  terraIncognita?: boolean;
  onViewportChange?: (viewport: ViewportState) => void;
}

// Greater London bounds: [sw, ne] as [LngLat, LngLat]
const GREATER_LONDON_BOUNDS: [[number, number], [number, number]] = [
  [-0.51, 51.28], // Southwest (lon, lat)
  [0.34, 51.69],  // Northeast (lon, lat)
];

const REVEAL_RADIUS_M = 40;
const FADE_DISTANCE_M = 20;
const FADE_STEPS = 8;
const BASE_OPACITY = 0.95;
const CIRCLE_POINTS = 64;

function createCircleRing(lat: number, lng: number, radiusM: number, clockwise: boolean): [number, number][] {
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [];
  for (let i = 0; i <= CIRCLE_POINTS; i++) {
    const angle = (2 * Math.PI * i) / CIRCLE_POINTS;
    ring.push([
      lng + dLng * Math.cos(angle),
      lat + (clockwise ? -1 : 1) * dLat * Math.sin(angle),
    ]);
  }
  return ring;
}

function createTerraIncognitaData(lat: number, lng: number) {
  const outerFadeRadius = REVEAL_RADIUS_M + FADE_DISTANCE_M;
  const outerRing: [number, number][] = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];

  const features: any[] = [];

  // Main terra incognita: world polygon with hole at outer fade radius
  features.push({
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [outerRing, createCircleRing(lat, lng, outerFadeRadius, true)],
    },
    properties: { opacity: BASE_OPACITY },
  });

  // Fade rings from inner (low opacity) to outer (high opacity)
  const stepSize = FADE_DISTANCE_M / FADE_STEPS;
  for (let j = 0; j < FADE_STEPS; j++) {
    const innerR = REVEAL_RADIUS_M + j * stepSize;
    const outerR = REVEAL_RADIUS_M + (j + 1) * stepSize;
    const opacity = BASE_OPACITY * (j + 0.5) / FADE_STEPS;
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          createCircleRing(lat, lng, outerR, false),
          createCircleRing(lat, lng, innerR, true),
        ],
      },
      properties: { opacity },
    });
  }

  return { type: "FeatureCollection", features };
}

export function Map({ latitude, longitude, terraIncognita, onViewportChange }: MapProps) {
  const [mapStyle, setMapStyle] = useState<StyleSpecification | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    buildStyle(defaultConfig).then((s) => setMapStyle(s as StyleSpecification));
  }, []);

  const onLoad = useCallback((e: MapLibreEvent) => {
    const map = e.target;
    mapInstanceRef.current = map;
    setMapReady(true);
    if (map.hasImage("retro-dots")) return;
    const img = new Image(DOT_PATTERN_SIZE, DOT_PATTERN_SIZE);
    img.onload = () => {
      if (!map.hasImage("retro-dots")) {
        map.addImage("retro-dots", img);
      }
    };
    img.src = DOT_PATTERN_BASE64;
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    map.setLayoutProperty(
      "terra-incognita",
      "visibility",
      terraIncognita ? "visible" : "none",
    );
  }, [terraIncognita, mapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource("terra-incognita-source") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(createTerraIncognitaData(latitude, longitude) as any);
  }, [latitude, longitude, mapReady]);

  if (!mapStyle) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReactMapGL
        mapLib={maplibregl}
        initialViewState={{
          latitude,
          longitude,
          zoom: 14,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        minZoom={14}
        maxBounds={GREATER_LONDON_BOUNDS}
        maxPitch={0}
        dragRotate={false}
        pitchWithRotate={false}
        onLoad={onLoad}
        onMoveEnd={(evt) => {
          onViewportChange?.({
            latitude: evt.viewState.latitude,
            longitude: evt.viewState.longitude,
            zoom: evt.viewState.zoom,
          });
        }}
      >
        <Marker latitude={latitude} longitude={longitude} />
      </ReactMapGL>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
