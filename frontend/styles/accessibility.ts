export const accessibility = {
  // High contrast text options
  contrast: {
    normal: {
      textOnBackground: "#2D2D2D", // 4.5:1 contrast ratio
      textOnPrimary: "#FFFFFF", // High contrast on soft red
      textOnAccent: "#2D2D2D", // Dark text on gold
      textSecondary: "#5A5A5A", // 3:1 contrast for secondary text
    },
    high: {
      textOnBackground: "#000000", // Maximum contrast
      textOnPrimary: "#FFFFFF", // Pure white on soft red
      textOnAccent: "#000000", // Pure black on gold
      textSecondary: "#333333", // Higher contrast secondary
      backgroundOverlay: "rgba(255, 255, 255, 0.95)", // Enhanced frosted glass
    },
  },

  // Scalable font sizes (base 16px)
  fontScaling: {
    small: {
      multiplier: 0.875, // 14px base
      lineHeightAdjustment: 1.2,
    },
    normal: {
      multiplier: 1, // 16px base
      lineHeightAdjustment: 1,
    },
    large: {
      multiplier: 1.125, // 18px base
      lineHeightAdjustment: 1.1,
    },
    extraLarge: {
      multiplier: 1.25, // 20px base
      lineHeightAdjustment: 1.15,
    },
  },

  // Touch targets and spacing
  touchTargets: {
    minimum: 44, // 44px minimum touch target
    comfortable: 48, // Comfortable touch target
    spacing: 8, // Minimum spacing between targets
  },

  // Focus indicators
  focus: {
    outline: "2px solid #F5B6B0", // Soft red focus ring
    outlineOffset: "2px",
    borderRadius: "8px",
    transition: "outline 0.2s ease-in-out",
  },

  // Screen reader support
  screenReader: {
    skipToContent: "メインコンテンツにスキップ", // Skip to main content
    navigationLabel: "ナビゲーション", // Navigation
    searchLabel: "検索", // Search
    menuLabel: "メニュー", // Menu
  },
}

// Accessibility utility functions
export const a11yUtils = {
  // Generate accessible color combinations
  getAccessibleTextColor: (backgroundColor: string, highContrast = false) => {
    const colors = highContrast ? accessibility.contrast.high : accessibility.contrast.normal

    switch (backgroundColor) {
      case "#F5B6B0": // Primary soft red
        return colors.textOnPrimary
      case "#E4C56A": // Accent gold
        return colors.textOnAccent
      default:
        return colors.textOnBackground
    }
  },

  // Scale font size based on user preference
  scaleFontSize: (baseSize: number, scale: keyof typeof accessibility.fontScaling) => {
    const scaling = accessibility.fontScaling[scale]
    return {
      fontSize: baseSize * scaling.multiplier,
      lineHeight: baseSize * scaling.multiplier * 1.5 * scaling.lineHeightAdjustment,
    }
  },

  // Generate ARIA labels for Japanese content
  generateAriaLabel: (content: string, context?: string) => {
    if (context) {
      return `${content}、${context}`
    }
    return content
  },
}
