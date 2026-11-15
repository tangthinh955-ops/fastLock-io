import { createTheme } from '@mui/material';

export const surfaceTokens = {
  pageBg: '#F8FAFC',
  cardBg: '#FFFFFF',
  mutedBg: '#F1F5F9',
  borderSubtle: '#E2E8F0',
  borderStrong: '#CBD5E1',
  videoStageBg: '#0F172A',
  videoFrameBg: '#0B1120',
  liveRed: '#DC2626',
  liveRedSoft: '#FEF2F2',
  liveRedText: '#991B1B',
  primaryMain: '#1D4ED8',
  primarySoft: '#EFF6FF',
  primaryBorder: '#BFDBFE',
  successMain: '#047857',
  successSoft: '#ECFDF5',
  successBubble: '#DCFCE7',
  successBorder: '#A7F3D0',
  successText: '#065F46',
  warningMain: '#B45309',
  warningSoft: '#FEF3C7',
  warningText: '#78350F',
  systemSoft: '#FFFBEB',
  aiSoft: '#F5F3FF',
  aiBorder: '#DDD6FE',
  aiText: '#5B21B6',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
} as const;

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: surfaceTokens.primaryMain,
      light: surfaceTokens.primarySoft,
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0F172A',
      light: '#F1F5F9',
      dark: '#020617',
      contrastText: '#FFFFFF',
    },
    success: {
      main: surfaceTokens.successMain,
      light: surfaceTokens.successSoft,
      dark: surfaceTokens.successText,
      contrastText: '#FFFFFF',
    },
    warning: {
      main: surfaceTokens.warningMain,
      light: surfaceTokens.warningSoft,
      dark: surfaceTokens.warningText,
      contrastText: '#FFFFFF',
    },
    error: {
      main: surfaceTokens.liveRed,
      light: surfaceTokens.liveRedSoft,
      dark: surfaceTokens.liveRedText,
      contrastText: '#FFFFFF',
    },
    background: {
      default: surfaceTokens.pageBg,
      paper: surfaceTokens.cardBg,
    },
    text: {
      primary: surfaceTokens.textPrimary,
      secondary: surfaceTokens.textSecondary,
    },
    divider: surfaceTokens.borderSubtle,
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    htmlFontSize: 16,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
    },
    h2: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
    },
    h5: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
    },
    h6: {
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      fontWeight: 700,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.55,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSize: '16px',
          scrollBehavior: 'smooth',
        },
        body: {
          margin: 0,
          backgroundColor: surfaceTokens.pageBg,
          color: surfaceTokens.textPrimary,
          overflowX: 'clip',
        },
        '*:focus-visible': {
          outline: '2px solid #2563EB',
          outlineOffset: '2px',
        },
        '@media (prefers-reduced-motion: reduce)': {
          html: {
            scrollBehavior: 'auto',
          },
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${surfaceTokens.borderSubtle}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          minHeight: 40,
          '@media (max-width:899.95px)': {
            minHeight: 44,
          },
        },
        sizeSmall: {
          minHeight: 36,
          '@media (max-width:899.95px)': {
            minHeight: 44,
          },
        },
        sizeLarge: {
          minHeight: 48,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 40,
          minHeight: 40,
          '@media (max-width:899.95px)': {
            minWidth: 44,
            minHeight: 44,
          },
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          '@media (max-width:899.95px)': {
            minWidth: 44,
            minHeight: 44,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: surfaceTokens.cardBg,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${surfaceTokens.borderSubtle}`,
        },
      },
    },
  },
});

