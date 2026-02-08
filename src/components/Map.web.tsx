import { useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import ReactMapGL, { Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildStyle } from "../utils/styleBuilder";
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
        maxPitch={0}
        dragRotate={false}
        pitchWithRotate={false}
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
