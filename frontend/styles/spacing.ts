/**
 * Takumi Design System - Spacing Scale
 * Based on 4px grid system with Japanese-inspired proportions
 */

export const spacing = {
  0: "0",
  xxs: "0.125rem", // 2px
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  lg: "1.5rem", // 24px (alias for 6)
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
  xxl: "2rem", // 32px (alias for 8)
  40: "10rem", // 160px
  48: "12rem", // 192px
  56: "14rem", // 224px
  64: "16rem", // 256px
} as const

export type Spacing = typeof spacing

export const layout = {
  // Container widths
  container: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // Grid system
  grid: {
    columns: {
      1: "repeat(1, minmax(0, 1fr))",
      2: "repeat(2, minmax(0, 1fr))",
      3: "repeat(3, minmax(0, 1fr))",
      4: "repeat(4, minmax(0, 1fr))",
      6: "repeat(6, minmax(0, 1fr))",
      12: "repeat(12, minmax(0, 1fr))",
    },
    gap: {
      xs: spacing[2], // 8px
      sm: spacing[3], // 12px
      md: spacing[4], // 16px
      lg: spacing[6], // 24px
      xl: spacing[8], // 32px
    },
  },

  // Component padding standards
  padding: {
    // Card padding
    card: {
      sm: spacing[3], // 12px
      md: spacing[4], // 16px
      lg: spacing[6], // 24px
    },
    // Button padding
    button: {
      sm: `${spacing[2]} ${spacing[3]}`, // 8px 12px
      md: `${spacing[3]} ${spacing[4]}`, // 12px 16px
      lg: `${spacing[4]} ${spacing[6]}`, // 16px 24px
    },
    // Input padding
    input: {
      sm: `${spacing[2]} ${spacing[3]}`, // 8px 12px
      md: `${spacing[3]} ${spacing[4]}`, // 12px 16px
      lg: `${spacing[4]} ${spacing[5]}`, // 16px 20px
    },
    // Page/section padding
    page: {
      mobile: spacing[4], // 16px
      tablet: spacing[6], // 24px
      desktop: spacing[8], // 32px
    },
  },

  // Margin standards
  margin: {
    // Component spacing
    component: {
      xs: spacing[2], // 8px
      sm: spacing[4], // 16px
      md: spacing[6], // 24px
      lg: spacing[8], // 32px
      xl: spacing[12], // 48px
    },
    // Section spacing
    section: {
      sm: spacing[8], // 32px
      md: spacing[12], // 48px
      lg: spacing[16], // 64px
      xl: spacing[20], // 80px
    },
  },
} as const

export type Layout = typeof layout

export const borderRadius = {
  none: "0",
  xs: "0.125rem", // 2px
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",

  // Component-specific radius
  button: "0.75rem", // 12px - soft, approachable
  card: "0.75rem", // 12px - consistent with buttons
  input: "0.5rem", // 8px - slightly smaller for inputs
  badge: "9999px", // full - pill shape
  avatar: "9999px", // full - circular
  popup: "1rem", // 16px - larger for prominence
} as const

export type BorderRadius = typeof borderRadius

export const shadows = {
  none: "none",

  // Subtle shadows for Japanese aesthetic
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",

  // Frosted glass shadows
  frosted: {
    light: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    medium: "0 8px 32px 0 rgba(31, 38, 135, 0.5)",
    heavy: "0 8px 32px 0 rgba(31, 38, 135, 0.7)",
  },

  // Component-specific shadows
  card: "0 2px 8px 0 rgba(0, 0, 0, 0.08)",
  button: "0 2px 4px 0 rgba(0, 0, 0, 0.1)",
  popup: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
  floating: "0 12px 20px -8px rgba(0, 0, 0, 0.2)",
} as const

export type Shadows = typeof shadows

export const transitions = {
  // Duration
  duration: {
    fast: "150ms",
    normal: "250ms",
    slow: "350ms",
    slower: "500ms",
  },

  // Easing functions - Japanese-inspired smooth curves
  easing: {
    linear: "linear",
    ease: "ease",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    // Custom Japanese-inspired easing
    gentle: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    smooth: "cubic-bezier(0.23, 1, 0.32, 1)",
  },

  // Common transition combinations
  all: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  colors:
    "color 250ms cubic-bezier(0.4, 0, 0.2, 1), background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), border-color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  transform: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  opacity: "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  shadow: "box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1)",

  // Animation presets
  animations: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: "350ms",
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },
    fadeOut: {
      from: { opacity: 1 },
      to: { opacity: 0 },
      duration: "250ms",
      easing: "cubic-bezier(0.4, 0, 1, 1)",
    },
    slideUp: {
      from: { transform: "translateY(20px)", opacity: 0 },
      to: { transform: "translateY(0)", opacity: 1 },
      duration: "350ms",
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    },
    slideDown: {
      from: { transform: "translateY(-20px)", opacity: 0 },
      to: { transform: "translateY(0)", opacity: 1 },
      duration: "350ms",
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    },
    scaleIn: {
      from: { transform: "scale(0.95)", opacity: 0 },
      to: { transform: "scale(1)", opacity: 1 },
      duration: "250ms",
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },
    blur: {
      from: { filter: "blur(0px)" },
      to: { filter: "blur(8px)" },
      duration: "300ms",
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
} as const

export type Transitions = typeof transitions
