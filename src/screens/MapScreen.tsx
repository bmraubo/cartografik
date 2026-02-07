import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { useLocation } from "../hooks/useLocation";

const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = 0.05;

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

  const { latitude, longitude } = location;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="You are here"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
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
