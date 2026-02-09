import { useState, useEffect } from "react";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { MapView, Camera, MarkerView, Images } from "@maplibre/maplibre-react-native";
import { buildStyle } from "../utils/styleBuilder";
import { DOT_PATTERN_BASE64 } from "../utils/dotPattern";
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

const ZOOM = 14;

// Greater London bounds
const GREATER_LONDON_BOUNDS = {
  sw: [-0.51, 51.28], // Southwest corner (lon, lat)
  ne: [0.34, 51.69],  // Northeast corner (lon, lat)
};

const patternImages = {
  "retro-dots": { uri: DOT_PATTERN_BASE64 },
};

export function Map({ latitude, longitude, onViewportChange }: MapProps) {
  const [mapStyleObj, setMapStyleObj] = useState<object | null>(null);

  useEffect(() => {
    buildStyle(defaultConfig).then(setMapStyleObj);
  }, []);

  if (!mapStyleObj) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      mapStyle={mapStyleObj}
      pitchEnabled={false}
      rotateEnabled={false}
      onRegionDidChange={(feature: any) => {
        if (onViewportChange && feature?.geometry?.coordinates) {
          const [lng, lat] = feature.geometry.coordinates;
          onViewportChange({
            latitude: lat,
            longitude: lng,
            zoom: feature.properties?.zoomLevel ?? 14,
          });
        }
      }}
    >
      <Camera
        defaultSettings={{
          centerCoordinate: [longitude, latitude],
          zoomLevel: ZOOM,
        }}
        minZoomLevel={14}
        maxZoomLevel={19}
        maxBounds={GREATER_LONDON_BOUNDS}
      />
      <Images images={patternImages} />
      <MarkerView coordinate={[longitude, latitude]}>
        <View style={styles.marker} />
      </MarkerView>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#c0392b",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
