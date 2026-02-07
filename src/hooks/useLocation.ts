export type LocationState =
  | { status: "loading" }
  | { status: "denied"; error: string }
  | { status: "granted"; latitude: number; longitude: number };

// TODO: Replace with real geolocation
const CENTRAL_LONDON = { latitude: 51.5074, longitude: -0.1278 };

export function useLocation(): LocationState {
  return {
    status: "granted",
    ...CENTRAL_LONDON,
  };
}
