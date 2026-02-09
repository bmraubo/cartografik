import { useState } from "react";
import { StyleSheet, Text, View, Pressable, Platform, useWindowDimensions } from "react-native";

const PARCHMENT = "#F9F1DC";
const BROWN = "#5A4636";

const serifFont = Platform.select({
  web: "Georgia, 'Times New Roman', serif",
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

interface MapTitleCardProps {
  locationName: string | null;
  zoom: number;
  latitude: number;
  terraIncognita: boolean;
  onTerraIncognitaChange: (value: boolean) => void;
}

// Padding/border consumed by the card chrome: outerBorder(2+3) + innerBorder(1+24) = 30 per side
const CARD_CHROME_PX = 60;

function metersPerPixel(zoom: number, latitude: number): number {
  return (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
}

function formatScale(zoom: number, latitude: number): string {
  const mpp = metersPerPixel(zoom, latitude);
  const scaleDenominator = Math.round((mpp * 96) / 0.0254);
  const rounded = Math.round(scaleDenominator / 1000) * 1000;
  return `1 : ${rounded.toLocaleString()}`;
}

const NICE_DISTANCES = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
const NUM_SEGMENTS = 4;
const BAR_HEIGHT = 4;

function computeScaleBar(zoom: number, latitude: number, maxBarPx: number) {
  const mpp = metersPerPixel(zoom, latitude);
  // Pick the largest nice distance that fits within the available width
  let best = NICE_DISTANCES[0];
  for (const d of NICE_DISTANCES) {
    const px = d / mpp;
    if (px <= maxBarPx) {
      best = d;
    }
  }
  return { widthPx: Math.round(best / mpp), distance: best };
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
}

function ScaleBar({ zoom, latitude, maxWidthPx }: { zoom: number; latitude: number; maxWidthPx: number }) {
  const { widthPx, distance } = computeScaleBar(zoom, latitude, maxWidthPx);
  const segmentWidth = widthPx / NUM_SEGMENTS;

  return (
    <View style={sbStyles.container}>
      <View style={sbStyles.barOutline}>
        {Array.from({ length: NUM_SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={{
              width: segmentWidth,
              height: BAR_HEIGHT,
              backgroundColor: i % 2 === 0 ? BROWN : PARCHMENT,
            }}
          />
        ))}
      </View>
      <View style={sbStyles.labels}>
        <Text style={sbStyles.label}>0</Text>
        <Text style={sbStyles.label}>{formatDistance(distance)}</Text>
      </View>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 8,
  },
  barOutline: {
    flexDirection: "row",
    backgroundColor: BROWN,
    padding: 1,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginTop: 2,
  },
  label: {
    fontFamily: serifFont,
    fontSize: 9,
    color: BROWN,
    letterSpacing: 0.5,
  },
});

function DecorativeRule() {
  return (
    <View style={styles.ruleContainer}>
      <View style={styles.ruleLine} />
      <Text style={styles.ruleDiamond}>&#x25C6;</Text>
      <View style={styles.ruleLine} />
    </View>
  );
}

const CARD_WIDTH_RATIO = 0.1875;

export function MapTitleCard({ locationName, zoom, latitude, terraIncognita, onTerraIncognitaChange }: MapTitleCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  if (!locationName) return null;

  const cardWidth = windowWidth * CARD_WIDTH_RATIO;
  const barMaxWidth = cardWidth - CARD_CHROME_PX;

  return (
    <View style={[styles.wrapper, isOpen && styles.wrapperOpen]}>
      <Pressable onPress={() => setIsOpen((o) => !o)}>
        <View style={styles.chevronButtonOuter}>
          <View style={styles.chevronButtonInner}>
            <View
              style={[
                styles.arrowhead,
                isOpen && styles.arrowheadOpen,
              ]}
            />
          </View>
        </View>
      </Pressable>
      {isOpen && (
        <View style={[styles.trayOuter, { width: cardWidth }]}>
          <View style={styles.trayInner}>
            <Pressable
              style={styles.checkboxRow}
              onPress={() => onTerraIncognitaChange(!terraIncognita)}
            >
              <View style={[styles.checkbox, terraIncognita && styles.checkboxChecked]}>
                {terraIncognita && <Text style={styles.checkmark}>&#x2713;</Text>}
              </View>
              <Text style={styles.checkboxLabel}>TERRA INCOGNITA</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={[styles.outerBorder, { width: cardWidth }]}>
        <View style={styles.innerBorder}>
          <DecorativeRule />
          <Text style={styles.locationName}>{locationName.toUpperCase()}</Text>
          <DecorativeRule />
          <Text style={styles.scale}>Scale {formatScale(zoom, latitude)}</Text>
          <ScaleBar zoom={zoom} latitude={latitude} maxWidthPx={barMaxWidth} />
        </View>
      </View>
    </View>
  );
}

const CHEVRON_SIZE = 36;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  wrapperOpen: {
    flex: 1,
  },
  arrowheadOpen: {
    transform: [{ rotate: "180deg" }],
  },
  trayOuter: {
    flex: 1,
    borderWidth: 2,
    borderColor: BROWN,
    backgroundColor: PARCHMENT,
    padding: 3,
    marginBottom: 8,
  },
  trayInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: BROWN,
    padding: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: BROWN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: PARCHMENT,
  },
  checkmark: {
    color: BROWN,
    fontSize: 13,
    lineHeight: 18,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: serifFont,
    fontSize: 12,
    color: BROWN,
    letterSpacing: 2,
    textAlign: "right",
  },
  chevronButtonOuter: {
    width: CHEVRON_SIZE * 2,
    height: CHEVRON_SIZE,
    borderTopLeftRadius: CHEVRON_SIZE,
    borderTopRightRadius: CHEVRON_SIZE,
    backgroundColor: PARCHMENT,
    borderWidth: 2,
    borderColor: BROWN,
    borderBottomWidth: 0,
    padding: 3,
    paddingBottom: 0,
    marginBottom: -2,
  },
  chevronButtonInner: {
    flex: 1,
    borderTopLeftRadius: CHEVRON_SIZE,
    borderTopRightRadius: CHEVRON_SIZE,
    borderWidth: 1,
    borderColor: BROWN,
    borderBottomWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  outerBorder: {
    borderWidth: 2,
    borderColor: BROWN,
    backgroundColor: PARCHMENT,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: BROWN,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: "center",
  },
  ruleContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  ruleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: BROWN,
  },
  ruleDiamond: {
    color: BROWN,
    fontSize: 6,
    marginHorizontal: 8,
  },
  arrowhead: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: BROWN,
  },
  locationName: {
    fontFamily: serifFont,
    fontSize: 18,
    color: BROWN,
    letterSpacing: 4,
    marginVertical: 6,
  },
  scale: {
    fontFamily: serifFont,
    fontSize: 11,
    color: BROWN,
    letterSpacing: 1,
    marginTop: 4,
  },
});
