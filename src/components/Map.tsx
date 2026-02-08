import { useState, useEffect } from "react";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { MapView, Camera, MarkerView, Images } from "@maplibre/maplibre-react-native";
import { buildStyle } from "../utils/styleBuilder";
import { DOT_PATTERN_BASE64 } from "../utils/dotPattern";
import defaultConfig from "../config/mapStyle";

interface MapProps {
  latitude: number;
  longitude: number;
}

const ZOOM = 14;

const patternImages = {
  "retro-dots": { uri: DOT_PATTERN_BASE64 },
};

export function Map({ latitude, longitude }: MapProps) {
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
    <MapView style={styles.map} mapStyle={mapStyleObj} pitchEnabled={false} rotateEnabled={false}>
      <Camera
        defaultSettings={{
          centerCoordinate: [longitude, latitude],
          zoomLevel: ZOOM,
        }}
        minZoomLevel={14}
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
