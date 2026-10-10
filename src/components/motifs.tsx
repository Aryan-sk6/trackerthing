import Svg, { Circle, Defs, Ellipse, G, Path, Pattern, Rect } from 'react-native-svg';
import { colors } from '@/theme';

/** Kakatiya Kala Thoranam: the Warangal fort gateway. Logo mark and crest. */
export function Thoranam({
  width = 120,
  stroke = colors.primary,
  accent = colors.onIndigo,
}: {
  width?: number;
  stroke?: string;
  accent?: string;
}) {
  const height = (width * 260) / 300;
  return (
    <Svg width={width} height={height} viewBox="0 0 300 260" accessibilityLabel="Kala Thoranam">
      <G fill="none" stroke={stroke} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M40 260 V92 M260 260 V92" />
        <Path d="M30 92 H270 M30 70 H270 M44 48 H256" />
        <Path d="M40 92 Q40 160 100 190 M260 92 Q260 160 200 190" />
        <Path d="M150 48 V20" />
      </G>
      <Circle cx={150} cy={10} r={10} fill={stroke} />
      <Circle cx={150} cy={120} r={30} fill="none" stroke={accent} strokeWidth={5} />
      <G fill={accent}>
        <Ellipse cx={150} cy={104} rx={6} ry={12} />
        <Ellipse cx={150} cy={136} rx={6} ry={12} />
        <Ellipse cx={134} cy={120} rx={12} ry={6} />
        <Ellipse cx={166} cy={120} rx={12} ry={6} />
      </G>
    </Svg>
  );
}

/** Eight-petal lotus from the Ramappa temple ceilings. Loader / subscribed mark. */
export function Kamalam({
  size = 32,
  petal = colors.primary,
  center = colors.terracotta,
}: {
  size?: number;
  petal?: string;
  center?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Kamalam">
      <G fill={petal} stroke={colors.indigo} strokeWidth={3}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <Ellipse key={deg} cx={60} cy={26} rx={10} ry={22} rotation={deg} origin="60, 60" />
        ))}
      </G>
      <Circle cx={60} cy={60} r={12} fill={center} stroke={colors.indigo} strokeWidth={3} />
    </Svg>
  );
}

/** Stepped stone frieze carved on Kakatiya shrines, used as a divider under headers. */
export function Frieze({
  height = 12,
  background = colors.indigo,
  fill = colors.primary,
}: {
  height?: number;
  background?: string;
  fill?: string;
}) {
  const w = height * 2;
  return (
    <Svg width="100%" height={height} accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <Pattern id="frieze" width={w} height={height} patternUnits="userSpaceOnUse">
          <Path d={`M0 ${height} L${height} ${height * 0.15} L${w} ${height} Z`} fill={fill} />
        </Pattern>
      </Defs>
      <Rect width="100%" height={height} fill={background} />
      <Rect width="100%" height={height} fill="url(#frieze)" />
    </Svg>
  );
}
