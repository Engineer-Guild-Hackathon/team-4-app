/**
 * Takumi Design System - Color Palette
 * Japanese Classic Aesthetic with Frosty, Muted Tones
 */

export const colors = {
  // Direct access colors for convenience, mapped from the palette
  white: "#FFFFFF",
  black: "#1F2937",
  primaryMain: "#F5B6B0", // Main soft red, mapping to primary.300
  success: "#4A7C59", // Mapping to semantic.success.main
  danger: "#D32F2F", // Mapping to semantic.error.main
  border: "#EAEAEF", // Mapping to neutral.300
  borderFaint: "#F8F8F8", // Mapping to background.tertiary
  borderExtraLight: "#FAFAFA", // Mapping to background.secondary
  backgroundLighter: "#FAFAFA", // Mapping to background.secondary
  textDark: "#1F2937", // Mapping to text.primary
  textMedium: "#4B5563", // Mapping to text.secondary
  textGray: "#6B7280", // Mapping to text.tertiary
  link: "#F5B6B0", // Mapping to text.link
  green: "#4A7C59", // Mapping to semantic.success.main

  background: {
    primary: "#FFFFFF", // Pure white main background
    secondary: "#FAFAFA", // Subtle off-white for cards/sections
    tertiary: "#F8F8F8", // Lightest gray for subtle divisions
    overlay: "rgba(255, 255, 255, 0.85)", // Frosted glass overlay
    blur: "rgba(255, 255, 255, 0.75)", // Lighter frosted effect
  },

    // Primary Colors (Soft Red) 
  primary: {
    50: "#F8E6E6", 
    100: "#F0CCCC", 
    200: "#E8B3B3", 
    300: "#E09999", 
    400: "#D88080",
    500: "#D06666", // Main soft red 
    600: "#C84D4D", 
    700: "#B83333", 
    800: "#A01A1A", 
    900: "#800000", 
    hover: "#D88080", // Darker hover state
    active: "#D06666", // Darker active state
    disabled: "#E8B3B3", // Muted when disabled
  },

  // Secondary/Accent Colors (Golden highlights)
  secondary: {
    50: "#FEFCF7",
    100: "#FDF9EF",
    200: "#FBF3DF",
    300: "#F8EDCF",
    400: "#F5E7BF",
    500: "#F2E1AF",
    600: "#EFDB9F",
    700: "#ECD58F",
    800: "#E9CF7F",
    900: "#E4C56A", // Main muted gold
    hover: "#F2E1AF", // Lighter on hover
    active: "#E9CF7F", // More vibrant when pressed
    disabled: "#F5E7BF", // Faded when disabled
  },

  text: {
    primary: "#1F2937", // Main dark text
    secondary: "#4B5563", // Secondary text
    tertiary: "#6B7280", // Muted text
    placeholder: "#9CA3AF", // Placeholder text
    disabled: "#D1D5DB", // Disabled text
    inverse: "#FFFFFF", // White text on dark backgrounds
    accent: "#E4C56A", // Golden text for highlights
    link: "#F5B6B0", // Soft red for links
    linkHover: "#ED8278", // Darker red on link hover
  },

  frosted: {
    light: "rgba(255, 255, 255, 0.85)", // Light frosted overlay
    medium: "rgba(255, 255, 255, 0.75)", // Medium frosted overlay
    heavy: "rgba(255, 255, 255, 0.65)", // Heavy frosted overlay
    tinted: "rgba(245, 182, 176, 0.15)", // Soft red tinted glass
    golden: "rgba(228, 197, 106, 0.12)", // Golden tinted glass
  },

  // Neutrals
  neutral: {
    50: "#FFFFFF", // Pure white
    100: "#FAFAFA",
    200: "#F5F5F5",
    300: "#EAEAEF", // Light gray
    400: "#D1C6B3", // Soft beige
    500: "#9CA3AF",
    600: "#6B7280",
    700: "#4B5563",
    800: "#374151",
    900: "#1F2937",
  },

  semantic: {
    success: {
      light: "#E8F5E8",
      main: "#4A7C59", // Muted forest green
      dark: "#2F5233",
      background: "#F0F9F0",
    },
    warning: {
      light: "#FFF8E1",
      main: "#D4A574", // Warm amber
      dark: "#B8956A",
      background: "#FFFBF0",
    },
    error: {
      light: "#FFEBEE",
      main: "#D32F2F", // Traditional red
      dark: "#B71C1C",
      background: "#FFF5F5",
    },
    info: {
      light: "#E3F2FD",
      main: "#5C7CFA", // Soft blue
      dark: "#3F51B5",
      background: "#F8FAFF",
    },
  },

  shadow: {
    soft: "rgba(31, 41, 55, 0.08)", // Subtle shadows
    medium: "rgba(31, 41, 55, 0.12)", // Medium depth
    strong: "rgba(31, 41, 55, 0.16)", // Strong shadows
    colored: "rgba(245, 182, 176, 0.20)", // Soft red shadow
    golden: "rgba(228, 197, 106, 0.25)", // Golden shadow
  },
} as const

export type ColorPalette = typeof colors

export const colorUtils = {
  // Get color with opacity
  withOpacity: (color: string, opacity: number) => {
    if (color.startsWith("#")) {
      const hex = color.slice(1)
      const r = Number.parseInt(hex.slice(0, 2), 16)
      const g = Number.parseInt(hex.slice(2, 4), 16)
      const b = Number.parseInt(hex.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    return color
  },

  // Get frosted version of any color
  frosted: (color: string, opacity = 0.85) => {
    return colorUtils.withOpacity(color, opacity)
  },
}
