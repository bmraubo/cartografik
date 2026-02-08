import { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import ReactMapGL, { Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import type { StyleSpecification, MapLibreEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildStyle } from "../utils/styleBuilder";
import { DOT_PATTERN_BASE64, DOT_PATTERN_SIZE } from "../utils/dotPattern";
import defaultConfig from "../config/mapStyle";

interface MapProps {
  latitude: number;
  longitude: number;
}

export function Map({ latitude, longitude }: MapProps) {
  const [mapStyle, setMapStyle] = useState<StyleSpecification | null>(null);

  useEffect(() => {
    buildStyle(defaultConfig).then((s) => setMapStyle(s as StyleSpecification));
  }, []);

  const onLoad = useCallback((e: MapLibreEvent) => {
    const map = e.target;
    if (map.hasImage("retro-dots")) return;
    const img = new Image(DOT_PATTERN_SIZE, DOT_PATTERN_SIZE);
    img.onload = () => {
      if (!map.hasImage("retro-dots")) {
        map.addImage("retro-dots", img);
      }
    };
    img.src = DOT_PATTERN_BASE64;
  }, []);

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
        minZoom={10}
        maxPitch={0}
        dragRotate={false}
        pitchWithRotate={false}
        onLoad={onLoad}
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
