import { theme } from '@/styles/theme';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';

const remToPx = (rem: string) => parseFloat(rem) * 16;

export interface ButtonProps {
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'ghost' | 'link' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children?: React.ReactNode;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  onPress,
  style,
  textStyle,
  disabled,
  loading,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant].button,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color} />
      ) : (
        <>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          {children && (
            <Text style={[styles.textBase, sizeTextStyles[size], variantStyles[variant].text, textStyle]}>
              {children}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  iconWrapper: {
    marginRight: remToPx(theme.spacing[2]),
  },
  textBase: {
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: parseFloat(theme.spacing[3]) * 16, paddingHorizontal: parseFloat(theme.spacing[4]) * 16 },
  md: { paddingVertical: parseFloat(theme.spacing[4]) * 16, paddingHorizontal: parseFloat(theme.spacing[6]) * 16 },
  lg: { paddingVertical: parseFloat(theme.spacing[6]) * 16, paddingHorizontal: parseFloat(theme.spacing[8]) * 16 },
  icon: { width: 60, height: 60, borderRadius: 30, padding: 0 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: parseFloat(theme.typography.fontSize.sm) * 16 },
  md: { fontSize: parseFloat(theme.typography.fontSize.base) * 16 },
  lg: { fontSize: parseFloat(theme.typography.fontSize.lg) * 16 },
  icon: {}, // Icon variant uses icon prop, not text
});

const variantStyles = {
  primary: StyleSheet.create({
    button: { backgroundColor: theme.colors.primary[300], borderColor: theme.colors.primary[300] },
    text: { color: theme.colors.text.inverse },
  }),
  success: StyleSheet.create({
    button: { backgroundColor: theme.colors.semantic.success.main },
    text: { color: theme.colors.text.inverse },
  }),
  danger: StyleSheet.create({
    button: { backgroundColor: theme.colors.semantic.error.main },
    text: { color: theme.colors.text.inverse },
  }),
  warning: StyleSheet.create({
    button: { backgroundColor: theme.colors.semantic.warning.main },
    text: { color: theme.colors.text.inverse },
  }),
  secondary: StyleSheet.create({
    button: { backgroundColor: theme.colors.background.tertiary },
    text: { color: theme.colors.text.secondary },
  }),
  ghost: StyleSheet.create({
    button: { backgroundColor: 'transparent' },
    text: { color: theme.colors.text.primary },
  }),
  link: StyleSheet.create({
    button: { backgroundColor: 'transparent' },
    text: { color: theme.colors.text.link },
  }),
  icon: StyleSheet.create({
    button: { backgroundColor: theme.colors.black },
    text: { color: theme.colors.white }, // Not used, but good for consistency
  }),
};
