// theme.ts

import { colors, colorUtils } from './colors';
import { typography, textStyles, japaneseTypography, typographyClasses } from './typography';
import { spacing, layout, borderRadius, shadows, transitions } from './spacing';
import { accessibility, a11yUtils } from './accessibility';
import { layoutClasses, layoutStyles } from './layoutUtils';
import { localization, l10nUtils } from './localization';

export const theme = {
  colors,
  colorUtils,
  typography,
  textStyles,
  japaneseTypography,
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
