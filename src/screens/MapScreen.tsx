import { useState, useCallback } from "react";
import { StyleSheet, Text, View, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import { Map } from "../components/Map";
import type { ViewportState } from "../components/Map";
import { MapTitleCard } from "../components/MapTitleCard";
import { useLocation } from "../hooks/useLocation";
import { useReverseGeocode } from "../hooks/useReverseGeocode";
import { useScaledSize } from "../hooks/useScaledSize";

const REFERENCE_WIDTH = 1440;
const REFERENCE_ZOOM = 17;
const MIN_ZOOM = 14;
const MAX_ZOOM = 19;

export function MapScreen() {
  const location = useLocation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isPortrait = windowHeight > windowWidth;
  const s = useScaledSize();
  const [viewport, setViewport] = useState<ViewportState | null>(null);

  const initialZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, REFERENCE_ZOOM + 0.5 * Math.log2(windowWidth / REFERENCE_WIDTH)));

  const hasLocation = location.status === "granted";
  const userLat = hasLocation ? location.latitude : 0;
  const userLng = hasLocation ? location.longitude : 0;
  const zoom = viewport?.zoom ?? initialZoom;
  const viewLat = viewport?.latitude ?? userLat;

  const [terraIncognita, setTerraIncognita] = useState(true);
  const [recenterKey, setRecenterKey] = useState(0);
  const locationName = useReverseGeocode(userLat, userLng);

  const handleViewportChange = useCallback((v: ViewportState) => {
    setViewport(v);
  }, []);

  if (location.status === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={[styles.message, { fontSize: s(16), marginTop: s(12) }]}>Getting your location...</Text>
      </View>
    );
  }

  if (location.status === "denied") {
    return (
      <View style={styles.centered}>
        <Text style={[styles.message, { fontSize: s(16), marginTop: s(12) }]}>{location.error}</Text>
        <Text style={[styles.hint, { fontSize: s(14), marginTop: s(8) }]}>
          Enable location access in your device settings to use Cartografik.
        </Text>
      </View>
    );
  }

  const btnSize = s(40);

  return (
    <View style={styles.container}>
      <Map
        latitude={location.latitude}
        longitude={location.longitude}
        initialZoom={initialZoom}
        terraIncognita={terraIncognita}
        recenterKey={recenterKey}
        onViewportChange={handleViewportChange}
      />
      <Pressable
        style={[
          styles.recenterButtonFixed,
          {
            top: s(16),
            right: s(16),
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            borderWidth: s(2),
          },
        ]}
        onPress={() => setRecenterKey((k) => k + 1)}
      >
        <Text style={{ fontSize: s(26), color: "#5A4636" }}>&#x2316;</Text>
      </Pressable>
      <View
        style={{
          position: "absolute",
          top: s(16),
          bottom: s(16),
          left: s(16),
          ...(isPortrait && { right: s(16) }),
          justifyContent: "flex-end",
        }}
        pointerEvents="box-none"
      >
        <MapTitleCard locationName={locationName} zoom={zoom} latitude={viewLat} terraIncognita={terraIncognita} onTerraIncognitaChange={setTerraIncognita} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  recenterButtonFixed: {
    position: "absolute",
    backgroundColor: "#F9F1DC",
    borderColor: "#5A4636",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    textAlign: "center",
  },
  hint: {
    color: "#666",
    textAlign: "center",
  },
});
