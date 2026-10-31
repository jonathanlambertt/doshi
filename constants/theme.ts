/**
 * Doshi design tokens.
 *
 * This file is the single source of truth for every design value in the app.
 * Screens and components must read from here — no hardcoded colors, spacing or
 * type sizes anywhere else.
 */

import type { TextStyle } from 'react-native';

/** Tailwind Zinc — the neutral ramp both palettes are built from. */
export const zinc = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
} as const;

/**
 * The single brand accent (Tailwind Rose), identical in light and dark mode.
 * Rebranding the app means editing these three values and nothing else.
 */
export const brand = {
  accent: '#e11d48', // rose-600
  accentPressed: '#be123c', // rose-700
  onAccent: '#ffffff',
} as const;

const light = {
  background: zinc[50],
  surface: '#ffffff',
  text: zinc[900],
  textMuted: zinc[500],
  border: zinc[200],
  borderStrong: zinc[300],
  ...brand,
} as const;

const dark = {
  background: zinc[950],
  surface: zinc[900],
  text: zinc[50],
  textMuted: zinc[400],
  border: zinc[800],
  borderStrong: zinc[700],
  ...brand,
} as const;

export const colors = { light, dark } as const;

export type ColorSchemeName = keyof typeof colors;
export type ThemeColors = (typeof colors)[ColorSchemeName];

/** 4px base scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export type Spacing = keyof typeof spacing;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
} as const;

export type Radius = keyof typeof radius;

export const fontSize = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  display: 52,
} as const;

export type FontSize = keyof typeof fontSize;

/**
 * Figtree, one family per weight (static font files). Pick a weight by family
 * name — never combine these with `fontWeight`, which makes Android fall back
 * to the system font. Every family listed here must be loaded in the root layout.
 */
export const fontFamily = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
} as const satisfies Record<string, TextStyle['fontFamily']>;

export type FontFamily = keyof typeof fontFamily;

/** Tracking values that pair with the sizes above. */
export const letterSpacing = {
  tight: -1.5,
  normal: 0,
  wide: 0.3,
} as const;

/** Maximum content width so the layout stays readable on tablets and web. */
export const maxContentWidth = 420;
