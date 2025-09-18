import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '@/styles/theme';
import { MixedFontText } from './MixedFontText';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'icon' | 'frosted' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
  icon?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  onPress,
  disabled,
  loading,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant].button,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <MixedFontText style={[styles.textBase, sizeTextStyles[size], variantStyles[variant].text, textStyle]}>
            {children}
          </MixedFontText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
    
  },
  disabled: {
    opacity: 0.5,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  md: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  lg: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16 },
  icon: { width: 48, height: 48, borderRadius: 24, padding: 0 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
  icon: {},
});

const variantStyles = {
  primary: StyleSheet.create({
    button: {
      backgroundColor: theme.colors.primary[500],
      borderColor: theme.colors.primary[300],
      shadowColor: 'rgba(208,102,102,0.25)',
    },
    text: {
      color: theme.colors.text.inverse,
    },
  }),
  secondary: StyleSheet.create({
    button: {
      backgroundColor: theme.colors.secondary[500],
      borderColor: theme.colors.secondary[700],
      shadowColor: 'rgba(208,102,102,0.25)',
    },
    text: {
      color: theme.colors.text.primary,
    },
  }),
  icon: StyleSheet.create({
    button: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    text: {
      color: theme.colors.text.secondary,
    },
  }),
  frosted: StyleSheet.create({
    button: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderColor: 'rgba(255,255,255,0.25)',
      shadowColor: 'rgba(255,255,255,0.08)',
    },
    text: {
      color: theme.colors.text.primary,
    },
  }),
  outline: StyleSheet.create({
    button: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderColor: theme.colors.primary[600],
      shadowColor: 'rgba(208,102,102,0.15)',
    },
    text: {
      color: theme.colors.primary[500],
    },
  }),
  ghost: StyleSheet.create({
    button: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    text: {
      color: theme.colors.primary[500],
    },
  }),
};
