// theme.ts
import { colors, colorUtils } from './colors';
import { typography, textStyles, japaneseTypography, typographyClasses } from './typography';
import { spacing, layout, borderRadius, shadows, transitions } from './spacing';
import { accessibility, a11yUtils } from './accessibility';
import { layoutClasses, layoutStyles } from './layoutUtils';
import { localization, l10nUtils } from './localization';

/**
 * Converts a rem string to a pixel number.
 * Assumes a base font size of 16px.
 * @param rem - The rem value as a string (e.g., '1.5rem').
 * @returns The equivalent pixel value as a number.
 */
export const remToPx = (rem: string): number => {
  return parseFloat(rem) * 16;
};

export const theme = {
  colors,
  colorUtils,
  typography,
  textStyles,
  japaneseTypography,
  remToPx,
  typographyClasses,

  spacing,
  layout,
  borderRadius,
  shadows,
  transitions,
  layoutClasses,
  layoutStyles,

  accessibility,
  a11yUtils,

  localization,
  l10nUtils,
};

// Optional: TypeScript support
export type Theme = typeof theme;
