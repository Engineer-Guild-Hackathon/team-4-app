import React, { useEffect, useMemo } from 'react';
import { Image, ImageSourcePropType, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, Pattern, Image as SvgImage } from 'react-native-svg';

type CloudSegment = {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'pill' | 'connector';
};
interface WafuCloudProps {
  style?: ViewStyle;
  textureSource: ImageSourcePropType;
  seed?: number;
  topSegments?: number;
  bottomSegments?: number;
  duration?: number;
  travelDistance?: number;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const generateKasumiSegments = (
  seed: number,
  topCount: number,
  bottomCount: number
): CloudSegment[] => {
  const segments: CloudSegment[] = [];
  const segmentHeight = 40;
  const segmentOverlap = 0.7;
  let currentX = 0;
  for (let i = 0; i < topCount; i++) {
    const width = 60 + seededRandom(seed + i) * 40;
    segments.push({
      x: currentX + width / 2,
      y: 0,
      width: width,
      height: segmentHeight,
      type: 'pill',
    });
    currentX += width * segmentOverlap;
  }
  const topWidth = currentX;
  // 下部セグメントの開始位置を調整して、全体の幅をトップと合わせる
  const horizontalOffset = (seededRandom(seed + 99) - 0.5) * topWidth * 0.4;
  currentX = horizontalOffset;
  for (let i = 0; i < bottomCount; i++) {
    const width = 70 + seededRandom(seed + i + 100) * 50;
    segments.push({
      x: currentX + width / 2,
      y: segmentHeight * 1.5,
      width: width,
      height: segmentHeight,
      type: 'pill',
    });
    currentX += width * segmentOverlap;
  }
  // 接続部
  const connectorX = topWidth * seededRandom(seed + 200) * 1;
  segments.push({
    x: connectorX,
    y: segmentHeight * 0.75,
    width: 120 + seededRandom(seed + 201) * 10,
    height: segmentHeight,
    type: 'connector',
  });
  return segments;
};

const generateSegmentPath = (segment: CloudSegment) => {
  const x = segment.x - segment.width / 2;
  const y = segment.y - segment.height / 2;
  const { width, height } = segment;

  // 形状タイプが'connector'の場合、特別なくびれたパスを生成
  if (segment.type === 'connector') {
    // 円弧の半径を高さより少し大きくすることで、より深いくびれを表現
    const radiusX = height * 0.8;
    const radiusY = height / 2;

    // M = Move to (移動)
    // L = Line to (直線)
    // A = Arc to (円弧)
    // Z = Close path (パスを閉じる)
    return `
      M ${x},${y}
      L ${x + width},${y}
      A ${radiusX},${radiusY} 0 0 0 ${x + width},${y + height}
      L ${x},${y + height}
      A ${radiusX},${radiusY} 0 0 0 ${x},${y}
      Z
    `;
  }

  const rx = height / 2;
  return `M ${x + rx},${y} h ${width - 2 * rx} a ${rx},${rx} 0 0 1 ${rx},${rx} v ${height - 2 * rx} a ${rx},${rx} 0 0 1 ${-rx},${rx} h ${-(width - 2 * rx)} a ${rx},${rx} 0 0 1 ${-rx},${-rx} v ${-(height - 2 * rx)} a ${rx},${rx} 0 0 1 ${rx},${-rx} Z `;
};

export const WafuCloud: React.FC<WafuCloudProps> = ({
  style,
  textureSource,
  seed = 1,
  topSegments = 7,
  bottomSegments = 8,
  duration = 30000,
  travelDistance = 20,
}) => {
  const translateX = useSharedValue(0);

  // useMemoやuseEffect、animatedStyleのロジックは変更なし
  const { viewBox, cloudPaths } = useMemo(() => {
    const segments = generateKasumiSegments(seed, topSegments, bottomSegments);
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    segments.forEach(seg => {
      minX = Math.min(minX, seg.x - seg.width / 2);
      minY = Math.min(minY, seg.y - seg.height / 2);
      maxX = Math.max(maxX, seg.x + seg.width / 2);
      maxY = Math.max(maxY, seg.y + seg.height / 2);
    });
    const width = maxX - minX;
    const height = maxY - minY;

    const paths = segments.map(seg =>
      generateSegmentPath({ ...seg, x: seg.x - minX, y: seg.y - minY })
    );

    return { viewBox: `0 0 ${width} ${height}`, cloudPaths: paths };
  }, [seed, topSegments, bottomSegments]);

  useEffect(() => {
    translateX.value = withRepeat(withTiming(travelDistance, { duration: duration / 2 }), -1, true);
  }, [duration, travelDistance, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const resolvedTexture = Image.resolveAssetSource(textureSource);
  const patternId = `pattern-${seed}`;

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <Svg width="100%" height="100%" viewBox={viewBox}>
        <Defs>
          <Pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width={resolvedTexture.width}
            height={resolvedTexture.height}
          >
            <SvgImage
              href={resolvedTexture.uri}
              width={resolvedTexture.width}
              height={resolvedTexture.height}
              preserveAspectRatio="xMidYMid slice"
            />
          </Pattern>
        </Defs>
        {cloudPaths.map((path, index) => (
          <Path key={index} d={path} fill={`url(#${patternId})`} />
        ))}
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
