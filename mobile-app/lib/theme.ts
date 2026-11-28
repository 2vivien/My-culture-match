import { Platform } from 'react-native';

export const COLORS = {
  primary: '#DD4F0D', // Burnt orange principal
  primaryLight: '#ffffff', // Soft tint for backgrounds/gradients
  textMain: '#1e1e1e',
  textSub: '#8a8a8a',
  bgLight: '#fcfcfc',
  white: '#ffffff',
  black: '#000000',
  grayLight: '#f3f4f6',
  grayMedium: '#d1d5db',
  grayDark: '#6b7280',
  borderLight: '#f3f4f6',
};

export const SHADOWS = {
  card: Platform.select({
    web: {
      boxShadow: '0px 12px 35px rgba(0, 0, 0, 0.08)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 35,
      elevation: 8,
    },
  }) as any,
  nav: Platform.select({
    web: {
      boxShadow: '0px -5px 20px rgba(0, 0, 0, 0.03)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -5 },
      shadowOpacity: 0.03,
      shadowRadius: 20,
      elevation: 10,
    },
  }) as any,
  floatingBtn: Platform.select({
    web: {
      boxShadow: '0px 8px 25px rgba(205, 77, 12, 0.3)',
    },
    default: {
      shadowColor: '#CD4D0C',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 25,
      elevation: 12,
    },
  }) as any,
  small: Platform.select({
    web: {
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
  }) as any,
};

export const THEME = {
  colors: COLORS,
  shadows: SHADOWS,
};
