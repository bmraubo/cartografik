import { useState, useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import * as polygonClipping from "polygon-clipping";
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

// Trafalgar Square → Temple station via the Strand
// Waypoints from OSRM road geometry + corrected Temple station position
const WALK_ROUTE = [
  { latitude: 51.50815, longitude: -0.12721 }, // Trafalgar Square
  { latitude: 51.50847, longitude: -0.12733 }, // Crossing square NE
  { latitude: 51.50857, longitude: -0.12718 }, // North side, turning east
  { latitude: 51.50859, longitude: -0.12676 }, // Heading toward the Strand
  { latitude: 51.50859, longitude: -0.12630 }, // St Martin's Place
  { latitude: 51.50862, longitude: -0.12560 }, // Joining the Strand
  { latitude: 51.50871, longitude: -0.12533 }, // Early Strand
  { latitude: 51.50904, longitude: -0.12468 }, // Strand
  { latitude: 51.50934, longitude: -0.12409 }, // Near Charing Cross
  { latitude: 51.50969, longitude: -0.12337 }, // Strand
  { latitude: 51.51001, longitude: -0.12267 }, // Strand
  { latitude: 51.51038, longitude: -0.12178 }, // Strand
  { latitude: 51.51065, longitude: -0.12109 }, // Strand near Adelphi
  { latitude: 51.51101, longitude: -0.12012 }, // Savoy
  { latitude: 51.51126, longitude: -0.11946 }, // Approaching Somerset House
  { latitude: 51.51145, longitude: -0.11890 }, // Strand at Aldwych junction
  { latitude: 51.51155, longitude: -0.11810 }, // Strand east of Aldwych
  { latitude: 51.51160, longitude: -0.11720 }, // Near Lancaster Place
  { latitude: 51.51165, longitude: -0.11630 }, // Strand continues
  { latitude: 51.51163, longitude: -0.11540 }, // Near Surrey Street
  { latitude: 51.51155, longitude: -0.11460 }, // Approaching Temple
  { latitude: 51.51110, longitude: -0.11376 }, // Temple station
];

const WALKING_SPEED = 4.2; // m/s (~15 km/h, 3x normal walking speed)
const TICK_INTERVAL = 2_000; // ms

const REVEAL_RADIUS_M = 40;
const FADE_DISTANCE_M = 40;
const CIRCLE_POINTS = 64;
const FADE_RING_STEPS = 32;

function createCirclePoly(lat: number, lng: number, radiusM: number): polygonClipping.Polygon {
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  const ring: polygonClipping.Ring = [];
  for (let i = 0; i <= CIRCLE_POINTS; i++) {
    const angle = (2 * Math.PI * i) / CIRCLE_POINTS;
    ring.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  return [ring];
}

function haversineDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function computeSegmentDistances(route: typeof WALK_ROUTE): number[] {
  return route.slice(1).map((pt, i) => haversineDistance(route[i], pt));
}

function interpolateRoute(
  route: typeof WALK_ROUTE,
  segmentDistances: number[],
  totalDistance: number,
  fraction: number,
): { latitude: number; longitude: number } {
  const clamped = Math.max(0, Math.min(1, fraction));
  if (clamped === 0) return route[0];
  if (clamped >= 1) return route[route.length - 1];

  const targetDist = clamped * totalDistance;
  let accumulated = 0;
  for (let i = 0; i < segmentDistances.length; i++) {
    const segLen = segmentDistances[i];
    if (accumulated + segLen >= targetDist) {
      const t = (targetDist - accumulated) / segLen;
      return {
        latitude: route[i].latitude + t * (route[i + 1].latitude - route[i].latitude),
        longitude: route[i].longitude + t * (route[i + 1].longitude - route[i].longitude),
      };
    }
    accumulated += segLen;
  }
  return route[route.length - 1];
}

const SEGMENT_DISTANCES = computeSegmentDistances(WALK_ROUTE);
const TOTAL_DISTANCE = SEGMENT_DISTANCES.reduce((a, b) => a + b, 0);

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
  const [walkActive, setWalkActive] = useState(false);
  const [walkPosition, setWalkPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const walkStartTime = useRef<number>(0);

  useEffect(() => {
    if (!walkActive) {
      setWalkPosition(null);
      return;
    }
    walkStartTime.current = Date.now();
    setWalkPosition(WALK_ROUTE[0]);
    setRecenterKey((k) => k + 1);

    const id = setInterval(() => {
      const elapsed = (Date.now() - walkStartTime.current) / 1000;
      const distanceTravelled = elapsed * WALKING_SPEED;
      const fraction = distanceTravelled / TOTAL_DISTANCE;
      if (fraction >= 1) {
        setWalkPosition(WALK_ROUTE[WALK_ROUTE.length - 1]);
        clearInterval(id);
        return;
      }
      setWalkPosition(interpolateRoute(WALK_ROUTE, SEGMENT_DISTANCES, TOTAL_DISTANCE, fraction));
    }, TICK_INTERVAL);

    return () => clearInterval(id);
  }, [walkActive]);

  const effectiveLat = walkPosition ? walkPosition.latitude : userLat;
  const effectiveLng = walkPosition ? walkPosition.longitude : userLng;

  const [visitedPoints, setVisitedPoints] = useState<{ latitude: number; longitude: number; timestamp: number }[]>([]);
  const revealedRingsRef = useRef<(polygonClipping.MultiPolygon | null)[]>(
    new Array(FADE_RING_STEPS + 1).fill(null),
  );
  const [revealedRings, setRevealedRings] = useState<(polygonClipping.MultiPolygon | null)[]>(
    new Array(FADE_RING_STEPS + 1).fill(null),
  );

  useEffect(() => {
    if (effectiveLat === 0 && effectiveLng === 0) return;

    setVisitedPoints((prev) => [...prev, { latitude: effectiveLat, longitude: effectiveLng, timestamp: Date.now() }]);

    const stepSize = FADE_DISTANCE_M / FADE_RING_STEPS;
    const newRings = [...revealedRingsRef.current];
    for (let i = 0; i <= FADE_RING_STEPS; i++) {
      const radius = REVEAL_RADIUS_M + i * stepSize;
      const circle = createCirclePoly(effectiveLat, effectiveLng, radius);
      const current = newRings[i];
      newRings[i] = current ? polygonClipping.union(current, [circle]) : [circle];
    }
    revealedRingsRef.current = newRings;
    setRevealedRings(newRings);
  }, [effectiveLat, effectiveLng]);

  const locationName = useReverseGeocode(effectiveLat, effectiveLng);

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
        latitude={effectiveLat}
        longitude={effectiveLng}
        initialZoom={initialZoom}
        terraIncognita={terraIncognita}
        recenterKey={recenterKey}
        onViewportChange={handleViewportChange}
        revealedRings={revealedRings}
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
        <MapTitleCard locationName={locationName} zoom={zoom} latitude={viewLat} terraIncognita={terraIncognita} onTerraIncognitaChange={setTerraIncognita} walkActive={walkActive} onWalkChange={setWalkActive} />
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
