import { useState } from "react";
import { StyleSheet, Text, View, Pressable, Platform, useWindowDimensions } from "react-native";
import { useScaledSize } from "../hooks/useScaledSize";

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

function computeScaleBar(zoom: number, latitude: number, maxBarPx: number) {
  const mpp = metersPerPixel(zoom, latitude);
  let best = NICE_DISTANCES[0];
  for (const d of NICE_DISTANCES) {
    const px = d / mpp;
    if (px <= maxBarPx) {
      best = d;
    }
  }
  const minBarPx = maxBarPx * 0.375;
  return { widthPx: Math.max(Math.round(best / mpp), minBarPx), distance: best };
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
}

function ScaleBar({ zoom, latitude, maxWidthPx }: { zoom: number; latitude: number; maxWidthPx: number }) {
  const s = useScaledSize();
  const barHeight = s(4);
  const { widthPx, distance } = computeScaleBar(zoom, latitude, maxWidthPx);
  const segmentWidth = widthPx / NUM_SEGMENTS;

  return (
    <View style={{ alignItems: "center", marginTop: s(8) }}>
      <View style={{ flexDirection: "row", backgroundColor: BROWN, padding: 1 }}>
        {Array.from({ length: NUM_SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={{
              width: segmentWidth,
              height: barHeight,
              backgroundColor: i % 2 === 0 ? BROWN : PARCHMENT,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch", marginTop: s(2) }}>
        <Text style={{ fontFamily: serifFont, fontSize: s(9), color: BROWN, letterSpacing: s(0.5) }}>0</Text>
        <Text style={{ fontFamily: serifFont, fontSize: s(9), color: BROWN, letterSpacing: s(0.5) }}>{formatDistance(distance)}</Text>
      </View>
    </View>
  );
}

function DecorativeRule({ s }: { s: (basePx: number) => number }) {
  return (
    <View style={fixedStyles.ruleContainer}>
      <View style={fixedStyles.ruleLine} />
      <Text style={{ color: BROWN, fontSize: s(6), marginHorizontal: s(8) }}>&#x25C6;</Text>
      <View style={fixedStyles.ruleLine} />
    </View>
  );
}

const CARD_WIDTH_RATIO = 0.1875;

export function MapTitleCard({ locationName, zoom, latitude, terraIncognita, onTerraIncognitaChange }: MapTitleCardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const s = useScaledSize();
  const [isOpen, setIsOpen] = useState(false);
  if (!locationName) return null;

  const isPortrait = windowHeight > windowWidth;
  const chevronSize = s(36);
  const minCardWidth = s(220);
  // Padding/border consumed by the card chrome: outerBorder(2+3) + innerBorder(1+24) = 30 per side
  const cardChromePx = (s(2) + s(3) + 1 + s(24)) * 2;
  const cardWidth = isPortrait
    ? windowWidth - s(16) * 2
    : Math.max(windowWidth * CARD_WIDTH_RATIO, minCardWidth);
  const barMaxWidth = (cardWidth - cardChromePx) * 0.8;

  return (
    <View style={[fixedStyles.wrapper, isOpen && fixedStyles.wrapperOpen]}>
      <Pressable onPress={() => setIsOpen((o) => !o)}>
        <View
          style={{
            width: chevronSize * 2,
            height: chevronSize,
            borderTopLeftRadius: chevronSize,
            borderTopRightRadius: chevronSize,
            backgroundColor: PARCHMENT,
            borderWidth: s(2),
            borderColor: BROWN,
            borderBottomWidth: 0,
            padding: s(3),
            paddingBottom: 0,
            marginBottom: -s(2),
          }}
        >
          <View
            style={{
              flex: 1,
              borderTopLeftRadius: chevronSize,
              borderTopRightRadius: chevronSize,
              borderWidth: 1,
              borderColor: BROWN,
              borderBottomWidth: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={[
                {
                  width: 0,
                  height: 0,
                  borderLeftWidth: s(10),
                  borderRightWidth: s(10),
                  borderBottomWidth: s(12),
                  borderLeftColor: "transparent",
                  borderRightColor: "transparent",
                  borderBottomColor: BROWN,
                },
                isOpen && fixedStyles.arrowheadOpen,
              ]}
            />
          </View>
        </View>
      </Pressable>
      {isOpen && (
        <View
          style={{
            flex: 1,
            borderWidth: s(2),
            borderColor: BROWN,
            backgroundColor: PARCHMENT,
            padding: s(3),
            marginBottom: s(8),
            width: cardWidth,
          }}
        >
          <View style={{ flex: 1, borderWidth: 1, borderColor: BROWN, padding: s(12) }}>
            <Pressable
              style={fixedStyles.checkboxRow}
              onPress={() => onTerraIncognitaChange(!terraIncognita)}
            >
              <View
                style={[
                  {
                    width: s(18),
                    height: s(18),
                    borderWidth: 1,
                    borderColor: BROWN,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: s(8),
                  },
                  terraIncognita && fixedStyles.checkboxChecked,
                ]}
              >
                {terraIncognita && (
                  <Text style={{ color: BROWN, fontSize: s(13), lineHeight: s(18) }}>&#x2713;</Text>
                )}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: serifFont,
                  fontSize: s(12),
                  color: BROWN,
                  letterSpacing: s(2),
                  textAlign: "right",
                }}
              >
                TERRA INCOGNITA
              </Text>
            </Pressable>
          </View>
        </View>
      )}
      <View
        style={[
          {
            borderWidth: s(2),
            borderColor: BROWN,
            backgroundColor: PARCHMENT,
            padding: s(3),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          },
          { width: cardWidth },
        ]}
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: BROWN,
            paddingHorizontal: s(24),
            paddingVertical: s(10),
            alignItems: "center",
          }}
        >
          <DecorativeRule s={s} />
          <Text
            style={{
              fontFamily: serifFont,
              fontSize: s(18),
              color: BROWN,
              letterSpacing: s(4),
              marginVertical: s(6),
            }}
          >
            {locationName.toUpperCase()}
          </Text>
          <DecorativeRule s={s} />
          <Text
            style={{
              fontFamily: serifFont,
              fontSize: s(11),
              color: BROWN,
              letterSpacing: s(1),
              marginTop: s(4),
            }}
          >
            Scale {formatScale(zoom, latitude)}
          </Text>
          <ScaleBar zoom={zoom} latitude={latitude} maxWidthPx={barMaxWidth} />
        </View>
      </View>
    </View>
  );
}

const fixedStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  wrapperOpen: {
    flex: 1,
  },
  arrowheadOpen: {
    transform: [{ rotate: "180deg" }],
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: PARCHMENT,
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
});
