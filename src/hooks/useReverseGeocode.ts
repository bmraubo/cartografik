import { useState, useEffect, useRef } from "react";

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_API_KEY ?? "";

export function useReverseGeocode(latitude: number, longitude: number): string | null {
  const [name, setName] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_KEY}`,
        );
        const data = await res.json();
        const features = data.features ?? [];
        const place =
          features.find((f: Record<string, unknown>) =>
            (f.place_type as string[])?.includes("municipality"),
          ) ??
          features.find((f: Record<string, unknown>) =>
            (f.place_type as string[])?.includes("place"),
          ) ??
          features.find((f: Record<string, unknown>) =>
            (f.place_type as string[])?.includes("locality"),
          ) ??
          features[0];
        if (place?.text) {
          setName(place.text as string);
        }
      } catch {
        // Silent fail — card simply won't show a name
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [latitude, longitude]);

  return name;
}
