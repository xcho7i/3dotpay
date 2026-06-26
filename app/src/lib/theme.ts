/**
 * Shared design tokens for the MVP. Dark theme with a red/white accent
 * (3DotPay deck): clean and simple, not over-designed.
 */
export const colors = {
  bg: '#0B0E14',
  bgElevated: '#11151F',
  card: '#161B26',
  text: '#FFFFFF',
  subtext: '#AEB6C4',
  muted: '#6B7585',
  primary: '#E5322D', // 3DotPay red
  primaryDim: '#9B2420',
  success: '#34D399',
  warning: '#F5A623',
  danger: '#F87171',
  border: '#222A38',
  inputBg: '#0E131D',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;
