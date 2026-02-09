import { useState, useCallback } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Map } from "../components/Map";
import type { ViewportState } from "../components/Map";
import { MapTitleCard } from "../components/MapTitleCard";
import { useLocation } from "../hooks/useLocation";
import { useReverseGeocode } from "../hooks/useReverseGeocode";

const INITIAL_ZOOM = 14;

export function MapScreen() {
  const location = useLocation();
  const [viewport, setViewport] = useState<ViewportState | null>(null);

  const hasLocation = location.status === "granted";
  const userLat = hasLocation ? location.latitude : 0;
  const userLng = hasLocation ? location.longitude : 0;
  const zoom = viewport?.zoom ?? INITIAL_ZOOM;
  const viewLat = viewport?.latitude ?? userLat;

  const [terraIncognita, setTerraIncognita] = useState(true);
  const locationName = useReverseGeocode(userLat, userLng);

  const handleViewportChange = useCallback((v: ViewportState) => {
    setViewport(v);
  }, []);

  if (location.status === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Getting your location...</Text>
      </View>
    );
  }

  if (location.status === "denied") {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>{location.error}</Text>
        <Text style={styles.hint}>
          Enable location access in your device settings to use Cartografik.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map
        latitude={location.latitude}
        longitude={location.longitude}
        terraIncognita={terraIncognita}
        onViewportChange={handleViewportChange}
      />
      <View style={styles.cardOverlay} pointerEvents="box-none">
        <MapTitleCard locationName={locationName} zoom={zoom} latitude={viewLat} terraIncognita={terraIncognita} onTerraIncognitaChange={setTerraIncognita} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardOverlay: {
    position: "absolute",
    top: 16,
    bottom: 16,
    left: 16,
    justifyContent: "flex-end",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  hint: {
    fontSize: 14,
    marginTop: 8,
    color: "#666",
    textAlign: "center",
  },
});
