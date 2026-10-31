import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { fontSize, type FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Glyph = {
  char: string;
  size: Extract<FontSize, 'watermark' | 'watermarkLg'>;
  top: DimensionValue;
  left: DimensionValue;
  rotate: `${number}deg`;
};

// Kept to the edges and corners so nothing sits behind the wordmark or buttons.
// Several glyphs hang off-screen on purpose; the container clips them.
const GLYPHS: readonly Glyph[] = [
  { char: 'あ', size: 'watermarkLg', top: '-6%', left: '-14%', rotate: '-12deg' },
  { char: 'カ', size: 'watermark', top: '8%', left: '72%', rotate: '10deg' },
  { char: 'の', size: 'watermark', top: '42%', left: '-10%', rotate: '6deg' },
  { char: 'ゆ', size: 'watermarkLg', top: '62%', left: '64%', rotate: '-8deg' },
  { char: 'ン', size: 'watermark', top: '86%', left: '8%', rotate: '14deg' },
];

/**
 * Faint oversized kana behind a screen's content. Purely decorative: hidden from
 * screen readers and transparent to touches. Renders in the system Japanese font,
 * since Figtree has no CJK glyphs.
 */
export function KanaBackdrop() {
  const { theme } = useTheme();

  return (
    <View aria-hidden style={styles.container}>
      {GLYPHS.map((glyph) => (
        <Text
          key={glyph.char}
          style={[
            styles.glyph,
            {
              color: theme.decor,
              fontSize: fontSize[glyph.size],
              top: glyph.top,
              left: glyph.left,
              transform: [{ rotate: glyph.rotate }],
            },
          ]}>
          {glyph.char}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  glyph: {
    position: 'absolute',
  },
});
