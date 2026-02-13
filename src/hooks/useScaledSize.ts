import { useCallback } from "react";
import { useWindowDimensions } from "react-native";

const REFERENCE_WIDTH = 1440;
const MIN_SCALE = 0.9;
const MAX_SCALE = 1.5;

export function useScaledSize(): (basePx: number) => number {
  const { width } = useWindowDimensions();
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, width / REFERENCE_WIDTH));
  return useCallback((basePx: number) => Math.round(basePx * scale), [scale]);
}
