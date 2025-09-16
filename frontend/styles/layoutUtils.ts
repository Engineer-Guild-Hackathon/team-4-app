import { layout, borderRadius } from "./spacing"

/**
 * Layout utility classes for consistent spacing and structure
 */
export const layoutClasses = {
  // Container classes
  container: {
    base: "mx-auto px-4 sm:px-6 lg:px-8",
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
  },

  // Grid classes
  grid: {
    base: "grid",
    cols1: "grid-cols-1",
    cols2: "grid-cols-2",
    cols3: "grid-cols-3",
    cols4: "grid-cols-4",
    cols6: "grid-cols-6",
    cols12: "grid-cols-12",
    gapXs: "gap-2",
    gapSm: "gap-3",
    gapMd: "gap-4",
    gapLg: "gap-6",
    gapXl: "gap-8",
  },

  // Flexbox utilities
  flex: {
    base: "flex",
    col: "flex-col",
    row: "flex-row",
    center: "items-center justify-center",
    between: "items-center justify-between",
    around: "items-center justify-around",
    start: "items-start justify-start",
    end: "items-end justify-end",
  },

  // Spacing utilities
  spacing: {
    // Padding
    p: {
      xs: "p-2",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
    px: {
      xs: "px-2",
      sm: "px-3",
      md: "px-4",
      lg: "px-6",
      xl: "px-8",
    },
    py: {
      xs: "py-2",
      sm: "py-3",
      md: "py-4",
      lg: "py-6",
      xl: "py-8",
    },
    // Margin
    m: {
      xs: "m-2",
      sm: "m-4",
      md: "m-6",
      lg: "m-8",
      xl: "m-12",
    },
    mx: {
      xs: "mx-2",
      sm: "mx-4",
      md: "mx-6",
      lg: "mx-8",
      xl: "mx-12",
    },
    my: {
      xs: "my-2",
      sm: "my-4",
      md: "my-6",
      lg: "my-8",
      xl: "my-12",
    },
  },
} as const

/**
 * CSS-in-JS style objects for React Native compatibility
 */
export const layoutStyles = {
  // Container styles
  container: {
    paddingHorizontal: 16,
    marginHorizontal: "auto" as const,
  },

  // Card layouts
  card: {
    base: {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderRadius: Number.parseInt(borderRadius.card),
      padding: Number.parseInt(layout.padding.card.md),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    compact: {
      padding: Number.parseInt(layout.padding.card.sm),
    },
    spacious: {
      padding: Number.parseInt(layout.padding.card.lg),
    },
  },

  // Button layouts
  button: {
    base: {
      borderRadius: Number.parseInt(borderRadius.button),
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    small: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
  },

  // Grid layouts
  grid: {
    twoColumn: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      justifyContent: "space-between" as const,
    },
    threeColumn: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      justifyContent: "space-around" as const,
    },
  },

  // Common layout patterns
  centerContent: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  spaceBetween: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },

  stackVertical: {
    flexDirection: "column" as const,
    gap: 16,
  },

  stackHorizontal: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
} as const

export type LayoutClasses = typeof layoutClasses
export type LayoutStyles = typeof layoutStyles
