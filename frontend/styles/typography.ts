/**
 * Takumi Design System - Typography
 * Using Klee One for headings and body text with Japanese language support
 */

/**
 * Converts a rem string to a pixel number.
 * Assumes a base font size of 16px.
 * @param rem - The rem value as a string (e.g., '1.5rem').
 * @returns The equivalent pixel value as a number.
 */
export const remToPx = (rem: string): number => {
  return parseFloat(rem) * 16;
};
export const typography = {
  fontFamily: {
    primary: 'Klee One',
    latinLight: 'SourceSerif4-Light',
    latinRegular: 'SourceSerif4-Regular',
    latinMedium: 'SourceSerif4-Medium',
    mono: 'Geist Mono, monospace',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
  },

  fontWeight: {
    regular: '400',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
    snug: '1.375', // Added for message content
    loose: '2',
  },

  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

export type Typography = typeof typography;

export const textStyles = {
  // Headers and Titles
  h1: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize['4xl'], // 36px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.2',
    letterSpacing: typography.letterSpacing.tight,
    color: 'var(--text-primary)',
  },

  h2: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize['3xl'], // 30px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.25',
    letterSpacing: typography.letterSpacing.tight,
    color: 'var(--text-primary)',
  },

  h3: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize['2xl'], // 24px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.3',
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-primary)',
  },

  h4: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.xl, // 20px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.35',
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-primary)',
  },

  h5: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.lg, // 18px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.4',
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-primary)',
  },

  h6: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.base, // 16px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.4',
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-primary)',
  },

  // Body Text
  bodyLarge: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.lg, // 18px
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.relaxed, // 1.625
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-primary)',
  },

  body: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.base, // 16px
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal, // 1.5
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-primary)',
  },

  bodySmall: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.sm, // 14px
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal, // 1.5
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-secondary)',
  },

  // Captions and Metadata
  caption: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.xs, // 12px
    fontWeight: typography.fontWeight.regular,
    lineHeight: '1.4',
    letterSpacing: typography.letterSpacing.wide,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
  },

  metadata: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.sm, // 14px
    fontWeight: typography.fontWeight.regular,
    lineHeight: '1.4',
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-tertiary)',
  },

  label: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.sm, // 14px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.4',
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-secondary)',
  },

  // Interactive Text
  link: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.base, // 16px
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--primary-600)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--primary-300)',
    textUnderlineOffset: '2px',
  },

  button: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.base, // 16px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.2',
    letterSpacing: typography.letterSpacing.wide,
    color: 'var(--text-inverse)',
  },

  buttonSmall: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.sm, // 14px
    fontWeight: typography.fontWeight.semibold,
    lineHeight: '1.2',
    letterSpacing: typography.letterSpacing.wide,
    color: 'var(--text-inverse)',
  },
} as const;

export const japaneseTypography = {
  // Japanese text requires different line heights and spacing
  bodyJapanese: {
    ...textStyles.body,
    lineHeight: '1.7', // Increased for better Japanese readability
    letterSpacing: '0.02em', // Slight spacing for clarity
    fontFeatureSettings: "'palt' 1", // Proportional alternate widths
  },

  headingJapanese: {
    ...textStyles.h2,
    lineHeight: '1.4', // Better for Japanese characters
    letterSpacing: '0.01em',
    fontFeatureSettings: "'palt' 1",
  },

  captionJapanese: {
    ...textStyles.caption,
    textTransform: 'none' as const, // Remove uppercase for Japanese
    letterSpacing: '0.03em',
    fontFeatureSettings: "'palt' 1",
  },
} as const;

export const latinTypography = {
  headingLatin: {
    fontFamily: typography.fontFamily.latinMedium,
    fontSize: typography.fontSize['3xl'],
    lineHeight: '1.25',
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-primary)',
  },
  bodyLatin: {
    fontFamily: typography.fontFamily.latinRegular,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
    color: 'var(--text-primary)',
  },
  captionLatin: {
    fontFamily: typography.fontFamily.latinLight,
    fontSize: typography.fontSize.xs,
    lineHeight: '1.4',
    letterSpacing: typography.letterSpacing.wide,
    color: 'var(--text-tertiary)',
  },
} as const;

export const typographyClasses = {
  // Headers
  'text-h1': textStyles.h1,
  'text-h2': textStyles.h2,
  'text-h3': textStyles.h3,
  'text-h4': textStyles.h4,
  'text-h5': textStyles.h5,
  'text-h6': textStyles.h6,

  // Body
  'text-body-lg': textStyles.bodyLarge,
  'text-body': textStyles.body,
  'text-body-sm': textStyles.bodySmall,

  // Utility
  'text-caption': textStyles.caption,
  'text-metadata': textStyles.metadata,
  'text-label': textStyles.label,
  'text-link': textStyles.link,
  'text-button': textStyles.button,
  'text-button-sm': textStyles.buttonSmall,

  // Japanese variants
  'text-body-ja': japaneseTypography.bodyJapanese,
  'text-heading-ja': japaneseTypography.headingJapanese,
  'text-caption-ja': japaneseTypography.captionJapanese,

  // Latin variants
  'text-heading-latin': latinTypography.headingLatin,
  'text-body-latin': latinTypography.bodyLatin,
  'text-caption-latin': latinTypography.captionLatin,
} as const;

export type TextStyles = typeof textStyles;
export type JapaneseTypography = typeof japaneseTypography;
export type LatinTypography = typeof latinTypography;
export type TypographyClasses = typeof typographyClasses;
