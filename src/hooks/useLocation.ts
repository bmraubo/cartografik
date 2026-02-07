import { useState, useEffect } from "react";
import * as Location from "expo-location";

export type LocationState =
  | { status: "loading" }
  | { status: "denied"; error: string }
  | { status: "granted"; latitude: number; longitude: number };

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== "granted") {
        setState({ status: "denied", error: "Location permission was denied" });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (cancelled) return;

      setState({
        status: "granted",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
