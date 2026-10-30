import { useColorScheme } from 'react-native';

import { colors, type ColorSchemeName, type ThemeColors } from '@/constants/theme';

/**
 * Resolves the active color palette from the OS appearance setting.
 * `useColorScheme` can return null, so anything that isn't 'dark' falls back to light.
 */
export function useTheme(): { scheme: ColorSchemeName; theme: ThemeColors } {
  const scheme: ColorSchemeName = useColorScheme() === 'dark' ? 'dark' : 'light';

  return { scheme, theme: colors[scheme] };
}
