import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Map } from "../components/Map";
import { useLocation } from "../hooks/useLocation";

export function MapScreen() {
  const location = useLocation();

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
      <Map latitude={location.latitude} longitude={location.longitude} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
